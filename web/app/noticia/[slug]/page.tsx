import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Mic } from "lucide-react";
import { MATERIAS, curto, dataHora, fina, legendaECredito, legendasNoTexto, materia, urlEditoria, urlMateria } from "@/lib/conteudo";
import { BannerTopo, Compartilhar, Ouca } from "@/components/verde/interativos";
import { Card, Chapeu, Legenda, Trilha } from "@/components/verde/blocos";

/* eslint-disable @next/next/no-img-element */

export const dynamicParams = false;
export function generateStaticParams() {
  return MATERIAS.map((m) => ({ slug: m.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = materia((await params).slug);
  if (!m) return {};
  return {
    title: m.titulo,
    description: fina(m.resumo, 180),
    openGraph: { title: m.titulo, description: fina(m.resumo, 180), images: m.foto_g ? [m.foto_g] : undefined, type: "article" },
  };
}

/** Matéria (no WordPress: o post, buscado pela API pelo slug). */
export default async function Noticia({ params }: Props) {
  const m = materia((await params).slug);
  if (!m) notFound();
  const ultimas = MATERIAS.slice(0, 8).filter((x) => x.slug !== m.slug);
  let rel = MATERIAS.filter((x) => x.editoria === m.editoria && x.slug !== m.slug).slice(0, 3);
  if (rel.length < 3) rel = rel.concat(MATERIAS.filter((x) => x.slug !== m.slug && !rel.includes(x)).slice(0, 3 - rel.length));
  const { legenda } = legendaECredito(m);
  const quando = <time dateTime={m.data}>{dataHora(m.data)}</time>;
  return (
    <>
      <BannerTopo />
      <Trilha itens={[["Início", "/"], [m.editoria_rotulo, urlEditoria(m) || null], [curto(m.titulo), null]]} />
      <article className="vfm-container vfm-materia">
        <header className="vfm-materia__cabeca">
          <Chapeu m={m} />
          <h1>{m.titulo}</h1>
          <p className="vfm-materia__fina">{fina(m.resumo)}</p>
          <div className="vfm-materia__linha">
            <div className="vfm-assinatura-materia">
              <span className="vfm-assinatura-materia__selo"><Mic size={18} aria-hidden="true" /></span>
              <span><strong>Redação Verde FM</strong>{quando}</span>
            </div>
            <Compartilhar m={m} />
          </div>
        </header>
        {m.foto_g && (
          <figure className="vfm-materia__foto">
            <img src={m.foto_g} alt={legenda} width={1280} height={720} fetchPriority="high" />
            <Legenda m={m} />
          </figure>
        )}
        <div className="vfm-materia__grade">
          <div>
            <div className="vfm-texto" dangerouslySetInnerHTML={{ __html: legendasNoTexto(m.conteudo) }} />
            <Ouca />
            <div className="vfm-materia__fim">
              <span className="vfm-meta">Publicada em {quando}</span>
              <Compartilhar m={m} />
            </div>
          </div>
          <aside className="vfm-materia__lateral" aria-label="Mais notícias">
            <div className="vfm-fixo">
              <div className="vfm-pub-quadrado" aria-label="Publicidade"><span>Publicidade</span><span>300 × 250</span></div>
              <section className="vfm-lista-numerada" style={{ marginTop: 28 }}>
                <h2>Últimas notícias</h2>
                <ol>{ultimas.map((x) => <li key={x.slug}><Link href={urlMateria(x)}>{x.titulo}</Link></li>)}</ol>
              </section>
            </div>
          </aside>
        </div>
      </article>
      <section className="vfm-secao vfm-secao--branca" aria-labelledby="leia-tambem">
        <div className="vfm-container">
          <h2 className="vfm-secao-titulo" id="leia-tambem">Leia também</h2>
          <ul className="vfm-cards">{rel.map((x) => <Card key={x.slug} m={x} />)}</ul>
        </div>
      </section>
    </>
  );
}
