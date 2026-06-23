// src/pages/cadastro/StepEndereco.jsx
import Button from "@/components/ui/Button.jsx";
import { onlyDigits, formatCEP, maskCEP, sanitizeUF } from "@/lib/br";

const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;
const inputStyle = { background: "var(--surface)", borderColor: "var(--c-border)" };

export default function StepEndereco({
  titular,
  updTitEndereco,
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
    <fieldset className="space-y-4" disabled={cepState?.loading}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="label font-medium text-sm" htmlFor="end-cep">
            CEP {requiredStar}
          </label>
          <button
            type="button"
            className="text-xs font-medium hover:underline disabled:opacity-40 min-h-[44px]"
            style={{ color: "var(--primary)" }}
            onClick={() => onCepBlur(titular.endereco.cep)}
            disabled={cepState.loading || cepDigits.length !== 8}
          >
            {cepState.loading ? "Buscando…" : "Buscar CEP"}
          </button>
        </div>
        <input
          id="end-cep"
          ref={cepRef}
          className={`input h-12 text-base mt-1.5 ${requiredRing(showErrors && cepDigits.length !== 8) || (cepState.error ? " ring-1 ring-red-500" : "")}`}
          style={inputStyle}
          inputMode="numeric"
          maxLength={9}
          value={formatCEP(titular.endereco.cep)}
          onChange={(e) => onCepChange(maskCEP(e.target.value))}
          onBlur={(e) => onCepBlur(e.target.value)}
          placeholder="00000-000"
          autoComplete="postal-code"
        />
        {showErrors && cepDigits.length !== 8 && !cepState.error && (
          <p className="text-xs mt-1 text-red-600">CEP deve ter 8 dígitos.</p>
        )}
        {cepState.error && <p className="text-xs mt-1 text-red-600">{cepState.error}</p>}
        {!cepState.error && cepState.found && (
          <p className="text-xs mt-1" style={{ color: "var(--primary)" }}>
            Endereço preenchido automaticamente.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr),minmax(0,1fr)] gap-4">
        <div>
          <label className="label font-medium text-sm" htmlFor="end-log">
            Logradouro {requiredStar}
          </label>
          <input
            id="end-log"
            ref={logRef}
            className={`input h-12 text-base mt-1.5 ${requiredRing(showErrors && isEmpty(titular.endereco.logradouro))}`}
            style={inputStyle}
            value={titular.endereco.logradouro}
            onChange={(e) => {
              setAddrTouched({ logradouro: true });
              updTitEndereco({ logradouro: e.target.value });
            }}
            autoComplete="address-line1"
            disabled={cepState.loading}
          />
        </div>
        <div>
          <label className="label font-medium text-sm" htmlFor="end-num">
            Número {requiredStar}
          </label>
          <input
            id="end-num"
            ref={numRef}
            className={`input h-12 text-base mt-1.5 ${requiredRing(showErrors && isEmpty(titular.endereco.numero))}`}
            style={inputStyle}
            value={titular.endereco.numero}
            onChange={(e) => updTitEndereco({ numero: e.target.value })}
            autoComplete="address-line2"
            disabled={cepState.loading}
          />
        </div>
      </div>

      <div>
        <label className="label font-medium text-sm" htmlFor="end-comp">
          Complemento
        </label>
        <input
          id="end-comp"
          className="input h-12 text-base mt-1.5"
          style={inputStyle}
          value={titular.endereco.complemento}
          onChange={(e) => updTitEndereco({ complemento: e.target.value })}
          disabled={cepState.loading}
        />
      </div>

      <div>
        <label className="label font-medium text-sm" htmlFor="end-bairro">
          Bairro {requiredStar}
        </label>
        <input
          id="end-bairro"
          ref={bairroRef}
          className={`input h-12 text-base mt-1.5 ${requiredRing(showErrors && isEmpty(titular.endereco.bairro))}`}
          style={inputStyle}
          value={titular.endereco.bairro}
          onChange={(e) => {
            setAddrTouched({ bairro: true });
            updTitEndereco({ bairro: e.target.value });
          }}
          disabled={cepState.loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr),120px] gap-4">
        <div>
          <label className="label font-medium text-sm" htmlFor="end-cidade">
            Cidade {requiredStar}
          </label>
          <input
            id="end-cidade"
            ref={cidadeRef}
            className={`input h-12 text-base mt-1.5 ${requiredRing(showErrors && isEmpty(titular.endereco.cidade))}`}
            style={inputStyle}
            value={titular.endereco.cidade}
            onChange={(e) => {
              setAddrTouched({ cidade: true });
              updTitEndereco({ cidade: e.target.value, uf: titular.endereco.uf || UF_PADRAO || "" });
            }}
            autoComplete="address-level2"
            disabled={cepState.loading}
          />
        </div>
        <div>
          <label className="label font-medium text-sm" htmlFor="end-uf">
            UF {requiredStar}
          </label>
          <input
            id="end-uf"
            ref={ufRef}
            className={`input h-12 text-base mt-1.5 ${requiredRing(showErrors && isEmpty(titular.endereco.uf))}`}
            style={inputStyle}
            value={titular.endereco.uf}
            onChange={(e) => {
              setAddrTouched({ uf: true });
              updTitEndereco({ uf: sanitizeUF(e.target.value) });
            }}
            maxLength={2}
            autoComplete="address-level1"
            disabled={cepState.loading}
          />
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-5 mt-5 border-t" style={{ borderColor: "var(--c-border)" }}>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[48px] rounded-xl md:rounded-full"
          onClick={() => setCurrentStep(1)}
        >
          Voltar
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="min-h-[48px] px-8 rounded-xl md:rounded-full"
          onClick={() => {
            setStepAttempted((prev) => ({ ...prev, endereco: true }));
            if (validateEndereco()) setCurrentStep(3);
          }}
        >
          Continuar
        </Button>
      </div>
    </fieldset>
  );
}
