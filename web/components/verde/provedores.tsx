"use client";

/**
 * Estado que vale para o portal inteiro (fica no layout, não some ao trocar de página):
 *  - tema (next-themes): claro, escuro ou automático;
 *  - cidade escolhida (cookie "vfm_cidade", que o WordPress também pode ler);
 *  - rádio ao vivo: um único <audio>; trocar de cidade troca a rádio.
 */
import { ThemeProvider } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { RADIOS, type Radio, type Programa } from "@/lib/conteudo";

/* ------------------------------------------------------------------ cidade */
type CidadeCtx = { cidade: Radio; trocarCidade: (slug: string) => void };
const Cidade = createContext<CidadeCtx | null>(null);
export const useCidade = () => useContext(Cidade)!;

const COOKIE = "vfm_cidade";
function lerCidade(): Radio {
  if (typeof document === "undefined") return RADIOS[0];
  const m = document.cookie.match(/(?:^|; )vfm_cidade=([^;]*)/);
  let slug = m ? decodeURIComponent(m[1]) : "";
  if (!slug) try { slug = localStorage.getItem(COOKIE) || ""; } catch {}
  const r = RADIOS.find((x) => x.slug === slug && x.ativa);
  return r || RADIOS[0];
}

/* ------------------------------------------------------------------ rádio */
type RadioCtx = {
  tocando: boolean;
  carregando: boolean;
  erro: string;
  tocar: () => void;
  pausar: () => void;
  alternar: () => void;
  volume: number;
  mudo: boolean;
  setVolume: (v: number) => void;
  alternarMudo: () => void;
  programa: Programa | null;
  registrarParaVideos: (fn: () => void) => () => void;
  ouvirCidade: (slug: string) => void;
};
const RadioC = createContext<RadioCtx | null>(null);
export const useRadio = () => useContext(RadioC)!;

/** Dia da semana e hora no fuso de Cuiabá, qualquer que seja o fuso do aparelho. */
export function agoraEmCuiaba() {
  try {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Cuiaba", weekday: "short", hour: "numeric", minute: "numeric", hour12: false })
        .formatToParts(new Date())
        .map((x) => [x.type, x.value]),
    );
    const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dia: dias[p.weekday], hora: (Number(p.hour) % 24) + Number(p.minute) / 60 };
  } catch {
    const d = new Date();
    return { dia: d.getDay(), hora: d.getHours() + d.getMinutes() / 60 };
  }
}
export function noIntervalo(hora: number, inicio: number, fim: number) {
  if (fim === 0) fim = 24;
  return inicio < fim ? hora >= inicio && hora < fim : hora >= inicio || hora < fim;
}
export function programaNoAr(r: Radio): Programa | null {
  const t = agoraEmCuiaba();
  for (const b of r.grade || []) {
    if (!b.dias.includes(t.dia)) continue;
    const p = b.programas.find((x) => noIntervalo(t.hora, x.inicio, x.fim));
    if (p) return p;
  }
  return null;
}

export function Provedores({ children }: { children: React.ReactNode }) {
  const [cidade, setCidade] = useState<Radio>(RADIOS[0]);
  useEffect(() => setCidade(lerCidade()), []);

  const audio = useRef<HTMLAudioElement | null>(null);
  const querTocar = useRef(false);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [volume, setVol] = useState(1);
  const [mudo, setMudo] = useState(false);
  const [programa, setPrograma] = useState<Programa | null>(null);
  const paraVideos = useRef(new Set<() => void>());

  useEffect(() => {
    setPrograma(programaNoAr(cidade));
    const t = setInterval(() => setPrograma(programaNoAr(cidade)), 60000);
    return () => clearInterval(t);
  }, [cidade]);

  const tocar = useCallback(() => {
    const a = audio.current;
    if (!a || !cidade.stream) {
      setErro("A rádio desta cidade ainda não está no ar.");
      return;
    }
    querTocar.current = true;
    setErro("");
    paraVideos.current.forEach((f) => f()); // rádio e vídeo não tocam juntos
    a.src = cidade.stream; // ao vivo: sempre volta para o "agora"
    setCarregando(true);
    a.play().catch(() => {
      querTocar.current = false;
      setCarregando(false);
      setTocando(false);
      setErro("Não foi possível tocar agora. Tente de novo em instantes.");
    });
    if ("mediaSession" in navigator && "MediaMetadata" in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Verde FM ${cidade.frequencia}`,
        artist: `${cidade.nome} · ao vivo`,
        artwork: [{ src: cidade.logo, sizes: "840x200", type: "image/png" }],
      });
    }
  }, [cidade]);

  const pausar = useCallback(() => {
    querTocar.current = false;
    const a = audio.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setCarregando(false);
    setTocando(false);
  }, []);

  const alternar = useCallback(() => (querTocar.current ? pausar() : tocar()), [pausar, tocar]);

  // trocar de cidade com a rádio tocando: passa a tocar a da cidade nova
  const tocarRef = useRef(tocar);
  tocarRef.current = tocar;
  useEffect(() => {
    if (querTocar.current) tocarRef.current();
  }, [cidade]);

  const trocarCidade = useCallback((slug: string) => {
    const nova = RADIOS.find((r) => r.slug === slug && r.ativa);
    if (!nova) return;
    document.cookie = `${COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=31536000; SameSite=Lax`;
    try { localStorage.setItem(COOKIE, slug); } catch {}
    setCidade(nova);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("vfm-tocando", tocando);
    document.documentElement.classList.toggle("vfm-carregando-audio", carregando);
    document.documentElement.classList.toggle("vfm-radio-erro", !!erro);
  }, [tocando, carregando, erro]);

  const radioCtx = useMemo<RadioCtx>(
    () => ({
      tocando, carregando, erro, tocar, pausar, alternar, volume, mudo, programa,
      setVolume: (v) => {
        setVol(v);
        setMudo(v === 0);
        if (audio.current) { audio.current.volume = v; audio.current.muted = v === 0; }
      },
      alternarMudo: () => {
        const novo = !mudo;
        setMudo(novo);
        if (audio.current) audio.current.muted = novo;
        if (!novo && volume === 0) { setVol(0.6); if (audio.current) audio.current.volume = 0.6; }
      },
      ouvirCidade: (slug) => {
        if (slug === cidade.slug) return tocar();
        querTocar.current = true; // o efeito da troca de cidade começa a tocar a nova
        trocarCidade(slug);
      },
      registrarParaVideos: (fn) => {
        paraVideos.current.add(fn);
        return () => paraVideos.current.delete(fn);
      },
    }),
    [tocando, carregando, erro, tocar, pausar, alternar, volume, mudo, programa, cidade, trocarCidade],
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
      <Cidade.Provider value={{ cidade, trocarCidade }}>
        <RadioC.Provider value={radioCtx}>
          {children}
          <audio
            ref={audio}
            preload="none"
            onPlaying={() => { setCarregando(false); setTocando(true); }}
            onWaiting={() => querTocar.current && setCarregando(true)}
            onPause={() => setTocando(false)}
            onError={() => {
              if (!querTocar.current) return;
              querTocar.current = false;
              setCarregando(false);
              setTocando(false);
              setErro("A transmissão caiu. Toque de novo para voltar.");
            }}
          />
        </RadioC.Provider>
      </Cidade.Provider>
    </ThemeProvider>
  );
}
