import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import Link from "next/link";
import { AgroCotacoes, AgroLetreiro, AgroNewsletter, AgroOuvir, AgroQuadroDia, AgroStatus, AgroVoltar } from "@/components/verde/agro";
import { TV } from "@/components/verde/interativos";
import { AGRO_DESTAQUES, AGRO_MANCHETE, AGRO_NOTICIAS, type NoticiaAgro } from "@/lib/agro";
import { VIDEOS, dataBr } from "@/lib/conteudo";

/* eslint-disable @next/next/no-img-element */

/** Fontes do manual da marca Agro na Verde (só nesta página). */
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400", display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "Agro na Verde",
  description: "Notícias do agro, cotações do dia nas praças de Mato Grosso, vídeos e entrevistas. Feito em Mato Grosso, para quem movimenta o agro de Mato Grosso.",
  openGraph: { images: ["/assets/img/agro/logo-agro.png"] },
};

const IMG = "/assets/img/agro";
const ext = { target: "_blank", rel: "noopener" } as const;

function Card({ n }: { n: NoticiaAgro }) {
  return n.foto ? (
    <a className="card" href={n.link} {...ext}>
      <img src={n.foto} alt="" width={768} height={512} loading="lazy" />
      <span className="chapeu">{n.chapeu}</span>
      <h3>{n.titulo}</h3>
      <time dateTime={n.data}>{dataBr(n.data)}</time>
    </a>
  ) : (
    <a className="card texto" href={n.link} {...ext}>
      <span className="chapeu">{n.chapeu}</span>
      <h3>{n.titulo}</h3>
      <p>{n.resumo}</p>
      <time dateTime={n.data}>{dataBr(n.data)}</time>
    </a>
  );
}

/**
 * Portal Agro na Verde (aprovado em 21/11/2026): um produto próprio, com notícias, cotações, vídeos,
 * entrevistas e newsletter. Mais tarde ganha domínio próprio apontando para cá.
 * Demonstração: notícias reais de agro dos sites da Verde (abrem lá); cotações e entrevista são exemplo.
 */
export default function AgroNaVerde() {
  const m = AGRO_MANCHETE;
  return (
    <div className={`agro ${bebas.variable} ${montserrat.variable}`}>
      {/* Faixa fina da Verde FM: o caminho de volta para o portal da rádio */}
      <div className="rede">
        <div className="agro-wrap">
          <AgroVoltar />
          <span className="producao">O Agro na Verde é uma produção da Verde FM</span>
          <AgroStatus />
        </div>
      </div>
      <div className="topo">
        <div className="agro-wrap">
          <a href="#agro-inicio" aria-label="Agro na Verde, início"><img className="logo logo-claro" src={`${IMG}/logo-agro.png`} alt="Agro na Verde" width={743} height={297} /><img className="logo logo-escuro" src={`${IMG}/logo-agro-branco.png`} alt="Agro na Verde" width={743} height={297} /></a>
          <nav aria-label="Agro na Verde">
            <a href="#agro-noticias">Notícias</a><a href="#agro-cotacoes">Cotações</a><a href="#agro-videos">Vídeos</a><a href="#agro-entrevistas">Entrevistas e artigos</a><a href="#agro-newsletter">Newsletter</a>
          </nav>
          <div className="topo-dir">
            <a className="btn verde" href="#agro-newsletter">Assine a newsletter</a>
          </div>
        </div>
      </div>

      <AgroLetreiro />

      <div className="agro-wrap destaques" id="agro-inicio">
        <article className="manchete">
          <a href={m.link} {...ext}>
            <img src={m.foto} alt="Luiz Pedro Bier, eleito presidente da Aprosoja MT" width={560} height={524} fetchPriority="high" />
            <span className="chapeu">{m.chapeu}</span>
            <h1>{m.titulo}</h1>
            <p>{m.resumo}</p>
          </a>
        </article>
        <div className="lado">
          {AGRO_DESTAQUES.map((n) => (
            <a className="mini" key={n.link} href={n.link} {...ext}>
              <img src={n.foto} alt="" width={768} height={432} />
              <span className="chapeu">{n.chapeu}</span>
              <h3>{n.titulo}</h3>
            </a>
          ))}
        </div>
      </div>

      <section className="sec" id="agro-cotacoes" aria-labelledby="agro-t-cot" style={{ paddingTop: 8 }}>
        <div className="agro-wrap"><AgroCotacoes /></div>
      </section>

      <section className="programa" aria-labelledby="agro-t-prog">
        <div className="agro-wrap">
          <img src={`${IMG}/logo-agro-branco.png`} alt="" width={160} height={64} />
          <div>
            <h2 id="agro-t-prog">Ao vivo de segunda a sexta, das 7h às 8h</h2>
            <p>Manchetes, radar do mercado, a conversa de negócios do dia e o que acontece nas regiões de Mato Grosso.</p>
            <AgroQuadroDia />
          </div>
          <AgroOuvir texto="Ouvir a Verde FM" />
        </div>
      </section>

      <section className="sec" id="agro-noticias" aria-labelledby="agro-t-not">
        <div className="agro-wrap">
          <div className="tit"><h2 id="agro-t-not">Notícias do agro</h2></div>
          <div className="grade">{AGRO_NOTICIAS.map((n) => <Card key={n.link} n={n} />)}</div>
        </div>
      </section>

      <section className="sec videos vfm-secao--tv" id="agro-videos" aria-labelledby="agro-t-vid">
        <div className="agro-wrap">
          <div className="tit"><h2 id="agro-t-vid">Vídeos e entrevistas</h2><a href="https://www.youtube.com/@VerdeFMoficial" {...ext}>Ver no YouTube</a></div>
          <TV videos={VIDEOS.slice(0, 6)} />
          <p className="nota">Provisório: vídeos do canal da Verde FM até a playlist do Agro na Verde ficar pronta.</p>
        </div>
      </section>

      <section className="sec" id="agro-entrevistas" aria-labelledby="agro-t-ea">
        <div className="agro-wrap">
          <div className="tit"><h2 id="agro-t-ea">Entrevistas e artigos</h2><span className="nota">Conteúdo de exemplo para mostrar o formato</span></div>
          <div className="ea">
            <article className="entrevista">
              <span className="tag">Entrevista · pergunta e resposta</span>
              <h3>“A conta da safra fecha no frete, não só no preço da soja”</h3>
              <p className="nota">Com o presidente de uma cooperativa de Sorriso, na Conversa de Negócios</p>
              <div className="pr">
                <p className="p">O que mais pesa no resultado do produtor nesta safra?</p>
                <p>A logística. Entre a fazenda e o porto, o frete leva uma fatia que o produtor não controla.</p>
                <p className="p">E o que dá para fazer agora?</p>
                <p>Planejar a venda junto com o transporte, e não depois da colheita.</p>
              </div>
            </article>
            <div className="colunas">
              {[["CR", "Crédito rural", "O que muda no custo do financiamento com o novo Plano Safra"],
                ["AG", "Coluna do agrônomo", "Manejo do solo na entressafra: o que fazer antes do plantio"],
                ["EC", "Mercado", "Câmbio e soja: como o dólar mexe no preço da saca em Mato Grosso"],
                ["RE", "De ponta a ponta", "O destaque da semana nas regiões produtoras de Mato Grosso"]].map(([s, c, t]) => (
                <article className="coluna" key={s}><span className="av" aria-hidden="true">{s}</span><div><span className="chapeu">{c}</span><h3>{t}</h3></div></article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="news" id="agro-newsletter" aria-labelledby="agro-t-news">
        <div className="agro-wrap">
          <div>
            <span className="tag escura">Toda terça, às 7h</span>
            <h2 id="agro-t-news">A síntese da semana do agro no seu e-mail</h2>
            <p>Notícias da semana, resumo do mercado, próximas entrevistas e a agenda do agro.</p>
          </div>
          <AgroNewsletter />
        </div>
      </section>

      <footer className="rodape">
        <div className="agro-wrap">
          <img src={`${IMG}/logo-agro-branco.png`} alt="Agro na Verde" width={743} height={297} />
          <p>Feito em Mato Grosso, para quem movimenta o agro de Mato Grosso. Uma produção da Verde FM. <Link href="/">Ir para o site da Verde FM</Link></p>
          {/* Assinatura da Astravox: só o ícone (padrão dos projetos web da Astravox) */}
          <a className="astravox" href="https://www.astravox.com.br" target="_blank" rel="noopener" aria-label="Astravox"><img src="/assets/img/astravox.svg" alt="" width={14} height={18} /></a>
        </div>
      </footer>
    </div>
  );
}
