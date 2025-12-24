// src/hooks/useSpeechToText.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getSR() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? { SR, supported: true } : { SR: null, supported: false };
}

/**
 * Hook robusto para ditado (Web Speech API), com estabilidade para ritmo variado
 *
 * Melhorias relevantes para seu caso:
 * - expõe lastFinal (apenas o ÚLTIMO trecho final) para evitar reprocessar acumulados
 * - autoRestart opcional: Chrome costuma encerrar após silêncio e “quebrar” frases
 * - controle de intenção: startWantedRef evita restart após stop manual
 */
export default function useSpeechToText({
  lang = "pt-BR",
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
  autoStopAfterMs = 120000,
  autoRestart = true,
  restartDelayMs = 250,
} = {}) {
  const { SR, supported } = useMemo(getSR, []);

  const recRef = useRef(null);
  const timerRef = useRef(null);

  const startingRef = useRef(false);
  const stoppingRef = useRef(false);
  const startWantedRef = useRef(false);
  const lastErrorRef = useRef("");

  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [lastFinal, setLastFinal] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const detachHandlers = useCallback((rec) => {
    if (!rec) return;
    try {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
    } catch {}
  }, []);

  const destroyRecognizer = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    try {
      detachHandlers(rec);
      rec?.abort?.();
    } catch {}
  }, [detachHandlers]);

  const ensureRecognizer = useCallback(() => {
    if (!supported) return null;
    if (recRef.current) return recRef.current;

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.maxAlternatives = maxAlternatives;

    rec.onstart = () => {
      startingRef.current = false;
      stoppingRef.current = false;
      lastErrorRef.current = "";
      setListening(true);
      setInterimText("");
      clearTimer();
      timerRef.current = setTimeout(() => {
        stop();
      }, autoStopAfterMs);
    };

    rec.onresult = (event) => {
      if (stoppingRef.current) return;

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = (res?.[0]?.transcript || "").trim();
        if (!text) continue;

        if (res.isFinal) final += (final ? " " : "") + text;
        else interim += (interim ? " " : "") + text;
      }

      if (final) {
        setFinalText((prev) => (prev ? prev + " " : "") + final);
        setLastFinal(final);
      }
      setInterimText(interim);
    };

    rec.onerror = (e) => {
      const code = e?.error || "erro";
      lastErrorRef.current = code;
      setError(code);

      stoppingRef.current = true;
      clearTimer();

      try {
        rec?.abort?.();
      } catch {}

      setListening(false);
      setInterimText("");

      // força recriação na próxima tentativa
      destroyRecognizer();

      stoppingRef.current = false;
      startingRef.current = false;
      startWantedRef.current = false;
    };

    rec.onend = () => {
      setListening(false);
      setInterimText("");
      clearTimer();
      startingRef.current = false;
      stoppingRef.current = false;

      // Auto-restart se o usuário ainda “quer” ditado e não houve erro
      if (
        autoRestart &&
        startWantedRef.current &&
        !lastErrorRef.current &&
        supported
      ) {
        setTimeout(() => {
          const r = ensureRecognizer();
          try {
            r?.start?.();
          } catch {}
        }, restartDelayMs);
      }
    };

    recRef.current = rec;
    return rec;
  }, [
    SR,
    supported,
    lang,
    continuous,
    interimResults,
    maxAlternatives,
    autoStopAfterMs,
    autoRestart,
    restartDelayMs,
    clearTimer,
    destroyRecognizer,
  ]);

  const stop = useCallback(() => {
    startWantedRef.current = false;

    if (!recRef.current) {
      setListening(false);
      setInterimText("");
      clearTimer();
      return;
    }

    stoppingRef.current = true;
    clearTimer();

    const rec = recRef.current;
    try {
      rec.stop();
    } catch {
      try {
        rec.abort();
      } catch {}
      destroyRecognizer();
    }

    setListening(false);
    setInterimText("");
    stoppingRef.current = false;
  }, [clearTimer, destroyRecognizer]);

  const reset = useCallback(() => {
    setFinalText("");
    setLastFinal("");
    setInterimText("");
    setError("");
    lastErrorRef.current = "";
  }, []);

  const consumeLastFinal = useCallback(() => {
    const v = lastFinal;
    if (v) setLastFinal("");
    return v;
  }, [lastFinal]);

  const start = useCallback(() => {
    setError("");
    lastErrorRef.current = "";

    if (!supported) {
      setError("not-supported");
      return;
    }
    if (startingRef.current) return;

    const rec = ensureRecognizer();
    if (!rec) return;

    if (listening) return;

    startingRef.current = true;
    startWantedRef.current = true;

    try {
      rec.start();
    } catch {
      // InvalidStateError (start rápido)
      try {
        rec.abort();
      } catch {}
      destroyRecognizer();

      try {
        const rec2 = ensureRecognizer();
        rec2?.start?.();
      } catch {
        setError("start-failed");
        startWantedRef.current = false;
      } finally {
        startingRef.current = false;
      }
    }
  }, [supported, ensureRecognizer, destroyRecognizer, listening]);

  useEffect(() => {
    return () => {
      clearTimer();
      try {
        recRef.current?.abort?.();
      } catch {}
      destroyRecognizer();
    };
  }, [clearTimer, destroyRecognizer]);

  return {
    supported,
    listening,
    finalText,
    lastFinal,
    interimText,
    error,
    start,
    stop,
    reset,
    consumeLastFinal,
  };
}
