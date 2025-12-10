// src/pages/cadastro/StepEndereco.jsx
import CTAButton from "@/components/ui/CTAButton";
import { onlyDigits, formatCEP, maskCEP, sanitizeUF } from "@/lib/br";

const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base md:text-lg font-semibold tracking-tight">
        {children}
      </h2>
      {right}
    </div>
  );
}

export default function StepEndereco({
  glassCardStyle,
  titular,
  updTitEndereco,
  addressTouched,
  setAddrTouched,
  cepState,
  onCepChange,
  onCepBlur,
  stepAttempted,
  submitAttempted,
  setStepAttempted,
  validateEndereco,
  setCurrentStep,
  cepRef,
  logRef,
  numRef,
  bairroRef,
  cidadeRef,
  ufRef,
  UF_PADRAO,
}) {
  const showErrors = stepAttempted?.endereco || submitAttempted;
  const cepDigits = onlyDigits(titular.endereco.cep || "");

  return (
    <div
      className="mt-6 rounded-3xl p-6 md:p-7 space-y-4"
      style={glassCardStyle}
    >
      <SectionTitle
        right={
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)]">
            Etapa 2 de 5
          </span>
        }
      >
        Endereço
      </SectionTitle>

      <div className="mt-3 space-y-3">
        {/* CEP */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="label text-xs font-medium" htmlFor="end-cep">
              CEP {requiredStar}
            </label>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)] hover:opacity-80 disabled:opacity-40"
              onClick={() => onCepBlur(titular.endereco.cep)}
              disabled={cepState.loading || cepDigits.length !== 8}
              aria-label="Buscar endereço pelo CEP"
            >
              {cepState.loading ? "Buscando…" : "Buscar CEP"}
            </button>
          </div>
          <input
            id="end-cep"
            ref={cepRef}
            className={`input h-11 text-sm ${
              requiredRing(showErrors && cepDigits.length !== 8) ||
              (cepState.error ? " ring-1 ring-red-500" : "")
            }`}
            inputMode="numeric"
            maxLength={9}
            value={formatCEP(titular.endereco.cep)}
            onChange={(e) => {
              const v = maskCEP(e.target.value);
              onCepChange(v);
            }}
            onBlur={(e) => onCepBlur(e.target.value)}
            placeholder="00000-000"
            autoComplete="postal-code"
            aria-required="true"
            aria-invalid={
              (showErrors && cepDigits.length !== 8) || !!cepState.error
                ? "true"
                : "false"
            }
            aria-describedby={cepState.error ? "cep-error" : undefined}
          />
          {showErrors && cepDigits.length !== 8 && !cepState.error && (
            <p
              className="text-xs text-red-600 mt-1"
              role="alert"
              aria-live="polite"
            >
              CEP deve ter 8 dígitos.
            </p>
          )}
          {cepState.error && (
            <p
              id="cep-error"
              className="text-xs text-red-600 mt-1"
              role="alert"
              aria-live="polite"
            >
              {cepState.error}
            </p>
          )}
          {!cepState.error && cepState.found && (
            <p className="text-xs text-green-700 mt-1" aria-live="polite">
              Endereço preenchido pelo CEP.
            </p>
          )}
        </div>

        {/* Logradouro + número */}
        <div className="grid gap-3 grid-cols-[minmax(0,2.2fr),minmax(0,1fr)] md:grid-cols-[minmax(0,3fr),minmax(0,1fr)]">
          <div>
            <label className="label text-xs font-medium" htmlFor="end-log">
              Logradouro {requiredStar}
            </label>
            <input
              id="end-log"
              ref={logRef}
              className={`input h-11 text-sm ${requiredRing(
                showErrors && isEmpty(titular.endereco.logradouro)
              )}`}
              value={titular.endereco.logradouro}
              onChange={(e) => {
                setAddrTouched({ logradouro: true });
                updTitEndereco({ logradouro: e.target.value });
              }}
              autoComplete="address-line1"
              aria-required="true"
              aria-invalid={
                showErrors && isEmpty(titular.endereco.logradouro)
                  ? "true"
                  : "false"
              }
              disabled={cepState.loading}
            />
            {showErrors && isEmpty(titular.endereco.logradouro) && (
              <p
                className="text-xs text-red-600 mt-1"
                role="alert"
                aria-live="polite"
              >
                Informe o logradouro.
              </p>
            )}
          </div>
          <div>
            <label className="label text-xs font-medium" htmlFor="end-num">
              Número {requiredStar}
            </label>
            <input
              id="end-num"
              ref={numRef}
              className={`input h-11 text-sm ${requiredRing(
                showErrors && isEmpty(titular.endereco.numero)
              )}`}
              value={titular.endereco.numero}
              onChange={(e) => updTitEndereco({ numero: e.target.value })}
              autoComplete="address-line2"
              aria-required="true"
              aria-invalid={
                showErrors && isEmpty(titular.endereco.numero) ? "true" : "false"
              }
              disabled={cepState.loading}
            />
            {showErrors && isEmpty(titular.endereco.numero) && (
              <p
                className="text-xs text-red-600 mt-1"
                role="alert"
                aria-live="polite"
              >
                Informe o número.
              </p>
            )}
          </div>
        </div>

        {/* Complemento */}
        <div>
          <label className="label text-xs font-medium" htmlFor="end-comp">
            Complemento
          </label>
          <input
            id="end-comp"
            className="input h-11 text-sm"
            value={titular.endereco.complemento}
            onChange={(e) => updTitEndereco({ complemento: e.target.value })}
            disabled={cepState.loading}
          />
        </div>

        {/* Bairro */}
        <div>
          <label className="label text-xs font-medium" htmlFor="end-bairro">
            Bairro {requiredStar}
          </label>
          <input
            id="end-bairro"
            ref={bairroRef}
            className={`input h-11 text-sm ${requiredRing(
              showErrors && isEmpty(titular.endereco.bairro)
            )}`}
            value={titular.endereco.bairro}
            onChange={(e) => {
              setAddrTouched({ bairro: true });
              updTitEndereco({ bairro: e.target.value });
            }}
            aria-required="true"
            aria-invalid={
              showErrors && isEmpty(titular.endereco.bairro) ? "true" : "false"
            }
            disabled={cepState.loading}
          />
          {showErrors && isEmpty(titular.endereco.bairro) && (
            <p
              className="text-xs text-red-600 mt-1"
              role="alert"
              aria-live="polite"
            >
              Informe o bairro.
            </p>
          )}
        </div>

        {/* Cidade + UF */}
        <div className="grid gap-3 grid-cols-[minmax(0,3fr),80px] md:grid-cols-[minmax(0,3fr),120px]">
          <div>
            <label className="label text-xs font-medium" htmlFor="end-cidade">
              Cidade {requiredStar}
            </label>
            <input
              id="end-cidade"
              ref={cidadeRef}
              className={`input h-11 text-sm ${requiredRing(
                showErrors && isEmpty(titular.endereco.cidade)
              )}`}
              value={titular.endereco.cidade}
              onChange={(e) => {
                setAddrTouched({ cidade: true });
                const cidade = e.target.value;
                const uf = titular.endereco.uf || UF_PADRAO || "";
                updTitEndereco({ cidade, uf });
              }}
              autoComplete="address-level2"
              aria-required="true"
              aria-invalid={
                showErrors && isEmpty(titular.endereco.cidade)
                  ? "true"
                  : "false"
              }
              disabled={cepState.loading}
            />
            {showErrors && isEmpty(titular.endereco.cidade) && (
              <p
                className="text-xs text-red-600 mt-1"
                role="alert"
                aria-live="polite"
              >
                Informe a cidade.
              </p>
            )}
          </div>
          <div>
            <label className="label text-xs font-medium" htmlFor="end-uf">
              UF {requiredStar}
            </label>
            <input
              id="end-uf"
              ref={ufRef}
              className={`input h-11 text-sm ${requiredRing(
                showErrors && isEmpty(titular.endereco.uf)
              )}`}
              value={titular.endereco.uf}
              onChange={(e) => {
                setAddrTouched({ uf: true });
                const v = sanitizeUF(e.target.value);
                updTitEndereco({ uf: v });
              }}
              maxLength={2}
              autoComplete="address-level1"
              aria-required="true"
              aria-invalid={
                showErrors && isEmpty(titular.endereco.uf) ? "true" : "false"
              }
              disabled={cepState.loading}
            />
            {showErrors && isEmpty(titular.endereco.uf) && (
              <p
                className="text-xs text-red-600 mt-1"
                role="alert"
                aria-live="polite"
              >
                Informe a UF.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-between gap-3">
        <CTAButton
          type="button"
          variant="outline"
          className="h-11 px-5"
          onClick={() => setCurrentStep(1)}
        >
          Voltar
        </CTAButton>
        <CTAButton
          type="button"
          className="h-11 px-6"
          onClick={() => {
            setStepAttempted((prev) => ({ ...prev, endereco: true }));
            if (validateEndereco()) {
              setCurrentStep(3);
            }
          }}
        >
          Continuar
        </CTAButton>
      </div>
    </div>
  );
}
