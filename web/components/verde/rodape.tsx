"use client";

import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { useCidade, useRadio } from "./provedores";
import { Facebook, IconesPlay, Instagram, YouTube } from "./icones";
import { RADIOS } from "@/lib/conteudo";

const REDES = [
  { classe: "instagram", nome: "Instagram", href: "https://www.instagram.com/verdefmoficial_/", Icone: Instagram },
  { classe: "facebook", nome: "Facebook", href: "https://www.facebook.com/profile.php?id=61553431857043", Icone: Facebook },
  { classe: "youtube", nome: "YouTube", href: "https://www.youtube.com/@VerdeFMoficial", Icone: YouTube },
];

export function Rodape() {
  const { cidade } = useCidade();
  return (
    <footer className="vfm-rodape">
      <div className="vfm-container vfm-rodape__colunas">
        <div className="vfm-rodape__marca">
          <Link className="vfm-rodape__logo" href="/" aria-label="Verde FM, página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cidade.logo} alt={`Verde FM ${cidade.nome} ${cidade.frequencia}`} width={840} height={200} loading="lazy" />
          </Link>
          <p>Notícias de Mato Grosso e a Verde FM ao vivo em Cuiabá, Campo Verde e Jaciara.</p>
        </div>
        <div>
          <h2>Nossas rádios</h2>
          <ul>
            {RADIOS.filter((r) => r.ativa).map((r) => (
              <li key={r.slug}><Link href={`/cidade/${r.slug}`}>{r.nome} · {r.frequencia}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Siga a Verde</h2>
          <ul className="vfm-redes">
            {REDES.map(({ classe, nome, href, Icone }) => (
              <li key={classe}>
                <a className={`vfm-rede vfm-rede--${classe}`} href={href} target="_blank" rel="noopener" aria-label={`${nome} da Verde FM`} title={nome}>
                  <Icone />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="vfm-container vfm-rodape__fim">
        <span>© Verde FM. Versão de demonstração com matérias dos sites atuais da Verde FM.</span>
        {/* Assinatura da Astravox: só o ícone, com link (padrão dos projetos web da Astravox) */}
        <a className="vfm-assinatura" href="https://www.astravox.com.br" target="_blank" rel="noopener" aria-label="Astravox" title="Astravox">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/astravox.svg" alt="" width={14} height={18} loading="lazy" />
        </a>
      </div>
    </footer>
  );
}

/** Botão de play da rádio (barra, página da cidade, matéria). */
export function BotaoPlay({ className = "vfm-play", rotulo }: { className?: string; rotulo?: string }) {
  const { cidade } = useCidade();
  const { tocando, alternar } = useRadio();
  return (
    <button
      className={className}
      type="button"
      aria-pressed={tocando}
      aria-label={rotulo ?? (tocando ? `Parar a rádio de ${cidade.nome}` : `Ouvir a rádio ao vivo de ${cidade.nome}`)}
      onClick={alternar}
    >
      <IconesPlay />
    </button>
  );
}

/** Player fixo no pé da tela, em todas as páginas (fica no layout: a rádio não para ao navegar). */
export function BarraPlayer() {
  const { cidade } = useCidade();
  const { erro, programa, volume, mudo, setVolume, alternarMudo } = useRadio();
  const semSom = mudo || volume === 0;
  return (
    <section className="vfm-barra-player" aria-label="Rádio ao vivo">
      <div className="vfm-container vfm-barra-player__linha">
        <BotaoPlay className="vfm-play vfm-play--barra" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="vfm-barra-player__logo" src={cidade.logo} alt={`Verde FM ${cidade.nome} ${cidade.frequencia}`} width={840} height={200} />
        <div className="vfm-barra-player__texto">
          <span className="vfm-barra-player__sobre">
            <span className="vfm-selo-aovivo"><span className="vfm-ponto" aria-hidden="true" />Ao vivo</span>
            <span>Verde FM {cidade.nome} · {cidade.frequencia}</span>
          </span>
          <strong>{programa ? programa.programa : `Verde FM ${cidade.nome}`}</strong>
          <span className="vfm-player-status" role="status">{erro}</span>
        </div>
        <span className="vfm-eq" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <div className="vfm-barra-player__extra">
          <Link className="vfm-barra-player__link" href="/programacao">Programação</Link>
          <div className={`vfm-volume ${semSom ? "vfm-volume--mudo" : ""}`}>
            <button className="vfm-volume__mudo" type="button" aria-pressed={semSom} aria-label={semSom ? "Ligar o som" : "Tirar o som"} onClick={alternarMudo}>
              {semSom ? <VolumeX className="vfm-volume__sem" size={18} aria-hidden="true" /> : <Volume2 className="vfm-volume__com" size={18} aria-hidden="true" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={mudo ? 0 : volume} aria-label="Volume" onChange={(e) => setVolume(Number(e.target.value))} />
          </div>
        </div>
      </div>
    </section>
  );
}
