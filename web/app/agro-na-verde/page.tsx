import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import { AgroAgora, AgroEcossistema, AgroJornada, AgroNewsletter, AgroOuvir, AgroQuadros, AgroRegua } from "@/components/verde/agro";

/* eslint-disable @next/next/no-img-element */

/** Fontes do manual da marca Agro na Verde (só nesta página). */
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400", display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "Agro na Verde",
  description: "Feito em Mato Grosso, para quem movimenta o agro de Mato Grosso. Segunda a sexta, das 7h às 8h, ao vivo na Verde FM.",
  openGraph: { images: ["/assets/img/agro/hero.jpg"] },
};

const TEMAS = ["Soja", "Milho", "Algodão", "Boi", "Dólar", "Crédito", "Logística", "Cooperativas", "Tecnologia", "Regiões de Mato Grosso"];
const IMG = "/assets/img/agro";

/** Página do programa Agro na Verde (aprovada em 21/11/2026, a partir da linha editorial e do manual da marca). */
export default function AgroNaVerde() {
  return (
    <div className={`agro ${bebas.variable} ${montserrat.variable}`}>
      <section className="capa" aria-labelledby="agro-titulo">
        <div className="agro-wrap">
          <div>
            <img className="logo" src={`${IMG}/logo-agro-branco.png`} alt="Agro na Verde" width={743} height={297} />
            <h1 id="agro-titulo">A voz de quem <span>movimenta o agro.</span></h1>
            <p className="lema">Feito em Mato Grosso, para quem movimenta o agro de Mato Grosso.</p>
            <div className="selos"><span className="selo">Seg a sex</span><span className="selo">7h às 8h</span><span className="selo vivo">Ao vivo</span></div>
            <AgroAgora />
            <div className="acoes">
              <AgroOuvir />
              <a className="btn vazado" href="#agro-radio">Ver o programa de hoje</a>
            </div>
          </div>
          <div className="quadro">
            <img src={`${IMG}/hero.jpg`} alt="Repórter do Agro na Verde com microfone numa lavoura de soja em Mato Grosso" width={1001} height={1200} fetchPriority="high" />
            <div className="ondas" aria-hidden="true"><i /><i /><i /></div>
            <div className="chip c1" aria-hidden="true"><b>7h05</b><span>Radar do mercado<small>soja, milho, algodão, boi e dólar</small></span></div>
            <div className="chip c2" aria-hidden="true"><b>7h25</b><span>Conversa de negócios<small>a entrevista principal do dia</small></span></div>
            <div className="chip c3" aria-hidden="true"><b>▶</b><span>No YouTube<small>5 episódios + 10 cortes por semana</small></span></div>
          </div>
        </div>
      </section>

      <div className="faixa" aria-hidden="true">
        <div>{[...TEMAS, ...TEMAS].map((t, i) => <span key={i}>{t}</span>)}</div>
      </div>

      <section className="band" aria-labelledby="agro-defesa">
        <div className="agro-wrap">
          <div className="cab">
            <h2 id="agro-defesa">A nossa <b>defesa</b></h2>
            <p>O agro de Mato Grosso já tem informação demais. <strong>A Verde vai dar contexto, voz e conexão.</strong></p>
          </div>
          <div className="tres">
            <article className="card">
              <span className="folha"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8M8 12c0-2.5 1.5-4 4.5-4.5C12.5 10 11 12 8 12z" /></svg></span>
              <h3>Contexto</h3><p>Selecionar e interpretar só o que tem consequência para os negócios.</p>
            </article>
            <article className="card">
              <span className="folha"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></svg></span>
              <h3>Voz</h3><p>As regiões, as cadeias produtivas e as pessoas do estado como protagonistas.</p>
            </article>
            <article className="card">
              <span className="folha"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 10l-4 11M12 10l4 11M9.5 16h5" /><circle cx="12" cy="8" r="1.5" /><path d="M7.5 4.5a6 6 0 0 0 0 7M16.5 4.5a6 6 0 0 1 0 7" /></svg></span>
              <h3>Conexão</h3><p>Uma rede de rádio presente nos municípios de Mato Grosso.</p>
            </article>
          </div>
          <div className="assinatura"><span className="tag">Assinatura</span><strong>A voz de quem movimenta o agro.</strong></div>
        </div>
      </section>

      <section className="band radio" id="agro-radio" aria-labelledby="agro-t-radio">
        <div className="agro-wrap">
          <div className="cab">
            <h2 id="agro-t-radio">No <b>rádio</b></h2>
            <p>Segunda a sexta, das 7h às 8h, ao vivo: o coração do projeto. <strong>Toque em cada bloco</strong> ou arraste o relógio para ver o espelho do programa.</p>
          </div>
          <AgroRegua />
          <div className="semana">
            <h3>7h45 · O quadro muda todo dia</h3>
            <AgroQuadros />
            <p className="todo-dia">Todo dia: notícia relevante, dado de mercado e conversa com contexto.</p>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="agro-t-eco">
        <div className="agro-wrap">
          <div className="cab">
            <h2 id="agro-t-eco">Uma marca, <b>várias experiências</b></h2>
            <p>Um núcleo editorial define <strong>uma pauta central</strong>, com narrativas e formatos próprios para cada canal, mais 1 destaque por dia da cobertura regional.</p>
          </div>
          <AgroEcossistema />
          <p className="regra">Cada canal tem uma função. Não é publicar a mesma coisa em cinco lugares.</p>
          <div className="fotos">
            <figure><img src={`${IMG}/foto-colheita.jpg`} alt="Produtor rural na colheita" width={834} height={541} loading="lazy" /><figcaption>De Mato Grosso para Mato Grosso</figcaption></figure>
            <figure><img src={`${IMG}/foto-gado.jpg`} alt="Repórter com microfone numa fazenda de gado" width={834} height={420} loading="lazy" /><figcaption>Cobertura regional</figcaption></figure>
            <figure><img src={`${IMG}/foto-milho.jpg`} alt="Repórter com microfone numa lavoura de milho" width={417} height={377} loading="lazy" /><figcaption>No ar, seg a sex</figcaption></figure>
          </div>
        </div>
      </section>

      <section className="band jornada" aria-labelledby="agro-t-jornada">
        <div className="agro-wrap">
          <div className="cab">
            <h2 id="agro-t-jornada">A jornada do <b>conteúdo</b></h2>
            <p>Siga uma pauta do começo ao fim: ela nasce no rádio e volta para a pauta com o que o público perguntou.</p>
          </div>
          <AgroJornada />
        </div>
      </section>

      <section className="band" aria-label="Newsletter e WhatsApp">
        <div className="agro-wrap cartas">
          <div className="news">
            <div>
              <span className="tag">Toda terça, às 7h</span>
              <h2>A síntese da semana na sua caixa de entrada</h2>
              <p>Notícias da semana, resumo do mercado, próximas entrevistas, artigo da semana e a agenda do agro.</p>
              <AgroNewsletter />
            </div>
            <img src={`${IMG}/icone-agro.png`} alt="" width={293} height={293} loading="lazy" />
          </div>
          <div className="zap">
            <span className="tag">Sugestão</span>
            <h3>Canal no WhatsApp</h3>
            <p>Cotação e destaques do dia, onde o agro mais consome informação.</p>
            <p className="nota" style={{ color: "#1d3a17" }}>O canal ainda não existe: o botão entra quando ele for criado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
