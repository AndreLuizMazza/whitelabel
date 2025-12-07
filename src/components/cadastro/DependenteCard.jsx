import { Trash2 } from "lucide-react";

export default function DependenteCard({ dependente, onRemove }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-2xl border shadow-sm"
      style={{
        background:
          "color-mix(in srgb, var(--c-surface) 94%, transparent)",
        borderColor:
          "color-mix(in srgb, var(--c-border) 70%, transparent)",
      }}
    >
      <div>
        <p className="font-semibold text-sm">{dependente.nome}</p>
        <p className="text-xs text-[var(--c-muted)] mt-0.5">
          {dependente.parentescoLabel} • {dependente.idade} anos
        </p>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="p-2 rounded-full hover:bg-[var(--c-surface-hover)] transition"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
      )}
    </div>
  );
}
