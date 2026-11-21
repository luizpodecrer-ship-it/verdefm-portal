"use client";

/* "As 10 mais tocadas da Verde" (aprovada em 21/11/2026, opção A do quadro de proposta). */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCidade, useRadio } from "./provedores";
import { PARADA, hora, type MusicaParada } from "@/lib/conteudo";

/* eslint-disable @next/next/no-img-element */

const CORES = [["#0E7A3A", "#2DBE4E"], ["#5B2A86", "#C04BB0"], ["#9A3412", "#F59E0B"], ["#1E3A8A", "#38BDF8"], ["#7F1D1D", "#F43F5E"],
  ["#134E4A", "#14B8A6"], ["#3F3F46", "#A1A1AA"], ["#713F12", "#FACC15"], ["#1E1B4B", "#818CF8"], ["#365314", "#A3E635"]];

const sigla = (a: string) => a.split(/[\s&,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("");

function movimento(pos: number, anterior: number | null) {
  if (anterior === null) return { texto: "Nova", leitor: "nova na parada", tipo: "sobe" };
  const d = anterior - pos;
  if (d > 0) return { texto: `▲ ${d}`, leitor: `subiu ${d}`, tipo: "sobe" };
  if (d < 0) return { texto: `▼ ${-d}`, leitor: `caiu ${-d}`, tipo: "cai" };
  return { texto: "=", leitor: "mesma posição", tipo: "igual" };
}

function Capa({ m, i, grande }: { m: MusicaParada; i: number; grande?: boolean }) {
  const c = CORES[i % CORES.length];
  return (
    <span className={`vfm-parada__capa${grande ? " vfm-parada__capa--grande" : ""}`} aria-hidden="true"
      style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}>
      {m.capa ? <img src={m.capa} alt="" width={300} height={300} loading="lazy" /> : sigla(m.artista)}
    </span>
  );
}

const IcoPlay = ({ t = 16 }: { t?: number }) => <svg aria-hidden="true" width={t} height={t} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>;
const IcoPausa = ({ t = 16 }: { t?: number }) => <svg aria-hidden="true" width={t} height={t} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;

export function Parada({ Titulo = "h2" }: { Titulo?: "h1" | "h2" }) {
  const { cidade } = useCidade();
  const { programa, tocando: radioTocando, pausar, registrarParaVideos } = useRadio();
  const [tocando, setTocando] = useState(-1);
  const audio = useRef<HTMLAudioElement>(null);

  // rádio e prévia não tocam juntas: a rádio começou, a prévia para
  useEffect(() => registrarParaVideos(() => { audio.current?.pause(); setTocando(-1); }), [registrarParaVideos]);

  function previa(i: number) {
    const a = audio.current;
    const m = PARADA.musicas[i];
    if (!a || !m.previa) return;
    if (tocando === i) { a.pause(); setTocando(-1); return; }
    if (radioTocando) pausar();
    a.src = m.previa;
    a.play().then(() => setTocando(i), () => setTocando(-1));
  }

  /** Botão de ouvir: com prévia (campo do WordPress) toca aqui 30 s; sem prévia, abre a música no YouTube. */
  function BotaoOuvir({ i, grande }: { i: number; grande?: boolean }) {
    const m = PARADA.musicas[i];
    const ativo = tocando === i;
    const classe = grande ? "vfm-parada__ouvir" : "vfm-parada__play";
    if (!m.previa) {
      const busca = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.musica} ${m.artista}`)}`;
      return (
        <a className={classe} href={busca} target="_blank" rel="noopener" aria-label={grande ? undefined : `Ouvir ${m.musica} no YouTube (abre em nova aba)`}>
          <IcoPlay />{grande && <>Ouvir no YouTube<span className="vfm-so-leitor"> (abre em nova aba)</span></>}
        </a>
      );
    }
    return (
      <button className={classe} type="button" aria-pressed={ativo} onClick={() => previa(i)}
        aria-label={grande ? undefined : `${ativo ? "Pausar" : "Ouvir"} a prévia de ${m.musica}`}>
        {ativo ? <IcoPausa /> : <IcoPlay />}{grande && (ativo ? "Pausar prévia" : "Ouvir prévia")}
      </button>
    );
  }

  const [top, ...resto] = PARADA.musicas;
  const girando = tocando !== -1 || radioTocando;
  return (
    <section className="vfm-secao vfm-parada" id="mais-tocadas" aria-labelledby="titulo-parada">
      <div className="vfm-container">
        <div className="vfm-parada__cabeca">
          <div>
            <span className="vfm-chapeu">A Verde é música</span>
            <Titulo id="titulo-parada" className="vfm-parada__titulo">As 10 mais tocadas da Verde</Titulo>
            <p className="vfm-parada__semana">
              {PARADA.semana} · Verde FM {cidade.nome} {cidade.frequencia}
              {PARADA.exemplo && <> · Lista de exemplo (demonstração)</>}
            </p>
          </div>
          {Titulo === "h2" && <Link className="vfm-parada__botao-contorno" href="/mais-tocadas">Ver a parada completa</Link>}
        </div>

        <div className="vfm-parada__grade">
          <article className="vfm-parada__topo">
            <div className={`vfm-parada__arte${girando ? " vfm-parada__arte--girando" : ""}`}>
              <span className="vfm-parada__disco" aria-hidden="true" />
              <Capa m={top} i={0} grande />
              <span className="vfm-parada__um" aria-hidden="true">1</span>
            </div>
            <div className="vfm-parada__topo-texto">
              <span className="vfm-parada__selo">{PARADA.semanasNoTopo}ª semana no topo</span>
              <h3><span className="vfm-so-leitor">1º lugar: </span>{top.musica}</h3>
              <p>{top.artista}</p>
            </div>
            <div className="vfm-parada__topo-acoes">
              <BotaoOuvir i={0} grande />
              {top.previa && <span>Prévia de 30 segundos</span>}
            </div>
          </article>

          <ol className="vfm-parada__lista" start={2}>
            {resto.map((m, j) => {
              const i = j + 1;
              const mov = movimento(i + 1, m.anterior);
              return (
                <li key={m.musica} className={tocando === i ? "vfm-parada__tocando" : undefined}>
                  <span className="vfm-parada__pos">{i + 1}<span className="vfm-so-leitor">º</span></span>
                  <span className={`vfm-parada__mov vfm-parada__mov--${mov.tipo}`}><span aria-hidden="true">{mov.texto}</span><span className="vfm-so-leitor">{mov.leitor}</span></span>
                  <Capa m={m} i={i} />
                  <span className="vfm-parada__nome"><strong>{m.musica}</strong><span>{m.artista}</span></span>
                  <span className="vfm-parada__semanas">{m.semanas} sem.<span className="vfm-so-leitor"> na parada</span></span>
                  <BotaoOuvir i={i} />
                </li>
              );
            })}
          </ol>
        </div>

        <div className="vfm-parada__agora">
          <span className="vfm-eq" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span><strong>Tocando agora na Verde:</strong> {programa ? `${programa.programa} · ${hora(programa.inicio)} às ${hora(programa.fim)}` : `Verde FM ${cidade.nome}`}</span>
          <span className="vfm-parada__atualiza">A parada é atualizada toda segunda-feira</span>
        </div>
      </div>
      <audio ref={audio} preload="none" onEnded={() => setTocando(-1)} onPause={() => setTocando((t) => (audio.current?.paused ? -1 : t))} />
    </section>
  );
}
