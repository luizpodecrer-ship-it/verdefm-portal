/**
 * Camada de conteúdo do portal.
 * Hoje lê a demonstração (data/demo.json e data/home.json, matérias reais dos sites atuais da Verde FM).
 * Quando o WordPress (headless) estiver no ar, só este arquivo muda: as funções passam a buscar
 * na API REST (/wp-json/wp/v2/...) e o resto do site continua igual.
 */
import demo from "@/data/demo.json";
import home from "@/data/home.json";

export type Materia = {
  slug: string;
  titulo: string;
  resumo: string;
  data: string;
  site: string;
  cidade: string;
  categorias: string[];
  editoria: string;
  editoria_rotulo: string;
  foto_g: string;
  foto_m: string;
  legenda: string;
  foto_titulo?: string;
  conteudo: string;
};

export type Programa = { inicio: number; fim: number; programa: string; apresentador: string };
export type BlocoGrade = { rotulo: string; dias: number[]; programas: Programa[] };
export type Radio = {
  slug: string;
  nome: string;
  frequencia: string;
  stream: string;
  ativa: boolean;
  logo: string;
  grade: BlocoGrade[];
};
export type Video = { id: string; titulo: string; data: string };
export type Banner = { href: string; img: string; alt: string; w: number; h: number };

export const MATERIAS = demo.materias as Materia[];
export const VIDEOS = demo.videos as Video[];
export const RADIOS = (home.radios as Radio[]).map((r) => ({ ...r, logo: `/assets/img/logos/${r.slug}.png` }));
export const BANNERS = home.banners as Banner[];
export const CANAL_YOUTUBE = "UC6WHqxKeQgo9b7rRtF43ifA";
export const ENDERECO = "https://verdefm-portal.netlify.app";

const porSlug = new Map(MATERIAS.map((m) => [m.slug, m]));
export function materia(slug: string): Materia | undefined {
  return porSlug.get(slug);
}

export const EDITORIAS: Record<string, { nome: string; descricao: string }> = {
  politica: { nome: "Política", descricao: "Política de Cuiabá, de Mato Grosso e do Brasil: Assembleia, prefeituras, Câmara e governo." },
  economia: { nome: "Economia e negócios", descricao: "Emprego, contas, comércio, agro e o que mexe com o bolso de quem vive em Mato Grosso." },
  "esporte-e-cultura": { nome: "Esporte e cultura", descricao: "Cuiabá Esporte Clube, eventos, shows e a cultura mato-grossense." },
  policial: { nome: "Policial", descricao: "Ocorrências, operações e segurança pública em Mato Grosso." },
  brasil: { nome: "Brasil", descricao: "O que acontece no país e chega a Mato Grosso." },
};

export function materiasDaEditoria(slug: string) {
  return MATERIAS.filter((m) => m.editoria === slug);
}
export function materiasDaCidade(slug: string) {
  return MATERIAS.filter((m) => m.cidade === slug);
}
export function radio(slug: string) {
  return RADIOS.find((r) => r.slug === slug);
}

/** Home: a escolha editorial de cada bloco (no WordPress: campos da página inicial ou posts fixados). */
type Par = [string, string];
export const HOME = {
  manchete: { ...home.manchete, materia: materia(home.manchete.slug)! },
  subs: (home.subs as unknown as Par[]).map(([s, c]) => ({ materia: materia(s)!, chapeu: c })),
  faixa: (home.faixa as unknown as Par[]).map(([s, c]) => ({ materia: materia(s)!, chapeu: c })),
  ultimas: (home.ultimas as string[]).map((s) => materia(s)!),
  cidades: Object.fromEntries(
    Object.entries(home.cidades as unknown as Record<string, Par[]>).map(([cid, l]) => [cid, l.map(([s, c]) => ({ materia: materia(s)!, chapeu: c }))]),
  ) as Record<string, { materia: Materia; chapeu: string }[]>,
  editorias: (home.editorias as { nome: string; rota: string; principal: string; lista: string[] }[]).map((e) => ({
    nome: e.nome,
    rota: e.rota,
    principal: materia(e.principal)!,
    lista: e.lista.map((s) => materia(s)!),
  })),
};

/* -------------------------------------------------------------- utilitários */
export const urlMateria = (m: Pick<Materia, "slug">) => `/noticia/${m.slug}`;
export function urlEditoria(m: Materia): string {
  if (m.editoria in EDITORIAS) return `/editoria/${m.editoria}`;
  if (m.editoria === "cidades") return `/cidade/${m.cidade || "cuiaba"}`;
  return "";
}
export function dataBr(iso: string) {
  const [a, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${a}`;
}
export function dataHora(iso: string) {
  return `${dataBr(iso)} às ${iso.slice(11, 13)}h${iso.slice(14, 16)}`;
}
/** Linha fina curta: a primeira frase (ou um corte limpo), nunca o parágrafo inteiro. */
export function fina(t: string, limite = 200) {
  t = (t || "").trim().replace(/\s*(\.\.\.|…|\[…\])\s*$/, "");
  const re = /[.!?](\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const fim = m.index + 1;
    if (fim >= 60 && fim <= limite) return t.slice(0, fim);
    if (fim > limite) break;
  }
  return t.length <= limite ? t : t.slice(0, limite).replace(/\s+\S*$/, "").replace(/[,;:]$/, "") + "…";
}
export function curto(t: string, limite = 42) {
  return t.length <= limite ? t : t.slice(0, limite).replace(/\s+\S*$/, "").replace(/[,;:]$/, "") + "…";
}
export const hora = (h: number) => `${String(h).padStart(2, "0")}h`;

/** Legenda e crédito da foto (no WordPress: legenda da mídia + campo "Crédito"). */
export function legendaECredito(m: Materia): { legenda: string; credito: string } {
  let leg = (m.legenda || "").trim();
  let cred = "";
  const achou = leg.match(/\s*[(\[]?\s*((Foto|Fotos|Crédito|Imagem)s?\s*:\s*[^)\]]+)[)\]]?\s*$/i);
  if (achou && achou.index !== undefined) {
    cred = achou[1].trim();
    leg = leg.slice(0, achou.index).replace(/[\s\-–|]+$/, "");
  }
  if (!leg) {
    let t = (m.foto_titulo || "").replace(/[-_]+/g, " ").trim().replace(/\s*\d+$/, "");
    const legivel = t.split(/\s+/).length >= 2 && !/whatsapp|image|img|php|thumb|screenshot|^\d|\d{3,}/i.test(t);
    if (legivel) {
      const sem = (w: string) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const doTitulo = new Map(m.titulo.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((w) => [sem(w), w]));
      t = t.split(/\s+/).map((w) => doTitulo.get(sem(w)) ?? w).join(" ");
      leg = t.charAt(0).toUpperCase() + t.slice(1);
    } else leg = m.titulo;
  }
  return { legenda: leg, credito: cred || "Foto: Reprodução" };
}

/** Fotos dentro do texto: toda imagem ganha legenda (o alt, se houver) e crédito. */
export function legendasNoTexto(html: string) {
  html = html.replaceAll("<figcaption>", '<figcaption class="vfm-legenda">');
  return html
    .split(/(<figure>[\s\S]*?<\/figure>)/)
    .map((p) =>
      p.startsWith("<figure>")
        ? p
        : p.replace(/<img [^>]*>/g, (img) => {
            const alt = img.match(/alt="([^"]*)"/)?.[1] ?? "";
            const texto = alt ? `<span class="vfm-legenda__texto">${alt}</span> ` : "";
            return `<figure>${img}<figcaption class="vfm-legenda">${texto}<span class="vfm-legenda__credito">Foto: Reprodução</span></figcaption></figure>`;
          }),
    )
    .join("");
}
