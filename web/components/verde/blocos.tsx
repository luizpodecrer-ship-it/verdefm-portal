/* Blocos de notícia que se repetem nas páginas (sem estado: renderizados no servidor). */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type Materia, dataBr, fina, legendaECredito, urlEditoria, urlMateria } from "@/lib/conteudo";

/* eslint-disable @next/next/no-img-element */

export function Chapeu({ m, rotulo }: { m: Materia; rotulo?: string }) {
  const href = urlEditoria(m);
  const t = rotulo ?? m.editoria_rotulo;
  return href ? <Link className="vfm-chapeu" href={href}>{t}</Link> : <span className="vfm-chapeu">{t}</span>;
}

export function Trilha({ itens }: { itens: [string, string | null][] }) {
  return (
    <nav className="vfm-trilha vfm-container" aria-label="Você está em">
      <ol>
        {itens.map(([rotulo, href], i) => (
          <li key={i}>{href ? <Link href={href}>{rotulo}</Link> : <span aria-current="page">{rotulo}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function LinkMais({ href, children, externo }: { href: string; children: React.ReactNode; externo?: boolean }) {
  const seta = <ArrowRight size={16} aria-hidden="true" />;
  return externo ? (
    <a className="vfm-link-mais" href={href} target="_blank" rel="noopener">{children}{seta}</a>
  ) : (
    <Link className="vfm-link-mais" href={href}>{children}{seta}</Link>
  );
}

/** Legenda e crédito da foto: pequena, cinza e em itálico. */
export function Legenda({ m }: { m: Materia }) {
  const { legenda, credito } = legendaECredito(m);
  return (
    <figcaption className="vfm-legenda">
      {legenda && <><span className="vfm-legenda__texto">{legenda}</span> </>}
      <span className="vfm-legenda__credito">{credito}</span>
    </figcaption>
  );
}

/** Cartão de notícia. Sem foto: só o texto (nada de quadro vazio). */
export function Card({ m, Titulo = "h3" }: { m: Materia; Titulo?: "h2" | "h3" }) {
  const u = urlMateria(m);
  return (
    <li>
      <article className={`vfm-card${m.foto_m ? "" : " vfm-card--sem-foto"}`}>
        {m.foto_m && (
          <Link className="vfm-card__foto" href={u} tabIndex={-1} aria-hidden="true">
            <img src={m.foto_m} alt="" width={768} height={480} loading="lazy" />
          </Link>
        )}
        <div className="vfm-meta"><span className="vfm-chapeu">{m.editoria_rotulo}</span><time dateTime={m.data}>{dataBr(m.data)}</time></div>
        <Titulo><Link href={u}>{m.titulo}</Link></Titulo>
        <p>{fina(m.resumo, 170)}</p>
      </article>
    </li>
  );
}

export function Destaque({ m }: { m: Materia }) {
  const u = urlMateria(m);
  return (
    <article className={`vfm-destaque${m.foto_g ? "" : " vfm-destaque--sem-foto"}`}>
      {m.foto_g && (
        <Link className="vfm-destaque__foto" href={u} tabIndex={-1} aria-hidden="true">
          <img className="vfm-foto vfm-foto--16x9" src={m.foto_g} alt="" width={1280} height={720} />
        </Link>
      )}
      <div className="vfm-destaque__texto">
        <div className="vfm-meta"><span className="vfm-chapeu">{m.editoria_rotulo}</span><time dateTime={m.data}>{dataBr(m.data)}</time></div>
        <h2><Link href={u}>{m.titulo}</Link></h2>
        <p>{fina(m.resumo, 240)}</p>
      </div>
    </article>
  );
}

/** Lista de uma editoria ou cidade: destaque (sempre com foto, quando houver) + cartões. */
export function ListaMaterias({ itens }: { itens: Materia[] }) {
  if (!itens.length) return <p className="vfm-resultado-vazio">Ainda não há notícias aqui.</p>;
  const primeira = itens.find((m) => m.foto_g) ?? itens[0];
  const resto = itens.filter((m) => m !== primeira).slice(0, 12);
  return (
    <>
      <Destaque m={primeira} />
      {resto.length > 0 && <ul className="vfm-cards">{resto.map((m) => <Card key={m.slug} m={m} />)}</ul>}
    </>
  );
}
