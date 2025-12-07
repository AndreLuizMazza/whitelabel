import { useState, useCallback } from "react";

const PREFIX = "cadastro-draft:";

// Pequeno helper de parse seguro
function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Hook de draft local (localStorage)
 * Assinatura compatível com o Cadastro.jsx atual.
 */
export function useCadastroDraft(id = "default") {
  const storageKey = `${PREFIX}${id}`;

  const [draft, setDraft] = useState(null);
  const [conflict, setConflict] = useState(null); // reservado para futura sync remota

  const loadDraft = useCallback(() => {
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(storageKey);
    const data = safeParse(raw);

    if (data) {
      setDraft(data);
    }

    return data;
  }, [storageKey]);

  const saveDraft = useCallback(
    (data) => {
      if (typeof window === "undefined") return;
      if (!data) return;

      const enriched = {
        ...data,
        _updatedAt: new Date().toISOString(),
      };

      setDraft(enriched);

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(enriched));
      } catch {
        // se o usuário bloquear storage, apenas ignora
      }
    },
    [storageKey]
  );

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;

    setDraft(null);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Hoje não temos comparação com “remoto”.
  // Mantemos a API para o Cadastro.jsx não quebrar.
  const resolveUseLocal = useCallback(() => {
    setConflict(null);
  }, []);

  const resolveUseRemote = useCallback(() => {
    // Se no futuro você tiver um draft “remoto”, é aqui que
    // você aplicaria a resolução. Por enquanto só limpamos o conflito.
    setConflict(null);
  }, []);

  return {
    draft,
    loadDraft,
    saveDraft,
    clearDraft,
    conflict,
    resolveUseLocal,
    resolveUseRemote,
  };
}
