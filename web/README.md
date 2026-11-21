# Verde FM · Portal (Next.js)

Next.js + React + TypeScript + Tailwind CSS + shadcn/ui. O WordPress fica "headless" (só o painel da redação, entregando as matérias pela API).

- `npm install` e `npm run dev` para abrir em http://localhost:3000.
- `npm run build` gera o site estático em `out/` (o que o Netlify publica).
- Conteúdo: `lib/conteudo.ts` é o único arquivo que conversa com os dados. Hoje lê a demonstração (`data/`); com o WordPress no ar, passa a buscar em `/wp-json/wp/v2/...`.
- Visual: `app/verdefm.css` (classes `vfm-*`, variáveis no topo; tema escuro em `html.dark`) + Tailwind/shadcn nos componentes de `components/ui`.
- Estado que vale para o site inteiro (tema, cidade, rádio ao vivo): `components/verde/provedores.tsx`, no layout — a rádio não para ao navegar.
