import type { Metadata } from "next";
import { Suspense } from "react";
import { Trilha } from "@/components/verde/blocos";
import { Busca } from "@/components/verde/busca";

export const metadata: Metadata = { title: "Buscar", description: "Busque notícias da Verde FM." };

export default function PaginaBusca() {
  return (
    <>
      <Trilha itens={[["Início", "/"], ["Busca", null]]} />
      <div className="vfm-container">
        <Suspense fallback={<header className="vfm-cabeca-pagina"><div><h1>Buscar notícias</h1></div></header>}>
          <Busca />
        </Suspense>
      </div>
      <div style={{ height: 56 }} />
    </>
  );
}
