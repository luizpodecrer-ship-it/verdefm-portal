import type { NextConfig } from "next";

/**
 * Portal Verde FM (front-end em Next.js).
 * Por enquanto o site é exportado como páginas prontas (pasta `out/`) e publicado no Netlify.
 * Quando o WordPress (painel da redação) estiver ligado, trocar para renderização com
 * revalidação (ISR) e tirar o `output: "export"`.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
