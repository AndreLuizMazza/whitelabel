// src/components/VoiceTextInput.jsx
import { useEffect, useMemo, useRef } from "react";
import { Mic, Square } from "lucide-react";
import useSpeechToText from "@/hooks/useSpeechToText";

/**
 * VoiceTextInput
 * - Aplica apenas o ÚLTIMO trecho final (lastFinal) para evitar reprocessar acumulado
 * - Modo "email": merge incremental e permite estado parcial durante ditado (mantém @)
 */
export default function VoiceTextInput({
  id,
  name,
  inputRef,
  value,
  onChange,
  onPaste,
  onChangeValue,
  placeholder,
  autoComplete,
  inputMode,
  type = "text",
  disabled = false,
  className = "",
  invalid = false,
  ariaRequired,
  ariaInvalid,
  ariaDescribedBy,

  enableVoice = true,
  lang = "pt-BR",

  // append | replace | email
  applyMode = "append",

  // normalizeTranscript pode ser (text, ctx) => string
  // ctx = { mode: "final" | "interim", fieldType: "email" | "text" }
  normalizeTranscript,

  showPreview = true,
  autoStopOnBlur = true,

  // UX
  listeningHint = "Toque no quadrado para concluir",
  idleHint = "Toque no microfone para ditar",
}) {
  const stt = useSpeechToText({
    lang,
    continuous: true,
    interimResults: true,
    autoRestart: true,
    restartDelayMs: 220,
  });

  const appliedOnceRef = useRef(false);

  function normalize(text, ctx) {
    const raw = String(text || "");
    if (typeof normalizeTranscript === "function") {
      return String(normalizeTranscript(raw, ctx) || "");
    }
    return raw;
  }

  function mergeValue(base, chunk) {
    const b = String(base || "");
    const c = String(chunk || "");

    if (!c.trim()) return b;

    if (applyMode === "replace") return c.trim();

    if (applyMode === "email") {
      // Email é incremental e sem espaços
      const b0 = b.replace(/\s+/g, "");
      let c0 = c.replace(/\s+/g, "");

      // Se o trecho vier começando com @, anexa direto
      if (c0.startsWith("@")) return (b0 + c0).replace(/@{2,}/g, "@");

      // Se base termina com @, anexa sem nada
      if (b0.endsWith("@")) return (b0 + c0).replace(/@{2,}/g, "@");

      // Se chunk contém @ e base já tem @, prioriza base e remove @ extra do chunk
      if (b0.includes("@") && c0.includes("@")) {
        c0 = c0.replace(/@+/g, "");
        return (b0 + c0).replace(/@{2,}/g, "@");
      }

      // Se chunk tem @ e base não tem, cola direto
      if (!b0.includes("@") && c0.includes("@")) return (b0 + c0).replace(/@{2,}/g, "@");

      // Se base já tem @, só anexa domínio/continuação
      if (b0.includes("@") && !c0.includes("@")) return b0 + c0;

      // Caso geral: anexa
      return b0 + c0;
    }

    // append normal com espaço
    const bTrim = b.trim();
    const cTrim = c.trim();
    return [bTrim, cTrim].filter(Boolean).join(" ").trim();
  }

  // aplica SOMENTE quando chegar um "lastFinal"
  useEffect(() => {
    const last = stt.consumeLastFinal?.();
    if (!last) return;

    const base = String(value || "");

    // normaliza trecho final (permitindo estado parcial no email)
    const chunk = normalize(last, {
      mode: "final",
      fieldType: applyMode === "email" ? "email" : "text",
    });

    // normaliza base também no caso de email (para não carregar sujeira)
    const baseNormalized =
      applyMode === "email"
        ? normalize(base, { mode: "final", fieldType: "email" })
        : base;

    const next = mergeValue(baseNormalized, chunk);

    if (typeof onChangeValue === "function") {
      onChangeValue(next);
    } else if (typeof onChange === "function") {
      onChange({ target: { name, value: next, type: "text" } });
    }

    appliedOnceRef.current = true;
    // não chamar stt.reset aqui (isso zera buffers e atrapalha sensação de continuidade)
    // lastFinal já foi consumido e limpo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.lastFinal]);

  // para automaticamente ao sair do campo
  useEffect(() => {
    if (!autoStopOnBlur) return;
    const el = inputRef?.current;
    if (!el) return;

    const onBlurLocal = () => {
      if (stt.listening) stt.stop();
    };

    el.addEventListener("blur", onBlurLocal);
    return () => el.removeEventListener("blur", onBlurLocal);
  }, [autoStopOnBlur, inputRef, stt.listening, stt.stop]);

  const preview = useMemo(() => {
    if (!stt.listening) return "";
    const raw = String(stt.interimText || "").trim();
    if (!raw) return "Ouvindo";
    const normalized = normalize(raw, {
      mode: "interim",
      fieldType: applyMode === "email" ? "email" : "text",
    });
    return normalized ? `Ouvindo ${normalized}` : "Ouvindo";
  }, [stt.listening, stt.interimText, applyMode]); // eslint-disable-line

  const micDisabled = disabled || !enableVoice || !stt.supported;

  const micStyle = stt.listening
    ? {
        background: "color-mix(in srgb, var(--primary) 18%, transparent)",
        borderColor: "color-mix(in srgb, var(--primary) 45%, transparent)",
        color: "var(--primary)",
      }
    : {
        background: "color-mix(in srgb, var(--surface) 85%, transparent)",
        borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
        color: "var(--text-muted)",
      };

  const helperText = stt.error
    ? stt.error === "not-allowed"
      ? "Permissão do microfone negada"
      : stt.error === "no-speech"
      ? "Não detectei fala"
      : stt.error === "audio-capture"
      ? "Microfone indisponível"
      : stt.error === "network"
      ? "Falha de rede no reconhecimento"
      : "Falha no ditado por voz"
    : "";

  // microcopy de UX (sem ponto final no texto)
  const uxHint = stt.listening ? listeningHint : idleHint;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name={name}
          ref={inputRef}
          value={value}
          onChange={onChange}
          onPaste={onPaste}
          type={type}
          className={`${className} ${invalid ? "ring-1 ring-red-500" : ""} ${
            enableVoice ? "pr-14" : ""
          }`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-required={ariaRequired}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
        />

        {enableVoice && (
          <button
            type="button"
            onClick={() => (stt.listening ? stt.stop() : stt.start())}
            disabled={micDisabled}
            className="absolute inset-y-0 right-2 my-2 w-10 rounded-xl border inline-flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label={
              !stt.supported
                ? "Ditado por voz indisponível"
                : stt.listening
                ? "Parar ditado"
                : "Falar"
            }
            aria-pressed={stt.listening}
            title={
              !stt.supported
                ? "Seu navegador não suporta ditado por voz"
                : stt.listening
                ? "Parar"
                : "Falar"
            }
            style={micStyle}
          >
            {stt.listening ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>

      {(enableVoice && showPreview && (stt.listening || stt.error)) && (
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[11px] md:text-xs">
            {stt.listening && (
              <span style={{ color: "var(--text-muted)" }}>{preview}</span>
            )}
            {helperText && <span className="text-red-600">{helperText}</span>}
          </div>

          {enableVoice && (
            <div
              className="inline-flex items-center gap-2 text-[11px] md:text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border"
                style={{
                  borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                  background:
                    "color-mix(in srgb, var(--surface-elevated) 88%, transparent)",
                }}
              >
                {uxHint}
              </span>

              {applyMode === "email" && stt.listening && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--primary) 30%, transparent)",
                    background:
                      "color-mix(in srgb, var(--primary) 10%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  Dica diga arroba e ponto
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
