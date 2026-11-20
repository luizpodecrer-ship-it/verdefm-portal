# Guia para o desenvolvedor WordPress

Este repositório entrega **só o front-end** do portal da Verde FM: HTML, CSS e JavaScript puros, sem framework e sem etapa de build. O trabalho do WordPress é transformar o HTML em templates PHP e alimentar os dados. **CSS e JS não precisam ser alterados**: eles funcionam com qualquer HTML que siga as classes e os atributos descritos aqui.

Pasta publicada: `site/`. Versão no ar para conferência: https://verdefm-portal.netlify.app (as matérias da demonstração vêm dos sites atuais da Verde FM e abrem lá, em outra aba).

---

## 1. Arquivos

| Arquivo | O que é |
|---|---|
| `site/index.html` | Home. Comentários `<!-- WP: ... -->` mostram de onde vem cada trecho. |
| `site/assets/css/verdefm.css` | Folha única. Variáveis no topo (`:root`), classes com prefixo `vfm-` em padrão BEM. |
| `site/assets/js/verdefm.js` | Comportamento: cidades, seletor, rádio, navegação contínua, janelas. Expõe `window.VerdeFM`. |
| `site/assets/img/logos/*.png` | Logo de cada cidade (840 × 200, fundo transparente). |
| `site/assets/img/foto-exemplo.svg` | Só para a demonstração. No tema, usar a imagem destacada do post. |

## 2. Divisão em templates

```
header.php       doctype … fim da faixa "Últimas"  (wp_head(), body_class(), seletor, menu)
front-page.php   conteúdo de <main id="vfm-conteudo"> da home
footer.php       rodapé, barra do rádio, <audio>, dialogs, JSON das cidades, wp_footer()
template-parts/  card-linha.php, card-cidade.php, editoria.php (repetem dentro dos loops)
```

**Regra importante:** cada template deve ter **um único** `<main id="vfm-conteudo">`. Só ele troca quando o leitor navega; cabeçalho, rádio e rodapé ficam fixos. Nada que precise mudar de página para página pode ficar fora dele (exceto o que o JS já atualiza: logo, nome da cidade, frequência, menu ativo, `<title>` e as classes do `<body>`).

Enfileirar em `functions.php`:

```php
wp_enqueue_style('vfm-fontes', 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap', [], null);
wp_enqueue_style('vfm', get_theme_file_uri('assets/css/verdefm.css'), [], VFM_VERSAO);
wp_enqueue_script('vfm', get_theme_file_uri('assets/js/verdefm.js'), [], VFM_VERSAO, ['strategy' => 'defer', 'in_footer' => false]);
```

Tamanhos de imagem sugeridos: `vfm-16x9` (1600 × 900, recorte) e `vfm-4x3` (800 × 600, recorte). As imagens recebem `class="vfm-foto vfm-foto--16x9"` (ou `--4x3`).

## 3. Cidades (o coração do multi-cidade)

Criar a **taxonomia `cidade`** (hierárquica não é necessária) ligada a `post`, com estes campos (term meta, ACF ou similar):

| Campo | Exemplo |
|---|---|
| nome (o próprio termo) | Cuiabá |
| slug | `cuiaba` |
| `frequencia` | 103.7 |
| `logo` | URL do PNG/SVG da cidade |
| `stream` | `https://streaming.livespanel.com:20086/verdefm` |
| `ativa` | sim/não (desligada aparece no seletor como "Em breve") |

Rádios atuais (tiradas do site antigo):

| Cidade | Frequência | Endereço da rádio ao vivo |
|---|---|---|
| Cuiabá | 103.7 | `https://streaming.livespanel.com:20086/verdefm` |
| Campo Verde | 96.3 | `https://str1.streamhostpg.com.br:8062/stream` |
| Jaciara | 102.3 | `https://streaming.livespanel.com:20120/verdefmjaciara` |
| Arenápolis | 102.1 | (em breve) |

O tema imprime as cidades no `footer.php`, exatamente neste formato, que o JS lê:

```php
<script type="application/json" id="vfm-cidades"><?php echo wp_json_encode(array_map(function ($t) {
  return [
    'slug'       => $t->slug,
    'nome'       => $t->name,
    'frequencia' => get_term_meta($t->term_id, 'frequencia', true),
    'logo'       => get_term_meta($t->term_id, 'logo', true),
    'stream'     => get_term_meta($t->term_id, 'stream', true),
    'ativa'      => (bool) get_term_meta($t->term_id, 'ativa', true),
  ];
}, get_terms(['taxonomy' => 'cidade', 'hide_empty' => false]))); ?></script>
```

E coloca a cidade padrão no `<html>`: `data-vfm-cidade-padrao="cuiaba"`.

### Como a escolha da cidade funciona

1. O leitor escolhe no seletor. O JS grava o **cookie `vfm_cidade`** (1 ano, `path=/`).
2. O JS troca na hora: logo (`[data-vfm-logo]`), textos `[data-vfm-texto="cidade"]` e `[data-vfm-texto="frequencia"]`, a opção marcada e **a rádio** (se estiver tocando, já passa a tocar a da cidade nova).
3. Em seguida o JS **pede a página atual de novo** e troca o `#vfm-conteudo`. O PHP deve ler o cookie e montar os blocos daquela cidade:

```php
function vfm_cidade_atual() {
  $slug = sanitize_key($_COOKIE['vfm_cidade'] ?? '');
  $t = $slug ? get_term_by('slug', $slug, 'cidade') : null;
  if (!$t || !get_term_meta($t->term_id, 'ativa', true)) $t = get_term_by('slug', 'cuiaba', 'cidade');
  return $t;
}
```

**Alternativa que também resolve o cache:** o template pode imprimir os blocos de **todas** as cidades, cada um com `data-vfm-so-cidade="slug"` (os que não são da cidade padrão com `hidden`). O JS mostra só o da cidade escolhida, sem pedir nada ao servidor. É o que a demonstração faz no bloco "Em {cidade}".

Use `vfm_cidade_atual()` em: logo inicial do cabeçalho, bloco "Em {cidade}", programação, publicidade e no `aria-current="true"` da opção do seletor. Assim a página já chega certa, sem "piscar".

**Cache:** como o HTML muda conforme o cookie, o cache de página (plugin ou CDN) precisa variar pelo cookie `vfm_cidade` (ou excluir a home do cache). Sem isso um leitor de Jaciara pode receber a home de Cuiabá.

## 4. Rádio ao vivo

- Um único `<audio id="vfm-audio" preload="none">` no `footer.php`, **fora** do `#vfm-conteudo`.
- Qualquer botão com `data-vfm-play` toca/pausa (pode haver vários: cartão na home, barra fixa, página da rádio). O JS mantém `aria-label` e `aria-pressed` certos.
- Estado no `<html>`: `vfm-tocando`, `vfm-carregando-audio` e `vfm-tocou` (já tocou uma vez; mostra a barra fixa no computador).
- `[data-vfm-player-status]` recebe avisos de erro. `[data-vfm-programa]` mostra o programa no ar (o PHP escreve; pode vir de um CPT `programa` com dia, início, fim e cidade).
- Os nomes da rádio aparecem na tela de bloqueio do celular (Media Session).

## 5. Navegação contínua (a rádio não para)

Ao clicar em um link do próprio site, o JS busca a página nova com `fetch`, troca só o `#vfm-conteudo`, atualiza `<title>`, classes do `<body>` e o endereço no navegador. O botão Voltar funciona.

- O pedido leva o cabeçalho `X-VFM-Navegacao: 1`. É opcional usar; o tema pode devolver a página inteira normalmente.
- Ficam de fora (navegação normal): links externos, `target="_blank"`, `download`, `/wp-admin`, `/wp-login.php`, `/wp-json`, `/feed`, arquivos (pdf, imagens, mp3…) e qualquer link ou bloco com `data-vfm-normal`.
- Scripts dentro do conteúdo novo são executados (embeds de Instagram, X, YouTube).
- Depois de cada troca o JS dispara **`vfm:pagina`**. Use para recarregar anúncios e analytics:

```js
document.addEventListener('vfm:pagina', function (e) {
  if (window.gtag) gtag('event', 'page_view', { page_location: e.detail.url, page_title: document.title });
  // googletag.pubads().refresh(); etc.
});
document.addEventListener('vfm:cidade', function (e) { /* e.detail.cidade.slug */ });
```

- Formulários com `data-vfm-busca` (método GET) também navegam sem recarregar. A busca usa o campo `s`, padrão do WordPress, com `action="<?php echo esc_url(home_url('/')); ?>"`.
- Menu ativo: links dentro de `[data-vfm-menu]` recebem `aria-current="page"` sozinhos.
- Se algo falhar (erro de rede, página sem `#vfm-conteudo`), o JS faz a navegação normal. Nada quebra.

## 6. Ao vivo e vídeos do YouTube

Bloco `#videos` da home: quadro grande com a transmissão ao vivo do canal e, ao lado (no celular, embaixo, correndo para o lado), os últimos vídeos.

- Canal: **@VerdeFMoficial**, ID `UC6WHqxKeQgo9b7rRtF43ifA` (vai no `data-canal` do `[data-vfm-tv]`).
- Últimos vídeos: ler o feed público do canal no PHP, sem chave de API, e guardar em cache (30 min):

```php
$feed = fetch_feed('https://www.youtube.com/feeds/videos.xml?channel_id=UC6WHqxKeQgo9b7rRtF43ifA');
foreach ($feed->get_items(0, 6) as $item) {
  $id = $item->get_item_tags('http://www.youtube.com/xml/schemas/2015', 'videoId')[0]['data'];
  // <button class="vfm-tv__item" data-vfm-video="$id" data-titulo="título"> … miniatura https://i.ytimg.com/vi/$id/mqdefault.jpg
}
```

- O quadro grande abre no **vídeo mais recente**: o PHP escreve o ID dele em `data-atual`, a capa `https://i.ytimg.com/vi/ID/maxresdefault.jpg`, o título e o link, e marca o item com `aria-current="true"`.
- O primeiro item da lista é o ao vivo (`data-vfm-video="ao-vivo"`).
- O vídeo **só carrega quando a pessoa toca** (até lá é uma capa leve): a home não fica pesada com o player do YouTube.
- **Rádio e vídeo não tocam juntos:** começar um vídeo pausa a rádio; ligar a rádio fecha o vídeo.
- Quando o canal não está ao vivo, o próprio YouTube mostra o aviso dentro do quadro. Se quiserem esconder o ao vivo fora do horário, o PHP pode tirar o item "ao vivo" e já abrir no vídeo mais recente (trocar `data-atual`, a classe `vfm-tv--ao-vivo` e a capa).

## 6.1 Banner de publicidade do topo

Logo no começo de `#vfm-conteudo` (troca com a cidade). Caixa com proporção fixa **1260 × 120 px**, imagem cobrindo a caixa (`object-fit: cover`), então peças em outra medida próxima (ex.: 730 × 72) também servem.

```html
<section class="vfm-pub-topo__caixa" aria-label="Publicidade" data-vfm-rodizio>
  <a class="vfm-pub-topo__peca vfm-ativa" href="LINK" target="_blank" rel="noopener sponsored"><img src="..." alt="ANUNCIANTE" width="1260" height="120"></a>
  <!-- mais anúncios: mesma marcação, sem vfm-ativa -->
</section>
```

Com dois ou mais anúncios o JS faz o rodízio (8 s, para no mouse/foco, começa num aleatório). Plugin de anúncios: basta gerar essa marcação.

## 7. Faixa "Últimas" (letreiro)

O `ul[data-vfm-letreiro-lista]` recebe os 5 posts mais recentes. O JS duplica os itens (cópias com `aria-hidden`) e faz correr; o botão `[data-vfm-letreiro-pausa]` pausa. Não é preciso duplicar no PHP.

## 7.1 Menu, busca e acessibilidade

- Menu do celular e busca são `<dialog>`: abrir com `data-vfm-abrir="id-do-dialog"`, fechar com `data-vfm-fechar`. Esc e toque fora fecham.
- Menus: `wp_nav_menu` com `theme_location` "editorias", usado no cabeçalho e no menu do celular (as duas `<nav>` levam `data-vfm-menu`).
- Já previsto: link "Pular para o conteúdo", foco visível, alvos de 44 px, aviso para leitor de tela a cada troca de página (`#vfm-aviso`), "reduzir movimento" do sistema respeitado. Manter os `aria-*` e os `alt` ao converter.

## 8. Páginas internas (templates)

Cada página da demonstração mostra o HTML que o template deve gerar. Cabeçalho, faixa "Últimas", player, rodapé e janelas são sempre os mesmos (header.php / footer.php); só muda o `<main id="vfm-conteudo">`.

| Página da demonstração | Template WordPress | Observações |
|---|---|---|
| `/noticia/*.html` | `single.php` | trilha, chapéu (link da editoria), título, linha fina (`the_excerpt`, uma frase), autor e data, compartilhar (WhatsApp, Facebook, X, copiar), foto com legenda, `the_content()` dentro de `.vfm-texto`, chamada "Ouça a Verde", lateral com publicidade 300 × 250 e últimas notícias, "Leia também" (mesma editoria) |
| `/editoria/*.html` | `category.php` | primeira matéria em destaque (`.vfm-destaque`), demais em `.vfm-cards`, paginação `.vfm-paginacao` |
| `/cidade/*.html` | `taxonomy-cidade.php` | logo e frequência da cidade; botão `data-vfm-ouvir-cidade="slug"` troca a cidade e toca a rádio dela |
| `/videos.html` | `page-videos.php` | mesmo componente `[data-vfm-tv]` da home, com todos os vídeos do feed em `.vfm-videos` |
| `/programacao.html` | `page-programacao.php` | um bloco por cidade (`data-vfm-so-cidade`), abas por dias (`data-vfm-abas`, cada aba com `data-vfm-dias`), itens com `data-inicio`/`data-fim` (horas). O JS abre a aba de hoje e marca o programa no ar |
| `/promocoes.html` | `page-promocoes.php` | formulário com as classes `.vfm-formulario`, `.vfm-campo`, `.vfm-aceite` (plugin de formulário) |
| `/busca.html?s=` | `search.php` | lista em `.vfm-cards`. Na demonstração a busca é feita por `assets/demo/busca-demo.js`, que **não** vai para o tema |
| `/404.html` | `404.php` | |

**Grade de programação no JSON das cidades:** cada cidade leva `grade: [{rotulo, dias: [1..5], programas: [{inicio, fim, programa, apresentador}]}]` (dias: 0 = domingo; horas inteiras; fim 0 = meia-noite). O player mostra o programa no ar (`[data-vfm-programa]`) pelo fuso de Cuiabá e troca sozinho na virada da hora.

**Outros atributos:** `data-vfm-link-cidade="/cidade/{cidade}.html"` (o JS troca `{cidade}` pela escolhida), `data-vfm-copiar="URL"` (copia o link), `data-vfm-grade-hoje` + `data-vfm-grade-curta="4"` (programação resumida da home).

A pasta `ferramentas/` só serve para montar a demonstração (coleta das matérias dos sites atuais e geração das páginas); não faz parte do tema.
