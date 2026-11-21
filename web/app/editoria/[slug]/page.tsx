import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EDITORIAS, materiasDaEditoria } from "@/lib/conteudo";
import { BannerTopo } from "@/components/verde/interativos";
import { ListaMaterias, Trilha } from "@/components/verde/blocos";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(EDITORIAS).map((slug) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ed = EDITORIAS[(await params).slug];
  return ed ? { title: ed.nome, description: ed.descricao } : {};
}

/** Editoria (no WordPress: categoria). */
export default async function Editoria({ params }: Props) {
  const { slug } = await params;
  const ed = EDITORIAS[slug];
  if (!ed) notFound();
  return (
    <>
      <BannerTopo />
      <Trilha itens={[["Início", "/"], [ed.nome, null]]} />
      <div className="vfm-container">
        <header className="vfm-cabeca-pagina">
          <div><span className="vfm-chapeu">Editoria</span><h1>{ed.nome}</h1><p>{ed.descricao}</p></div>
        </header>
        <ListaMaterias itens={materiasDaEditoria(slug)} />
      </div>
      <div style={{ height: 48 }} />
    </>
  );
}
