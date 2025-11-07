// src/hooks/useAvoidOverlap.js
import { useEffect, useState } from "react";

/**
 * Mede dinamicamente a altura total de elementos fixos a evitar
 * (ex.: banners de cookie) e retorna essa altura (px).
 */
export default function useAvoidOverlap(selectors = "[data-cookie-banner]") {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const q = Array.from(document.querySelectorAll(selectors));
    if (!q.length) {
      setOffset(0);
      return;
    }

    const calc = () => {
      const total = q.reduce((sum, el) => {
        const rect = el.getBoundingClientRect();
        const visible = rect.height > 0 && rect.bottom > 0;
        return visible ? sum + rect.height : sum;
      }, 0);
      setOffset(total);
    };

    const ro = new ResizeObserver(calc);
    q.forEach((n) => ro.observe(n));
    window.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    calc();

    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, [selectors]);

  return offset;
}
