import type { Metadata } from "next";
import { Trilha } from "@/components/verde/blocos";
import { Parada } from "@/components/verde/parada";

export const metadata: Metadata = { title: "As 10 mais tocadas", description: "A parada da semana da Verde FM: as 10 músicas mais tocadas." };

export default function MaisTocadas() {
  return (
    <>
      <Trilha itens={[["Início", "/"], ["As 10 mais tocadas", null]]} />
      <Parada Titulo="h1" />
    </>
  );
}
