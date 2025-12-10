import CTAButton from "@/components/ui/CTAButton";
import { DIA_D_OPTIONS } from "@/lib/constants";
import { money } from "@/lib/planUtils";
import { formatDateBR } from "@/lib/br";
import { Loader2 } from "lucide-react";

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base md:text-lg font-semibold tracking-tight">
        {children}
      </h2>
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
  onFinalizar, // callback para finalizar contratação
  saving, // indica se está processando
}) {
  const handleClickFinalizar = () => {
    if (saving) return; // já está processando

    const ok = window.confirm(
      "Deseja finalizar a contratação agora?\n\n" +
        "Vamos registrar o seu contrato e gerar o carnê de cobranças. " +
        "Esse processo pode levar alguns instantes."
    );
    if (!ok) return;

    if (typeof onFinalizar === "function") {
      onFinalizar();
    }
  };

  return (
    <div
      className="mt-6 rounded-3xl p-6 md:p-7 relative"
      style={glassCardStyle}
    >
      {/* Conteúdo principal da etapa */}
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
            disabled={saving}
          >
            {DIA_D_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--c-muted)] mt-1">
            A primeira cobrança ocorre na <b>data de efetivação</b> (próximo
            mês).
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3 shadow-sm">
            <p className="text-[11px] text-[var(--c-muted)]">
              Data de efetivação
            </p>
            <p className="font-medium text-[14px] mt-1">
              {formatDateBR(dataEfetivacaoISO)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3 shadow-sm">
            <p className="text-[11px] text-[var(--c-muted)]">Mensalidade</p>
            <p className="font-medium text-[14px] mt-1">
              {money(valorMensalidadePlano)}
            </p>
          </div>
        </div>
      </div>

      {/* Prévia das cobranças geradas */}
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

      {/* Rodapé de ações */}
      <div className="mt-6 flex justify-between gap-3">
        <CTAButton
          type="button"
          variant="outline"
          className="h-11 px-5"
          onClick={onBack}
          disabled={saving}
        >
          Voltar
        </CTAButton>

        <CTAButton
          type="button"
          className="h-11 px-6"
          onClick={handleClickFinalizar}
          disabled={saving}
          aria-disabled={saving ? "true" : "false"}
        >
          {saving ? "Finalizando…" : "Finalizar contratação"}
        </CTAButton>
      </div>

      {/* Overlay de processamento – bloqueia tudo enquanto saving === true */}
      {saving && (
        <div className="absolute inset-0 rounded-3xl bg-black/35 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="rounded-2xl bg-[var(--c-surface)]/98 border border-[var(--c-border)] px-6 py-5 shadow-2xl max-w-sm text-center">
            <Loader2 className="mx-auto mb-3 animate-spin" size={24} />
            <p className="font-semibold text-sm">
              Finalizando sua contratação…
            </p>
            <p className="text-xs text-[var(--c-muted)] mt-1">
              Estamos registrando seu contrato e gerando o carnê. <br />
              Por favor, aguarde alguns instantes e não feche esta página.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
