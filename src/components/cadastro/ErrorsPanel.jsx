/**
 * Painel de erros clicáveis.
 * Props:
 * - errorList: [{field,label}]
 * - onGoto(field)
 * - errorCount
 * - alertRef
 */
export default function ErrorsPanel({ errorList, onGoto, errorCount, alertRef }){
  if(!errorList?.length) return null;
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm mb-4"
      style={{
        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
        background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
        color: 'var(--text)',
      }}
      role="alert"
      aria-live="assertive"
      ref={alertRef}
      tabIndex={-1}
    >
      <p className="font-medium mb-1">Corrija os itens abaixo ({errorCount}):</p>
      <ul className="list-disc ml-5 space-y-1">
        {errorList.map((it, idx) => (
          <li key={idx}>
            <button type="button" className="underline hover:opacity-80" onClick={() => onGoto(it.field)}>
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
