// src/pages/cadastro/StepTitularIntro.jsx
import CTAButton from "@/components/ui/CTAButton";
import { ESTADO_CIVIL_OPTIONS, SEXO_OPTIONS } from "@/lib/constants";

const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm md:text-base font-semibold tracking-tight">
        {children}
      </h2>
      {right}
    </div>
  );
}

/**
 * Etapa 1 – Dados complementares do titular
 * Objetivo: parecer com Login/Registro (shell premium + card interno)
 * e não ser coberto pelo dock fixo (WhatsApp/Ligar).
 */
export default function StepTitularIntro({
  glassCardStyle,
  titular,
  updTit,
  stepAttempted,
  submitAttempted,
  setStepAttempted,
  validateDadosComplementares,
  setCurrentStep,
  ecRef,
  sexoRef,
}) {
  const showErrors = stepAttempted?.complementares || submitAttempted

  return (
    <div className="mt-6">
      {/* CARD PRINCIPAL (igual RegisterPage) */}
      <div
        className="relative overflow-hidden rounded-3xl border shadow-xl p-6 md:p-8"
        style={{
          background:
            'color-mix(in srgb, var(--surface) 88%, var(--text) 6%)',
          borderColor: 'color-mix(in srgb, var(--text) 18%, transparent)',
        }}
      >
        {/* gradiente inferior suave */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              'radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)',
            opacity: 0.6,
          }}
        />

        <fieldset className="relative z-[1] space-y-5">
          {/* Cabeçalho interno */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">
                Etapa 1 de 4 · Titular
              </p>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] md:text-xs"
                style={{
                  background:
                    'color-mix(in srgb, var(--surface-elevated) 90%, transparent)',
                  color: 'var(--text-muted)',
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: 'var(--primary)' }}
                />
                Começando
              </span>
            </div>

            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background:
                  'color-mix(in srgb, var(--surface-elevated) 80%, var(--text) 6%)',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: '25%',
                  background: 'var(--primary)',
                }}
              />
            </div>

            <p className="text-xs md:text-sm text-[var(--text-muted)]">
              Revise os dados do titular exibidos acima e complete as informações abaixo.
            </p>
          </div>

          {/* SUB-CARD DO FORMULÁRIO (igual Register) */}
          <div
            className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 space-y-4"
            style={{
              background:
                'color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)',
              borderColor:
                'color-mix(in srgb, var(--text) 16%, transparent)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado civil */}
              <div>
                <label className="label font-medium text-sm md:text-base">
                  Estado civil <span className="text-red-600">*</span>
                </label>
                <select
                  ref={ecRef}
                  value={titular.estado_civil}
                  onChange={(e) =>
                    updTit({ estado_civil: e.target.value })
                  }
                  className={`input h-12 text-base bg-white ${
                    showErrors && !titular.estado_civil
                      ? 'ring-1 ring-red-500'
                      : ''
                  }`}
                >
                  <option value="">Selecione…</option>
                  {ESTADO_CIVIL_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sexo */}
              <div>
                <label className="label font-medium text-sm md:text-base">
                  Sexo <span className="text-red-600">*</span>
                </label>
                <select
                  ref={sexoRef}
                  value={titular.sexo}
                  onChange={(e) => updTit({ sexo: e.target.value })}
                  className={`input h-12 text-base bg-white ${
                    showErrors && !titular.sexo
                      ? 'ring-1 ring-red-500'
                      : ''
                  }`}
                >
                  <option value="">Selecione…</option>
                  {SEXO_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] md:text-xs text-[var(--text-muted)]">
              Campos com * são obrigatórios.
            </p>
          </div>

          {/* Ação */}
          <div className="flex justify-end pt-2">
            <CTAButton
              className="h-12 px-6 text-[15px] font-semibold"
              onClick={() => {
                setStepAttempted((p) => ({
                  ...p,
                  complementares: true,
                }))
                if (validateDadosComplementares()) {
                  setCurrentStep(2)
                }
              }}
            >
              Continuar
            </CTAButton>
          </div>
        </fieldset>
      </div>
    </div>
  )
}

