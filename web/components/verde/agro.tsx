"use client";

/* Portal Agro na Verde (aprovado em 21/11/2026): partes que mexem. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { agoraEmCuiaba, useCidade, useRadio } from "./provedores";
import { Check, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COTACOES, PRACAS } from "@/lib/agro";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${v > 0 ? "▲ " : v < 0 ? "▼ " : ""}${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/* ------------------------------------------------------------ hora de Cuiabá */
function useCuiaba() {
  const [t, setT] = useState<{ dia: number; h: number } | null>(null);
  useEffect(() => {
    const ler = () => { const a = agoraEmCuiaba(); setT({ dia: a.dia, h: Math.floor(a.hora) }); };
    ler();
    const i = setInterval(ler, 30000);
    return () => clearInterval(i);
  }, []);
  return t;
}

/** "No ar agora" / "Próximo programa…" (seg a sex, 7h às 8h). */
export function AgroStatus() {
  const t = useCuiaba();
  let texto = "Ao vivo de segunda a sexta, das 7h às 8h";
  let noAr = false;
  if (t) {
    const util = t.dia >= 1 && t.dia <= 5;
    if (util && t.h === 7) { noAr = true; texto = "No ar agora: Agro na Verde"; }
    else if (util && t.h < 7) texto = "Hoje às 7h, ao vivo";
    else texto = `Próximo programa: ${t.dia >= 5 || t.dia === 0 ? "segunda" : "amanhã"}, às 7h`;
  }
  return <span className={`agro-status${noAr ? " no-ar" : ""}`} role="status"><span className="ponto" aria-hidden="true" />{texto}</span>;
}

const QUADROS = ["Na mesa: análise da semana", "Quem faz: histórias de empresários e lideranças", "Conta que fecha?: custos, margens e crédito", "Agro 2030: tecnologia e inovação", "De ponta a ponta: as regiões de Mato Grosso"];
export function AgroQuadroDia() {
  const t = useCuiaba();
  const util = t ? t.dia >= 1 && t.dia <= 5 : false;
  return <p className="q"><b>Quadro das 7h45 {util ? "de hoje" : "de segunda"}:</b> {QUADROS[util && t ? t.dia - 1 : 0]}</p>;
}

/** Ouvir ao vivo: toca a Verde FM da cidade escolhida no player do portal. */
export function AgroOuvir({ texto = "Ouvir ao vivo" }: { texto?: string }) {
  const { tocando, alternar } = useRadio();
  return (
    <button className="btn verde" type="button" aria-pressed={tocando} onClick={alternar}>
      {tocando
        ? <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        : <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>}
      {tocando ? "Parar a rádio" : texto}
    </button>
  );
}

/* ------------------------------------------------------------ praça do leitor (preferência) */
const CHAVE = "agro_praca";
function usePraca() {
  const [praca, setPraca] = useState("Sorriso");
  useEffect(() => {
    try { const p = localStorage.getItem(CHAVE); if (p && PRACAS.includes(p)) setPraca(p); } catch {}
    const ouvir = (e: Event) => setPraca((e as CustomEvent<string>).detail);
    addEventListener("agro:praca", ouvir);
    return () => removeEventListener("agro:praca", ouvir);
  }, []);
  const escolher = (p: string) => {
    try { localStorage.setItem(CHAVE, p); } catch {}
    dispatchEvent(new CustomEvent("agro:praca", { detail: p }));
  };
  return [praca, escolher] as const;
}

/** Letreiro com as cotações da praça do leitor e o dólar. */
export function AgroLetreiro() {
  const [praca] = usePraca();
  const itens = COTACOES.produtos.map((p) => {
    const l = p.linhas.find((x) => x.praca === praca)!;
    return { k: p.k, t: `${p.nome} · ${praca}`, v: brl(l.preco), d: l.variacao };
  });
  itens.push({ k: "dolar", t: "Dólar comercial", v: brl(COTACOES.dolar.valor), d: COTACOES.dolar.variacao });
  const linha = (copia: boolean) => itens.map((i) => (
    <span key={(copia ? "c" : "") + i.k} aria-hidden={copia || undefined}>{i.t} <b>{i.v}</b> <em className={i.d >= 0 ? "up" : "dn"}>{pct(i.d)}</em></span>
  ));
  return (
    <div className="letreiro" aria-label={`Cotações de hoje em ${praca}${COTACOES.exemplo ? " (valores de exemplo)" : ""}`}>
      <div className="pista">{linha(false)}{COTACOES.exemplo && <span>Valores de exemplo</span>}{linha(true)}</div>
    </div>
  );
}

function Linha7Dias({ semana, sobe }: { semana: number[]; sobe: boolean }) {
  const W = 96, H = 28, mn = Math.min(...semana), mx = Math.max(...semana), r = mx - mn || 1;
  const pts = semana.map((v, i) => `${((i / (semana.length - 1)) * (W - 4) + 2).toFixed(1)},${(H - 3 - ((v - mn) / r) * (H - 6)).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={sobe ? "var(--sobe)" : "var(--cai)"} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Quadro de cotações do dia: produto em abas, 9 praças, variação, 7 dias, média, maior/menor e sua praça. */
export function AgroCotacoes({ fontes = "" }: { fontes?: string }) {
  const [aba, setAba] = useState(0);
  const [praca, escolher] = usePraca();
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const p = COTACOES.produtos[aba];
  const precos = p.linhas.map((l) => l.preco);
  const media = precos.reduce((a, b) => a + b, 0) / precos.length;
  const maior = p.linhas.reduce((a, b) => (b.preco > a.preco ? b : a));
  const menor = p.linhas.reduce((a, b) => (b.preco < a.preco ? b : a));
  const ir = (n: number) => { const k = (n + 4) % 4; setAba(k); abas.current[k]?.focus(); };
  return (
    <div className="cot">
      <div className="cot-topo">
        <div>
          <h2 id="agro-t-cot">Cotações do dia</h2>
          <p className="nota">{COTACOES.atualizado}{COTACOES.exemplo && " · valores de exemplo"}</p>
        </div>
        <div className="oferece"><small>Oferecimento</small><strong>Espaço para o patrocinador</strong></div>
      </div>
      <div>
        <div className="abas" role="tablist" aria-label="Produto">
          {COTACOES.produtos.map((x, i) => (
            <button key={x.k} ref={(el) => { abas.current[i] = el; }} className="aba" role="tab" id={`agro-cot-${x.k}`} aria-controls="agro-cot-painel"
              aria-selected={i === aba} tabIndex={i === aba ? 0 : -1} onClick={() => setAba(i)}
              onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); ir(aba + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); ir(aba - 1); } }}>
              {x.nome}
            </button>
          ))}
        </div>
        <div role="tabpanel" id="agro-cot-painel" aria-labelledby={`agro-cot-${p.k}`}>
          <p className="unid">{p.unidade}</p>
          <div className="tabela-caixa">
            <table className="tabela">
              <thead><tr><th scope="col">Praça</th><th scope="col" className="num">Preço</th><th scope="col" className="num">No dia</th><th scope="col" className="num col7">7 dias</th></tr></thead>
              <tbody>
                {p.linhas.map((l) => (
                  <tr key={l.praca} className={l.praca === praca ? "minha" : undefined}>
                    <th scope="row"><button type="button" aria-pressed={l.praca === praca} onClick={() => escolher(l.praca)}>{l.praca}</button></th>
                    <td className="num">{brl(l.preco)}</td>
                    <td className="num"><span className={`var ${l.variacao >= 0 ? "up" : "dn"}`}>{pct(l.variacao)}</span></td>
                    <td className="num col7"><Linha7Dias semana={l.semana} sobe={l.variacao >= 0} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="nota" style={{ marginTop: 10 }}>Preços lançados pela redação todo dia útil, com a fonte de cada praça. Toque numa praça para marcá-la como sua.</p>
        </div>
      </div>
      <div className="resumo">
        <div className="box dolar">
          <small>Dólar comercial · automático, Banco Central</small>
          <div className="grande">{brl(COTACOES.dolar.valor)}</div>
          <div className="linha"><span>Variação no dia</span><b>{pct(COTACOES.dolar.variacao)}</b></div>
        </div>
        <div className="box">
          <small>{p.nome} · média das 9 praças</small>
          <div className="grande">{brl(media)}</div>
          <div className="linha"><span>Maior</span><b>{maior.praca} · {brl(maior.preco)}</b></div>
          <div className="linha"><span>Menor</span><b>{menor.praca} · {brl(menor.preco)}</b></div>
        </div>
        {/* Sua praça: escolha no visual da marca (shadcn Select). A lista abre fora do .agro, então leva as cores e fontes junto. */}
        <div className="minha-praca">
          <span className="minha-praca__rotulo" id="agro-praca-rotulo">Sua praça</span>
          <Select value={praca} onValueChange={(v) => v && escolher(String(v))}>
            <SelectTrigger aria-labelledby="agro-praca-rotulo" className="agro-praca-botao">
              <span className="agro-praca-pino" aria-hidden="true"><MapPin size={18} /></span>
              <SelectValue />
              <span className="agro-praca-preco">{brl(p.linhas.find((l) => l.praca === praca)!.preco)}</span>
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              sideOffset={8}
              className={`${fontes} agro-praca-lista rounded-xl border-0 bg-white p-1.5 font-[family-name:var(--font-montserrat)] text-[#2A211B] shadow-[0_18px_48px_rgba(42,33,27,.22)] ring-1 ring-[#E2D6CF] dark:bg-[#2A211B] dark:text-[#F3ECE8] dark:ring-[#3A2F28]`}
            >
              <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-[.06em] text-[#5E554F] uppercase dark:text-[#CDBFB6]">{p.nome} · {p.unidade}</p>
              {p.linhas.map((l) => (
                <SelectItem key={l.praca} value={l.praca}
                  className="min-h-11 cursor-pointer gap-3 rounded-lg py-2 pr-3 pl-3 text-[15px] transition-colors focus:bg-[#F3ECE8] data-selected:font-bold dark:focus:bg-[#3A2F28] [&>span:last-child]:hidden">
                  <span className="flex flex-1 items-center gap-2.5">
                    <MapPin size={15} style={{ color: "var(--lista-terra)" }} aria-hidden="true" />
                    {l.praca}
                  </span>
                  <span className="ml-auto flex items-center gap-3 tabular-nums">
                    <span>{brl(l.preco)}</span>
                    <span className="w-14 text-right text-[13px] font-bold max-[420px]:hidden" style={{ color: l.variacao >= 0 ? "var(--lista-sobe)" : "var(--lista-cai)" }}>{pct(l.variacao)}</span>
                    <Check size={16} className={l.praca === praca ? "" : "invisible"} style={{ color: "#4DB336" }} aria-hidden="true" />
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ newsletter (demonstração) */
export function AgroNewsletter() {
  const [msg, setMsg] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  return (
    <form noValidate onSubmit={(e) => {
      e.preventDefault();
      const v = campo.current?.value.trim() ?? "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setMsg("Confira o e-mail: falta o @ ou o domínio."); campo.current?.focus(); return; }
      setMsg("Pronto! Na próxima terça, às 7h, a síntese chega para você. (Demonstração: nada foi enviado.)");
    }}>
      <label htmlFor="agro-email">Seu e-mail</label>
      <input ref={campo} id="agro-email" type="email" autoComplete="email" placeholder="nome@fazenda.com.br" aria-describedby="agro-news-msg" />
      <button className="btn escuro" type="submit">Quero receber</button>
      <p className="ok" id="agro-news-msg" role="status">{msg}</p>
    </form>
  );
}

/** "Voltar para a Verde FM" com o logo da cidade escolhida. */
export function AgroVoltar() {
  const { cidade } = useCidade();
  return (
    <Link className="voltar" href="/" aria-label="Voltar para o site da Verde FM">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      <span>Voltar para a</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cidade.logo} alt="" width={84} height={20} />
    </Link>
  );
}
