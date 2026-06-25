// src/pages/cadastro/StepTitularIntro.jsx
import Button from "@/components/ui/Button.jsx";
import { ESTADO_CIVIL_OPTIONS, SEXO_OPTIONS } from "@/lib/constants";

export default function StepTitularIntro({
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
  const showErrors = stepAttempted?.complementares || submitAttempted;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label font-medium text-sm" htmlFor="estado-civil">
            Estado civil <span className="text-red-600">*</span>
          </label>
          <select
            id="estado-civil"
            ref={ecRef}
            value={titular.estado_civil}
            onChange={(e) => updTit({ estado_civil: e.target.value })}
            className={`input h-12 text-base mt-1.5 ${
              showErrors && !titular.estado_civil ? "ring-1 ring-red-500" : ""
            }`}
            style={{ background: "var(--surface)", borderColor: "var(--c-border)" }}
          >
            <option value="">Selecione…</option>
            {ESTADO_CIVIL_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label font-medium text-sm" htmlFor="sexo">
            Sexo <span className="text-red-600">*</span>
          </label>
          <select
            id="sexo"
            ref={sexoRef}
            value={titular.sexo}
            onChange={(e) => updTit({ sexo: e.target.value })}
            className={`input h-12 text-base mt-1.5 ${
              showErrors && !titular.sexo ? "ring-1 ring-red-500" : ""
            }`}
            style={{ background: "var(--surface)", borderColor: "var(--c-border)" }}
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

      <div
        className="flex justify-end pt-3 mt-3 sm:pt-5 sm:mt-5 border-t"
        style={{ borderColor: "var(--c-border)" }}
      >
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="min-h-[44px] sm:min-h-[48px] px-6 sm:px-8 rounded-xl md:rounded-full w-full sm:w-auto"
          onClick={() => {
            setStepAttempted((p) => ({ ...p, complementares: true }));
            if (validateDadosComplementares()) setCurrentStep(2);
          }}
        >
          Continuar
        </Button>
      </div>
    </>
  );
}
