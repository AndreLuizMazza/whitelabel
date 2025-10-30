// src/lib/hooks.js
import { useRef } from "react";

/** Debounce estável para callbacks de UI/efeitos */
export function useDebouncedCallback(fn, delay = 400) {
  const t = useRef();
  return (...args) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  };
}
