import type { Metadata } from "next";
import { VIDEOS } from "@/lib/conteudo";
import { TV } from "@/components/verde/interativos";
import { LinkMais, Trilha } from "@/components/verde/blocos";

export const metadata: Metadata = { title: "Vídeos", description: "Entrevistas, o Jornal da Verde e a transmissão ao vivo do estúdio da Verde FM." };

export default function Videos() {
  return (
    <>
      <Trilha itens={[["Início", "/"], ["Vídeos", null]]} />
      <div className="vfm-container">
        <header className="vfm-cabeca-pagina">
          <div><span className="vfm-chapeu">Verde FM no YouTube</span><h1>Vídeos</h1><p>Entrevistas, o Jornal da Verde e a transmissão ao vivo do estúdio.</p></div>
          <LinkMais href="https://www.youtube.com/@VerdeFMoficial" externo>Ver o canal no YouTube</LinkMais>
        </header>
        <TV videos={VIDEOS} pagina />
      </div>
      <div style={{ height: 48 }} />
    </>
  );
}
