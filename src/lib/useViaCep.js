// src/lib/useViaCep.js
import { useRef, useState } from "react";
import { onlyDigits, sanitizeUF } from "./br";

/**
 * Hook para consultar ViaCEP e aplicar dados de endereço.
 * Você decide como aplicar o resultado via callback `applyData(data)`.
 */
export function useViaCep({ ufPadrao = "" } = {}) {
  const abortRef = useRef(null);
  const [state, setState] = useState({
    loading: false,
    error: "",
    found: false,
    lastCep: "",
  });

  async function fetchCEP(cepRaw, applyData) {
    const d = onlyDigits(cepRaw || "");
    if (d.length !== 8) {
      setState({
        loading: false,
        error: d.length > 0 ? "CEP deve ter 8 dígitos." : "",
        found: false,
        lastCep: d,
      });
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ loading: true, error: "", found: false, lastCep: d });
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Erro ao consultar CEP (${res.status})`);
      const data = await res.json();

      if (data?.erro) {
        setState({ loading: false, error: "CEP não encontrado.", found: false, lastCep: d });
        return;
      }

      // Normalização mínima: garantir UF 2 letras
      if (data.uf) data.uf = sanitizeUF(data.uf) || sanitizeUF(ufPadrao);

      // Delega a aplicação do resultado (ex.: setTitular(prev => ({ ... })))
      applyData?.(data);

      setState({ loading: false, error: "", found: true, lastCep: d });
    } catch (err) {
      if (err?.name === "AbortError") return;
      setState({ loading: false, error: "Falha ao consultar CEP. Tente novamente.", found: false, lastCep: d });
    }
  }

  return { state, fetchCEP, setState };
}
