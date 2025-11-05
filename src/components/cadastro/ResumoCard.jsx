import { formatDateBR } from "@/lib/br";

/**
 * Resumo final com totais.
 * Props:
 * - plano, baseMensal, numDepsIncl, valorIncMensal, depsCount
 * - valorAdesao, diaD, efetivacaoISO, mensalidade, cupom, totalMensal
 * - money: fn
 */
export default function ResumoCard({
  plano, baseMensal, numDepsIncl, valorIncMensal, depsCount,
  valorAdesao, diaD, efetivacaoISO, mensalidade, cupom, totalMensal,
  money
}){
  const excedentes = Math.max(0, depsCount - numDepsIncl);
  return (
    <div className="p-6 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
      <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Plano</span><span className="font-medium text-right">{plano?.nome}</span></div>
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Base mensal</span><span>{money(baseMensal)}</span></div>
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Incluídos no plano</span><span>{numDepsIncl}</span></div>
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Dependentes adicionais ({excedentes}) × {money(valorIncMensal)}</span><span>{money(excedentes*valorIncMensal)}</span></div>

        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Adesão (única)</span><span>{money(valorAdesao)}</span></div>
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Dia D</span><span>{diaD}</span></div>
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Efetivação</span><span className="font-medium">{formatDateBR(efetivacaoISO)}</span></div>
        <div className="flex justify-between"><span className="text-[var(--c-muted)]">Mensalidade</span><span>{money(mensalidade)}</span></div>

        <hr className="my-2"/>
        <div className="flex justify-between font-semibold text-base">
          <span>Total mensal</span><span className="text-[color:var(--primary)] font-extrabold">{money(totalMensal)}</span>
        </div>
        {cupom ? (<div className="flex justify-between"><span className="text-[var(--c-muted)]">Cupom</span><span className="font-medium">{cupom}</span></div>) : null}
      </div>
    </div>
  );
}
