// src/hooks/useSpeechToText.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getSR() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? { SR, supported: true } : { SR: null, supported: false };
}

/**
 * Hook robusto para ditado (Web Speech API).
 * - Chrome/Edge: ok
 * - Safari/iOS: pode não suportar
 */
export default function useSpeechToText({
  lang = "pt-BR",
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
  autoStopAfterMs = 120000,
} = {}) {
  const { SR, supported } = useMemo(getSR, []);
  const recRef = useRef(null);
  const timerRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch {}
    setListening(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setFinalText("");
    setInterimText("");
    setError("");
  }, []);

  const start = useCallback(() => {
    setError("");

    if (!supported) {
      setError("Ditado por voz não é suportado neste navegador.");
      return;
    }

    const rec = new SR();
    recRef.current = rec;

    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.maxAlternatives = maxAlternatives;

    rec.onstart = () => {
      setListening(true);
      setInterimText("");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => stop(), autoStopAfterMs);
    };

    rec.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = (res?.[0]?.transcript || "").trim();
        if (!text) continue;

        if (res.isFinal) final += (final ? " " : "") + text;
        else interim += (interim ? " " : "") + text;
      }

      if (final) setFinalText((prev) => (prev ? prev + " " : "") + final);
      setInterimText(interim);
    };

    rec.onerror = (e) => {
      const code = e?.error || "erro";
      setError(code);
      stop();
    };

    rec.onend = () => {
      setListening(false);
      setInterimText("");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    try {
      rec.start();
    } catch {
      setError("Não foi possível iniciar o ditado. Tente novamente.");
      stop();
    }
  }, [
    SR,
    supported,
    lang,
    continuous,
    interimResults,
    maxAlternatives,
    autoStopAfterMs,
    stop,
  ]);

  useEffect(() => () => stop(), [stop]);

  return {
    supported,
    listening,
    finalText,
    interimText,
    error,
    start,
    stop,
    reset,
  };
}
