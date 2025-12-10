// src/pages/cadastro/StepCarne.jsx
import CTAButton from "@/components/ui/CTAButton";
import { DIA_D_OPTIONS } from "@/lib/constants";
import { money } from "@/lib/planUtils";
import { formatDateBR } from "@/lib/br";

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base md:text-lg font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

export default function StepCarne({
  glassCardStyle,
  diaDSelecionado,
  setDiaDSelecionado,
  dataEfetivacaoISO,
  valorMensalidadePlano,
  cobrancasPreview,
  onBack,
  onNext,
}) {
  return (
    <div className="mt-6 rounded-3xl p-6 md:p-7" style={glassCardStyle}>
      <SectionTitle>Cobrança (carnê)</SectionTitle>

      <div className="mt-3 grid gap-3 md:grid-cols-3 items-stretch">
        <div className="md:col-span-1">
          <label className="label text-xs font-medium" htmlFor="diaD">
            Dia D (vencimento)
          </label>
          <select
            id="diaD"
            className="input h-11 w-full text-sm"
            value={diaDSelecionado}
            onChange={(e) => setDiaDSelecionado(Number(e.target.value))}
          >
            {DIA_D_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--c-muted)] mt-1">
            A primeira cobrança ocorre na <b>data de efetivação</b> (próximo mês).
          </p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3 shadow-sm">
            <p className="text-[11px] text-[var(--c-muted)]">Data de efetivação</p>
            <p className="font-medium text-[14px] mt-1">{formatDateBR(dataEfetivacaoISO)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3 shadow-sm">
            <p className="text-[11px] text-[var(--c-muted)]">Mensalidade</p>
            <p className="font-medium text-[14px] mt-1">
              {money(valorMensalidadePlano)}
            </p>
          </div>
        </div>
      </div>

      {/* Prévia das cobranças geradas (estrutura pronta para evoluir) */}
      <div className="mt-5 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/90 p-4">
        <p className="text-xs font-semibold text-[var(--c-muted)] mb-2 uppercase tracking-[0.16em]">
          Cobranças previstas
        </p>
        {(!cobrancasPreview || cobrancasPreview.length === 0) && (
          <p className="text-sm text-[var(--c-muted)]">
            As cobranças serão calculadas conforme as regras do plano.
          </p>
        )}
        {cobrancasPreview && cobrancasPreview.length > 0 && (
          <div className="space-y-1 text-sm">
            {cobrancasPreview.map((cob) => (
              <div
                key={cob.id}
                className="flex items-center justify-between gap-3 py-1 border-b border-dashed border-[var(--c-border)]/60 last:border-b-0"
              >
                <span className="text-[var(--c-muted)]">
                  {cob.tipo || "Cobrança"}
                </span>
                <span className="tabular-nums text-[13px]">
                  {formatDateBR(cob.dataVencimentoISO)} •{" "}
                  <strong>{money(cob.valor || 0)}</strong>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <CTAButton
          type="button"
          variant="outline"
          className="h-11 px-5"
          onClick={onBack}
        >
          Voltar
        </CTAButton>
        <CTAButton
          type="button"
          className="h-11 px-6"
          onClick={onNext}
        >
          Continuar
        </CTAButton>
      </div>
    </div>
  );
}
