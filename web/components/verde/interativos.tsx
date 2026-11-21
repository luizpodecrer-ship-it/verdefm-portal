"use client";

/* Peças com movimento ou que dependem da cidade escolhida. */
import Link from "next/link";
import { Link2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCidade, useRadio, agoraEmCuiaba, noIntervalo } from "./provedores";
import { Facebook, WhatsApp, X } from "./icones";
import { BANNERS, CANAL_YOUTUBE, ENDERECO, HOME, hora, type Materia, type Video, dataBr, urlMateria } from "@/lib/conteudo";

/* eslint-disable @next/next/no-img-element */

const reduzir = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------ banner do topo */
/** Banner 1260 × 120: rodízio a cada 8 s, para no mouse, no foco e no botão; cada visita começa num anúncio diferente. */
export function BannerTopo() {
  const [atual, setAtual] = useState(0);
  const [ligado, setLigado] = useState(false);
  const [pausado, setPausado] = useState(false);
  const parado = useRef(false);
  useEffect(() => {
    setAtual(Math.floor(Math.random() * BANNERS.length));
    if (BANNERS.length < 2 || reduzir()) return;
    setLigado(true);
  }, []);
  useEffect(() => {
    if (!ligado || pausado) return;
    const t = setInterval(() => {
      if (parado.current || document.hidden) return;
      setAtual((a) => (a + 1) % BANNERS.length);
    }, 8000);
    return () => clearInterval(t);
  }, [ligado, pausado]);
  const parar = (v: boolean) => () => { parado.current = v; };
  return (
    <div className="vfm-container vfm-pub-topo">
      <section className="vfm-pub-topo__caixa" aria-label="Publicidade" onMouseEnter={parar(true)} onMouseLeave={parar(false)} onFocus={parar(true)} onBlur={parar(false)}>
        {BANNERS.map((b, i) => (
          <a key={b.img} className={`vfm-pub-topo__peca${i === atual ? " vfm-ativa" : ""}`} href={b.href} target="_blank" rel="noopener sponsored"
            tabIndex={i === atual ? undefined : -1} aria-hidden={i === atual ? undefined : true}>
            <img src={b.img} alt={b.alt} width={b.w} height={b.h} loading={i === 0 ? undefined : "lazy"} />
          </a>
        ))}
      </section>
      <div className="vfm-pub-topo__rodape">
        <span className="vfm-pub-topo__rotulo" aria-hidden="true">Publicidade</span>
        {ligado && (
          <button className="vfm-pub-topo__pausa" type="button" aria-pressed={pausado}
            aria-label={pausado ? "Continuar a troca de anúncios" : "Pausar a troca de anúncios"} title={pausado ? "Continuar a troca de anúncios" : "Pausar a troca de anúncios"}
            onClick={() => setPausado(!pausado)}>
            {pausado ? <Play size={12} fill="currentColor" aria-hidden="true" /> : <Pause size={12} fill="currentColor" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Em {cidade} */
export function EmCidade() {
  const { cidade } = useCidade();
  const itens = HOME.cidades[cidade.slug] ?? HOME.cidades.cuiaba;
  const href = `/cidade/${cidade.slug}`;
  return (
    <section className="vfm-secao vfm-secao--suave" id="cidade" aria-labelledby="titulo-cidade">
      <div className="vfm-container">
        <div className="vfm-titulo-secao">
          <div>
            <span className="vfm-chapeu">Notícias da sua cidade</span>
            <h2 id="titulo-cidade">Em {cidade.nome}</h2>
          </div>
          <Link className="vfm-link-mais" href={href}><span>Todas de {cidade.nome}</span>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
        <ul className="vfm-grade-cidade">
          {itens.map(({ materia: m, chapeu }) => (
            <li key={m.slug}>
              <article className="vfm-card-cidade">
                {m.foto_m && (
                  <Link className="vfm-card-cidade__foto" href={urlMateria(m)} tabIndex={-1} aria-hidden="true">
                    <img className="vfm-foto vfm-foto--4x3" src={m.foto_m} alt="" width={400} height={300} loading="lazy" />
                  </Link>
                )}
                <div className="vfm-card-cidade__texto"><span className="vfm-chapeu">{chapeu}</span><h3><Link href={urlMateria(m)}>{m.titulo}</Link></h3></div>
              </article>
            </li>
          ))}
        </ul>
        <Link className="vfm-link-mais vfm-link-mais--bloco vfm-botao vfm-botao--contorno" href={href}><span>Todas de {cidade.nome}</span></Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ programação */
function useAgora() {
  const [t, setT] = useState<{ dia: number; hora: number } | null>(null);
  useEffect(() => {
    setT(agoraEmCuiaba());
    const i = setInterval(() => setT(agoraEmCuiaba()), 60000);
    return () => clearInterval(i);
  }, []);
  return t;
}

/** Home: o programa no ar e os 3 seguintes, da cidade escolhida. */
export function ProgramacaoHoje() {
  const { cidade } = useCidade();
  const t = useAgora();
  const dia = t?.dia ?? 1;
  const bloco = cidade.grade.find((b) => b.dias.includes(dia)) ?? cidade.grade[0];
  const progs = bloco?.programas ?? [];
  const atual = t ? progs.findIndex((p) => noIntervalo(t.hora, p.inicio, p.fim)) : -1;
  const inicio = atual === -1 ? 0 : atual;
  return (
    <div className="vfm-programacao" id="programacao">
      <h2>Programação de hoje</h2>
      <p>Verde FM {cidade.nome} · {cidade.frequencia} · <Link className="vfm-link-mais" href="/programacao">Grade completa</Link></p>
      <ol>
        {progs.slice(inicio, inicio + 4).map((p, i) => (
          <li key={p.inicio} className={i + inicio === atual ? "vfm-no-ar" : undefined}>
            <time>{hora(p.inicio)}</time>
            <span><strong>{p.programa}</strong>{p.apresentador ? ` · ${p.apresentador}` : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Página Programação: abas por dia, abre no dia de hoje; marca o programa no ar. */
export function GradeCompleta() {
  const { cidade } = useCidade();
  const t = useAgora();
  const [aba, setAba] = useState(0);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (!t) return;
    const i = cidade.grade.findIndex((b) => b.dias.includes(t.dia));
    setAba(i === -1 ? 0 : i);
    // só ao abrir a página e ao trocar de cidade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cidade.slug, t === null]);
  if (!cidade.grade.length) return <p className="vfm-resultado-vazio">A grade desta rádio chega em breve.</p>;
  const ir = (i: number) => {
    const n = (i + cidade.grade.length) % cidade.grade.length;
    setAba(n);
    abas.current[n]?.focus();
  };
  return (
    <section aria-label={`Programação da Verde FM ${cidade.nome}`}>
      <div className="vfm-abas" role="tablist" aria-label="Dias da semana">
        {cidade.grade.map((b, i) => (
          <button key={b.rotulo} ref={(el) => { abas.current[i] = el; }} type="button" role="tab" id={`aba-${i}`} aria-controls={`grade-${i}`}
            aria-selected={i === aba} tabIndex={i === aba ? 0 : -1} onClick={() => setAba(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); ir(aba + 1); }
              if (e.key === "ArrowLeft") { e.preventDefault(); ir(aba - 1); }
            }}>
            {b.rotulo}
          </button>
        ))}
      </div>
      {cidade.grade.map((b, i) => {
        const hoje = t ? b.dias.includes(t.dia) : false;
        return (
          <div key={b.rotulo} role="tabpanel" id={`grade-${i}`} aria-labelledby={`aba-${i}`} tabIndex={0} hidden={i !== aba}>
            <ol className="vfm-grade-programas">
              {b.programas.map((p) => (
                <li key={p.inicio} className={hoje && t && noIntervalo(t.hora, p.inicio, p.fim) ? "vfm-no-ar" : undefined}>
                  <time>{hora(p.inicio)} às {hora(p.fim)}</time>
                  <span><strong>{p.programa}</strong>{p.apresentador && <small>{p.apresentador}</small>}</span>
                  <span className="vfm-selo-aovivo"><span className="vfm-ponto" aria-hidden="true" />No ar</span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}

/** Texto com a cidade escolhida (ex.: "Verde FM Cuiabá · 103.7"). */
export function NomeCidade({ comFrequencia }: { comFrequencia?: boolean }) {
  const { cidade } = useCidade();
  return <>{cidade.nome}{comFrequencia ? ` · ${cidade.frequencia}` : ""}</>;
}

/** Botão "Ouvir": troca para a cidade (se precisar) e toca. */
export function BotaoOuvir({ slug, children }: { slug?: string; children: React.ReactNode }) {
  const { cidade } = useCidade();
  const { ouvirCidade, tocando, pausar } = useRadio();
  const alvo = slug ?? cidade.slug;
  const tocandoEsta = tocando && alvo === cidade.slug;
  return (
    <button className="vfm-botao" type="button" aria-pressed={tocandoEsta} onClick={() => (tocandoEsta ? pausar() : ouvirCidade(alvo))}>
      {tocandoEsta ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
      {tocandoEsta ? " Parar a rádio" : <> {children}</>}
    </button>
  );
}

/** Matéria: cartão "Ouça a Verde FM {cidade} ao vivo". */
export function Ouca() {
  const { cidade } = useCidade();
  const { programa, tocando, alternar } = useRadio();
  return (
    <section className="vfm-ouca" aria-label="Rádio ao vivo">
      <button className="vfm-play" type="button" aria-pressed={tocando} aria-label={tocando ? "Parar a rádio" : "Ouvir a rádio ao vivo"} onClick={alternar}>
        <svg className="vfm-play__tocar" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
        <svg className="vfm-play__pausar" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        <svg className="vfm-play__girando" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
      </button>
      <div className="vfm-ouca__texto">
        <strong>Ouça a Verde FM {cidade.nome} ao vivo</strong>
        <span>No ar agora: {programa ? programa.programa : "Verde FM"}</span>
      </div>
      <Link className="vfm-botao vfm-botao--contorno" href="/programacao">Programação</Link>
    </section>
  );
}

/* ------------------------------------------------------------ compartilhar */
export function Compartilhar({ m }: { m: Materia }) {
  const url = ENDERECO + urlMateria(m);
  const [copiado, setCopiado] = useState(false);
  const enc = encodeURIComponent;
  return (
    <div className="vfm-compartilhar">
      <span>Compartilhar</span>
      <a href={`https://wa.me/?text=${enc(m.titulo + " " + url)}`} target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp" title="WhatsApp"><WhatsApp /></a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener" aria-label="Compartilhar no Facebook" title="Facebook"><Facebook tamanho={18} /></a>
      <a href={`https://twitter.com/intent/tweet?text=${enc(m.titulo)}&url=${enc(url)}`} target="_blank" rel="noopener" aria-label="Compartilhar no X" title="X"><X /></a>
      <button type="button" title="Copiar o link" onClick={() => {
        navigator.clipboard?.writeText(url).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2200); }, () => {});
      }}>
        <Link2 size={18} aria-hidden="true" />
        <span className="vfm-so-leitor" role="status">{copiado ? "Link copiado" : "Copiar o link"}</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ vídeos */
/** Ao vivo e vídeos: abre no último vídeo; o ao vivo é o primeiro item. O vídeo só carrega no toque; rádio e vídeo não tocam juntos. */
export function TV({ videos, pagina = false }: { videos: Video[]; pagina?: boolean }) {
  const { cidade } = useCidade();
  const { registrarParaVideos, tocando, pausar } = useRadio();
  const [atual, setAtual] = useState(videos[0]?.id ?? "ao-vivo");
  const [assistindo, setAssistindo] = useState(false);
  const [capa, setCapa] = useState(`https://i.ytimg.com/vi/${videos[0]?.id}/maxresdefault.jpg`);
  const tela = useRef<HTMLDivElement>(null);
  useEffect(() => registrarParaVideos(() => setAssistindo(false)), [registrarParaVideos]);

  const aoVivo = atual === "ao-vivo";
  const titulo = aoVivo ? "Transmissão ao vivo do estúdio" : videos.find((v) => v.id === atual)?.titulo ?? "";
  const src = aoVivo
    ? `https://www.youtube.com/embed/live_stream?channel=${CANAL_YOUTUBE}&autoplay=1`
    : `https://www.youtube.com/embed/${atual}?autoplay=1&rel=0`;
  const link = aoVivo ? `https://www.youtube.com/channel/${CANAL_YOUTUBE}/live` : `https://www.youtube.com/watch?v=${atual}`;

  function assistir() {
    setAssistindo(true);
    if (tocando) pausar(); // vídeo começou: a rádio para
  }
  function escolher(id: string) {
    setAtual(id);
    if (id !== "ao-vivo") setCapa(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
    assistir();
    if (tela.current && tela.current.getBoundingClientRect().top < 0) tela.current.scrollIntoView({ behavior: reduzir() ? "auto" : "smooth", block: "start" });
  }
  const TituloTag = pagina ? "h2" : "h3";
  const itens = (
    <>
      <li>
        <button className="vfm-tv__item vfm-tv__item--aovivo" type="button" aria-current={aoVivo} onClick={() => escolher("ao-vivo")}>
          <span className="vfm-tv__miniatura vfm-tv__miniatura--aovivo" aria-hidden="true"><span className="vfm-ponto" /></span>
          <span className="vfm-tv__item-texto"><strong>Transmissão ao vivo</strong><small>Estúdio da Verde FM</small></span>
        </button>
      </li>
      {videos.map((v) => (
        <li key={v.id}>
          <button className="vfm-tv__item" type="button" aria-current={v.id === atual} onClick={() => escolher(v.id)}>
            <img className="vfm-tv__miniatura" src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" />
            <span className="vfm-tv__item-texto"><strong>{v.titulo}</strong><small>{dataBr(v.data)}</small></span>
          </button>
        </li>
      ))}
    </>
  );
  return (
    <div className={`vfm-tv${pagina ? " vfm-tv--pagina" : ""}${aoVivo ? " vfm-tv--ao-vivo" : ""}`}>
      <div className="vfm-tv__principal">
        <div className="vfm-tv__tela" ref={tela}>
          {assistindo ? (
            <iframe key={atual} src={src} title={titulo || "Vídeo da Verde FM"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          ) : (
            <button className="vfm-tv__capa" type="button" onClick={assistir}>
              <img className="vfm-tv__capa-img" src={capa} alt="" width={1280} height={720} loading="lazy" hidden={aoVivo}
                onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth <= 120 && !i.src.includes("hqdefault")) setCapa(i.src.replace("maxresdefault", "hqdefault")); }}
                onError={(e) => { const i = e.currentTarget; if (!i.src.includes("hqdefault")) setCapa(i.src.replace("maxresdefault", "hqdefault")); }} />
              <span className="vfm-tv__capa-aovivo" aria-hidden="true">
                <img src={cidade.logo} alt="" width={840} height={200} />
                <span>Transmissão do estúdio</span>
              </span>
              <span className="vfm-tv__selo"><span className="vfm-ponto" aria-hidden="true" /><span>{aoVivo ? "Ao vivo" : atual === videos[0]?.id ? "Último vídeo" : "Vídeo"}</span></span>
              <span className="vfm-tv__play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg></span>
              <span className="vfm-so-leitor">Assistir: {titulo}</span>
            </button>
          )}
        </div>
        <div className="vfm-tv__legenda">
          <TituloTag>{titulo}</TituloTag>
          <a className="vfm-link-mais" href={link} target="_blank" rel="noopener">Abrir no YouTube</a>
        </div>
      </div>
      {pagina ? (
        <ul className="vfm-videos" aria-label="Todos os vídeos">{itens}</ul>
      ) : (
        <div className="vfm-tv__lateral">
          <div className="vfm-tv__painel">
            <h3 className="vfm-tv__lista-titulo">Últimos vídeos</h3>
            <ul className="vfm-tv__lista">{itens}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
