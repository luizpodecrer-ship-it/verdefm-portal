# Guia para o desenvolvedor WordPress (formato headless)

Portal da **Verde FM** (multi-cidade) e do **Agro na Verde**. Versão de 21/11/2026, que substitui o guia antigo do tema em HTML/PHP.

## 1. Como fica a arquitetura

```
 Redação ──► WordPress (só o painel)  ──API REST──►  Site em Next.js (pasta web/)  ──►  Netlify  ──►  leitor
              painel.verdefm.com.br                  gera as páginas                    verdefm.com.br
```

- **O WordPress não mostra o site.** Ele é só o painel onde a redação escreve matérias, sobe fotos, lança cotações, monta a parada e cadastra anúncios. O leitor nunca acessa o WordPress.
- **O site é o projeto Next.js da pasta `web/`** (React + TypeScript + Tailwind + shadcn). Ele busca o conteúdo na API REST do WordPress (`/wp-json/...`) e gera as páginas.
- **Endereços sugeridos:** o WordPress em um subdomínio (ex.: `painel.verdefm.com.br`) e o site em `verdefm.com.br`. O Agro na Verde terá domínio próprio apontando para o mesmo site (seção 11).
- **Tema do WordPress:** qualquer tema simples. Não é preciso tema próprio, porque nenhum HTML do WordPress chega ao leitor. Recomenda-se bloquear as páginas públicas do WordPress, redirecionando-as para o site, para não haver conteúdo duplicado no Google.

### Onde o site lê o conteúdo

Só **dois arquivos** do site conversam com os dados. Hoje eles leem a demonstração (`web/data/*.json`, com matérias reais dos sites atuais); com o WordPress no ar, passam a buscar na API, e **nenhum componente visual muda**.

| Arquivo | O que entrega |
|---|---|
| `web/lib/conteudo.ts` | matérias, editorias, cidades e rádios (com a grade), escolhas da home, banners, vídeos e "As 10 mais tocadas" |
| `web/lib/agro.ts` | notícias do Agro na Verde, cotações do dia (9 praças × 4 produtos) e dólar |

Os tipos (`Materia`, `Radio`, `BlocoGrade`, `Banner`, `MusicaParada`, `NoticiaAgro`, `Produto`) estão no começo desses arquivos e mostram exatamente cada campo que o site espera.

## 2. Quando o site se atualiza

Hoje o site é **gerado por completo** a cada publicação (`npm run build` → pasta `out/`, publicada no Netlify em 1 a 2 minutos).

1. **Ao publicar ou editar** qualquer conteúdo, o WordPress chama o **Build Hook do Netlify** (um endereço secreto que dispara uma nova geração). Exemplo em `functions.php` (ou em um plugin próprio):

```php
// Chama o Netlify quando algo é publicado, atualizado ou vai para a lixeira.
function vfm_avisar_netlify($post_id) {
  if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;
  $tipos = ['post', 'programa', 'anuncio', 'parada', 'cotacao'];
  if (!in_array(get_post_type($post_id), $tipos, true)) return;
  if (get_transient('vfm_build_pendente')) return;          // junta várias edições seguidas
  set_transient('vfm_build_pendente', 1, 60);
  wp_remote_post(VFM_NETLIFY_BUILD_HOOK, ['blocking' => false]);
}
add_action('save_post', 'vfm_avisar_netlify');
add_action('trashed_post', 'vfm_avisar_netlify');
// No wp-config.php: define('VFM_NETLIFY_BUILD_HOOK', 'https://api.netlify.com/build_hooks/XXXX');
```

2. **Dólar:** atualizado automaticamente (seção 9.2) por uma geração agendada, de hora em hora, em dias úteis.

3. **Futuro (quando o volume de matérias crescer):** trocar a geração completa por **revalidação por página** (ISR do Next.js, com o site rodando no Netlify com funções). O WordPress passa a avisar só a página que mudou. Isso exige mudar `output: "export"` em `web/next.config.ts`, mas os componentes não mudam.

> Matéria agendada no WordPress também dispara o aviso na hora em que é publicada.

## 3. Plugins recomendados

| Plugin | Para quê |
|---|---|
| **Advanced Custom Fields (ACF)** | campos extras (crédito da foto, cidade, grade, parada, cotações, anúncios). Ativar "Mostrar na API REST" em cada grupo de campos |
| Custom Post Type UI *(ou o código da seção 4)* | criar os tipos de conteúdo e as taxonomias com `show_in_rest` |
| Yoast SEO *(opcional)* | título e descrição para o Google; o site lê `yoast_head_json` da API |
| Redirection | levar os endereços antigos dos três sites para os novos |
| Application Passwords *(nativo do WordPress)* | senha só para leitura de rascunhos e conteúdo privado; nunca usar a senha de um administrador no site |

## 4. Tipos de conteúdo e taxonomias

Tudo com `show_in_rest => true`, para aparecer na API.

```php
add_action('init', function () {
  // Cidades: cada rádio é um termo. Ligar uma cidade nova = criar o termo, sem mexer no site.
  register_taxonomy('cidade', ['post', 'programa', 'anuncio', 'parada'], [
    'label' => 'Cidades', 'hierarchical' => true, 'show_in_rest' => true, 'rest_base' => 'cidades',
  ]);
  // Produto: marca as matérias que vão para o Agro na Verde (termo "agro-na-verde").
  register_taxonomy('produto', ['post'], [
    'label' => 'Produtos', 'hierarchical' => true, 'show_in_rest' => true, 'rest_base' => 'produtos',
  ]);
  $cpt = fn($nome, $rest) => ['label' => $nome, 'public' => false, 'show_ui' => true, 'show_in_rest' => true,
    'rest_base' => $rest, 'supports' => ['title', 'thumbnail', 'custom-fields']];
  register_post_type('programa', $cpt('Programação', 'programas'));
  register_post_type('anuncio', $cpt('Publicidade', 'anuncios'));
  register_post_type('parada', $cpt('Mais tocadas', 'paradas'));
  register_post_type('cotacao', $cpt('Cotações do dia', 'cotacoes'));
});
```

### 4.1 Cidades (taxonomia `cidade`)

| Campo (ACF no termo) | Exemplo | Uso no site |
|---|---|---|
| nome / slug | Cuiabá / `cuiaba` | seletor de cidade, `/cidade/cuiaba` |
| `frequencia` | 103.7 | cabeçalho, player, rodapé |
| `logo` | imagem PNG ou SVG | cabeçalho, player, rodapé (troca com a cidade) |
| `stream` | `https://streaming.livespanel.com:20086/verdefm` | rádio ao vivo |
| `ativa` | sim/não | desligada aparece como "Em breve" no seletor |

Rádios atuais:

| Cidade | Frequência | Rádio ao vivo |
|---|---|---|
| Cuiabá | 103.7 | `https://streaming.livespanel.com:20086/verdefm` |
| Campo Verde | 96.3 | `https://str1.streamhostpg.com.br:8062/stream` |
| Jaciara | 102.3 | `https://streaming.livespanel.com:20120/verdefmjaciara` |
| Arenápolis | 102.1 | em breve (endereço pendente) |

A escolha do leitor fica no navegador (cookie `vfm_cidade`). O site gera os blocos de **todas** as cidades e mostra o da cidade escolhida, por isso o WordPress **não precisa** ler cookie nem variar cache.

### 4.2 Matérias (`post`)

| No WordPress | No site (`Materia`) | Observação |
|---|---|---|
| título | `titulo` | |
| slug | `slug` | endereço `/noticia/{slug}` |
| resumo (excerpt) | `resumo` | **uma frase** (vira a linha fina); se ficar vazio, o site usa a primeira frase do texto |
| conteúdo | `conteudo` | HTML do editor; fotos internas ganham legenda e crédito automaticamente |
| data | `data` | |
| imagem destacada | `foto_g` (grande), `foto_m` (média) | tamanhos `large` e `medium_large`; **sem foto, o site mostra a matéria só com texto** |
| legenda da imagem | `legenda` | `caption` da mídia |
| campo `credito` na mídia (ACF) | crédito | sem crédito: "Foto: Reprodução" |
| categoria | `editoria` | slugs: `politica`, `economia`, `esporte-e-cultura`, `policial`, `brasil`, `cidades` |
| taxonomia `cidade` | `cidade` | uma ou mais; alimenta "Em {cidade}" e `/cidade/{slug}` |
| taxonomia `produto` = `agro-na-verde` | — | a matéria entra no Agro na Verde |
| campo `chapeu` (ACF, opcional) | chapéu | texto curto acima do título (ex.: "Cidades · Saúde"); vazio = nome da editoria |

**Legenda e crédito em toda foto** (pedido da rádio): abaixo de cada imagem, pequena, cinza e em itálico: "Legenda · Foto: Crédito". O campo "Crédito" deve ficar na tela de mídia, perto da legenda, para a redação preencher ao subir a foto.

Pedido para a API (o `_embed` traz foto, autor e termos numa chamada só):

```
GET /wp-json/wp/v2/posts?_embed&per_page=20&status=publish
GET /wp-json/wp/v2/posts?_embed&categories={id}            (editoria)
GET /wp-json/wp/v2/posts?_embed&cidades={id}               (cidade)
GET /wp-json/wp/v2/posts?_embed&produtos={id-agro}         (Agro na Verde)
GET /wp-json/wp/v2/posts?search=termo                      (busca)
```

### 4.3 Home (página de opções no ACF: "Página inicial")

| Campo | Tipo | Bloco da home |
|---|---|---|
| `manchete` | matéria | manchete grande |
| `chapeu_manchete`, `fina_manchete` | texto | chapéu e linha fina da manchete (opcionais) |
| `faixa` | até 4 matérias | faixa abaixo da manchete |
| `ultimas` | automático | as 5 mais recentes vão para a faixa "Últimas" (não precisa campo) |
| `editorias_home` | 3 editorias | colunas de editoria da home (1 destaque + 2 em lista, automáticas) |

"Em {cidade}" é automático: as 4 matérias mais recentes de cada cidade. Ao lado da manchete fica o painel das **10 mais tocadas** (seção 6).

### 4.4 Programação (`programa`)

Um registro por programa e por bloco de dias:

| Campo | Exemplo |
|---|---|
| título | Jornal da Verde FM |
| `cidade` (taxonomia) | Cuiabá |
| `dias` (checkbox) | seg, ter, qua, qui, sex (0 = domingo … 6 = sábado) |
| `inicio`, `fim` (hora inteira) | 8, 11 (`fim` 0 = meia-noite) |
| `apresentador` | Jornalista: Marina Martins |

O site monta a grade de cada cidade (`grade: [{rotulo, dias, programas}]`), marca o programa no ar pelo fuso de Cuiabá e mostra o nome dele no player. O "Agro na Verde" é um programa como os outros (seg a sex, 7h às 8h).

## 5. Publicidade (`anuncio`)

| Campo | Valores |
|---|---|
| imagem | banner do topo **1260 × 120 px** (ou 2520 × 240 para telas nítidas); quadrado da matéria **300 × 250 px** |
| `posicao` | `topo`, `materia` (e futuras posições) |
| `link` | endereço do anunciante (abre em nova aba, com `rel="sponsored"`) |
| `alt` | nome do anunciante (acessibilidade) |
| `cidade` (taxonomia) | em quais cidades aparece; nenhuma marcada = todas |
| `inicio`, `fim` | datas da campanha; fora do período o anúncio some sozinho |

Mais de um anúncio na mesma posição: o site faz rodízio a cada 8 s (para com o mouse e tem botão de pausa).

## 6. As 10 mais tocadas (`parada`)

Um registro por semana (e por cidade, se a rádio decidir ter uma parada por cidade; sem cidade = vale para todas).

| Campo | Observação |
|---|---|
| título | "Semana de 16 a 22 de novembro" |
| `semanas_no_topo` | número de semanas do 1º lugar no topo |
| `musicas` (repetidor, 10 linhas, na ordem) | `musica`, `artista`, `posicao_anterior` (vazio = nova), `semanas`, `capa` (imagem quadrada, mín. 400 × 400), `youtube` (link ou ID do vídeo oficial), `previa` (MP3 de 30 s, opcional) |

Com `previa`, o play toca 30 s na própria página (e pausa a rádio). Sem `previa`, o play abre a música no YouTube Music. **Capas e prévias exigem cuidado com direitos:** usar as fornecidas pelas gravadoras ou por um serviço licenciado.

## 7. Promoções

Saiu do site em 24/11/2026 (decisão do Luiz). Não criar o tipo `promocao`.

## 8. Vídeos (YouTube)

Não passam pelo WordPress. Na geração, o site lê o feed público, sem chave:

- Verde FM: `https://www.youtube.com/feeds/videos.xml?channel_id=UC6WHqxKeQgo9b7rRtF43ifA`
- Agro na Verde: `https://www.youtube.com/feeds/videos.xml?playlist_id={ID_DA_PLAYLIST}`. A playlist ainda não existe; até lá, o Agro usa os vídeos do canal da Verde.

O vídeo só carrega quando a pessoa toca (até lá é uma capa leve), e rádio e vídeo não tocam juntos.

## 9. Agro na Verde

Portal próprio dentro do site, em `/agro-na-verde`, com cabeçalho e rodapé próprios e o player da Verde embaixo.

### 9.1 Notícias, entrevistas e artigos

- **Notícias:** matérias comuns marcadas com `produto = agro-na-verde`. A mais recente com o campo `destaque_agro` vira a manchete do Agro, e as duas seguintes vão ao lado dela. Meta da linha editorial: **3 notícias por dia**.
- **Entrevistas:** categoria `entrevistas` + `produto = agro-na-verde`. No formato pergunta e resposta, use no texto o bloco "Citação" para as perguntas, ou um repetidor ACF `perguntas` (`pergunta`, `resposta`).
- **Artigos (colunas):** categoria `artigos` + `produto = agro-na-verde`. Campo `coluna`: Crédito rural, Coluna do agrônomo, Mercado ou De ponta a ponta. O autor do WordPress é o colunista.

### 9.2 Cotações do dia (`cotacao`)

**Decisão da rádio:** a redação lança os preços todo dia útil, com a fonte; o dólar é automático.

Um registro **por dia** (título = a data). Campos ACF, um grupo por produto e um campo numérico por praça:

| Produto | Unidade | Praças (9) |
|---|---|---|
| Soja | R$ por saca de 60 kg | Sorriso, Sinop, Nova Mutum, Lucas do Rio Verde, Diamantino, Campo Verde, Rondonópolis, Primavera do Leste, Brasnorte |
| Milho | R$ por saca de 60 kg | as mesmas |
| Algodão | R$ por arroba (pluma) | as mesmas |
| Boi gordo | R$ por arroba | as mesmas |

Também tem o campo `fonte` (texto, por produto) e o campo `hora` da atualização. Para facilitar, deixe na tela de "Nova cotação" um botão **"Copiar os preços de ontem"**: a pessoa só corrige o que mudou.

O site lê os **últimos 7 registros** e calcula sozinho a variação do dia, a linha dos 7 dias, a média, o maior e o menor preço:

```
GET /wp-json/wp/v2/cotacoes?per_page=7&orderby=date&order=desc
```

**Dólar automático:** cotação PTAX de venda do Banco Central (API pública, sem chave), buscada pelo site na geração agendada de hora em hora, em dias úteis:

```
https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='MM-DD-AAAA'&$format=json
```

**Patrocínio:** na página de opções "Agro na Verde", os campos `patrocinador_nome`, `patrocinador_logo` e `patrocinador_link` preenchem o espaço "Oferecimento" do quadro. Vazio, o site mostra "Espaço para o patrocinador".

### 9.3 Newsletter

Toda terça, às 7h. O cadastro precisa de um serviço de envio (ex.: Brevo, Mailchimp, RD Station ou MailPoet no WordPress). O formulário do site envia o e-mail para a API do serviço por uma função do Netlify, para a chave não aparecer no navegador. É obrigatório guardar o aceite (LGPD) e ter o link de descadastro em todo envio. Hoje o cadastro é só demonstração.

## 10. Migração dos sites atuais

Os três sites de hoje (verdefm.com.br, verdefmjaciara.com.br e verdefmcampoverde.com.br) já são WordPress. Proposta:

1. Usar **um único WordPress** como painel. As matérias de Jaciara e Campo Verde entram nele (Ferramentas › Exportar / Importar) com a taxonomia `cidade` preenchida conforme o site de origem.
2. Matérias publicadas nos três sites (há várias repetidas) viram **uma só**, com as cidades marcadas.
3. As categorias atuais são `politica`, `policial`, `cidades`, `economia`, `esportes`, `brasil`, `entrevistas`, `artigos`, `videos`, `variedades`, `geral`, `noticias` e `destaques`. Unificar nas editorias do site: Política, Economia e negócios, Esporte e cultura, Policial, Brasil e Cidades. `destaques`, `geral` e `noticias` deixam de existir: os destaques da home vêm da página de opções.
4. **Redirecionamentos:** endereços antigos `/AAAA/MM/DD/slug/` → `/noticia/slug` (regra no Netlify, `_redirects`). Os domínios de Jaciara e Campo Verde apontam para `verdefm.com.br/cidade/jaciara` e `/cidade/campo-verde`.

## 11. Domínio próprio do Agro na Verde

Quando o domínio for registrado (ex.: `agronaverde.com.br`):

1. No Netlify, adicionar o domínio ao mesmo projeto do site.
2. Regra no Netlify para o domínio do Agro abrir `/agro-na-verde` como página inicial (`_redirects` com condição de domínio, ou uma `proxy` do Next.js quando o site passar a rodar com funções).
3. Os links "Voltar para a Verde FM" passam a apontar para `https://verdefm.com.br`.

## 12. Segurança e boas práticas

- O site só **lê** a API pública. Rascunhos e conteúdo privado exigem uma Application Password de um usuário **só leitura**, guardada como variável de ambiente no Netlify, nunca no código.
- Bloquear `/wp-json/wp/v2/users` para visitantes (evita expor os nomes de usuário).
- Imagens: subir em boa resolução (mín. 1600 px de largura para manchete). O WordPress gera os tamanhos e o site escolhe o certo.
- Textos alternativos (`alt`) em todas as imagens que não sejam decorativas: acessibilidade e Google.

## 13. Lista de entrega do desenvolvedor

- [ ] WordPress em `painel.verdefm.com.br`, com HTTPS e as páginas públicas redirecionando para o site
- [ ] Taxonomias `cidade` e `produto` e os tipos `programa`, `anuncio`, `parada` e `cotacao`, com `show_in_rest`
- [ ] Campos ACF de cada seção deste guia, visíveis na API REST
- [ ] Campo "Crédito" na mídia
- [ ] Páginas de opções "Página inicial" e "Agro na Verde"
- [ ] Build Hook do Netlify chamado ao publicar (seção 2) e geração agendada de hora em hora para o dólar
- [ ] Migração das matérias dos três sites, com cidades e editorias, e os redirecionamentos
- [ ] Usuário só leitura (Application Password) para o site
- [ ] Testar: publicar uma matéria e conferir no site em até 2 minutos; trocar a cidade; lançar uma cotação; cadastrar um anúncio com período

Dúvidas sobre o site (Next.js): os arquivos `web/lib/conteudo.ts` e `web/lib/agro.ts` mostram, nos tipos, cada campo esperado. A pasta `site/` e a pasta `ferramentas/` são da versão antiga e da demonstração; não fazem parte do novo site.
