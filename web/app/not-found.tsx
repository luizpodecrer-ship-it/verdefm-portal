import Link from "next/link";
import { FormBusca } from "@/components/verde/busca";

export default function NaoEncontrada() {
  return (
    <div className="vfm-container vfm-erro">
      <span className="vfm-erro__numero" aria-hidden="true">404</span>
      <h1>Esta página saiu do ar</h1>
      <p>O endereço pode ter mudado ou a notícia foi retirada. Busque o que você procura ou volte para o início.</p>
      <FormBusca id="busca-404" placeholder="Buscar notícias" />
      <div className="vfm-atalhos">
        <Link className="vfm-botao" href="/">Ir para o início</Link>
        <Link className="vfm-botao vfm-botao--contorno" href="/videos">Vídeos</Link>
        <Link className="vfm-botao vfm-botao--contorno" href="/programacao">Programação</Link>
      </div>
    </div>
  );
}
