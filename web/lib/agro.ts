/**
 * Conteúdo do portal Agro na Verde (aprovado em 21/11/2026).
 * No WordPress headless: notícias = posts marcados "Agro na Verde"; cotações = lançadas pela redação
 * todo dia útil (preço por praça e produto, com a fonte), dólar automático pela API do Banco Central.
 * Demonstração: notícias reais de agro publicadas nos sites da Verde FM; cotações e dólar são EXEMPLO.
 */

export type NoticiaAgro = { foto: string; data: string; chapeu: string; titulo: string; resumo: string; link: string };

const F = (n: string) => `/assets/img/agro/noticias/${n}.jpg`;

export const AGRO_MANCHETE: NoticiaAgro = {
  foto: F("n0"), data: "2026-11-10", chapeu: "Entidades · Soja e milho",
  titulo: "Luiz Pedro Bier assume presidência da Aprosoja MT a partir de 2027",
  resumo: "A Associação dos Produtores de Soja e Milho de Mato Grosso elegeu a nova diretoria que comandará a entidade no triênio 2027/2029.",
  link: "https://www.verdefm.com.br/2026/11/10/luiz-pedro-bier-assume-presidencia-da-aprosoja-mt-a-partir-de-2027/",
};

export const AGRO_DESTAQUES: NoticiaAgro[] = [
  { foto: F("n5"), data: "2026-10-08", chapeu: "Política agrícola", titulo: "Dois nomes de MT são cotados para Agricultura em eventual governo Flávio Bolsonaro", resumo: "", link: "https://www.verdefm.com.br/2026/10/08/dois-nomes-de-mt-sao-cotados-para-agricultura-em-eventual-governo-flavio-bolsonaro/" },
  { foto: F("n4"), data: "2026-09-03", chapeu: "Campo Verde", titulo: "Campo Verde inicia elaboração de plano para fortalecer agricultura familiar", resumo: "", link: "https://www.verdefmcampoverde.com.br/2026/09/03/campo-verde-inicia-elaboracao-de-plano-para-fortalecer-agricultura-familiar/" },
];

export const AGRO_NOTICIAS: NoticiaAgro[] = [
  { foto: F("n3"), data: "2026-11-12", chapeu: "Investigação", titulo: "Donos de fazenda são investigados por usar agrotóxico proibido em MT", resumo: "A Polícia Civil deflagrou a Operação Aegis para investigar o uso ilegal de um agrotóxico proibido no Brasil desde 2020 em uma propriedade rural de Cuiabá.", link: "https://www.verdefm.com.br/2026/11/12/donos-de-fazenda-sao-investigados-por-usar-agrotoxico-proibido-em-mt/" },
  { foto: F("n9"), data: "2026-11-05", chapeu: "Logística", titulo: "Carreta carregada com soja tomba e pega fogo; motorista morre na BR-070", resumo: "A carreta bitrem bateu em uma mureta de concreto, tombou e pegou fogo na Rodovia dos Imigrantes, em Várzea Grande.", link: "https://www.verdefm.com.br/2026/11/05/carreta-carregada-com-soja-tomba-e-pega-fogo-motorista-morre-na-br-070/" },
  { foto: F("n10"), data: "2026-10-16", chapeu: "Crédito", titulo: "Justiça penhora fazenda de R$ 17,6 milhões em cobrança de dívida com Banco do Brasil", resumo: "A Justiça determinou a penhora da Fazenda Bom Sucesso para garantir o pagamento de uma dívida de R$ 15,2 milhões.", link: "https://www.verdefm.com.br/2026/10/16/justica-penhora-fazenda-de-r-176-milhoes-em-cobranca-de-divida-com-banco-do-brasil/" },
  { foto: F("n8"), data: "2026-10-08", chapeu: "Pecuária", titulo: "Temporal com raios mata 11 animais e causa estragos em Vila Bela", resumo: "Um raio matou 11 cabeças de gado durante um forte temporal em Vila Bela da Santíssima Trindade, a 521 km de Cuiabá.", link: "https://www.verdefm.com.br/2026/10/08/temporal-com-raios-mata-11-animais-e-causa-estragos-em-vila-bela/" },
  { foto: F("n2"), data: "2026-09-24", chapeu: "Defesa agropecuária", titulo: "Indea confirma seis casos de raiva em cavalos e bovinos em fazendas de MT", resumo: "Um cavalo foi diagnosticado em uma fazenda de Dom Aquino e cinco bovinos em outra propriedade do Estado.", link: "https://www.verdefm.com.br/2026/09/24/indea-confirma-seis-casos-de-raiva-em-cavalos-e-bovinos-em-fazendas-de-mt/" },
  { foto: F("n6"), data: "2026-08-31", chapeu: "Frigoríficos", titulo: "MPE cobra R$ 1 milhão de frigorífico por contaminação de rio em MT", resumo: "O Ministério Público ajuizou ações contra um frigorífico de Colíder por descumprir obrigações de um termo de ajustamento de conduta.", link: "https://www.verdefm.com.br/2026/08/31/mpe-cobra-r-1-milhao-de-frigorifico-por-contaminacao-de-rio-em-mt/" },
  { foto: "", data: "2026-08-14", chapeu: "Grãos", titulo: "Campeão brasileiro de pôquer é alvo de operação que apura desvio de grãos", resumo: "A terceira fase da Operação Safra Desviada, do Gaeco, mirou o empresário e outros alvos em Mato Grosso.", link: "https://www.verdefm.com.br/2026/08/14/campeao-brasileiro-de-poquer-e-alvo-de-operacao-que-apura-desvio-de-graos/" },
  { foto: "", data: "2026-06-11", chapeu: "Soja", titulo: "Vazio sanitário da soja já está em vigência em Mato Grosso", resumo: "O Indea informa que o período que proíbe plantas vivas de soja no campo, da safra 2025/26, já está valendo.", link: "https://www.verdefm.com.br/2026/06/11/vazio-sanitario-da-soja-ja-esta-em-vigencia-em-mato-grosso/" },
];

/* ------------------------------------------------------------------ cotações (EXEMPLO) */
export const PRACAS = ["Sorriso", "Sinop", "Nova Mutum", "Lucas do Rio Verde", "Diamantino", "Campo Verde", "Rondonópolis", "Primavera do Leste", "Brasnorte"];

export type LinhaCotacao = { praca: string; preco: number; variacao: number; semana: number[] };
export type Produto = { k: string; nome: string; unidade: string; linhas: LinhaCotacao[] };

const BASES: { k: string; nome: string; unidade: string; base: number[] }[] = [
  { k: "soja", nome: "Soja", unidade: "R$ por saca de 60 kg", base: [118.5, 117.8, 119.2, 118.9, 119.6, 121.4, 123.1, 122.3, 116.4] },
  { k: "milho", nome: "Milho", unidade: "R$ por saca de 60 kg", base: [52.3, 51.6, 53.1, 52.8, 53.4, 56.2, 57.8, 56.9, 50.7] },
  { k: "algodao", nome: "Algodão", unidade: "R$ por arroba (pluma)", base: [131.2, 130.6, 131.8, 131.5, 131.9, 133.4, 134.1, 133.7, 129.8] },
  { k: "boi", nome: "Boi gordo", unidade: "R$ por arroba", base: [302, 298, 304, 303, 305, 301, 307, 306, 296] },
];

/** Série de exemplo determinística (o mesmo número em toda visita), terminando no preço de hoje. */
function gerar(): Produto[] {
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return BASES.map((p) => ({
    k: p.k, nome: p.nome, unidade: p.unidade,
    linhas: PRACAS.map((praca, i) => {
      const semana: number[] = [];
      let v = p.base[i] * (1 - 0.02 + rnd() * 0.02);
      for (let d = 0; d < 7; d++) { v = v * (1 + (rnd() - 0.47) * 0.012); semana.push(v); }
      semana[6] = p.base[i];
      return { praca, preco: p.base[i], variacao: (p.base[i] / semana[5] - 1) * 100, semana };
    }),
  }));
}
export const COTACOES = {
  exemplo: true,
  atualizado: "Atualizado hoje às 9h30",
  produtos: gerar(),
  dolar: { valor: 5.41, variacao: 0.32 },
};
