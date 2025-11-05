import CTAButton from "@/components/ui/CTAButton";
import { Trash2 } from "lucide-react";
import DateSelectBR from "./DateSelectBR";
import { formatCPF, cpfIsValid } from "@/lib/br";

export default function DependenteItem({
  i, d, issue, submitAttempted,
  sexoOptions, parentescos, onChange, onRemove,
  idadeMinDep, idadeMaxDep
}){
  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">Dependente {i+1}</span>
        <CTAButton variant="ghost" onClick={onRemove} className="h-9 px-3" aria-label={`Remover dependente ${i+1}`}>
          <Trash2 size={16} className="mr-2"/> Remover
        </CTAButton>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-6">
          <label className="label" htmlFor={`dep-${i}-nome`}>Nome completo *</label>
          <input
            id={`dep-${i}-nome`}
            className={`input h-11 w-full ${submitAttempted && !((d.nome||"").trim().length>=3) ? "ring-1 ring-red-500":""}`}
            placeholder="Nome do dependente"
            value={d.nome}
            onChange={e=>onChange({nome:e.target.value})}
            aria-invalid={submitAttempted && !((d.nome||"").trim().length>=3)}
          />
        </div>
        <div className="md:col-span-3">
          <label className="label" htmlFor={`dep-${i}-parentesco`}>Parentesco *</label>
          <select
            id={`dep-${i}-parentesco`}
            className={`input h-11 w-full ${submitAttempted && !d.parentesco ? "ring-1 ring-red-500":""}`}
            value={d.parentesco}
            onChange={e=>onChange({parentesco:e.target.value})}
            aria-invalid={submitAttempted && !d.parentesco}
          >
            <option value="">Selecione…</option>
            {parentescos.map(v=>(<option key={v} value={v}>{v}</option>))}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="label" htmlFor={`dep-${i}-sexo`}>Sexo *</label>
          <select
            id={`dep-${i}-sexo`}
            className={`input h-11 w-full ${submitAttempted && !d.sexo ? "ring-1 ring-red-500":""}`}
            value={d.sexo||""}
            onChange={e=>onChange({sexo:e.target.value})}
            aria-invalid={submitAttempted && !d.sexo}
          >
            <option value="">Selecione…</option>
            {sexoOptions.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-12 mt-2">
        <div className="md:col-span-6">
          <label className="label" htmlFor={`dep-${i}-cpf`}>CPF (opcional)</label>
          <input
            id={`dep-${i}-cpf`}
            className={`input h-11 w-full ${(d.cpf && !cpfIsValid(d.cpf)) ? "ring-1 ring-red-500" : ""}`}
            inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
            value={formatCPF(d.cpf||"")}
            onChange={e=>onChange({cpf:e.target.value})}
            aria-invalid={(d.cpf && !cpfIsValid(d.cpf))}
          />
        </div>
        <div className="md:col-span-6">
          <label className="label">Data de nascimento *</label>
          <DateSelectBR
            className="w-full"
            idPrefix={`dep-${i}-nasc`}
            valueISO={d.data_nascimento}
            onChangeISO={(iso)=>onChange({data_nascimento:iso})}
            invalid={Boolean(submitAttempted && (!d.data_nascimento || issue?.fora))}
            minAge={Number.isFinite(idadeMinDep)?Number(idadeMinDep):undefined}
            maxAge={Number.isFinite(idadeMaxDep)?Number(idadeMaxDep):undefined}
          />
        </div>
      </div>
    </div>
  );
}
