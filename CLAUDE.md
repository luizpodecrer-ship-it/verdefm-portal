# VERDE FM · Portal de notícias

Portal de notícias da Rádio Verde FM, multi-cidade: cada cidade tem a sua rádio, o seu logo, as suas notícias e a sua publicidade. Site atual: verdefm.com.br.

**Este repositório entrega só o front-end** (HTML, CSS e JavaScript). O back-end será WordPress, feito por outro desenvolvedor. Guia para ele: `docs/WORDPRESS.md`.

## Quem é o Luiz

- **Responder sempre em português do Brasil** (pedido do Luiz em 21/11/2026), em toda mensagem.
- **Padrão em todo projeto web:** assinatura da Astravox no rodapé = **só o ícone** da Astravox (sem "Desenvolvido por", sem o nome), pequeno e discreto, com link para https://www.astravox.com.br em nova aba e `aria-label="Astravox"`.
- Não é desenvolvedor. Quando precisar ele fazer algo (GitHub, Netlify, domínio), dar o passo a passo clicável, sem jargão.
- Quer **proposta ou protótipo antes de implementar**. Nada vai para o código sem aprovação.
- Quer confirmação curta depois de cada entrega e que problemas próximos sejam apontados sem ele pedir.
- **Não mandar arquivos para ele.** Tudo vai para o GitHub; protótipos para revisar vão como página publicada (link).

## Como o código é feito

- HTML, CSS e JS puros, sem framework e sem build. Pasta publicada: `site/`.
- Uma folha só (`site/assets/css/verdefm.css`), com variáveis no topo; classes com prefixo `vfm-` (padrão BEM). Não criar cores soltas fora das variáveis.
- Um script só (`site/assets/js/verdefm.js`), clássico (não ES module), tudo dentro de uma função; API pública em `window.VerdeFM`.
- Comportamento ligado por atributos `data-vfm-*`, nunca por texto ou posição, para o WordPress poder gerar o HTML livremente.
- Cada página tem um único `<main id="vfm-conteudo">`: só ele troca na navegação contínua.
- Comentários `<!-- WP: ... -->` no HTML dizem qual template ou função do WordPress gera cada trecho.
- Textos, nomes de classe e comentários em português do Brasil.
- Mobile first: conferir em 375 px, 1366–1440 px e 1920 px.
- Acessibilidade WCAG 2.1 AA: contraste 4,5:1, alvos de 44 px, um `<h1>` por página, tudo pelo teclado, "reduzir movimento" respeitado.
- Sem dados no navegador além da preferência de cidade (cookie `vfm_cidade` e o mesmo valor no localStorage).

## Visual (aprovado em 20/11/2026)

- Claro e suave: fundo `#F7F8F6`, branco nos cartões, texto `#1B2420`, apoio `#55625A`.
- Verde só como acento: `#17803A` (botões, links, etiquetas), `#EEF4F0` (fundos suaves), `#2DBE4E` só em detalhes decorativos. Rodapé grafite `#1B2420`.
- Fontes (pedido do Luiz em 21/11/2026; substitui Inter + Aeonik e Grtsk + Open Sans): **Clash Display** nos títulos (700) e **Satoshi** no texto (400/500/700; menu em 700). As duas vêm do **Fontshare** (gratuitas, uso comercial liberado), por `api.fontshare.com`. A Clash tem espaço entre palavras estreito: títulos sem letras apertadas (letter-spacing 0) e com `word-spacing: .12em`.
- Cantos arredondados por igual, **pouco arredondados** (6, 8, 10 e 12 px; pedido do Luiz em 21/11/2026, antes 10–20 px); botões em pílula continuam. Linhas finas, sombras discretas.
- Player: volume em trilho fino branco, sem contorno; equalizador **parado (barrinhas quietas) com a rádio parada e dançando com a rádio tocando** (auditoria de 21/11/2026, aprovada: substitui o "sempre se mexendo").
- Protótipo aprovado (canvas): https://claude.ai/artifact/4QqTTzzLXqrU77uNBGwR7M

## Decisões aprovadas

- **20/11/2026** — Portal multi-cidade com **seletor de cidade em lista que abre**, ao lado do logo (no celular, abaixo do logo: "Você está em …"). Não mostrar todas as cidades como botões soltos.
- **20/11/2026** — Cidades: Cuiabá 103.7, Campo Verde 96.3 e Jaciara 102.3 no ar; **Arenápolis 102.1 entra em breve** (aparece apagada com "Em breve"). Cada cidade é um cadastro (taxonomia `cidade` no WordPress) para ligar novas sem mexer no código.
- **20/11/2026** — **Cada cidade tem a sua rádio**: trocar de cidade troca o logo, as notícias "Em {cidade}", a programação, a publicidade **e a rádio ao vivo** (se estiver tocando, passa a tocar a nova).
- **20/11/2026** — **A rádio não para ao navegar**: navegação contínua (só `#vfm-conteudo` troca). Barra fixa da rádio sempre no celular; no computador aparece depois do primeiro play.
- **20/11/2026** — Visual suave aprovado (ver seção Visual). Substituiu a primeira proposta, de verde forte e letras largas.
- **20/11/2026** — Home em código, pronta para o WordPress, e publicada no Netlify para conferência.
- **20/11/2026** — **Ao vivo e vídeos na home** (pedido do Luiz): bloco com a transmissão ao vivo do YouTube no quadro grande e os últimos vídeos do canal ao lado (no celular, embaixo, correndo para o lado). Tocar num vídeo abre no quadro grande. Rádio e vídeo não tocam juntos. O vídeo só carrega no toque. Substituiu o bloco "Entrevistas" da home; no menu, "Entrevistas" virou "Vídeos". Canal: @VerdeFMoficial (`UC6WHqxKeQgo9b7rRtF43ifA`).
- **20/11/2026** — **Cabeçalho sempre à vista** (pedido do Luiz): logo, seletor de cidade e menu ficam presos no topo ao rolar; depois de descer um pouco, o cabeçalho encolhe e ganha sombra leve (`.vfm-rolou`). Ao pular para uma seção, o título não fica escondido atrás dele.
- **20/11/2026** — **Demonstração com matérias reais** (pedido do Luiz): a home usa títulos, resumos e fotos das matérias recentes dos três sites atuais (verdefm.com.br, verdefmjaciara.com.br, verdefmcampoverde.com.br); os links abrem a matéria no site atual, em outra aba. "Em {cidade}" traz as notícias de Cuiabá, Jaciara e Campo Verde e mostra só as da cidade escolhida (`data-vfm-so-cidade`).
- **20/11/2026** — **Assinatura da Astravox no rodapé** (pedido do Luiz): **só o ícone** (`assets/img/astravox.svg`), pequeno e discreto, com link para www.astravox.com.br em nova aba. Sem "Desenvolvido por" e sem o nome escrito. **Padrão de todos os projetos web do Luiz/Astravox.**
- **20/11/2026** — **Logo da cidade no rodapé** (pedido do Luiz): no lugar do texto "Verde FM", o logo da cidade escolhida, menor e discreto (34 px de altura); troca junto com o do cabeçalho (`data-vfm-logo`).
- **21/11/2026** — **Faixa "Últimas" em movimento** (pedido do Luiz): letreiro que corre sem parar (velocidade constante), para com o mouse, com o foco do teclado e no botão de pausa; com "reduzir movimento" fica parada e dá para arrastar.
- **21/11/2026** — **"Ao vivo no YouTube" com o ícone oficial** (vermelho), ondas pulsando em volta e "Ao vivo" com pontinho piscando; sobe no mouse. Mesmo botão no menu do celular (`.vfm-yt`).
- **21/11/2026** — **Redes sociais com ícones no rodapé**: Instagram, Facebook e YouTube em botões redondos brancos que ficam **verdes** no mouse (pedido do Luiz: nada das cores de cada rede).
- **21/11/2026** — **Vídeos já abrem no último vídeo do canal** (pedido do Luiz): capa em alta do vídeo mais recente no quadro grande; o ao vivo fica como primeiro item da lista. No computador, a lista "Últimos vídeos" fica num painel à direita com a mesma altura do vídeo e rola por dentro.
- **21/11/2026** — **Banner de publicidade no topo** (pedido do Luiz, como no site atual): logo abaixo da faixa "Últimas", largura toda do conteúdo, proporção **1260 × 120 px** (a mesma do banner_topo do site atual; MRV 730 × 72 também cabe). Mais de um anúncio = rodízio a cada 8 s, com troca suave; para no mouse e no foco; cada visita começa num anúncio diferente. Etiqueta "Publicidade" discreta embaixo. Medida para pedir aos anunciantes: 1260 × 120 px (ou 2520 × 240 para telas nítidas).
- **21/11/2026** — **Player da rádio fixo no rodapé em todas as telas** (pedido do Luiz; saiu o cartão "No ar agora" do lado da manchete): barra grafite com play (anel pulsando ao tocar), logo da cidade, selo "Ao vivo", nome do programa no ar, equalizador animado, link da programação e volume com botão de mudo. No lugar do cartão, a coluna ao lado da manchete tem **5 notícias** (fecha na altura da manchete).
- **21/11/2026** — **Programa no ar de verdade**: a grade real das três rádios (copiada das páginas /programacao/ dos sites atuais) vai no JSON das cidades; o player mostra o programa do momento pelo fuso de Cuiabá e as grades marcam "No ar".
- **21/11/2026** — **Páginas internas** (pedido do Luiz: "desenvolva todas as internas agora"; feitas direto, sem protótipo): matéria (`/noticia/…`), editoria (`/editoria/…`: Política, Economia e negócios, Esporte e cultura, Policial, Brasil), cidade (`/cidade/…`, com "Ouvir a Verde {cidade}"), Vídeos, Programação (abas por dia, abre no dia de hoje, por cidade), Promoções (formulário de inscrição), Busca e 404. Tudo com a navegação contínua: a rádio não para. As páginas da demonstração são geradas por `ferramentas/gerar-demo.py` a partir da home e de `ferramentas/dados/demo.json` (matérias reais dos três sites, grade e vídeos, coletados por `ferramentas/coletar-demo.py`).

- **21/11/2026** — **Correções da auditoria de UX e acessibilidade** (aprovadas pelo Luiz): foco do teclado com anel duplo (branco + verde; verde vivo no escuro); ordem do cabeçalho = ordem da tela; página da cidade sem rolagem lateral em 320 px; painéis das abas com foco; movimento só com motivo (ondas do YouTube e pontinho piscam 3 vezes e param; equalizador e selo "Ao vivo" só se mexem com a rádio tocando; rodízio do banner com botão de pausa visível); no celular, ao rolar, o cabeçalho recolhe a linha da cidade e um alfinete reabre a escolha; formulário com validação e mensagens por campo; sem textos provisórios entre colchetes; links do rodapé com 44 px; trilha termina no título da matéria; player com erro apaga o selo e vira "tentar de novo".
- **Pendências da auditoria (decisão do Luiz):** banner do topo no celular (peça própria 320 × 100), faixa "Últimas" no celular (um título por vez), estado "fora do ar" da transmissão do YouTube (precisa do WordPress) e assinatura "Redação Verde FM".

- **21/11/2026** — **Efeitos de mouse suaves em todo o portal** (pedido do Luiz: "muito duro, amador"): nada pula nem cresce no mouse; só mudam cor, fundo, borda e sombra, em 260 ms suaves (`--vfm-transicao`). Fotos: zoom lento e leve (900 ms, `--vfm-transicao-foto`). Notícias: o título fica verde. Botão do YouTube: fundo rosado bem claro. **Regra para telas novas.**

- **21/11/2026** — **Correção do foco no título** (Luiz viu um contorno verde em volta do título ao abrir as páginas no Safari): o foco que o site coloca no título ao trocar de página (para leitor de tela) não aparece mais na tela (`[tabindex="-1"]:focus`). Matéria sem foto aparece só com texto (destaque e cartões), sem quadro vazio; linha fina curta nos destaques e cartões. **Testar sempre navegando pelo menu, como o Luiz faz, antes de entregar.**

- **21/11/2026** — **Nomes das páginas menores** (pedido do Luiz: "não gostei desses nomes grandes"): título de editoria, cidade, vídeos, programação etc. entre 24 e 30 px (antes até 44 px); logo da página da cidade menor.

## Próximas etapas

1. Luiz revisar as páginas internas no Netlify e pedir ajustes.
2. Arquivos da Aeonik (ou voltar para outra fonte de texto, se o teste não agradar).

## Pendências

- Programação real de cada cidade (programas, apresentadores, horários).
- Texto institucional do rodapé.
- Endereço da rádio ao vivo de Arenápolis.
- Endereço por cidade (ex.: verdefm.com.br/jaciara) ou tudo no mesmo endereço com o seletor.
- Quem publica as notícias: redação única marcando a cidade, ou uma equipe por cidade.
- Logos em SVG.

## Publicar

- GitHub: `luizpodecrer-ship-it/verdefm-portal`, branch `main`.
- Netlify: projeto **verdefm-portal** (id `5f327f1e-1d67-44ec-879f-db751dbdb975`, time "luizpodecrer"), endereço **verdefm-portal.netlify.app**, acesso de visitantes aberto. Publica a pasta `site/` (configurado em `netlify.toml`).
- Primeira publicação (20/11/2026) foi enviada direto pelo Claude. Enquanto o Netlify não estiver ligado ao GitHub, cada entrega precisa ser publicada de novo pela ferramenta do Netlify (deploy-site com o id acima).
- A cada publicação, trocar o número `?v=` do CSS e do JS em `site/index.html` e rodar `python3 ferramentas/gerar-demo.py` (as páginas internas copiam o cabeçalho e o rodapé da home). **Mudou cabeçalho, rodapé ou player na home? Rode o gerador de novo.**

## Testar

- Abrir `site/` num navegador de teste servido por HTTP (a navegação contínua não funciona abrindo o arquivo com dois cliques; nesse caso o site navega do jeito normal).
- O som da rádio só dá para conferir no endereço publicado.
