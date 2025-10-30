/** 
 * Complemento do titular: estado civil, sexo e RG
 * Props:
 * - titular, onChange(patch)
 * - ESTADO_CIVIL_OPTIONS, SEXO_OPTIONS
 * - submitAttempted
 * - refs: { ecRef, sexoRef }
 */
export default function TitularComplementoForm({
  titular, onChange,
  ESTADO_CIVIL_OPTIONS, SEXO_OPTIONS,
  submitAttempted,
  refs={}
}){
  const isEmpty = v => !String(v||"").trim();
  const requiredRing = cond => cond ? "ring-1 ring-red-500" : "";

  return (
    <div className="mt-8">
      <h2 className="font-semibold text-lg">Complemento do cadastro</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <label className="label" htmlFor="titular-ec">Estado civil *</label>
          <select
            id="titular-ec"
            ref={refs.ecRef}
            className={`input h-11 w-full ${requiredRing(submitAttempted && isEmpty(titular.estado_civil))}`}
            value={titular.estado_civil}
            onChange={e=>onChange({estado_civil:e.target.value})}
            aria-invalid={submitAttempted && isEmpty(titular.estado_civil)}
          >
            <option value="">Selecione…</option>
            {ESTADO_CIVIL_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
          </select>
          {submitAttempted && isEmpty(titular.estado_civil) && (
            <p className="text-xs text-red-600 mt-1">Selecione o estado civil.</p>
          )}
        </div>

        <div className="md:col-span-4">
          <label className="label" htmlFor="titular-sexo">Sexo *</label>
          <select
            id="titular-sexo"
            ref={refs.sexoRef}
            className={`input h-11 w-full ${requiredRing(submitAttempted && isEmpty(titular.sexo))}`}
            value={titular.sexo}
            onChange={e=>onChange({sexo:e.target.value})}
            aria-invalid={submitAttempted && isEmpty(titular.sexo)}
          >
            <option value="">Selecione…</option>
            {SEXO_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
          </select>
          {submitAttempted && isEmpty(titular.sexo) && (
            <p className="text-xs text-red-600 mt-1">Selecione o sexo.</p>
          )}
        </div>

        <div className="md:col-span-4">
          <label className="label" htmlFor="titular-rg">RG</label>
          <input
            id="titular-rg"
            className="input h-11 w-full"
            value={titular.rg||""}
            onChange={e=>onChange({rg:e.target.value})}
            placeholder="RG"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
