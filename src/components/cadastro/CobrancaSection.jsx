import { formatDateBR } from "@/lib/br";

/**
 * Cobrança: Dia D + efetivação + mensalidade
 * Props:
 * - diaDSelecionado, setDiaDSelecionado
 * - efetivacaoISO, mensalidade
 * - DIA_D_OPTIONS: number[]
 * - money: fn
 */
export default function CobrancaSection({
  diaDSelecionado, setDiaDSelecionado,
  efetivacaoISO, mensalidade,
  DIA_D_OPTIONS, money
}){
  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
      <h3 className="text-lg font-semibold">Cobrança</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="label" htmlFor="diaD">Dia D (vencimento)</label>
          <select
            id="diaD"
            className="input h-11 w-full"
            value={diaDSelecionado}
            onChange={e=>setDiaDSelecionado(Number(e.target.value))}
          >
            {DIA_D_OPTIONS.map(d=>(<option key={d} value={d}>{d}</option>))}
          </select>
          <p className="text-xs text-[var(--c-muted)] mt-1">
            A primeira cobrança ocorre na <b>data de efetivação</b> abaixo (próximo mês).
          </p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--c-border)] p-3">
            <p className="text-[var(--c-muted)] text-xs">Data de efetivação</p>
            <p className="font-medium">{formatDateBR(efetivacaoISO)}</p>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] p-3">
            <p className="text-[var(--c-muted)] text-xs">Mensalidade</p>
            <p className="font-medium">{money(mensalidade)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
