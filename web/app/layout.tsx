import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Provedores } from "@/components/verde/provedores";
import { Cabecalho } from "@/components/verde/cabecalho";
import { BarraPlayer, Rodape } from "@/components/verde/rodape";
import { AoNavegar } from "@/components/verde/ao-navegar";
import { HOME, ENDERECO } from "@/lib/conteudo";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["700"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(ENDERECO),
  title: { default: "Verde FM · Notícias de Cuiabá, Jaciara, Campo Verde e região", template: "%s · Verde FM" },
  description: "Notícias de Mato Grosso e a Verde FM ao vivo em Cuiabá, Campo Verde e Jaciara.",
  icons: { icon: "/favicon.ico" },
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1512" },
  ],
};

/** Estrutura de todas as páginas. Só o <main> troca ao navegar: a rádio, o cabeçalho e o rodapé ficam. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body>
        <Provedores>
          <a className="vfm-pular" href="#vfm-conteudo">Pular para o conteúdo</a>
          <Cabecalho ultimas={HOME.ultimas} />
          <main id="vfm-conteudo" tabIndex={-1}>{children}</main>
          <Rodape />
          <BarraPlayer />
          <AoNavegar />
        </Provedores>
      </body>
    </html>
  );
}
