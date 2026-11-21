import type { Metadata } from "next";
import { BotaoOuvir } from "@/components/verde/interativos";
import { Trilha } from "@/components/verde/blocos";
import { PromocaoForm } from "@/components/verde/promocao-form";

export const metadata: Metadata = { title: "Promoções", description: "Promoções da Verde FM para os ouvintes de Cuiabá, Campo Verde e Jaciara." };

/** Promoções (no WordPress: tipo de conteúdo "promocao"). Sem promoção ativa: só o aviso. */
export default function Promocoes() {
  return (
    <>
      <Trilha itens={[["Início", "/"], ["Promoções", null]]} />
      <div className="vfm-container">
        <header className="vfm-cabeca-pagina">
          <div><span className="vfm-chapeu">Ouvinte da Verde ganha mais</span><h1>Promoções</h1><p>Participe das promoções da Verde FM da sua cidade.</p></div>
        </header>
        <div className="vfm-resultado-vazio vfm-promo-vazia" role="status">
          <strong>Nenhuma promoção aberta agora.</strong>
          <span>Fique ligado na Verde: a próxima é anunciada no ar e aparece aqui.</span>
          <BotaoOuvir>Ouvir a rádio</BotaoOuvir>
        </div>
        <h2 className="vfm-secao-titulo">Como uma promoção aparece no portal</h2>
        <p className="vfm-meta" style={{ margin: "-12px 0 20px" }}>Exemplo de demonstração do layout: nenhuma inscrição é enviada.</p>
        <article className="vfm-promo">
          <div className="vfm-promo__arte">
            <span className="vfm-chapeu">Exemplo</span>
            <h2>Promoção da semana</h2>
            <p>Aqui entram o prêmio, até quando vale e como o ganhador é escolhido.</p>
          </div>
          <PromocaoForm />
        </article>
      </div>
      <div style={{ height: 56 }} />
    </>
  );
}
