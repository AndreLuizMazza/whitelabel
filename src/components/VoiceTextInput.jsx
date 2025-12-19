// src/components/VoiceTextInput.jsx
import { useEffect, useMemo, useState } from "react";
import { Mic, Square, Info } from "lucide-react";
import useSpeechToText from "@/hooks/useSpeechToText";

/**
 * VoiceTextInput
 * - Input com botão de microfone (Web Speech API)
 * - Aplica texto FINAL ao campo (delta), e então reseta buffers do hook.
 *
 * UX:
 * - Quando ouvindo: mostra badge “Ouvindo” + instrução de como finalizar.
 * - Quando não ouvindo: mostra dica curta ao focar (opcional).
 *
 * Prioridade de atualização:
 * 1) onChangeValue(nextValue)
 * 2) onChange({ target: { name, value: nextValue } })
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
  applyMode = "append", // append | replace
  normalizeTranscript,
  showPreview = true,
  autoStopOnBlur = true,

  // UX opcional
  showIdleHintOnFocus = true,
  idleHint = "Toque no microfone e dite para preencher.",
  listeningHint = "Para finalizar, faça uma pausa curta ou toque no ■.",
}) {
  const stt = useSpeechToText({
    lang,
    continuous: true,
    interimResults: true,
    autoResume: true, // importante para ritmo/pausas
  });

  const [focused, setFocused] = useState(false);

  // aplica SOMENTE quando chegar um "final" (delta)
  useEffect(() => {
    if (!stt.finalText) return;

    const raw = String(stt.finalText || "").trim();
    const normalized = normalizeTranscript ? normalizeTranscript(raw) : raw;

    const base = String(value || "").trim();
    const next =
      applyMode === "replace"
        ? normalized
        : [base, normalized].filter(Boolean).join(" ").trim();

    if (typeof onChangeValue === "function") {
      onChangeValue(next);
    } else if (typeof onChange === "function") {
      onChange({ target: { name, value: next, type: "text" } });
    }

    // limpa buffers para não reaplicar
    stt.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.finalText]);

  // para automaticamente ao sair do campo (UX melhor)
  useEffect(() => {
    if (!autoStopOnBlur) return;
    const el = inputRef?.current;
    if (!el) return;

    const onBlurLocal = () => {
      if (stt.listening) stt.stop();
      setFocused(false);
    };
    const onFocusLocal = () => setFocused(true);

    el.addEventListener("blur", onBlurLocal);
    el.addEventListener("focus", onFocusLocal);
    return () => {
      el.removeEventListener("blur", onBlurLocal);
      el.removeEventListener("focus", onFocusLocal);
    };
  }, [autoStopOnBlur, inputRef, stt.listening, stt.stop]);

  const preview = useMemo(() => {
    if (!stt.listening) return "";
    if (!stt.interimText) return "Ouvindo…";
    const raw = String(stt.interimText || "").trim();
    const normalized = normalizeTranscript ? normalizeTranscript(raw) : raw;
    return normalized ? `Ouvindo… ${normalized}` : "Ouvindo…";
  }, [stt.listening, stt.interimText, normalizeTranscript]);

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
      : stt.error === "not-supported"
      ? "Ditado por voz indisponível neste navegador"
      : "Falha no ditado por voz"
    : "";

  const showStateLine =
    enableVoice &&
    showPreview &&
    (stt.listening || stt.error || (focused && showIdleHintOnFocus));

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
                : "Iniciar ditado"
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

      {showStateLine && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] md:text-xs">
          {/* Linha principal (ouvindo / idle) */}
          {!stt.error && (
            <>
              {stt.listening ? (
                <>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--primary) 45%, transparent)",
                      background:
                        "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--text)",
                    }}
                    aria-live="polite"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                    <span className="font-medium">Ouvindo</span>
                  </span>

                  <span style={{ color: "var(--text-muted)" }}>
                    {preview}
                  </span>

                  <span
                    className="inline-flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Info size={12} />
                    {listeningHint}
                  </span>
                </>
              ) : (
                focused &&
                showIdleHintOnFocus && (
                  <span style={{ color: "var(--text-muted)" }}>
                    {idleHint}
                  </span>
                )
              )}
            </>
          )}

          {/* Erros (se existirem) */}
          {helperText && <span className="text-red-600">{helperText}</span>}
        </div>
      )}
    </div>
  );
}
