// src/pages/cadastro/CadastroStepShell.jsx
import { CheckCircle2 } from "lucide-react";

export function CadastroStepper({ steps, currentStep, currentIndex, onStep, disabled, compact = false }) {
  const trackOff = "var(--c-border)";
  const trackOn = "var(--primary)";

  return (
    <div
      className={`rounded-xl md:rounded-2xl border flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 ${
        compact ? "px-2 py-1.5 md:px-3 md:py-2.5" : "px-3 py-2.5"
      }`}
      style={{
        background: "var(--surface)",
        borderColor: "var(--c-border)",
        boxShadow: "0 1px 3px color-mix(in srgb, var(--text) 8%, transparent)",
      }}
      role="navigation"
      aria-label="Etapas do cadastro"
    >
      {steps.map((step, idx) => {
        const active = currentStep === step.id;
        const done = idx < currentIndex;
        const locked = disabled || idx > currentIndex;

        return (
          <span key={step.id} className="contents">
            {idx > 0 && (
              <span
                aria-hidden="true"
                className="h-0.5 w-6 sm:w-10 md:w-14 rounded-full"
                style={{ background: idx <= currentIndex ? trackOn : trackOff, opacity: idx <= currentIndex ? 1 : 0.6 }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (locked) return;
                onStep?.(step.id);
              }}
              disabled={locked}
              className={`rounded-full border inline-flex items-center justify-center font-semibold transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                compact ? "h-9 w-9 md:h-11 md:w-11 text-sm" : "h-10 w-10 md:h-11 md:w-11"
              }`}
              style={{
                background: active || done ? "var(--primary)" : "var(--surface-alt, var(--surface))",
                borderColor: active || done ? "transparent" : "var(--c-border)",
                color: active || done ? "var(--on-primary, #fff)" : "var(--text-muted)",
                boxShadow: active ? "0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)" : "none",
                transform: active ? "scale(1.05)" : "scale(1)",
              }}
              aria-current={active ? "step" : undefined}
              aria-label={`Etapa ${idx + 1}: ${step.label}`}
              title={step.label}
            >
              {done ? <CheckCircle2 size={16} strokeWidth={2.5} /> : idx + 1}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export default function CadastroStepShell({ title, subtitle, plain, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl md:rounded-3xl border shadow-sm ${className}`.trim()}
      style={{
        background: "var(--surface)",
        borderColor: "var(--c-border)",
      }}
    >
      <div className="p-3 sm:p-4 md:p-7">
        {(title || subtitle) && (
          <header className="mb-3 md:mb-6">
            {title && (
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-[var(--text)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="mt-1 text-xs sm:text-sm leading-snug sm:leading-relaxed hidden sm:block"
                style={{ color: "var(--text-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </header>
        )}

        {plain ? (
          children
        ) : (
          <div
            className="rounded-xl md:rounded-2xl border px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5"
            style={{
              background: "var(--surface-alt, color-mix(in srgb, var(--primary) 4%, var(--surface)))",
              borderColor: "var(--c-border)",
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
