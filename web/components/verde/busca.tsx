"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MATERIAS } from "@/lib/conteudo";
import { Card } from "./blocos";

const normal = (t: string) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca da demonstração (sem acento e sem diferenciar maiúsculas). No WordPress: /wp-json/wp/v2/posts?search=termo. */
export function Busca() {
  const termo = (useSearchParams().get("s") ?? "").trim();
  const router = useRouter();
  const palavras = normal(termo).split(/\s+/).filter(Boolean);
  const achados = palavras.length
    ? MATERIAS.filter((m) => { const alvo = normal(`${m.titulo} ${m.resumo} ${m.editoria_rotulo}`); return palavras.every((p) => alvo.includes(p)); })
    : MATERIAS.slice(0, 12);
  const resumo = palavras.length
    ? achados.length ? `${achados.length} ${achados.length === 1 ? "notícia encontrada" : "notícias encontradas"} para “${termo}”` : `Nada encontrado para “${termo}”. Tente outra palavra.`
    : "Últimas notícias";
  return (
    <>
      <header className="vfm-cabeca-pagina">
        <div style={{ flex: "1 1 100%" }}>
          <h1>Buscar notícias</h1>
          <FormBusca key={termo} inicial={termo} id="busca-pagina" ir={(s) => router.push(`/busca?s=${encodeURIComponent(s)}`)} />
        </div>
      </header>
      <p className="vfm-meta" role="status">{resumo}</p>
      <ul className="vfm-cards" style={{ marginTop: 20 }}>{achados.map((m) => <Card key={m.slug} m={m} />)}</ul>
    </>
  );
}

export function FormBusca({ inicial = "", id, ir, placeholder = "Digite o que você procura" }: { inicial?: string; id: string; ir?: (s: string) => void; placeholder?: string }) {
  const router = useRouter();
  return (
    <form className="vfm-busca-pagina" role="search" onSubmit={(e) => {
      e.preventDefault();
      const s = (new FormData(e.currentTarget).get("s") ?? "").toString().trim();
      (ir ?? ((t: string) => router.push(`/busca?s=${encodeURIComponent(t)}`)))(s);
    }}>
      <label className="vfm-so-leitor" htmlFor={id}>Buscar notícias</label>
      <input id={id} type="search" name="s" placeholder={placeholder} defaultValue={inicial} />
      <button className="vfm-botao" type="submit">Buscar</button>
    </form>
  );
}
