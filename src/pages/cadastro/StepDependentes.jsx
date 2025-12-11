// src/pages/cadastro/StepDependentes.jsx
import { useState, useMemo } from "react";
import CTAButton from "@/components/ui/CTAButton";
import DateSelectBR from "@/components/DateSelectBR";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  PARENTESCOS_FALLBACK,
  PARENTESCO_LABELS,
  SEXO_OPTIONS,
} from "@/lib/constants";
import { cpfIsValid, formatCPF } from "@/lib/br";
import { ageFromDate } from "@/lib/dates";

const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

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

const emptyDraft = {
  nome: "",
  cpf: "",
  sexo: "",
  parentesco: "",
  data_nascimento: "",
};

function sexoLabelFromValue(v) {
  return SEXO_OPTIONS.find(([val]) => val === v)?.[1] || "";
}

export default function StepDependentes({
  glassCardStyle,
  // leitura / resumo
  depsExistentes,
  // dependentes novos armazenados em Cadastro.jsx
  depsNovos,
  depsIssuesNovos,
  addDepNovo,
  delDepNovo,
  updDepNovo,
  countDepsFora,
  idadeMinDep,
  idadeMaxDep,
  plano,
  stepAttempted,
  submitAttempted,
  setStepAttempted,
  validateDependentes,
  setCurrentStep,
}) {
  // ===== Estado local de UI =====
  const [mode, setMode] = useState(null); // null | "create" | "edit"
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [formAttempted, setFormAttempted] = useState(false);

  const dependentesCount = depsNovos.length;
  const showErrors = formAttempted || submitAttempted;

  const parentescosDisponiveis = useMemo(
    () =>
      plano?.parentescos?.length
        ? plano.parentescos
        : PARENTESCOS_FALLBACK.map(([v]) => v),
    [plano]
  );

  // ===== Validação local do formulário (apenas o draft atual) =====
  function validateDraft() {
    const errors = {};

    if (!(draft.nome || "").trim() || draft.nome.trim().length < 3) {
      errors.nome = "Informe o nome (mín. 3 caracteres).";
    }
    if (!draft.parentesco) {
      errors.parentesco = "Selecione o parentesco.";
    }
    if (!draft.sexo) {
      errors.sexo = "Selecione o sexo.";
    }

    if (!draft.data_nascimento) {
      errors.data_nascimento = "Informe a data de nascimento.";
    } else {
      const idade = ageFromDate(draft.data_nascimento);
      if (
        Number.isFinite(idadeMinDep) &&
        idade != null &&
        idade < Number(idadeMinDep)
      ) {
        errors.data_nascimento = "Data fora do limite mínimo de idade do plano.";
      }
      if (
        Number.isFinite(idadeMaxDep) &&
        idade != null &&
        idade > Number(idadeMaxDep)
      ) {
        errors.data_nascimento = "Data fora do limite máximo de idade do plano.";
      }
    }

    if (draft.cpf && !cpfIsValid(draft.cpf)) {
      errors.cpf = "CPF inválido.";
    }

    return errors;
  }

  // Helper visual
  function fieldRing(cond) {
    return cond ? "ring-1 ring-red-500" : "";
  }

  // ===== Entrar / sair de modos =====
  function openCreate() {
    setMode("create");
    setEditingIndex(null);
    setDraft(emptyDraft);
    setFormAttempted(false);
  }

  function openEdit(idx) {
    const d = depsNovos[idx];
    setMode("edit");
    setEditingIndex(idx);
    setDraft({
      nome: d.nome || "",
      cpf: d.cpf || "",
      sexo: d.sexo || "",
      parentesco: d.parentesco || "",
      data_nascimento: d.data_nascimento || "",
    });
    setFormAttempted(false);
  }

  function cancelForm() {
    setMode(null);
    setEditingIndex(null);
    setDraft(emptyDraft);
    setFormAttempted(false);
  }

  // ===== Salvar dependente (criar ou editar) =====
  function handleSave({ goNext = false } = {}) {
    setFormAttempted(true);
    const errors = validateDraft();
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      return false;
    }

    if (mode === "create") {
      const index = depsNovos.length;
      addDepNovo();
      updDepNovo(index, { ...draft });
    } else if (mode === "edit" && editingIndex != null) {
      updDepNovo(editingIndex, { ...draft });
    }

    cancelForm(); // limpa modo de formulário

    if (goNext) {
      setStepAttempted((prev) => ({ ...prev, dependentes: true }));
      if (validateDependentes()) {
        setCurrentStep(4);
      }
    }

    return true;
  }

  // ===== Ações de rodapé =====
  function handleContinue() {
    if (mode) {
      // Se está preenchendo um formulário, Continuar = Salvar + avançar
      handleSave({ goNext: true });
      return;
    }
    setStepAttempted((prev) => ({ ...prev, dependentes: true }));
    if (validateDependentes()) {
      setCurrentStep(4); // Etapa 4 – Cobranças
    }
  }

  // ===== Render =====
  return (
    <>
      {/* Dependentes existentes (somente leitura, resumo compacto) */}
      {depsExistentes.length > 0 && (
        <details
          className="mt-6 rounded-3xl border px-6 py-5 md:px-7 md:py-6 backdrop-blur-xl"
          style={glassCardStyle}
          open
        >
          <summary className="cursor-pointer list-none">
            <SectionTitle>Dependentes já cadastrados</SectionTitle>
          </summary>
          <div className="mt-4 space-y-2">
            {depsExistentes.map((d, i) => {
              const idade = d.data_nascimento
                ? ageFromDate(d.data_nascimento)
                : null;
              const parentescoLabel =
                PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—";

              return (
                <div
                  key={d.id || i}
                  className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/90 px-3 py-2 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--c-muted)]">
                      DEPENDENTE {i + 1}
                    </span>
                    <span className="text-[13px] font-medium leading-tight truncate">
                      {d.nome}
                    </span>
                    <span className="text-[11px] text-[var(--c-muted)]">
                      {parentescoLabel}
                      {idade != null
                        ? ` • ${idade} ano${idade === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Bloco principal de dependentes novos */}
      <div
        className="mt-6 rounded-3xl p-6 md:p-7 space-y-4"
        style={glassCardStyle}
      >
        <SectionTitle
          right={
            !mode && (
              <CTAButton
                type="button"
                onClick={openCreate}
                className="h-10 px-4 text-sm"
              >
                <Plus size={16} className="mr-2" />
                Adicionar dependente
              </CTAButton>
            )
          }
        >
          Dependentes do plano{" "}
          <span className="text-xs font-normal text-[var(--c-muted)]">
            ({dependentesCount} novo
            {dependentesCount === 1 ? "" : "s"})
          </span>
        </SectionTitle>

        <p className="text-xs md:text-sm text-[var(--c-muted)]">
          Você pode incluir <strong>dependentes adicionais</strong> ao plano.
          Este passo é opcional e pode ser feito com calma; ele pode impactar o
          valor da mensalidade conforme as regras do plano.
        </p>

        {/* Lista de dependentes novos – resumo enxuto (nome, parentesco, idade) */}
        {!mode && depsNovos.length > 0 && (
          <div className="space-y-2">
            {depsNovos.map((d, idx) => {
              const idade = d.data_nascimento
                ? ageFromDate(d.data_nascimento)
                : null;
              const parentescoLabel =
                PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—";

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 px-3 py-2 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--c-muted)]">
                      DEPENDENTE {idx + 1}
                    </span>
                    <span className="text-[13px] font-medium leading-tight truncate">
                      {d.nome}
                    </span>
                    <span className="text-[11px] text-[var(--c-muted)]">
                      {parentescoLabel}
                      {idade != null
                        ? ` • ${idade} ano${idade === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[var(--primary)] hover:opacity-80"
                      onClick={() => openEdit(idx)}
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-red-600 hover:opacity-80"
                      onClick={() => delDepNovo(idx)}
                    >
                      <Trash2 size={14} /> Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado vazio quando não há dependentes e não está no modo formulário */}
        {!mode && depsNovos.length === 0 && (
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)]/70 p-4 text-sm text-[var(--c-muted)] flex flex-col items-start gap-2">
            <p className="font-medium text-[13px]">
              Nenhum dependente adicional cadastrado.
            </p>
            <p className="text-xs">
              Se preferir, você pode seguir sem dependentes agora.
            </p>
          </div>
        )}

        {/* Formulário de criação/edição */}
        {mode && (
          <div className="mt-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">
                {mode === "create" ? "Novo dependente" : "Editar dependente"}
              </span>
              <button
                type="button"
                onClick={cancelForm}
                className="text-xs text-[var(--c-muted)] hover:text-[var(--text)]"
              >
                Cancelar
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-12">
              {/* Nome */}
              <div className="md:col-span-6">
                <label className="label text-xs font-medium" htmlFor="dep-nome">
                  Nome completo {requiredStar}
                </label>
                <input
                  id="dep-nome"
                  className={`input h-11 w-full text-sm ${fieldRing(
                    showErrors &&
                      (!(draft.nome || "").trim() ||
                        draft.nome.trim().length < 3)
                  )}`}
                  placeholder="Nome do dependente"
                  value={draft.nome}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, nome: e.target.value }))
                  }
                />
                {showErrors &&
                  (!(draft.nome || "").trim() ||
                    draft.nome.trim().length < 3) && (
                    <p
                      className="text-xs text-red-600 mt-1"
                      role="alert"
                      aria-live="polite"
                    >
                      Informe o nome (mín. 3 caracteres).
                    </p>
                  )}
              </div>

              {/* Parentesco */}
              <div className="md:col-span-3">
                <label
                  className="label text-xs font-medium"
                  htmlFor="dep-parentesco"
                >
                  Parentesco {requiredStar}
                </label>
                <select
                  id="dep-parentesco"
                  className={`input h-11 w-full text-sm ${fieldRing(
                    showErrors && !draft.parentesco
                  )}`}
                  value={draft.parentesco}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, parentesco: e.target.value }))
                  }
                >
                  <option value="">Selecione…</option>
                  {parentescosDisponiveis.map((v) => (
                    <option key={v} value={v}>
                      {PARENTESCO_LABELS[v] || v}
                    </option>
                  ))}
                </select>
                {showErrors && !draft.parentesco && (
                  <p
                    className="text-xs text-red-600 mt-1"
                    role="alert"
                    aria-live="polite"
                  >
                    Selecione o parentesco.
                  </p>
                )}
              </div>

              {/* Sexo */}
              <div className="md:col-span-3">
                <label className="label text-xs font-medium" htmlFor="dep-sexo">
                  Sexo {requiredStar}
                </label>
                <select
                  id="dep-sexo"
                  className={`input h-11 w-full text-sm ${fieldRing(
                    showErrors && !draft.sexo
                  )}`}
                  value={draft.sexo}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, sexo: e.target.value }))
                  }
                >
                  <option value="">Selecione…</option>
                  {SEXO_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                {showErrors && !draft.sexo && (
                  <p
                    className="text-xs text-red-600 mt-1"
                    role="alert"
                    aria-live="polite"
                  >
                    Selecione o sexo.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-12 mt-3">
              {/* CPF opcional */}
              <div className="md:col-span-6">
                <label className="label text-xs font-medium" htmlFor="dep-cpf">
                  CPF (opcional)
                </label>
                <input
                  id="dep-cpf"
                  className={`input h-11 w-full text-sm ${
                    draft.cpf && !cpfIsValid(draft.cpf)
                      ? "ring-1 ring-red-500"
                      : ""
                  }`}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={formatCPF(draft.cpf || "")}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, cpf: e.target.value }))
                  }
                />
                {draft.cpf && !cpfIsValid(draft.cpf) && (
                  <p
                    className="text-xs text-red-600 mt-1"
                    role="alert"
                    aria-live="polite"
                  >
                    CPF inválido.
                  </p>
                )}
              </div>

              {/* Data nascimento */}
              <div className="md:col-span-6">
                <label className="label text-xs font-medium">
                  Data de nascimento {requiredStar}
                </label>
                <DateSelectBR
                  className="w-full"
                  idPrefix="dep-nasc"
                  valueISO={draft.data_nascimento}
                  onChangeISO={(iso) =>
                    setDraft((d) => ({ ...d, data_nascimento: iso }))
                  }
                  invalid={Boolean(
                    showErrors &&
                      (!draft.data_nascimento ||
                        Object.keys(
                          (() => {
                            const e = validateDraft();
                            const { data_nascimento, ...rest } = e;
                            return data_nascimento ? { data_nascimento } : {};
                          })()
                        ).length > 0)
                  )}
                  minAge={
                    Number.isFinite(idadeMinDep)
                      ? Number(idadeMinDep)
                      : undefined
                  }
                  maxAge={
                    Number.isFinite(idadeMaxDep)
                      ? Number(idadeMaxDep)
                      : undefined
                  }
                />
                {showErrors && !draft.data_nascimento && (
                  <p
                    className="text-xs text-red-600 mt-1"
                    role="alert"
                    aria-live="polite"
                  >
                    Informe a data de nascimento.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 justify-between">
              <CTAButton
                type="button"
                variant="outline"
                className="h-10 px-4 text-sm"
                onClick={() => setDraft(emptyDraft)}
              >
                Limpar campos
              </CTAButton>
              <CTAButton
                type="button"
                className="h-10 px-5 text-sm"
                onClick={() => handleSave({ goNext: false })}
              >
                Salvar dependente
              </CTAButton>
            </div>
          </div>
        )}

        {countDepsFora > 0 && !mode && (
          <p
            className="mt-2 text-xs inline-flex items-center gap-1 text-red-600"
            role="alert"
            aria-live="polite"
          >
            {countDepsFora} dependente(s) fora do limite etário do plano.
          </p>
        )}

        {/* Rodapé da etapa */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <CTAButton
            type="button"
            variant="outline"
            className="h-11 px-5"
            onClick={() => {
              if (mode) {
                cancelForm();
              } else {
                setCurrentStep(2); // volta para Endereço
              }
            }}
          >
            Voltar
          </CTAButton>
          <CTAButton
            type="button"
            className="h-11 px-6"
            onClick={handleContinue}
          >
            Continuar
          </CTAButton>
        </div>
      </div>
    </>
  );
}
