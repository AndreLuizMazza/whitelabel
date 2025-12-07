import DateSelectBR from "@/components/DateSelectBR";
import { Trash2 } from "lucide-react";
import { maskCPF } from "@/lib/br";

export default function DependenteNovoCard({ data, onChange, onRemove, parentescos }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div
      className="rounded-2xl p-4 border shadow-sm"
      style={{
        background:
          "color-mix(in srgb, var(--c-surface) 94%, transparent)",
        borderColor:
          "color-mix(in srgb, var(--c-border) 70%, transparent)",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold tracking-tight">Novo dependente</h3>

        <button
          onClick={onRemove}
          className="p-2 rounded-full hover:bg-[var(--c-surface-hover)] transition"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs font-medium">Nome</label>
          <input
            type="text"
            value={data.nome || ""}
            onChange={(e) => update("nome", e.target.value)}
            className="input-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium">CPF</label>
          <input
            type="text"
            maxLength={14}
            value={maskCPF(data.cpf || "")}
            onChange={(e) => update("cpf", e.target.value)}
            className="input-primary"
          />
        </div>

        <DateSelectBR
          label="Data de nascimento"
          value={data.dataNascimento || ""}
          onChange={(v) => update("dataNascimento", v)}
        />

        <div>
          <label className="text-xs font-medium">Parentesco</label>
          <select
            value={data.parentesco || ""}
            onChange={(e) => update("parentesco", e.target.value)}
            className="input-primary"
          >
            <option value="">Selecione…</option>
            {parentescos.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
