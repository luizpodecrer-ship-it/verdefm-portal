"use client";

/* Agro na Verde (página /agro-na-verde, aprovada em 21/11/2026). Partes que mexem: status "no ar",
   régua do programa, quadro do dia, mapa dos canais, jornada do conteúdo e newsletter (demonstração). */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { agoraEmCuiaba, useRadio } from "./provedores";

const reduzir = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const hh = (m: number) => (m >= 60 ? "8h" : `7h${String(m).padStart(2, "0")}`);

export const BLOCOS = [
  { i: 0, f: 5, t: "Abertura + manchetes", d: "As 5 notícias que merecem atenção." },
  { i: 5, f: 15, t: "Radar do mercado", d: "Soja, milho, algodão, boi, dólar e leitura de cenário." },
  { i: 15, f: 25, t: "Agro em movimento", d: "Empresas, cooperativas, investimentos e regiões." },
  { i: 25, f: 45, t: "Conversa de negócios", d: "A entrevista principal do dia." },
  { i: 45, f: 55, t: "Quadro do dia", d: "Tema diferente a cada dia da semana: veja logo abaixo.", q: true },
  { i: 55, f: 60, t: "Fechamento", d: "Agenda, serviço e chamada para o dia seguinte." },
];
const blocoDe = (m: number) => BLOCOS.findIndex((b) => m >= b.i && m < b.f);

/** Hora de Cuiabá a cada 30 s (null antes de montar, para não divergir do HTML estático). */
function useCuiaba() {
  const [t, setT] = useState<{ dia: number; h: number; m: number } | null>(null);
  useEffect(() => {
    const ler = () => { const a = agoraEmCuiaba(); setT({ dia: a.dia, h: Math.floor(a.hora), m: Math.round((a.hora % 1) * 60) % 60 }); };
    ler();
    const i = setInterval(ler, 30000);
    return () => clearInterval(i);
  }, []);
  return t;
}

/* ------------------------------------------------------------ capa */
export function AgroAgora() {
  const t = useCuiaba();
  let titulo = "Programa de segunda a sexta, das 7h às 8h";
  let sub = "Na Verde FM e no YouTube";
  let noAr = false;
  if (t) {
    const util = t.dia >= 1 && t.dia <= 5;
    if (util && t.h === 7) {
      noAr = true;
      titulo = "No ar agora";
      sub = `${hh(t.m)} · ${BLOCOS[blocoDe(t.m)].t}`;
    } else {
      let dias = 0, d = t.dia;
      if (!(util && t.h < 7)) { do { d = (d + 1) % 7; dias++; } while (d === 0 || d === 6); }
      const nomes = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      const quando = dias === 0 ? "hoje" : dias === 1 ? "amanhã" : nomes[d];
      const falta = dias * 1440 + 420 - (t.h * 60 + t.m);
      const fh = Math.floor(falta / 60), fm = falta % 60;
      titulo = `Próximo programa: ${quando}, às 7h`;
      sub = `Faltam ${fh > 23 ? `${Math.floor(fh / 24)}d ${fh % 24}h` : `${fh}h ${fm}min`} · na Verde FM e no YouTube`;
    }
  }
  return (
    <div className={`agora${noAr ? " no-ar" : ""}`} role="status">
      <span className="ponto" aria-hidden="true" />
      <div><strong>{titulo}</strong><span>{sub}</span></div>
    </div>
  );
}

/** Ouvir ao vivo: toca a Verde FM da cidade escolhida no player do portal. */
export function AgroOuvir() {
  const { tocando, alternar } = useRadio();
  return (
    <button className="btn verde" type="button" aria-pressed={tocando} onClick={alternar}>
      {tocando
        ? <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        : <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>}
      {tocando ? "Parar a rádio" : "Ouvir ao vivo"}
    </button>
  );
}

/* ------------------------------------------------------------ régua do programa */
export function AgroRegua() {
  const t = useCuiaba();
  const [min, setMin] = useState(25);
  const [mexeu, setMexeu] = useState(false);
  const trilho = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  // se o programa estiver no ar, a régua abre no minuto de agora
  useEffect(() => { if (!mexeu && t && t.dia >= 1 && t.dia <= 5 && t.h === 7) setMin(t.m); }, [t, mexeu]);
  const k = blocoDe(min), b = BLOCOS[k];
  useLayoutEffect(() => {
    const medir = () => {
      const el = trilho.current; if (!el) return;
      const s = el.children[k] as HTMLElement, base = el.getBoundingClientRect(), r = s.getBoundingClientRect();
      setX(r.left - base.left + r.width * ((min - b.i) / (b.f - b.i)));
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (trilho.current) ro.observe(trilho.current);
    return () => ro.disconnect();
  }, [min, k, b]);
  const ir = (m: number) => { setMexeu(true); setMin(m); };
  return (
    <>
      <div className="regua">
        <div className="trilho" ref={trilho}>
          {BLOCOS.map((s, j) => (
            <button key={s.t} type="button" className={`seg${s.q ? " quadro-dia" : ""}`} style={{ ["--min" as string]: s.f - s.i }}
              aria-pressed={j === k} onClick={() => ir(s.i)}>
              <small>{hh(s.i)}–{hh(s.f)}</small><strong>{s.t}</strong>
            </button>
          ))}
        </div>
        <div className="agulha" data-h={hh(min)} style={{ left: x }} aria-hidden="true" />
      </div>
      <div className="relogio">
        <label htmlFor="agro-minuto">Relógio do programa</label>
        <input type="range" id="agro-minuto" min={0} max={59} value={min} aria-valuetext={hh(min)} onChange={(e) => ir(Number(e.target.value))} />
        <span className="nota">{hh(min)}</span>
      </div>
      <div className="detalhe troca" key={k} aria-live="polite">
        <span className="hora">{hh(b.i)}</span>
        <h3>{b.t}</h3>
        <p>{b.d} <span className="nota">· {b.f - b.i} minutos</span></p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ quadro de cada dia */
const QUADROS = [
  { d: "Segunda", n: "Na mesa", t: "Análise da semana: mercado, decisões e tendências." },
  { d: "Terça", n: "Quem faz", t: "Histórias de empresários e lideranças." },
  { d: "Quarta", n: "Conta que fecha?", t: "Custos, margens, crédito e investimentos." },
  { d: "Quinta", n: "Agro 2030", t: "Tecnologia, inovação e futuro." },
  { d: "Sexta", n: "De ponta a ponta", t: "Destaque das regiões de Mato Grosso." },
];
export function AgroQuadros() {
  const t = useCuiaba();
  const hoje = t && t.dia >= 1 && t.dia <= 5 ? t.dia - 1 : -1;
  const [aba, setAba] = useState(0);
  const abriu = useRef(false);
  useEffect(() => { if (t && !abriu.current) { abriu.current = true; if (hoje !== -1) setAba(hoje); } }, [t, hoje]);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const ir = (n: number) => { const k = (n + 5) % 5; setAba(k); botoes.current[k]?.focus(); };
  const q = QUADROS[aba];
  return (
    <>
      <div className="abas" role="tablist" aria-label="Quadro de cada dia">
        {QUADROS.map((x, k) => (
          <button key={x.d} ref={(el) => { botoes.current[k] = el; }} className="aba" role="tab" id={`agro-aba-${k}`} aria-controls="agro-painel"
            aria-selected={k === aba} tabIndex={k === aba ? 0 : -1} onClick={() => setAba(k)}
            onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); ir(aba + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); ir(aba - 1); } }}>
            {x.d}{k === hoje && <span className="hoje">hoje</span>}
          </button>
        ))}
      </div>
      <div className="painel troca" key={aba} role="tabpanel" id="agro-painel" aria-labelledby={`agro-aba-${aba}`} tabIndex={0}>
        <div><span className="tag">{q.d} · 7h45 às 7h55</span><h4>{q.n}</h4></div>
        <p>{q.t}</p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ mapa dos canais */
const IC: Record<string, React.ReactNode> = {
  radio: <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2" /><path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></svg>,
  yt: <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" /></svg>,
  redes: <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" /></svg>,
  site: <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 9h10M7 13h10M7 17h6" /></svg>,
  news: <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>,
};
type Canal = { k: string; n: string; f: string; onde: string; num: number; sufixo: string; num2: string; x: number; y: number; itens: [string, string, boolean?][]; ex: string };
const CANAIS: Canal[] = [
  { k: "radio", n: "Rádio", f: "Conversa", onde: "Onde a pauta nasce, ao vivo.", num: 60, sufixo: "min", num2: "ao vivo, seg a sex, das 7h às 8h", x: 50, y: 13,
    itens: [["Espelho fixo", "Manchetes, mercado, agro em movimento, entrevista, quadro do dia e fechamento."], ["Conversa e opinião", "Presença, conversa e opinião: o coração do projeto."]], ex: "Debate com especialista e ouvintes." },
  { k: "yt", n: "YouTube", f: "Profundidade", onde: "Onde a conversa vai até o fim.", num: 5, sufixo: "episódios", num2: "+ 10 cortes por semana", x: 87, y: 38,
    itens: [["5 episódios", "O programa completo em vídeo, de segunda a sexta."], ["10 cortes por semana", "Os trechos mais fortes da Conversa de Negócios e do Agro em Movimento."], ["Títulos que respondem dúvidas", "Ex.: “Por que o frete pesa tanto no resultado da safra em MT?”"], ["Acervo de busca", "Encontrado por quem pesquisa o tema semanas ou meses depois."]], ex: "Entrevista completa com título em pergunta." },
  { k: "redes", n: "Redes", f: "Descoberta", onde: "Onde o público encontra a marca pela primeira vez, todos os dias.", num: 15, sufixo: "posts", num2: "+ stories diários", x: 74, y: 84,
    itens: [["Notícias em cards", "O essencial e o impacto, em uma arte."], ["Cortes do programa", "Os melhores momentos da Conversa de Negócios e do Agro em Movimento."], ["Cotação diária", "Arte padronizada, publicada sempre no mesmo horário."], ["Carrossel semanal", "Um tema técnico explicado de forma simples.", true]], ex: "Corte de 60 segundos com arte de dados." },
  { k: "site", n: "Site", f: "Referência", onde: "Onde o conteúdo fica: pesquisável, com números e fontes.", num: 3, sufixo: "notícias por dia", num2: "+ cotações e colunas", x: 26, y: 84,
    itens: [["Notícias atualizadas", "Três notícias por dia, sempre com contexto."], ["Cotação diária", "Página fixa, sempre atualizada e fácil de consultar."], ["Entrevistas pergunta e resposta", "Com as pessoas mais influentes do setor."], ["Artigos semanais", "Colunistas fixos: economista, agrônomo e especialista em crédito.", true], ["Editorias pelos pilares", "Um acervo pesquisável, organizado por tema.", true]], ex: "Matéria com os números de cada região." },
  { k: "news", n: "Newsletter", f: "Curadoria", onde: "Onde a semana vira síntese, na caixa de entrada de quem decide.", num: 7, sufixo: "h, toda terça", num2: "semanal", x: 13, y: 38,
    itens: [["Notícias da semana", "O que mais importou, com contexto."], ["Resumo do mercado", "Como as cotações se comportaram e o que observar."], ["Próximas entrevistas", "Quem vem ao programa nos próximos dias."], ["Agenda do agro", "Feiras, eventos e prazos importantes.", true]], ex: "O tema entre os movimentos da semana." },
];

function Contador({ alvo }: { alvo: number }) {
  const [v, setV] = useState(alvo);
  useEffect(() => {
    if (reduzir()) { setV(alvo); return; }
    let raf = 0; const t0 = performance.now();
    const passo = (t: number) => { const p = Math.min(1, (t - t0) / 700); setV(Math.round(alvo * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(passo); };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo]);
  return <b>{v}</b>;
}

export function AgroEcossistema() {
  const [sel, setSel] = useState(0);
  const mapa = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ W: 0, H: 0 });
  useEffect(() => {
    const el = mapa.current; if (!el) return;
    const ro = new ResizeObserver(() => setTam({ W: el.clientWidth, H: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="eco">
      <div className="mapa" ref={mapa}>
        <svg className="linhas" aria-hidden="true" viewBox={`0 0 ${tam.W || 1} ${tam.H || 1}`}>
          {CANAIS.map((x, k) => <line key={x.k} x1={tam.W / 2} y1={tam.H / 2} x2={(x.x / 100) * tam.W} y2={(x.y / 100) * tam.H} className={k === sel ? "on" : undefined} />)}
        </svg>
        <div className="nucleo" aria-hidden="true"><div><small>Núcleo editorial</small><strong>Uma pauta central</strong></div></div>
        {CANAIS.map((x, k) => (
          <button key={x.k} type="button" className="canal" style={{ left: `${x.x}%`, top: `${x.y}%` }} aria-pressed={k === sel} onClick={() => setSel(k)}>
            {IC[x.k]}{x.n}
          </button>
        ))}
      </div>
      {/* As 5 fichas ficam empilhadas no mesmo lugar: a caixa tem sempre a altura da maior e não muda ao trocar de canal. */}
      <div className="fichas" aria-live="polite">
        {CANAIS.map((c, k) => (
          <article key={c.k} className={`ficha${k === sel ? " troca" : " fora"}`} inert={k !== sel} aria-hidden={k !== sel || undefined}>
            <span className="funcao">{c.f}</span>
            <h3>{c.n}</h3>
            <p className="onde">{c.onde}</p>
            <div className="numero">{k === sel ? <Contador key={sel} alvo={c.num} /> : <b>{c.num}</b>}<span>{c.sufixo} <span className="nota">{c.num2}</span></span></div>
            <ul className="itens">
              {c.itens.map(([t, d, s]) => <li key={t}><div><strong>{t}</strong><span>{d}</span></div>{s && <span className="tag">Sugestão</span>}</li>)}
            </ul>
            <p className="ex"><b>Exemplo:</b> {c.ex}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ jornada */
const PASSOS: [string, string][] = [
  ["Pauta", "O núcleo editorial define os temas a partir dos pilares, do mercado e dos correspondentes."],
  ["Rádio", "O programa ao vivo apresenta a pauta: notícias, cotação, entrevista e regiões."],
  ["YouTube", "O episódio completo e os cortes da semana, com títulos que respondem dúvidas."],
  ["Redes", "No mesmo dia: cortes, cotação em arte e notícias em cards."],
  ["Site", "A pauta vira referência: matéria, cotação, entrevista e artigo."],
  ["Newsletter", "Toda terça, a curadoria da semana e as próximas entrevistas."],
  ["De volta à pauta", "Perguntas, interações e o que foi mais visto alimentam os próximos temas."],
];
export function AgroJornada() {
  const [atual, setAtual] = useState(0);
  const [passeio, setPasseio] = useState(false);
  const trilha = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, w: 0 });
  useEffect(() => { setPasseio(!reduzir()); }, []);
  useEffect(() => {
    if (!passeio) return;
    const i = setInterval(() => setAtual((a) => (a + 1) % PASSOS.length), 2600);
    return () => clearInterval(i);
  }, [passeio]);
  useLayoutEffect(() => {
    const medir = () => {
      const el = trilha.current; if (!el) return;
      const bts = el.querySelectorAll<HTMLElement>(".passo"), base = el.getBoundingClientRect(), r = bts[atual].getBoundingClientRect();
      const x = r.left - base.left + r.width / 2;
      setPos({ x, w: Math.max(0, x - base.width * 0.04) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (trilha.current) ro.observe(trilha.current);
    return () => ro.disconnect();
  }, [atual]);
  return (
    <>
      <div className="trilha" ref={trilha}>
        <div className="progresso" style={{ width: pos.w }} aria-hidden="true" />
        <div className="token" style={{ left: pos.x }} aria-hidden="true" />
        {PASSOS.map(([t, d], k) => (
          <button key={t} type="button" className="passo" aria-current={k === atual} onClick={() => { setPasseio(false); setAtual(k); }}>
            <b>{String(k + 1).padStart(2, "0")}</b><strong>{t}</strong><span>{d}</span>
          </button>
        ))}
      </div>
      <p className="resumo">Uma pauta <b>nasce no rádio</b>, <b>se aprofunda no YouTube</b>, <b>se espalha nas redes</b>, <b>fica no site</b> e é <b>resumida na newsletter</b>.</p>
      <button className="pausa" type="button" aria-pressed={!passeio} onClick={() => setPasseio(!passeio)}>
        {passeio ? "Pausar o passeio" : "Continuar o passeio"}
      </button>
    </>
  );
}

/* ------------------------------------------------------------ newsletter (demonstração) */
export function AgroNewsletter() {
  const [msg, setMsg] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  return (
    <>
      <form noValidate onSubmit={(e) => {
        e.preventDefault();
        const v = campo.current?.value.trim() ?? "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setMsg("Confira o e-mail: falta o @ ou o domínio."); campo.current?.focus(); return; }
        setMsg("Pronto! Na próxima terça, às 7h, a síntese chega para você. (Demonstração: nada foi enviado.)");
      }}>
        <label htmlFor="agro-email">Seu e-mail</label>
        <input ref={campo} id="agro-email" type="email" autoComplete="email" placeholder="nome@fazenda.com.br" aria-describedby="agro-news-msg" />
        <button className="btn verde" type="submit">Quero receber</button>
      </form>
      <p className="ok" id="agro-news-msg" role="status">{msg}</p>
    </>
  );
}
