"use client";

/* Faixa "Tudo sobre o agro" (aprovada em 24/11/2026, opção A): fica no lugar da faixa "Últimas".
   Selo do Agro na Verde à esquerda (chamada para o portal) e as cotações da praça do leitor correndo.
   Para com o mouse, com o foco e no botão; parada com "reduzir movimento". */
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COTACOES } from "@/lib/agro";
import { usePraca } from "./agro-praca";

/* eslint-disable @next/next/no-img-element */

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${v > 0 ? "▲ " : v < 0 ? "▼ " : ""}${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const PORTAL = "/agro-na-verde";

export function FaixaAgro() {
  const [praca] = usePraca();
  const lista = useRef<HTMLUListElement>(null);
  const [ligado, setLigado] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tempo, setTempo] = useState(40);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLigado(true);
    const medir = () => lista.current && setTempo(Math.max(18, Math.round(lista.current.scrollWidth / 2 / 40)));
    requestAnimationFrame(medir);
    addEventListener("resize", medir);
    return () => removeEventListener("resize", medir);
  }, []);

  const itens = COTACOES.produtos.map((p) => {
    const l = p.linhas.find((x) => x.praca === praca) ?? p.linhas[0];
    return { k: p.k, t: `${p.nome} · ${l.praca}`, v: brl(l.preco), d: l.variacao };
  });
  itens.push({ k: "dolar", t: "Dólar comercial", v: brl(COTACOES.dolar.valor), d: COTACOES.dolar.variacao });

  const linha = (copia: boolean) => (
    <>
      {itens.map((i) => (
        <li key={(copia ? "c-" : "") + i.k} aria-hidden={copia || undefined}>
          <Link href={`${PORTAL}#agro-cotacoes`} tabIndex={copia ? -1 : undefined}>
            {i.t} <b>{i.v}</b> <em className={i.d > 0 ? "vfm-sobe" : i.d < 0 ? "vfm-cai" : undefined}>{pct(i.d)}</em>
          </Link>
        </li>
      ))}
      {COTACOES.exemplo && <li aria-hidden={copia || undefined} className="vfm-agro-faixa__nota">Valores de exemplo</li>}
    </>
  );

  return (
    <div className="vfm-ultimas vfm-container">
      <div
        className={`vfm-ultimas__caixa vfm-agro-faixa ${ligado ? "vfm-letreiro--ligado" : ""} ${pausado ? "vfm-letreiro--pausado" : ""}`}
        style={{ ["--vfm-letreiro-tempo" as string]: `${tempo}s` }}
      >
        <Link className="vfm-agro-faixa__cta" href={PORTAL} aria-label="Agro na Verde: tudo sobre o agro. Acesse o portal">
          <img src="/assets/img/agro/logo-agro-branco.png" alt="" width={65} height={26} />
          <span className="vfm-agro-faixa__frase" aria-hidden="true">Tudo sobre o<strong>agro</strong></span>
          <b aria-hidden="true">Acesse ›</b>
        </Link>
        <div className="vfm-ultimas__janela" role="region" aria-label={`Cotações de hoje em ${praca}${COTACOES.exemplo ? " (valores de exemplo)" : ""}`}>
          <ul className="vfm-ultimas__lista" ref={lista}>{linha(false)}{ligado && linha(true)}</ul>
        </div>
        {ligado && (
          <button className="vfm-ultimas__pausa" type="button" aria-pressed={pausado} aria-label={pausado ? "Continuar as cotações" : "Pausar as cotações"} onClick={() => setPausado(!pausado)}>
            {pausado ? <Play size={14} aria-hidden="true" fill="currentColor" /> : <Pause size={14} aria-hidden="true" fill="currentColor" />}
          </button>
        )}
      </div>
    </div>
  );
}
