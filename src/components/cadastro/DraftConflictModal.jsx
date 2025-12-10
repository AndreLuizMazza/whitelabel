// src/components/cadastro/DraftConflictModal.jsx
export default function DraftConflictModal({ onUseLocal, onUseRemote }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--c-surface)] p-5 shadow-2xl border border-[var(--c-border)]">
        <h2 className="text-base font-semibold mb-2">
          Rascunho encontrado
        </h2>
        <p className="text-sm text-[var(--c-muted)] mb-4">
          Encontramos um rascunho anterior deste cadastro neste dispositivo.
          Você prefere continuar com os dados salvos ou descartar e usar
          apenas as informações atuais?
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onUseRemote}
            className="inline-flex justify-center rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--c-surface-strong)]"
          >
            Usar rascunho salvo
          </button>
          <button
            type="button"
            onClick={onUseLocal}
            className="inline-flex justify-center rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Manter dados atuais
          </button>
        </div>
      </div>
    </div>
  );
}
