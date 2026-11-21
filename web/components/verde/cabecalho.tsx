"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, MapPin, Menu, Pause, Play, Search, X as Fechar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { useCidade } from "./provedores";
import { YouTubeOficial } from "./icones";
import { RADIOS, type Materia, urlMateria } from "@/lib/conteudo";

const AO_VIVO = "https://www.youtube.com/@VerdeFMoficial/live";

function menuItens(cidade: string) {
  return [
    { rotulo: "Início", href: "/" },
    { rotulo: "Política", href: "/editoria/politica" },
    { rotulo: "Cidades", href: `/cidade/${cidade}` },
    { rotulo: "Economia e negócios", href: "/editoria/economia" },
    { rotulo: "Esporte e cultura", href: "/editoria/esporte-e-cultura" },
    { rotulo: "Vídeos", href: "/videos" },
    { rotulo: "Mais tocadas", href: "/mais-tocadas" },
    { rotulo: "Programação", href: "/programacao" },
    { rotulo: "Promoções", href: "/promocoes" },
    { rotulo: "Agro na Verde", href: "/agro-na-verde" },
  ];
}

function BotaoYouTube({ largo = false }: { largo?: boolean }) {
  return (
    <a className={`vfm-yt ${largo ? "vfm-yt--largo" : "vfm-topo__youtube"}`} href={AO_VIVO} target="_blank" rel="noopener">
      <span className="vfm-yt__icone"><YouTubeOficial className="vfm-yt__logo" /></span>
      <span className="vfm-yt__texto">
        <strong><span className="vfm-ponto" aria-hidden="true" />Ao vivo</strong>
        <small>no YouTube</small>
      </span>
    </a>
  );
}

/** Seletor de cidade: lista que abre ao lado do logo (no celular, embaixo). Teclado: setas, Home/End, Esc. */
function SeletorCidade({ aberto, setAberto }: { aberto: boolean; setAberto: (v: boolean) => void }) {
  const { cidade, trocarCidade } = useCidade();
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const atual = lista.current?.querySelector<HTMLButtonElement>('[aria-current="true"]') ?? lista.current?.querySelector("button");
    atual?.focus();
    const fora = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".vfm-cidade, [data-vfm-atalho-cidade]")) setAberto(false);
    };
    document.addEventListener("click", fora);
    return () => document.removeEventListener("click", fora);
  }, [aberto, setAberto]);

  function teclado(e: React.KeyboardEvent) {
    const ops = Array.from(lista.current?.querySelectorAll("button") ?? []);
    const i = ops.indexOf(document.activeElement as HTMLButtonElement);
    const ir = (n: number) => { e.preventDefault(); ops[(n + ops.length) % ops.length]?.focus(); };
    if (e.key === "ArrowDown") ir(i + 1);
    else if (e.key === "ArrowUp") ir(i - 1);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(ops.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); setAberto(false); botao.current?.focus(); }
    else if (e.key === "Tab") setAberto(false);
  }

  return (
    <div className="vfm-cidade vfm-topo__cidade">
      <button
        ref={botao}
        className="vfm-cidade__botao"
        type="button"
        aria-expanded={aberto}
        aria-controls="vfm-cidades-lista"
        onClick={() => setAberto(!aberto)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setAberto(true); } }}
      >
        <MapPin aria-hidden="true" size={16} color="var(--vfm-verde)" />
        <span className="vfm-cidade__prefixo">Você está em</span>
        <span className="vfm-cidade__nome">{cidade.nome}</span>
        <span className="vfm-cidade__freq">{cidade.frequencia}</span>
        <ChevronDown className="vfm-cidade__seta" aria-hidden="true" size={16} />
        <span className="vfm-so-leitor">— trocar de cidade</span>
      </button>
      <ul ref={lista} className="vfm-cidade__lista" id="vfm-cidades-lista" aria-label="Escolha a cidade" hidden={!aberto} onKeyDown={teclado}>
        {RADIOS.map((r) => {
          const atual = r.slug === cidade.slug;
          return (
            <li key={r.slug}>
              <button
                className="vfm-cidade__opcao"
                type="button"
                aria-current={atual}
                aria-disabled={!r.ativa || undefined}
                onClick={() => {
                  if (!r.ativa) return;
                  setAberto(false);
                  trocarCidade(r.slug);
                  botao.current?.focus();
                }}
              >
                <span><strong>{r.nome}</strong><small>Verde FM {r.frequencia}</small></span>
                <span className="vfm-cidade__nota">{!r.ativa ? "Em breve" : atual ? "Você está aqui" : ""}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Faixa "Últimas": letreiro que corre; para com o mouse, com o foco e no botão; parado com "reduzir movimento". */
function Letreiro({ ultimas }: { ultimas: Materia[] }) {
  const lista = useRef<HTMLUListElement>(null);
  const [ligado, setLigado] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tempo, setTempo] = useState(40);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLigado(true);
    const medir = () => lista.current && setTempo(Math.max(18, Math.round(lista.current.scrollWidth / 2 / 55)));
    requestAnimationFrame(medir);
    addEventListener("resize", medir);
    return () => removeEventListener("resize", medir);
  }, []);
  const itens = (copia: boolean) =>
    ultimas.map((m) => (
      <li key={(copia ? "c-" : "") + m.slug} aria-hidden={copia || undefined}>
        <Link href={urlMateria(m)} tabIndex={copia ? -1 : undefined}>{m.titulo}</Link>
      </li>
    ));
  return (
    <div className="vfm-ultimas vfm-container">
      <div
        className={`vfm-ultimas__caixa ${ligado ? "vfm-letreiro--ligado" : ""} ${pausado ? "vfm-letreiro--pausado" : ""}`}
        style={{ ["--vfm-letreiro-tempo" as string]: `${tempo}s` }}
      >
        <span className="vfm-ultimas__rotulo"><span className="vfm-ponto vfm-ponto--verde" aria-hidden="true" />Últimas</span>
        <div className="vfm-ultimas__janela">
          <ul className="vfm-ultimas__lista" ref={lista}>{itens(false)}{ligado && itens(true)}</ul>
        </div>
        {ligado && (
          <button className="vfm-ultimas__pausa" type="button" aria-pressed={pausado} aria-label={pausado ? "Continuar as últimas notícias" : "Pausar as últimas notícias"} onClick={() => setPausado(!pausado)}>
            {pausado ? <Play size={14} aria-hidden="true" fill="currentColor" /> : <Pause size={14} aria-hidden="true" fill="currentColor" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Cabecalho({ ultimas }: { ultimas: Materia[] }) {
  const { cidade } = useCidade();
  const caminho = usePathname();
  const router = useRouter();
  const [cidadeAberta, setCidadeAberta] = useState(false);
  const [mostrarCidade, setMostrarCidade] = useState(false);
  const [data, setData] = useState("");
  const topo = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const busca = useRef<HTMLDialogElement>(null);

  // data de hoje no fuso de Cuiabá
  useEffect(() => {
    const t = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Cuiaba" }).format(new Date());
    setData(t.charAt(0).toUpperCase() + t.slice(1));
  }, []);

  // cabeçalho fixo: encolhe depois de rolar; mede a altura para as âncoras não ficarem escondidas
  useEffect(() => {
    let rolou = false;
    const raiz = document.documentElement;
    const medir = () => topo.current && raiz.style.setProperty("--vfm-topo-altura", `${topo.current.offsetHeight}px`);
    const conferir = () => {
      const y = scrollY;
      if (!rolou && y > 80) rolou = true;
      else if (rolou && y < 10) rolou = false;
      else return;
      raiz.classList.toggle("vfm-rolou", rolou);
      setTimeout(medir, 220);
    };
    medir();
    addEventListener("scroll", conferir, { passive: true });
    addEventListener("resize", medir);
    return () => { removeEventListener("scroll", conferir); removeEventListener("resize", medir); };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("vfm-mostrar-cidade", mostrarCidade);
    if (!cidadeAberta) setMostrarCidade(false);
  }, [mostrarCidade, cidadeAberta]);

  // trocar de página fecha as janelas
  useEffect(() => { menu.current?.close(); busca.current?.close(); setCidadeAberta(false); }, [caminho]);

  const itens = menuItens(cidade.slug);
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));
  const fecharNoFundo = (e: React.MouseEvent<HTMLDialogElement>) => { if (e.target === e.currentTarget) e.currentTarget.close(); };

  return (
    <>
      <header className="vfm-topo" ref={topo}>
        <div className="vfm-container vfm-topo__linha">
          <Link className="vfm-logo" href="/" aria-label="Verde FM, página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cidade.logo} alt={`Verde FM ${cidade.nome} ${cidade.frequencia}`} width={840} height={200} />
          </Link>
          <SeletorCidade aberto={cidadeAberta} setAberto={setCidadeAberta} />
          <div className="vfm-topo__acoes">
            <button className="vfm-icone-botao vfm-topo__atalho-cidade" type="button" data-vfm-atalho-cidade aria-label="Trocar de cidade" title="Trocar de cidade"
              onClick={() => { setMostrarCidade(true); setCidadeAberta(true); }}>
              <MapPin size={18} aria-hidden="true" />
            </button>
            <BotaoYouTube />
            <span className="vfm-topo__data">{data}</span>
            <div className="vfm-topo__tema"><ThemeSwitcher /></div>
            <button className="vfm-icone-botao" type="button" aria-label="Buscar" onClick={() => { busca.current?.showModal(); busca.current?.querySelector("input")?.focus(); }}>
              <Search size={19} aria-hidden="true" />
            </button>
            <button className="vfm-icone-botao vfm-topo__menu" type="button" aria-label="Abrir o menu" onClick={() => menu.current?.showModal()}>
              <Menu size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav className="vfm-nav vfm-container" aria-label="Editorias">
          <ul>
            {itens.map((i) => (
              <li key={i.rotulo}><Link href={i.href} aria-current={ativo(i.href) ? "page" : undefined}>{i.rotulo}</Link></li>
            ))}
          </ul>
        </nav>
      </header>

      <Letreiro ultimas={ultimas} />

      <dialog className="vfm-janela vfm-menu" ref={menu} aria-label="Menu" onClick={fecharNoFundo}>
        <div className="vfm-menu__cabeca">
          <span>Menu</span>
          <button className="vfm-icone-botao" type="button" aria-label="Fechar o menu" onClick={() => menu.current?.close()}><Fechar size={18} aria-hidden="true" /></button>
        </div>
        <nav aria-label="Editorias">
          <ul>
            {itens.map((i) => (
              <li key={i.rotulo}><Link href={i.href} aria-current={ativo(i.href) ? "page" : undefined} onClick={() => menu.current?.close()}>{i.rotulo}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="vfm-menu__extra">
          <div className="vfm-menu__tema"><span>Aparência</span><ThemeSwitcher /></div>
          <BotaoYouTube largo />
        </div>
      </dialog>

      <dialog className="vfm-janela vfm-busca" ref={busca} aria-label="Buscar no site" onClick={fecharNoFundo}>
        <form role="search" onSubmit={(e) => {
          e.preventDefault();
          const s = new FormData(e.currentTarget).get("s")?.toString().trim() ?? "";
          busca.current?.close();
          router.push(`/busca?s=${encodeURIComponent(s)}`);
        }}>
          <label htmlFor="vfm-busca-campo">Buscar notícias</label>
          <input id="vfm-busca-campo" type="search" name="s" placeholder="Buscar notícias" autoComplete="off" />
          <button className="vfm-botao" type="submit">Buscar</button>
          <button className="vfm-icone-botao" type="button" aria-label="Fechar a busca" onClick={() => busca.current?.close()}><Fechar size={18} aria-hidden="true" /></button>
        </form>
      </dialog>
    </>
  );
}
