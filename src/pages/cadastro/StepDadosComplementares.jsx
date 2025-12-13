// src/pages/cadastro/StepDadosComplementares.jsx
import CTAButton from "@/components/ui/CTAButton";
import { ESTADO_CIVIL_OPTIONS, SEXO_OPTIONS } from "@/lib/constants";

const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base md:text-lg font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

export default function StepDadosComplementares({
  glassCardStyle,
  titular,
  updTit,
  stepAttempted,
  submitAttempted,
  setStepAttempted,
  validateDadosComplementares,
  onBack,
  onNext,
  ecRef,
  sexoRef,
}) {
  const showErrors = stepAttempted?.complementares || submitAttempted;
  const hasBack = typeof onBack === "function";

  return (
    <div className="mt-6">
      {/* Card “premium” com fundo similar ao Login */}
      <div
        className="relative overflow-hidden p-6 md:p-8 rounded-3xl border shadow-xl"
        style={{
          ...(glassCardStyle || {}),
          background:
            "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
          borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
        }}
      >
        {/* halo superior discreto */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)",
            opacity: 0.7,
          }}
        />

        {/* gradiente suave no rodapé do card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              "radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)",
            opacity: 0.55,
          }}
        />

        <div className="relative z-[1] space-y-5">
          <SectionTitle
            right={
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)]">
                Etapa 1 – Informações básicas
              </span>
            }
          >
            Confirme seus dados
          </SectionTitle>

          <p className="text-xs md:text-sm text-[var(--c-muted)]">
            Revise os dados do titular exibidos acima e complete as informações abaixo.
            Elas serão usadas no contrato e nas comunicações da empresa.
          </p>

          {/* “Painel interno” como no Login */}
          <div
            className="rounded-2xl border px-4 py-4 md:px-5 md:py-5"
            style={{
              background:
                "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
              borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
            }}
          >
            <div className="grid gap-3 grid-cols-2 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="label text-xs font-medium" htmlFor="titular-ec">
                  Estado civil {requiredStar}
                </label>
                <select
                  id="titular-ec"
                  ref={ecRef}
                  className={`input h-11 w-full text-sm ${requiredRing(
                    showErrors && isEmpty(titular.estado_civil)
                  )}`}
                  value={titular.estado_civil}
                  onChange={(e) => updTit({ estado_civil: e.target.value })}
                  aria-required="true"
                  aria-invalid={showErrors && isEmpty(titular.estado_civil) ? "true" : "false"}
                >
                  <option value="">Selecione…</option>
                  {ESTADO_CIVIL_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                {showErrors && isEmpty(titular.estado_civil) && (
                  <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                    Selecione o estado civil.
                  </p>
                )}
              </div>

              <div className="md:col-span-6">
                <label className="label text-xs font-medium" htmlFor="titular-sexo">
                  Sexo {requiredStar}
                </label>
                <select
                  id="titular-sexo"
                  ref={sexoRef}
                  className={`input h-11 w-full text-sm ${requiredRing(
                    showErrors && isEmpty(titular.sexo)
                  )}`}
                  value={titular.sexo}
                  onChange={(e) => updTit({ sexo: e.target.value })}
                  aria-required="true"
                  aria-invalid={showErrors && isEmpty(titular.sexo) ? "true" : "false"}
                >
                  <option value="">Selecione…</option>
                  {SEXO_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                {showErrors && isEmpty(titular.sexo) && (
                  <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                    Selecione o sexo.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-1 flex justify-between">
            {hasBack ? (
              <CTAButton type="button" variant="outline" className="h-11 px-5" onClick={onBack}>
                Voltar
              </CTAButton>
            ) : (
              <span />
            )}

            <CTAButton
              type="button"
              className="h-11 px-6"
              onClick={() => {
                setStepAttempted((prev) => ({ ...prev, complementares: true }));
                if (validateDadosComplementares()) onNext?.();
              }}
            >
              Continuar
            </CTAButton>
          </div>
        </div>
      </div>
    </div>
  );
}
