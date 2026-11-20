# VERDE FM · Portal de notícias

Portal de notícias da Rádio Verde FM, multi-cidade: cada cidade tem a sua rádio, o seu logo, as suas notícias e a sua publicidade. Site atual: verdefm.com.br.

**Este repositório entrega só o front-end** (HTML, CSS e JavaScript). O back-end será WordPress, feito por outro desenvolvedor. Guia para ele: `docs/WORDPRESS.md`.

## Quem é o Luiz

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
- Fontes: Archivo (títulos, peso 600) e Inter (texto, 400/500/600), do Google Fonts.
- Cantos arredondados por igual (10–20 px), linhas finas, sombras discretas.
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

## Próximas etapas

1. Protótipos para aprovar: página da notícia, página da cidade, página da editoria, busca e 404.
2. Converter as telas aprovadas para o mesmo padrão de código.

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
- A cada publicação, trocar o número `?v=` do CSS e do JS em `site/index.html`, para o navegador baixar a versão nova.

## Testar

- Abrir `site/` num navegador de teste servido por HTTP (a navegação contínua não funciona abrindo o arquivo com dois cliques; nesse caso o site navega do jeito normal).
- O som da rádio só dá para conferir no endereço publicado.
