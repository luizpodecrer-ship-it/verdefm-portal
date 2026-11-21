"use client";

/**
 * Movimento do Agro na Verde (pedido do Luiz em 21/11/2026: "paralaxe, rolando, bem suave"):
 *  - rolagem suave e desacelerada ao tocar nos links da página (#seção);
 *  - paralaxe nas fotos e na logo da faixa do programa ([data-paralaxe] = quanto andam, em fração da rolagem);
 *  - seções e cartões (.revela) surgem subindo de leve quando entram na tela, em sequência (--i).
 * Só mexe em transform/opacity (não muda tamanho de nada: sem risco de "tremer" no Safari).
 * Com "reduzir movimento" ligado no aparelho, nada disso acontece.
 */
import { useEffect, useRef } from "react";

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2); // começa e termina devagar

export function AgroMovimento() {
  const marca = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const raiz = marca.current?.closest(".agro") as HTMLElement | null;
    if (!raiz) return;
    const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 0. cabeçalho do Agro preso no topo: depois de descer um pouco, encolhe e ganha sombra */
    let rolou = false;
    const conferirTopo = () => {
      const y = scrollY;
      if (!rolou && y > 120) rolou = true;
      else if (rolou && y < 40) rolou = false;
      else return;
      raiz.classList.toggle("agro-rolou", rolou);
    };
    conferirTopo();
    addEventListener("scroll", conferirTopo, { passive: true });
    // altura do cabeçalho preso (encolhido), para a rolagem parar logo abaixo dele
    const alturaTopo = () => {
      const t = raiz.querySelector<HTMLElement>(".topo");
      return t ? Math.min(t.offsetHeight, innerWidth < 900 ? 120 : 64) : 0;
    };

    /* 1. rolagem suave até a seção */
    let animacao = 0;
    const rolarAte = (alvo: HTMLElement) => {
      const de = scrollY;
      const para = Math.max(0, alvo.getBoundingClientRect().top + scrollY - alturaTopo() - 8);
      const dist = para - de;
      const tempo = Math.min(1400, 650 + Math.abs(dist) * 0.25);
      cancelAnimationFrame(animacao);
      const t0 = performance.now();
      const passo = (agora: number) => {
        const p = Math.min(1, (agora - t0) / tempo);
        scrollTo(0, de + dist * suave(p));
        if (p < 1) animacao = requestAnimationFrame(passo);
        else { alvo.setAttribute("tabindex", "-1"); alvo.focus({ preventScroll: true }); }
      };
      animacao = requestAnimationFrame(passo);
    };
    const aoClicar = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || !raiz.contains(a)) return;
      const alvo = document.getElementById(a.getAttribute("href")!.slice(1));
      if (!alvo) return;
      e.preventDefault();
      if (reduzir) { scrollTo(0, Math.max(0, alvo.getBoundingClientRect().top + scrollY - alturaTopo() - 8)); alvo.setAttribute("tabindex", "-1"); alvo.focus({ preventScroll: true }); return; }
      rolarAte(alvo);
    };
    raiz.addEventListener("click", aoClicar);
    // a pessoa mexeu na rolagem: para a animação na hora
    const parar = () => cancelAnimationFrame(animacao);
    addEventListener("wheel", parar, { passive: true });
    addEventListener("touchstart", parar, { passive: true });

    if (reduzir) {
      return () => { raiz.removeEventListener("click", aoClicar); removeEventListener("wheel", parar); removeEventListener("touchstart", parar); removeEventListener("scroll", conferirTopo); };
    }

    /* 2. seções e cartões que surgem */
    raiz.classList.add("agro-js");
    const observador = new IntersectionObserver((itens) => {
      for (const i of itens) if (i.isIntersecting) { i.target.classList.add("visivel"); observador.unobserve(i.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    raiz.querySelectorAll(".revela").forEach((el) => observador.observe(el));

    /* 3. paralaxe */
    const camadas = Array.from(raiz.querySelectorAll<HTMLElement>("[data-paralaxe]"));
    let pedido = 0;
    const atualizar = () => {
      pedido = 0;
      const meio = innerHeight / 2;
      for (const el of camadas) {
        const caixa = (el.parentElement ?? el).getBoundingClientRect();
        if (caixa.bottom < -200 || caixa.top > innerHeight + 200) continue;
        const v = Number(el.dataset.paralaxe) || 0;
        const foto = el.tagName === "IMG" && v > 0;
        let y = (caixa.top + caixa.height / 2 - meio) * v;
        // a foto é 14% maior que a moldura: nunca anda mais que a sobra (sem borda vazia)
        if (foto) { const sobra = caixa.height * 0.065; y = Math.max(-sobra, Math.min(sobra, y)); }
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)${foto ? " scale(1.14)" : ""}`;
      }
    };
    const aoRolar = () => { if (!pedido) pedido = requestAnimationFrame(atualizar); };
    atualizar();
    addEventListener("scroll", aoRolar, { passive: true });
    addEventListener("resize", aoRolar);

    return () => {
      raiz.removeEventListener("click", aoClicar);
      removeEventListener("wheel", parar); removeEventListener("touchstart", parar);
      removeEventListener("scroll", aoRolar); removeEventListener("resize", aoRolar); removeEventListener("scroll", conferirTopo);
      cancelAnimationFrame(pedido); cancelAnimationFrame(animacao);
      observador.disconnect();
    };
  }, []);
  return <span ref={marca} hidden />;
}
