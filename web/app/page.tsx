import Link from "next/link";
import { HOME, VIDEOS, urlMateria } from "@/lib/conteudo";
import { LinkMais } from "@/components/verde/blocos";
import { BannerTopo, EmCidade, ProgramacaoHoje, TV } from "@/components/verde/interativos";
import { ParadaLateral } from "@/components/verde/parada";

/* eslint-disable @next/next/no-img-element */

export default function Home() {
  const { manchete, subs, faixa, editorias } = HOME;
  // faixa abaixo da manchete: 4 notícias (as 2 que ficavam ao lado da manchete + as 2 seguintes)
  const faixa4 = [...subs, ...faixa].slice(0, 4);
  const mm = manchete.materia;
  return (
    <>
      <BannerTopo />

      {/* Destaques: manchete + as 10 mais tocadas ao lado (no WordPress: post fixado "Manchete") */}
      <div className="vfm-container vfm-destaques">
        <article className="vfm-manchete">
          {mm.foto_g && (
            <Link className="vfm-manchete__foto" href={urlMateria(mm)} tabIndex={-1} aria-hidden="true">
              <img className="vfm-foto vfm-foto--16x9" src={mm.foto_g} alt="" width={1600} height={900} fetchPriority="high" />
            </Link>
          )}
          <span className="vfm-chapeu">{manchete.chapeu}</span>
          <h1><Link href={urlMateria(mm)}>{mm.titulo}</Link></h1>
          <p className="vfm-manchete__fina">{manchete.fina}</p>
        </article>

        {/* As 10 mais tocadas ao lado da manchete (opção C, aprovada em 21/11/2026) */}
        <ParadaLateral />
      </div>

      {/* Faixa de 4 destaques abaixo da manchete */}
      <section className="vfm-container vfm-mais-destaques" aria-label="Mais destaques">
        <ul className="vfm-mais-destaques__lista">
          {faixa4.map(({ materia: m, chapeu }) => (
            <li key={m.slug}>
              <article className="vfm-card-linha">
                {m.foto_m && (
                  <Link className="vfm-card-linha__foto" href={urlMateria(m)} tabIndex={-1} aria-hidden="true">
                    <img className="vfm-foto" src={m.foto_m} alt="" width={400} height={300} loading="lazy" />
                  </Link>
                )}
                <div className="vfm-card-linha__texto">
                  <span className="vfm-chapeu">{chapeu}</span>
                  <h2><Link href={urlMateria(m)}>{m.titulo}</Link></h2>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <EmCidade />

      <section className="vfm-secao vfm-secao--tv" id="videos" aria-labelledby="titulo-videos">
        <div className="vfm-container">
          <div className="vfm-titulo-secao">
            <div>
              <span className="vfm-chapeu">Verde FM no YouTube</span>
              <h2 id="titulo-videos">Ao vivo e vídeos</h2>
            </div>
            <LinkMais href="https://www.youtube.com/@VerdeFMoficial" externo>Ver o canal</LinkMais>
          </div>
          <TV videos={VIDEOS.slice(0, 6)} />
        </div>
      </section>

      <div className="vfm-publicidade vfm-container">
        <div className="vfm-publicidade__espaco">
          <span>Publicidade</span>
          <span>Banner 1200 × 150 no computador · 320 × 100 no celular</span>
        </div>
      </div>

      <section className="vfm-secao vfm-container" id="editorias" aria-label="Editorias">
        <div className="vfm-editorias">
          {editorias.map((ed) => (
            <div className="vfm-editoria" key={ed.rota}>
              <div className="vfm-editoria__titulo"><h2>{ed.nome}</h2><Link className="vfm-link-mais" href={ed.rota}>Ver mais</Link></div>
              {ed.principal.foto_m && (
                <Link className="vfm-editoria__foto" href={urlMateria(ed.principal)} tabIndex={-1} aria-hidden="true">
                  <img className="vfm-foto vfm-foto--16x9" src={ed.principal.foto_m} alt="" width={768} height={432} loading="lazy" />
                </Link>
              )}
              <h3 className="vfm-editoria__principal"><Link href={urlMateria(ed.principal)}>{ed.principal.titulo}</Link></h3>
              <ul className="vfm-editoria__lista">
                {ed.lista.map((m) => <li key={m.slug}><Link href={urlMateria(m)}>{m.titulo}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="vfm-secao vfm-secao--branca">
        <div className="vfm-container vfm-extras">
          <ProgramacaoHoje />
          <div className="vfm-promocao" id="promocoes">
            <span className="vfm-chapeu">Promoções</span>
            <p className="vfm-promocao__nome">Nenhuma promoção aberta agora</p>
            <p>Fique ligado na Verde: a próxima é anunciada no ar e aparece aqui.</p>
            <Link className="vfm-botao" href="/promocoes">Ver promoções</Link>
          </div>
        </div>
      </section>
    </>
  );
}
