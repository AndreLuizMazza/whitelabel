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
    <div className="mt-6 rounded-3xl p-6 md:p-7 space-y-4" style={glassCardStyle}>
      <SectionTitle
        right={
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)]">
            Etapa 1 – Informações básicas
          </span>
        }
      >
        Dados do titular e complementares
      </SectionTitle>

      <p className="text-xs md:text-sm text-[var(--c-muted)]">
        Escolha o <strong>estado civil</strong> e o <strong>sexo</strong>. Essas informações ajudam
        a personalizar o atendimento e os documentos do plano.
      </p>

      <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-12">
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

      <div className="mt-5 flex justify-between">
        {hasBack ? (
          <CTAButton
            type="button"
            variant="outline"
            className="h-11 px-5"
            onClick={onBack}
          >
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
            if (validateDadosComplementares()) {
              onNext?.();
            }
          }}
        >
          Continuar
        </CTAButton>
      </div>
    </div>
  );
}
