"use client";

/**
 * Escolhe a "moldura" da página: o portal da Verde (cabeçalho, "Últimas" e rodapé da Verde)
 * ou o Agro na Verde, que é um produto próprio e tem cabeçalho e rodapé dele (aprovado em 21/11/2026).
 * O player da rádio fica fora daqui: vale para os dois e não para ao trocar de página.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const ehAgro = (caminho: string | null) => !!caminho && caminho.startsWith("/agro-na-verde");

/** Mostra o que está dentro só nas páginas do portal da Verde. */
export function SoNoPortal({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const agro = ehAgro(caminho);
  // sem o cabeçalho fixo da Verde, nada fica escondido atrás dele ao pular para uma seção
  useEffect(() => {
    if (agro) document.documentElement.style.setProperty("--vfm-topo-altura", "0px");
  }, [agro]);
  return agro ? null : <>{children}</>;
}
