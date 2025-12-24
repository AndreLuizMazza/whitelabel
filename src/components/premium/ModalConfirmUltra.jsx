// src/components/premium/ModalConfirmUltra.jsx
import CTAButton from "@/components/ui/CTAButton";
import { money } from "@/lib/planUtils";
import { formatDateBR } from "@/lib/br";

export default function ModalConfirmUltra({
  open,
  onClose,
  onConfirm,
  plano,
  titular,
  cobrancasPreview = [],
  valorMensalidadePlano = 0,
  valorAdesaoPlano = 0,
  diaDSelecionado,
  dataEfetivacaoISO,
  onWhatsFallback,
  hasErrors,
}) {
  if (!open) return null;

  const nomePlano = plano?.nome || "Plano selecionado";
  const nomeTitular = titular?.nome || "Titular";

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[8px]"
        onClick={onClose}
      />

      <div className="relative max-w-lg w-full rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/98 shadow-[0_22px_80px_rgba(0,0,0,0.65)] p-6 space-y-4">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)]">
            Confirmação
          </p>
          <h2 className="text-lg md:text-xl font-semibold tracking-tight">
            Deseja concluir a contratação agora?
          </h2>
          <p className="text-xs md:text-sm text-[var(--c-muted)]">
            Revisamos os principais dados do seu contrato. Se estiver tudo certo, confirme abaixo
            para gerar o cadastro e a primeira cobrança.
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/96 p-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)]">
              Plano
            </p>
            <p className="font-medium">{nomePlano}</p>
            <p className="text-[11px] text-[var(--c-muted)] mt-1">
              Mensalidade estimada:{" "}
              <strong>{money(valorMensalidadePlano)}</strong>
            </p>
            {valorAdesaoPlano > 0 && (
              <p className="text-[11px] text-[var(--c-muted)]">
                Adesão única:{" "}
                <strong>{money(valorAdesaoPlano)}</strong>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/96 p-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)]">
              Titular
            </p>
            <p className="font-medium">{nomeTitular}</p>
            <p className="text-[11px] text-[var(--c-muted)] mt-1">
              Vencimento escolhido:{" "}
              <strong>Dia {diaDSelecionado}</strong>
            </p>
            <p className="text-[11px] text-[var(--c-muted)]">
              Data de efetivação:{" "}
              <strong>{formatDateBR(dataEfetivacaoISO)}</strong>
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)] mb-1">
            Cobranças previstas
          </p>
          {(!cobrancasPreview || cobrancasPreview.length === 0) && (
            <p className="text-xs text-[var(--c-muted)]">
              As cobranças serão calculadas de acordo com as regras do plano.
            </p>
          )}
          {cobrancasPreview && cobrancasPreview.length > 0 && (
            <div className="space-y-1 text-xs md:text-sm">
              {cobrancasPreview.map((cob) => (
                <div
                  key={cob.id}
                  className="flex items-center justify-between gap-3 py-1 border-b border-dashed border-[var(--c-border)]/50 last:border-b-0"
                >
                  <span className="text-[var(--c-muted)]">
                    {cob.tipo || "Cobrança"}
                  </span>
                  <span className="tabular-nums text-[12px] md:text-[13px]">
                    {formatDateBR(cob.dataVencimentoISO)} •{" "}
                    <strong>{money(cob.valor || 0)}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {hasErrors && (
          <p className="text-[11px] text-red-600">
            Identificamos campos obrigatórios pendentes. Se preferir, você pode
            voltar e revisar os dados, ou enviar a solicitação pelo WhatsApp.
          </p>
        )}

        <footer className="mt-2 flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            <CTAButton
              type="button"
              variant="outline"
              className="h-10 px-4 text-sm"
              onClick={onClose}
            >
              Voltar e revisar
            </CTAButton>
            <CTAButton
              type="button"
              variant="ghost"
              className="h-10 px-4 text-xs md:text-sm"
              onClick={onWhatsFallback}
            >
              Enviar dados por WhatsApp
            </CTAButton>
          </div>
          <CTAButton
            type="button"
            className="h-10 px-6 text-sm"
            onClick={onConfirm}
          >
            Confirmar e concluir
          </CTAButton>
        </footer>
      </div>
    </div>
  );
}
