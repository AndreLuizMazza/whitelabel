// src/lib/useDebouncedCallback.js
import { useRef } from "react";
export default function useDebouncedCallback(fn, delay=400){
  const t = useRef();
  return (...args)=>{
    if(t.current) clearTimeout(t.current);
    t.current = setTimeout(()=>fn(...args), delay);
  };
}
