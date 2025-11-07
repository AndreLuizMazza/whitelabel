// src/hooks/useAvoidOverlap.js
import { useEffect, useState } from "react";

/**
 * Mede dinamicamente a altura total de elementos que devem ser evitados
 * (ex.: barra de cookies) e retorna essa altura para aplicar como offset.
 */
export default function useAvoidOverlap(selectors = "[data-cookie-banner]") {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nodes = Array.from(document.querySelectorAll(selectors));
    if (!nodes.length) {
      setOffset(0);
      return;
    }

    const calc = () => {
      const total = nodes.reduce((sum, el) => {
        const rect = el.getBoundingClientRect();
        // conta só se estiver visível na viewport e na parte inferior
        const visible = rect.height > 0 && rect.bottom > 0;
        return visible ? sum + rect.height : sum;
      }, 0);
      setOffset(total);
    };

    const ro = new ResizeObserver(calc);
    nodes.forEach((n) => ro.observe(n));
    window.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    calc();

    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, [selectors]);

  return offset; // px
}
