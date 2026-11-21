"use client";

import { useRef, useState } from "react";
import { RADIOS } from "@/lib/conteudo";

/** Formulário de demonstração: valida e mostra o padrão de erro. No WordPress o envio vai para o plugin de formulário. */
export function PromocaoForm() {
  const [erros, setErros] = useState({ nome: false, zap: false, aceite: false });
  const [ok, setOk] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form className="vfm-formulario" ref={form} noValidate onSubmit={(e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const nome = (f.elements.namedItem("nome") as HTMLInputElement);
      const zap = (f.elements.namedItem("whatsapp") as HTMLInputElement);
      const aceite = (f.elements.namedItem("aceite") as HTMLInputElement);
      const d = zap.value.replace(/[^0-9]/g, "");
      const novo = { nome: nome.value.trim().length <= 1, zap: !(d.length === 10 || d.length === 11), aceite: !aceite.checked };
      setErros(novo);
      setOk(!novo.nome && !novo.zap && !novo.aceite);
      (novo.nome ? nome : novo.zap ? zap : novo.aceite ? aceite : null)?.focus();
    }}>
      <div className="vfm-campo">
        <label htmlFor="p-nome">Seu nome</label>
        <input id="p-nome" name="nome" autoComplete="name" aria-describedby="p-nome-erro" aria-invalid={erros.nome} />
        <p className="vfm-erro-campo" id="p-nome-erro" hidden={!erros.nome}>Informe seu nome.</p>
      </div>
      <div className="vfm-campo">
        <label htmlFor="p-zap">WhatsApp</label>
        <input id="p-zap" name="whatsapp" type="tel" inputMode="tel" placeholder="(65) 99999-9999" autoComplete="tel" aria-describedby="p-zap-erro" aria-invalid={erros.zap} />
        <p className="vfm-erro-campo" id="p-zap-erro" hidden={!erros.zap}>Informe o WhatsApp com DDD, como (65) 99999-9999.</p>
      </div>
      <div className="vfm-campo">
        <label htmlFor="p-cidade">Cidade</label>
        <select id="p-cidade" name="cidade">{RADIOS.filter((r) => r.ativa).map((r) => <option key={r.slug}>{r.nome}</option>)}</select>
      </div>
      <label className="vfm-aceite">
        <input type="checkbox" name="aceite" id="p-aceite" aria-describedby="p-aceite-erro" aria-invalid={erros.aceite} /> Li e aceito o regulamento e o uso dos meus dados para esta promoção.
      </label>
      <p className="vfm-erro-campo" id="p-aceite-erro" hidden={!erros.aceite}>Para participar, aceite o regulamento.</p>
      <button className="vfm-botao" type="submit">Quero participar</button>
      <p className="vfm-aviso-form" hidden={!ok} role="status">Inscrição feita! Boa sorte: o resultado sai na programação da Verde. (Demonstração: nada foi enviado.)</p>
    </form>
  );
}
