import {
  formatCPF,
  maskCPF,
  cpfIsValid,
  normalizeISODate,
} from "@/lib/br";
import { Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

/* Parentescos permitidos — pode vir do servidor em versões futuras */
const PARENTESCOS = [
  "Cônjuge",
  "Filho(a)",
  "Enteado(a)",
  "Pai",
  "Mãe",
  "Sogro(a)",
  "Irmão(ã)",
  "Avô/Avó",
  "Neto(a)",
  "Outro",
];

/* ============================================================
   STEP 3 — DEPENDENTES
   ============================================================ */
export default function Step3Dependentes({
  dependentes,
  onChange,
  onNext,
  onPrev,
}) {
  const list = dependentes || [];

  /* --------------------------
     ALTERAR CAMPO DE DEPENDENTE
     -------------------------- */
  function update(i, field, value) {
    const clone = [...list];
    clone[i] = { ...clone[i], [field]: value };
    onChange(clone);
  }

  /* --------------------------
     ADICIONAR NOVO DEPENDENTE
     -------------------------- */
  function addDep() {
    onChange([
      ...list,
      {
        nome: "",
        cpf: "",
        dataNascimento: "",
        parentesco: "",
      },
    ]);
  }

  /* --------------------------
     REMOVER DEPENDENTE
     -------------------------- */
  function removeDep(i) {
    const clone = [...list];
    clone.splice(i, 1);
    onChange(clone);
  }

  /* --------------------------
     VALIDAÇÃO DO STEP
     -------------------------- */
  const stepValid =
    list.length > 0 &&
    list.every((d) => {
      return (
        d.nome?.trim() &&
        d.parentesco?.trim() &&
        d.dataNascimento &&
        (!d.cpf || cpfIsValid(d.cpf))
      );
    });

  return (
    <div className="space-y-10 pb-10">

      {/* TÍTULO */}
      <h2 className="text-xl font-semibold text-[var(--c-strong)]">
        Dependentes do Plano
      </h2>

      {/* LISTAGEM */}
      <div className="space-y-8">
        {list.map((dep, idx) => {
          const cpfFilled = dep.cpf && dep.cpf.trim().length >= 11;
          const cpfInvalid = cpfFilled && !cpfIsValid(dep.cpf);

          return (
            <div
              key={idx}
              className="rounded-2xl p-5 bg-[var(--c-surface-1)] border border-[var(--c-surface-2)] shadow-sm space-y-5"
            >
              {/* Cabeçalho do bloco */}
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium text-[var(--c-strong)]">
                  Dependente {idx + 1}
                </h3>

                <button
                  className="p-2 rounded-xl bg-[var(--c-surface-2)] text-[var(--c-muted-strong)] hover:bg-[var(--c-surface-3)] transition"
                  onClick={() => removeDep(idx)}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Campo - Nome */}
              <InputBlock label="Nome completo">
                <input
                  type="text"
                  className="input-premium"
                  placeholder="Nome completo"
                  value={dep.nome || ""}
                  onChange={(ev) => update(idx, "nome", ev.target.value)}
                />
              </InputBlock>

              {/* Campo - CPF */}
              <InputBlock label="CPF (opcional)">
                <input
                  type="text"
                  className="input-premium"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={maskCPF(dep.cpf || "")}
                  onChange={(ev) => update(idx, "cpf", formatCPF(ev.target.value))}
                />
                {cpfInvalid && (
                  <InlineError>CPF inválido</InlineError>
                )}
              </InputBlock>

              {/* Campo - Data de nascimento */}
              <InputBlock label="Data de Nascimento">
                <input
                  type="date"
                  className="input-premium"
                  value={normalizeISODate(dep.dataNascimento || "")}
                  onChange={(ev) =>
                    update(idx, "dataNascimento", normalizeISODate(ev.target.value))
                  }
                />
              </InputBlock>

              {/* Campo - Parentesco */}
              <InputBlock label="Parentesco">
                <select
                  className="input-premium"
                  value={dep.parentesco || ""}
                  onChange={(ev) => update(idx, "parentesco", ev.target.value)}
                >
                  <option value="">Selecione</option>
                  {PARENTESCOS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </InputBlock>
            </div>
          );
        })}
      </div>

      {/* Botão adicionar dependente */}
      <button
        onClick={addDep}
        className="w-full h-14 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-strong)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--c-surface-3)] transition"
      >
        <Plus size={20} /> Adicionar dependente
      </button>

      {/* Navegação */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={onPrev}
          className="w-1/2 h-14 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-muted-strong)] flex items-center justify-center gap-2"
        >
          <ChevronLeft size={20} />
          Voltar
        </button>

        <button
          onClick={onNext}
          disabled={!stepValid}
          className={`w-1/2 h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all
            ${
              stepValid
                ? "bg-[var(--primary)] text-white shadow-lg active:scale-[0.97]"
                : "bg-[var(--c-surface-2)] text-[var(--c-muted)] opacity-50"
            }
          `}
        >
          Continuar
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   BLOCO PREMIUM
   ------------------------------------------------------------ */
function InputBlock({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--c-muted-strong)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function InlineError({ children }) {
  return (
    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
      <AlertTriangle size={14} />
      {children}
    </div>
  );
}
