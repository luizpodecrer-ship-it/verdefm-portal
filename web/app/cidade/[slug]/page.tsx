import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RADIOS, materiasDaCidade, radio } from "@/lib/conteudo";
import { BannerTopo, BotaoOuvir } from "@/components/verde/interativos";
import { ListaMaterias, Trilha } from "@/components/verde/blocos";

/* eslint-disable @next/next/no-img-element */

export const dynamicParams = false;
export function generateStaticParams() {
  return RADIOS.filter((r) => r.ativa).map((r) => ({ slug: r.slug }));
}
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = radio((await params).slug);
  return c ? { title: `Notícias de ${c.nome}`, description: `Notícias de ${c.nome} e a Verde FM ${c.frequencia} ao vivo.` } : {};
}

/** Cidade (no WordPress: termo da taxonomia "cidade"). */
export default async function Cidade({ params }: Props) {
  const c = radio((await params).slug);
  if (!c || !c.ativa) notFound();
  return (
    <>
      <BannerTopo />
      <Trilha itens={[["Início", "/"], ["Cidades", null], [c.nome, null]]} />
      <div className="vfm-container">
        <header className="vfm-cabeca-pagina">
          <div className="vfm-cabeca-pagina__marca">
            <img src={c.logo} alt={`Verde FM ${c.nome} ${c.frequencia}`} width={840} height={200} />
            <div><h1>Notícias de {c.nome}</h1><p>O que acontece em {c.nome} e região, com a Verde FM {c.frequencia}.</p></div>
          </div>
          <BotaoOuvir slug={c.slug}>Ouvir a Verde {c.nome}</BotaoOuvir>
        </header>
        <ListaMaterias itens={materiasDaCidade(c.slug)} />
      </div>
      <div style={{ height: 48 }} />
    </>
  );
}
