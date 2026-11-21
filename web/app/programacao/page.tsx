import type { Metadata } from "next";
import { BotaoOuvir, GradeCompleta, NomeCidade } from "@/components/verde/interativos";
import { Trilha } from "@/components/verde/blocos";

export const metadata: Metadata = { title: "Programação", description: "Grade de programação da Verde FM em Cuiabá, Campo Verde e Jaciara." };

export default function Programacao() {
  return (
    <>
      <Trilha itens={[["Início", "/"], ["Programação", null]]} />
      <div className="vfm-container">
        <header className="vfm-cabeca-pagina">
          <div>
            <span className="vfm-chapeu">Verde FM <NomeCidade comFrequencia /></span>
            <h1>Programação</h1>
            <p>A grade da rádio da sua cidade. Troque a cidade lá em cima para ver a de outra praça.</p>
          </div>
          <BotaoOuvir>Ouvir agora</BotaoOuvir>
        </header>
        <GradeCompleta />
      </div>
      <div style={{ height: 56 }} />
    </>
  );
}
