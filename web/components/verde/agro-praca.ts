"use client";

/* "Sua praça" do Agro na Verde: preferência guardada no navegador (agro_praca), compartilhada
   entre o portal do Agro e a faixa de cotações do site da Verde. */
import { useEffect, useState } from "react";
import { PRACAS } from "@/lib/agro";

const CHAVE = "agro_praca";

export function usePraca() {
  const [praca, setPraca] = useState("Sorriso");
  useEffect(() => {
    try { const p = localStorage.getItem(CHAVE); if (p && PRACAS.includes(p)) setPraca(p); } catch {}
    const ouvir = (e: Event) => setPraca((e as CustomEvent<string>).detail);
    addEventListener("agro:praca", ouvir);
    return () => removeEventListener("agro:praca", ouvir);
  }, []);
  const escolher = (p: string) => {
    try { localStorage.setItem(CHAVE, p); } catch {}
    dispatchEvent(new CustomEvent("agro:praca", { detail: p }));
  };
  return [praca, escolher] as const;
}
