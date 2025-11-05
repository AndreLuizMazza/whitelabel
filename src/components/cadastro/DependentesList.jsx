import CTAButton from "@/components/ui/CTAButton";
import { AlertTriangle, Plus } from "lucide-react";
import DependenteItem from "./DependenteItem";

/**
 * Lista de dependentes + botão de adicionar
 * Props:
 * - deps: array
 * - issues: array de { fora, age, parentescoVazio, cpfInvalido }
 * - submitAttempted
 * - onAdd(), onRemove(i), onChangeDep(i, patch)
 * - sexoOptions, parentescos (array de labels já mapeadas)
 * - idadeMinDep, idadeMaxDep
 */
export default function DependentesList({
  deps, issues, submitAttempted,
  onAdd, onRemove, onChangeDep,
  sexoOptions, parentescos,
  idadeMinDep, idadeMaxDep
}){
  const countDepsFora = issues.filter(x=>x?.fora).length;

  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Dependentes ({deps.length})</h2>
        <CTAButton onClick={onAdd} className="h-10">
          <Plus size={16} className="mr-2"/>Adicionar dependente
        </CTAButton>
      </div>

      <div className="mt-4 grid gap-4">
        {deps.map((d,i)=>(
          <DependenteItem
            key={i}
            i={i}
            d={d}
            issue={issues[i]}
            submitAttempted={submitAttempted}
            sexoOptions={sexoOptions}
            parentescos={parentescos}
            idadeMinDep={idadeMinDep}
            idadeMaxDep={idadeMaxDep}
            onRemove={()=>onRemove(i)}
            onChange={(patch)=>onChangeDep(i, patch)}
          />
        ))}
      </div>

      {countDepsFora>0 && (
        <p className="mt-2 text-xs inline-flex items-center gap-1 text-red-600" role="alert" aria-live="polite">
          <AlertTriangle size={14}/> {countDepsFora} dependente(s) fora do limite etário do plano.
        </p>
      )}
    </div>
  );
}
