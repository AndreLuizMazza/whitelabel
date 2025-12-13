// src/pages/cadastro/StepEndereco.jsx
import CTAButton from "@/components/ui/CTAButton";
import { onlyDigits, formatCEP, maskCEP, sanitizeUF } from "@/lib/br";

const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

export default function StepEndereco({
  glassCardStyle, // mantido na assinatura por compatibilidade (não usado aqui de propósito)
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
  const cepDigits = onlyDigits(titular?.endereco?.cep || "");

  return (
    <div className="mt-6">
      {/* CARD PRINCIPAL (mesma linguagem do RegisterPage) */}
      <div
        className="relative overflow-hidden rounded-3xl border shadow-xl p-6 md:p-8"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
          borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
        }}
      >
        {/* gradiente inferior suave */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              "radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)",
            opacity: 0.6,
          }}
        />

        <fieldset className="relative z-[1] space-y-5" disabled={cepState?.loading}>
          {/* Cabeçalho interno (igual Register) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">
                Etapa 2 de 4 · Endereço
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] md:text-xs"
                style={{
                  background:
                    "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
                  color: "var(--text-muted)",
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
                Continuando
              </span>
            </div>

            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background:
                  "color-mix(in srgb, var(--surface-elevated) 80%, var(--text) 6%)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: "50%",
                  background: "var(--primary)",
                }}
              />
            </div>

            <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
              Informe o endereço principal do titular. Ele será usado no contrato e nas cobranças.
            </p>
          </div>

          {/* SUB-CARD DO FORMULÁRIO (igual Register) */}
          <div
            className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 space-y-4"
            style={{
              background:
                "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
              borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
            }}
          >
            {/* CEP */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label font-medium text-sm md:text-base" htmlFor="end-cep">
                  CEP {requiredStar}
                </label>

                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] hover:opacity-80 disabled:opacity-40"
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
                className={`input h-12 text-base bg-white ${
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
                  (showErrors && cepDigits.length !== 8) || !!cepState.error ? "true" : "false"
                }
                aria-describedby={cepState.error ? "cep-error" : undefined}
              />

              {showErrors && cepDigits.length !== 8 && !cepState.error && (
                <p className="text-xs md:text-sm mt-1 text-red-600" role="alert" aria-live="polite">
                  CEP deve ter 8 dígitos.
                </p>
              )}
              {cepState.error && (
                <p
                  id="cep-error"
                  className="text-xs md:text-sm mt-1 text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {cepState.error}
                </p>
              )}
              {!cepState.error && cepState.found && (
                <p className="text-xs md:text-sm mt-1 text-green-700" aria-live="polite">
                  Endereço preenchido pelo CEP.
                </p>
              )}
            </div>

            {/* Logradouro + número */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr),minmax(0,1fr)] gap-4">
              <div>
                <label className="label font-medium text-sm md:text-base" htmlFor="end-log">
                  Logradouro {requiredStar}
                </label>
                <input
                  id="end-log"
                  ref={logRef}
                  className={`input h-12 text-base bg-white ${requiredRing(
                    showErrors && isEmpty(titular.endereco.logradouro)
                  )}`}
                  value={titular.endereco.logradouro}
                  onChange={(e) => {
                    setAddrTouched({ logradouro: true });
                    updTitEndereco({ logradouro: e.target.value });
                  }}
                  autoComplete="address-line1"
                  aria-required="true"
                  aria-invalid={showErrors && isEmpty(titular.endereco.logradouro) ? "true" : "false"}
                  disabled={cepState.loading}
                />
                {showErrors && isEmpty(titular.endereco.logradouro) && (
                  <p className="text-xs md:text-sm mt-1 text-red-600" role="alert" aria-live="polite">
                    Informe o logradouro.
                  </p>
                )}
              </div>

              <div>
                <label className="label font-medium text-sm md:text-base" htmlFor="end-num">
                  Número {requiredStar}
                </label>
                <input
                  id="end-num"
                  ref={numRef}
                  className={`input h-12 text-base bg-white ${requiredRing(
                    showErrors && isEmpty(titular.endereco.numero)
                  )}`}
                  value={titular.endereco.numero}
                  onChange={(e) => updTitEndereco({ numero: e.target.value })}
                  autoComplete="address-line2"
                  aria-required="true"
                  aria-invalid={showErrors && isEmpty(titular.endereco.numero) ? "true" : "false"}
                  disabled={cepState.loading}
                />
                {showErrors && isEmpty(titular.endereco.numero) && (
                  <p className="text-xs md:text-sm mt-1 text-red-600" role="alert" aria-live="polite">
                    Informe o número.
                  </p>
                )}
              </div>
            </div>

            {/* Complemento */}
            <div>
              <label className="label font-medium text-sm md:text-base" htmlFor="end-comp">
                Complemento
              </label>
              <input
                id="end-comp"
                className="input h-12 text-base bg-white"
                value={titular.endereco.complemento}
                onChange={(e) => updTitEndereco({ complemento: e.target.value })}
                disabled={cepState.loading}
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="label font-medium text-sm md:text-base" htmlFor="end-bairro">
                Bairro {requiredStar}
              </label>
              <input
                id="end-bairro"
                ref={bairroRef}
                className={`input h-12 text-base bg-white ${requiredRing(
                  showErrors && isEmpty(titular.endereco.bairro)
                )}`}
                value={titular.endereco.bairro}
                onChange={(e) => {
                  setAddrTouched({ bairro: true });
                  updTitEndereco({ bairro: e.target.value });
                }}
                aria-required="true"
                aria-invalid={showErrors && isEmpty(titular.endereco.bairro) ? "true" : "false"}
                disabled={cepState.loading}
              />
              {showErrors && isEmpty(titular.endereco.bairro) && (
                <p className="text-xs md:text-sm mt-1 text-red-600" role="alert" aria-live="polite">
                  Informe o bairro.
                </p>
              )}
            </div>

            {/* Cidade + UF */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr),120px] gap-4">
              <div>
                <label className="label font-medium text-sm md:text-base" htmlFor="end-cidade">
                  Cidade {requiredStar}
                </label>
                <input
                  id="end-cidade"
                  ref={cidadeRef}
                  className={`input h-12 text-base bg-white ${requiredRing(
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
                  aria-invalid={showErrors && isEmpty(titular.endereco.cidade) ? "true" : "false"}
                  disabled={cepState.loading}
                />
                {showErrors && isEmpty(titular.endereco.cidade) && (
                  <p className="text-xs md:text-sm mt-1 text-red-600" role="alert" aria-live="polite">
                    Informe a cidade.
                  </p>
                )}
              </div>

              <div>
                <label className="label font-medium text-sm md:text-base" htmlFor="end-uf">
                  UF {requiredStar}
                </label>
                <input
                  id="end-uf"
                  ref={ufRef}
                  className={`input h-12 text-base bg-white ${requiredRing(
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
                  aria-invalid={showErrors && isEmpty(titular.endereco.uf) ? "true" : "false"}
                  disabled={cepState.loading}
                />
                {showErrors && isEmpty(titular.endereco.uf) && (
                  <p className="text-xs md:text-sm mt-1 text-red-600" role="alert" aria-live="polite">
                    Informe a UF.
                  </p>
                )}
              </div>
            </div>

            <p className="text-[11px] md:text-xs text-[var(--text-muted)]">
              Campos com * são obrigatórios.
            </p>
          </div>

          {/* Navegação da etapa */}
          <div className="flex justify-between gap-3 pt-1">
            <CTAButton
              type="button"
              variant="outline"
              className="h-12 px-5 rounded-2xl"
              onClick={() => setCurrentStep(1)}
            >
              Voltar
            </CTAButton>

            <CTAButton
              type="button"
              className="h-12 px-6 rounded-2xl"
              onClick={() => {
                setStepAttempted((prev) => ({ ...prev, endereco: true }));
                if (validateEndereco()) setCurrentStep(3);
              }}
            >
              Continuar
            </CTAButton>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
