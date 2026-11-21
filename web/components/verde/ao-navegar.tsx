"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Ao trocar de página: leva o foco para o conteúdo (leitor de tela começa do início), sem contorno na tela. */
export function AoNavegar() {
  const caminho = usePathname();
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    document.getElementById("vfm-conteudo")?.focus({ preventScroll: true });
  }, [caminho]);
  return null;
}
