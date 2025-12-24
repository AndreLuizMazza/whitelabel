// src/pages/cadastro/StepConfirmacao.jsx
import CTAButton from "@/components/ui/CTAButton";
import { ChevronLeft, MessageCircle, CheckCircle2 } from "lucide-react";
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

export default function StepConfirmacao({
  glassCardStyle,
  submitAttempted,
  errorList,
  errorCount,
  alertRef,
  focusByField,
  plano,
  baseMensal,
  numDepsIncl,
  depsExistentes,
  depsNovos,
  valorIncMensal,
  valorAdesaoPlano,
  diaDSelecionado,
  dataEfetivacaoISO,
  valorMensalidadePlano,
  totalMensal,
  cupom,
  handleSalvarEnviar,
  saving,
  sendWhatsFallback,
  onBack,
}) {
  return (
    <div className="mt-6 mb-6 rounded-3xl p-6 md:p-7" style={glassCardStyle}>
      {submitAttempted && errorList.length > 0 && (
        <div
          className="rounded-2xl px-4 py-3 text-sm mb-4 backdrop-blur-md"
          style={{
            border: "1px solid color-mix(in srgb, var(--primary) 40%, transparent)",
            background: "color-mix(in srgb, var(--c-surface) 80%, transparent)",
            color: "var(--text)",
          }}
          role="alert"
          aria-live="assertive"
          ref={alertRef}
          tabIndex={-1}
        >
          <p className="font-semibold mb-1">
            Revise os campos antes de continuar ({errorCount}):
          </p>
          <ul className="list-disc ml-5 space-y-1">
            {errorList.map((it, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  className="underline hover:opacity-80"
                  onClick={() => focusByField(it.field)}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--c-muted)] hover:text-[var(--text)]"
        >
          <ChevronLeft size={14} />
          Voltar para cobranças
        </button>
      </div>

      <SectionTitle>Resumo financeiro</SectionTitle>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">Plano</span>
          <span className="font-medium text-right">{plano?.nome}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">Base mensal</span>
          <span>{money(baseMensal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">
            Dependentes incluídos no plano
          </span>
          <span>{numDepsIncl}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">
            Dependentes adicionais (
            {Math.max(0, depsExistentes.length + depsNovos.length - numDepsIncl)}) ×{" "}
            {money(valorIncMensal)}
          </span>
          <span>
            {money(
              Math.max(
                0,
                depsExistentes.length + depsNovos.length - numDepsIncl
              ) * valorIncMensal
            )}
          </span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">Adesão (única)</span>
          <span>{money(valorAdesaoPlano)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">Dia D</span>
          <span>{diaDSelecionado}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">Efetivação</span>
          <span className="font-medium">{formatDateBR(dataEfetivacaoISO)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--c-muted)]">Mensalidade</span>
          <span>{money(valorMensalidadePlano)}</span>
        </div>

        <hr className="my-2 border-[color-mix(in srgb,var(--c-border) 70%,transparent)]" />

        <div className="flex justify-between items-baseline gap-3">
          <span className="font-semibold text-[15px]">Total mensal</span>
          <span className="text-[color:var(--primary)] font-extrabold text-lg md:text-xl">
            {money(totalMensal)}
          </span>
        </div>
        {cupom ? (
          <div className="flex justify-between gap-3">
            <span className="text-[var(--c-muted)]">Cupom aplicado</span>
            <span className="font-medium">{cupom}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <CTAButton
          type="button"
          onClick={handleSalvarEnviar}
          disabled={saving}
          className="h-12 w-full text-[15px] font-semibold"
          aria-disabled={saving ? "true" : "false"}
          title="Concluir contratação"
        >
          {saving ? "Enviando…" : "Concluir contratação"}
        </CTAButton>

        <CTAButton
          variant="outline"
          onClick={sendWhatsFallback}
          className="h-12 w-full text-[15px] font-semibold"
          title="Enviar cadastro por WhatsApp"
        >
          <MessageCircle size={16} className="mr-2" /> Enviar por WhatsApp
        </CTAButton>
      </div>

      <p className="mt-3 text-[11px] text-[var(--c-muted)] inline-flex items-center gap-1">
        <CheckCircle2 size={14} /> Seus dados não são gravados neste dispositivo.
      </p>
    </div>
  );
}
