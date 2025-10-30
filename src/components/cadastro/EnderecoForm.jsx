import { maskCEP, onlyDigits, sanitizeUF } from "@/lib/br";

/**
 * Endereço do titular com integração via CEP.
 * Props:
 * - endereco: {cep, logradouro, numero, complemento, bairro, cidade, uf}
 * - onChange(patch) => atualiza endereço
 * - submitAttempted
 * - viaCep: { cepState, fetchCEP(cep, titularSnapshot, setTitularProxy), debouncedBuscaCEP, setAddressTouched }
 * - titularSnapshot, setTitularProxy (callbacks da página para o hook usar)
 * - refs: { cepRef, logRef, numRef, bairroRef, cidadeRef, ufRef }
 * - UF_PADRAO
 */
export default function EnderecoForm({
  endereco,
  onChange,
  submitAttempted,
  viaCep,
  titularSnapshot,
  setTitularProxy,
  refs={},
  UF_PADRAO
}){
  const isEmpty = v => !String(v||"").trim();
  const requiredRing = cond => cond ? "ring-1 ring-red-500" : "";

  const cepDigits = onlyDigits(endereco?.cep||"");
  const cepError = viaCep.cepState.error;

  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
      <h2 className="font-semibold text-lg">Endereço</h2>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 md:grid-cols-[210px,1fr,140px]">
          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="end-cep">CEP *</label>
              <button
                type="button"
                className="text-xs underline text-[var(--c-muted)] hover:opacity-80 disabled:opacity-50"
                onClick={()=>viaCep.fetchCEP(endereco.cep, titularSnapshot, setTitularProxy)}
                disabled={viaCep.cepState.loading || onlyDigits(endereco.cep).length!==8}
                aria-label="Buscar endereço pelo CEP"
              >
                {viaCep.cepState.loading ? "Buscando..." : "Buscar CEP"}
              </button>
            </div>
            <input
              id="end-cep"
              ref={refs.cepRef}
              className={`input h-11 ${requiredRing(submitAttempted && cepDigits.length!==8) || (cepError ? " ring-1 ring-red-500" : "")}`}
              inputMode="numeric" maxLength={9}
              value={maskCEP(endereco.cep||"")}
              onChange={e=>{
                const v=maskCEP(e.target.value);
                viaCep.setAddressTouched(s=>s); // no-op só pra manter referência
                viaCep.cepState.error && (viaCep.cepState.error="");
                onChange({cep:v});
                viaCep.debouncedBuscaCEP(v, titularSnapshot, setTitularProxy);
              }}
              onBlur={(e)=>viaCep.fetchCEP(e.target.value, titularSnapshot, setTitularProxy)}
              placeholder="00000-000"
              autoComplete="postal-code"
              aria-invalid={(submitAttempted && cepDigits.length!==8) || !!cepError}
              aria-describedby={(cepError ? "cep-error" : undefined)}
            />
            {submitAttempted && cepDigits.length!==8 && !cepError && (
              <p className="text-xs text-red-600 mt-1">CEP deve ter 8 dígitos.</p>
            )}
            {cepError && (
              <p id="cep-error" className="text-xs text-red-600 mt-1" role="alert">{cepError}</p>
            )}
            {(!cepError && viaCep.cepState.found) && (
              <p className="text-xs text-green-700 mt-1" aria-live="polite">Endereço preenchido pelo CEP.</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="end-log">Logradouro *</label>
            <input
              id="end-log"
              ref={refs.logRef}
              className={`input h-11 ${requiredRing(submitAttempted && isEmpty(endereco.logradouro))}`}
              value={endereco.logradouro||""}
              onChange={e=>{ viaCep.setAddressTouched(prev=>({...prev, logradouro:true})); onChange({logradouro:e.target.value}); }}
              autoComplete="address-line1"
              aria-invalid={submitAttempted && isEmpty(endereco.logradouro)}
              disabled={viaCep.cepState.loading}
            />
            {submitAttempted && isEmpty(endereco.logradouro) && (
              <p className="text-xs text-red-600 mt-1">Informe o logradouro.</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="end-num">Número *</label>
            <input
              id="end-num"
              ref={refs.numRef}
              className={`input h-11 ${requiredRing(submitAttempted && isEmpty(endereco.numero))}`}
              value={endereco.numero||""}
              onChange={e=>onChange({numero:e.target.value})}
              autoComplete="address-line2"
              aria-invalid={submitAttempted && isEmpty(endereco.numero)}
              disabled={viaCep.cepState.loading}
            />
            {submitAttempted && isEmpty(endereco.numero) && (
              <p className="text-xs text-red-600 mt-1">Informe o número.</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,100px]">
          <div>
            <label className="label" htmlFor="end-comp">Complemento</label>
            <input
              id="end-comp"
              className="input h-11"
              value={endereco.complemento||""}
              onChange={e=>onChange({complemento:e.target.value})}
              disabled={viaCep.cepState.loading}
            />
          </div>
          <div>
            <label className="label" htmlFor="end-bairro">Bairro *</label>
            <input
              id="end-bairro"
              ref={refs.bairroRef}
              className={`input h-11 ${requiredRing(submitAttempted && isEmpty(endereco.bairro))}`}
              value={endereco.bairro||""}
              onChange={e=>{ viaCep.setAddressTouched(prev=>({...prev, bairro:true})); onChange({bairro:e.target.value})}}
              aria-invalid={submitAttempted && isEmpty(endereco.bairro)}
              disabled={viaCep.cepState.loading}
            />
            {submitAttempted && isEmpty(endereco.bairro) && (
              <p className="text-xs text-red-600 mt-1">Informe o bairro.</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="end-cidade">Cidade *</label>
            <input
              id="end-cidade"
              ref={refs.cidadeRef}
              className={`input h-11 ${requiredRing(submitAttempted && isEmpty(endereco.cidade))}`}
              value={endereco.cidade||""}
              onChange={e=>{
                viaCep.setAddressTouched(prev=>({...prev, cidade:true}));
                const cidade=e.target.value;
                const uf=endereco.uf || UF_PADRAO || "";
                onChange({ cidade, uf });
              }}
              autoComplete="address-level2"
              aria-invalid={submitAttempted && isEmpty(endereco.cidade)}
              disabled={viaCep.cepState.loading}
            />
            {submitAttempted && isEmpty(endereco.cidade) && (
              <p className="text-xs text-red-600 mt-1">Informe a cidade.</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="end-uf">UF *</label>
            <input
              id="end-uf"
              ref={refs.ufRef}
              className={`input h-11 ${requiredRing(submitAttempted && isEmpty(endereco.uf))}`}
              value={(endereco.uf||"").toUpperCase()}
              onChange={e=>{ viaCep.setAddressTouched(prev=>({...prev, uf:true})); onChange({ uf: sanitizeUF(e.target.value) }) }}
              maxLength={2}
              autoComplete="address-level1"
              aria-invalid={submitAttempted && isEmpty(endereco.uf)}
              disabled={viaCep.cepState.loading}
            />
            {submitAttempted && isEmpty(endereco.uf) && (
              <p className="text-xs text-red-600 mt-1">Informe a UF.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
