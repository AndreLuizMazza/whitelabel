// src/components/premium/PremiumOverlay.jsx
import { Loader2 } from "lucide-react";

/**
 * Overlay full-screen enquanto o cadastro/assinatura está sendo processado.
 * Versão sem lottie-react, usando apenas ícone de carregamento.
 */
export default function PremiumOverlay({
  open,
  title = "Finalizando sua contratação",
  subtitle = "Estamos gerando seu contrato e a primeira cobrança.",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      aria-live="polite"
      aria-busy="true"
    >
      {/* fundo escurecido com blur */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[10px]" />

      {/* cartão central */}
      <div
        className="relative max-w-sm w-full rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 shadow-[0_24px_90px_rgba(0,0,0,0.6)] p-6 flex flex-col items-center text-center space-y-4"
      >
        <div className="flex items-center justify-center">
          <div className="h-14 w-14 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/90 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-[var(--c-muted)]">
            {subtitle}
          </p>
        </div>

        <p className="text-[11px] text-[var(--c-muted)]">
          Não feche esta janela. Assim que concluirmos, você será redirecionado para o resumo.
        </p>
      </div>
    </div>
  );
}
