// src/hooks/useSpeechToText.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getSR() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? { SR, supported: true } : { SR: null, supported: false };
}

/**
 * Hook robusto para ditado (Web Speech API), com UX estável.
 *
 * Melhorias principais nesta versão:
 * - `finalText` agora representa APENAS o último trecho final (delta) capturado.
 *   Isso evita “reaplicar” tudo quando o componente consumidor chama reset().
 * - Auto-resume: alguns navegadores encerram o reconhecimento após pausas.
 *   Quando `shouldBeListening=true` e não foi stop manual, reinicia automaticamente.
 * - Backoff leve e limite de tentativas para evitar loops em erro.
 * - Proteções extras para InvalidStateError e timing.
 */
export default function useSpeechToText({
  lang = "pt-BR",
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
  autoStopAfterMs = 120000, // 2 min
  autoResume = true,
  autoResumeDelayMs = 250,
  maxAutoResumeTries = 8,
} = {}) {
  const { SR, supported } = useMemo(getSR, []);

  const recRef = useRef(null);
  const timerRef = useRef(null);

  // flags de controle para evitar eventos bagunçando a UI
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);

  // intenção do usuário (o que ele quer, mesmo se o browser “cair” sozinho)
  const shouldBeListeningRef = useRef(false);

  // controle de auto-resume
  const resumeTryRef = useRef(0);
  const resumeTimerRef = useRef(null);

  const [listening, setListening] = useState(false);

  // IMPORTANTES:
  // - finalText: somente o último trecho FINAL (delta)
  // - interimText: preview parcial
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
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

  const scheduleAutoResume = useCallback(() => {
    if (!autoResume) return;
    if (!supported) return;

    if (!shouldBeListeningRef.current) return;
    if (stoppingRef.current) return;

    // evita loop infinito
    if (resumeTryRef.current >= maxAutoResumeTries) return;

    clearResumeTimer();
    const tryIndex = resumeTryRef.current;

    resumeTimerRef.current = setTimeout(() => {
      // ainda quer ouvir?
      if (!shouldBeListeningRef.current) return;
      if (stoppingRef.current) return;

      // backoff leve (250ms, 350ms, 450ms…)
      const backoff = autoResumeDelayMs + tryIndex * 100;

      resumeTryRef.current += 1;
      try {
        recRef.current?.start?.();
      } catch {
        // se falhar, agenda uma nova tentativa com backoff
        clearResumeTimer();
        resumeTimerRef.current = setTimeout(() => {
          scheduleAutoResume();
        }, backoff);
      }
    }, autoResumeDelayMs);
  }, [
    autoResume,
    supported,
    maxAutoResumeTries,
    autoResumeDelayMs,
    clearResumeTimer,
  ]);

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

      setListening(true);
      setInterimText("");
      setError("");

      // reset de auto-resume ao iniciar “de verdade”
      resumeTryRef.current = 0;
      clearResumeTimer();

      clearTimer();
      timerRef.current = setTimeout(() => {
        stop();
      }, autoStopAfterMs);
    };

    rec.onresult = (event) => {
      // alguns browsers disparam onresult durante stop; ignorar nesses casos
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

      // finalText = somente delta final (último trecho)
      if (final) {
        setFinalText(final);
      }
      setInterimText(interim);
    };

    rec.onerror = (e) => {
      const code = e?.error || "erro";
      setError(code);

      // Em erro, browsers podem ficar instáveis.
      // Encerra e força recriação.
      stoppingRef.current = true;
      shouldBeListeningRef.current = false;

      clearTimer();
      clearResumeTimer();

      try {
        rec?.abort?.();
      } catch {}

      setListening(false);
      setInterimText("");

      destroyRecognizer();

      stoppingRef.current = false;
      startingRef.current = false;
      resumeTryRef.current = 0;
    };

    rec.onend = () => {
      setListening(false);
      setInterimText("");
      clearTimer();

      startingRef.current = false;
      stoppingRef.current = false;

      // Se o usuário queria continuar (não foi stop manual),
      // reinicia automaticamente para lidar com pausas/ritmo.
      if (shouldBeListeningRef.current) {
        scheduleAutoResume();
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
    clearTimer,
    clearResumeTimer,
    destroyRecognizer,
    scheduleAutoResume,
  ]);

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;

    if (!recRef.current) {
      setListening(false);
      setInterimText("");
      clearTimer();
      clearResumeTimer();
      return;
    }

    stoppingRef.current = true;
    clearTimer();
    clearResumeTimer();

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
  }, [clearTimer, clearResumeTimer, destroyRecognizer]);

  const reset = useCallback(() => {
    // Reseta buffers de exibição (não interfere com sessão ativa).
    setFinalText("");
    setInterimText("");
    setError("");
  }, []);

  const start = useCallback(() => {
    setError("");

    if (!supported) {
      setError("not-supported");
      return;
    }
    if (startingRef.current) return;

    const rec = ensureRecognizer();
    if (!rec) return;

    // Se já está ouvindo, não reinicia
    if (listening) {
      shouldBeListeningRef.current = true;
      return;
    }

    shouldBeListeningRef.current = true;
    startingRef.current = true;
    resumeTryRef.current = 0;

    try {
      rec.start();
    } catch {
      // InvalidStateError (start rápido demais) -> recria e tenta uma vez
      try {
        rec.abort();
      } catch {}
      destroyRecognizer();

      try {
        const rec2 = ensureRecognizer();
        rec2?.start?.();
      } catch {
        setError("start-failed");
        shouldBeListeningRef.current = false;
      } finally {
        startingRef.current = false;
      }
    }
  }, [supported, ensureRecognizer, destroyRecognizer, listening]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearResumeTimer();
      try {
        recRef.current?.abort?.();
      } catch {}
      destroyRecognizer();
    };
  }, [clearTimer, clearResumeTimer, destroyRecognizer]);

  return {
    supported,
    listening,
    finalText,   // último trecho FINAL (delta)
    interimText, // preview
    error,
    start,
    stop,
    reset,
  };
}
