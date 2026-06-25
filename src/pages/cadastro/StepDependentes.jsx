// src/pages/cadastro/StepDependentes.jsx
import { useMemo, useRef, useState } from "react";
import CTAButton from "@/components/ui/CTAButton";
import DateSelectBR from "@/components/DateSelectBR";
import { Plus, Trash2, Pencil, UsersRound, Info, X } from "lucide-react";
import {
  PARENTESCOS_FALLBACK,
  PARENTESCO_LABELS,
  SEXO_OPTIONS,
} from "@/lib/constants";
import { cpfIsValid, formatCPF, onlyDigits } from "@/lib/br";
import { ageFromDate } from "@/lib/dates";

const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

const emptyDraft = {
  nome: "",
  cpf: "", // guardamos só dígitos para evitar “pulos” no cursor
  sexo: "",
  parentesco: "",
  data_nascimento: "",
};

function isTitularRow(d) {
  const p = String(d?.parentesco || "").trim().toUpperCase();
  const l = String(PARENTESCO_LABELS?.[d?.parentesco] || "")
    .trim()
    .toUpperCase();
  return (
    p === "TITULAR" ||
    l === "TITULAR" ||
    d?.isTitular === true ||
    d?.titular === true ||
    String(d?.tipo || "").toUpperCase() === "TITULAR"
  );
}

function cardStyle() {
  return {
    background: "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
    borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
  };
}
function panelStyle() {
  return {
    background:
      "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
    borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
  };
}

function fieldRing(cond) {
  return cond ? "ring-1 ring-red-500" : "";
}

export default function StepDependentes({
  glassCardStyle, // mantido por compatibilidade
  depsExistentes,
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
  // ===== UI / modos =====
  const [mode, setMode] = useState(null); // null | "create" | "edit"
  const [editingIndex, setEditingIndex] = useState(null);

  // Draft local (não mexe em depsNovos enquanto digita -> evita re-render “agressivo” vindo do pai)
  const [draft, setDraft] = useState(emptyDraft);
  const [formAttempted, setFormAttempted] = useState(false);

  // Refs
  const nomeRef = useRef(null);
  const cpfRef = useRef(null);

  const dependentesCount = depsNovos.length;

  const parentescosDisponiveis = useMemo(
    () =>
      plano?.parentescos?.length
        ? plano.parentescos
        : PARENTESCOS_FALLBACK.map(([v]) => v),
    [plano]
  );

  const depsExistentesSemTitular = useMemo(() => {
    return (depsExistentes || []).filter((d) => !isTitularRow(d));
  }, [depsExistentes]);

  // ===== validação do draft =====
  function validateDraft(nextDraft = draft) {
    const errors = {};
    const nome = (nextDraft.nome || "").trim();

    if (!nome || nome.length < 3)
      errors.nome = "Informe o nome (mín. 3 caracteres).";
    if (!nextDraft.parentesco) errors.parentesco = "Selecione o parentesco.";
    if (!nextDraft.sexo) errors.sexo = "Selecione o sexo.";

    if (!nextDraft.data_nascimento) {
      errors.data_nascimento = "Informe a data de nascimento.";
    } else {
      const idade = ageFromDate(nextDraft.data_nascimento);
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

    if (nextDraft.cpf) {
      // nextDraft.cpf está só dígitos
      if (nextDraft.cpf.length !== 11 || !cpfIsValid(nextDraft.cpf)) {
        errors.cpf = "CPF inválido.";
      }
    }

    return errors;
  }

  const draftErrors = useMemo(
    () => (formAttempted ? validateDraft(draft) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      formAttempted,
      draft.nome,
      draft.cpf,
      draft.sexo,
      draft.parentesco,
      draft.data_nascimento,
    ]
  );

  // ===== ações =====
  function openCreate() {
    setMode("create");
    setEditingIndex(null);
    setDraft(emptyDraft);
    setFormAttempted(false);

    // foco somente ao abrir o formulário (sem “auto-refocus” a cada mudança de estado)
    requestAnimationFrame(() => nomeRef.current?.focus?.());
  }

  function openEdit(idx) {
    const d = depsNovos[idx] || {};
    setMode("edit");
    setEditingIndex(idx);
    setDraft({
      nome: d.nome || "",
      cpf: onlyDigits(d.cpf || ""),
      sexo: d.sexo || "",
      parentesco: d.parentesco || "",
      data_nascimento: d.data_nascimento || "",
    });
    setFormAttempted(false);

    requestAnimationFrame(() => nomeRef.current?.focus?.());
  }

  function cancelForm() {
    setMode(null);
    setEditingIndex(null);
    setDraft(emptyDraft);
    setFormAttempted(false);
  }

  function saveDraft() {
    setFormAttempted(true);

    const errors = validateDraft(draft);
    if (Object.keys(errors).length > 0) {
      // foco no primeiro campo inválido (sem “roubar” foco durante o preenchimento normal)
      if (errors.nome) {
        requestAnimationFrame(() => nomeRef.current?.focus?.());
      } else if (errors.cpf) {
        requestAnimationFrame(() => cpfRef.current?.focus?.());
      }
      return false;
    }

    if (mode === "create") {
      const index = depsNovos.length;
      addDepNovo();
      updDepNovo(index, { ...draft, cpf: draft.cpf }); // cpf já em dígitos
    } else if (mode === "edit" && editingIndex != null) {
      updDepNovo(editingIndex, { ...draft, cpf: draft.cpf });
    }

    cancelForm();
    return true;
  }

  function handleContinue() {
    if (mode) {
      const ok = saveDraft();
      if (!ok) return;
    }

    setStepAttempted((prev) => ({ ...prev, dependentes: true }));
    if (validateDependentes()) setCurrentStep(4);
  }

  // ===== FIX UX: não exibir “pendências” genéricas na lista por padrão =====
  const showListIssues = false; // submitAttempted || stepAttempted?.dependentes;

  // ===== estilos auxiliares (premium) =====
  const inputSurface = {
    background:
      "color-mix(in srgb, var(--surface) 92%, var(--text) 2%)",
    borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
  };

  const inputClass = (hasError) =>
    `input h-11 sm:h-12 w-full min-w-0 text-base ${fieldRing(hasError)}`;

  return (
    <div className="min-w-0 overflow-x-hidden">
      {/* Dependentes existentes (somente leitura) — sem titular */}
      {depsExistentesSemTitular.length > 0 && (
        <div
          className="mb-3 sm:mb-4 rounded-xl border p-3 sm:p-4 min-w-0 overflow-hidden"
          style={{ borderColor: "var(--c-border)", background: "var(--surface-alt, var(--surface))" }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold tracking-tight flex items-center gap-2">
                <UsersRound size={18} className="shrink-0" />
                Dependentes já cadastrados
              </p>
              <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: "var(--text-muted)" }}>
                Lista somente para conferência.
              </p>
            </div>

            <span
              className="self-start shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs"
              style={{
                background: "color-mix(in srgb, var(--surface) 85%, transparent)",
                color: "var(--text-muted)",
                border: "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
              }}
            >
              {depsExistentesSemTitular.length} item
              {depsExistentesSemTitular.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-3 sm:mt-4 space-y-2">
            {depsExistentesSemTitular.map((d, i) => {
              const idade = d.data_nascimento ? ageFromDate(d.data_nascimento) : null;
              const parentescoLabel =
                PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—";

              return (
                <div
                  key={d.id || i}
                  className="rounded-xl sm:rounded-2xl border px-3 py-2.5 shadow-sm min-w-0"
                  style={{
                    borderColor: "color-mix(in srgb, var(--text) 12%, transparent)",
                    background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-[10px] font-semibold tracking-[0.16em] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      DEPENDENTE {i + 1}
                    </span>
                    <span className="text-sm font-medium leading-tight break-words">
                      {d.nome}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {parentescoLabel}
                      {idade != null ? ` • ${idade} ano${idade === 1 ? "" : "s"}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 min-w-0">
        {!mode && (
          <p className="text-xs sm:text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
            Opcional — adicione dependentes agora ou continue sem incluir ninguém.
          </p>
        )}

        <div
          className="rounded-xl border p-3 sm:p-4 md:p-5 min-w-0 overflow-hidden"
          style={{ borderColor: "var(--c-border)", background: "var(--surface)" }}
        >
          {!mode && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold tracking-tight">
                    Dependentes do plano
                  </p>

                  {countDepsFora > 0 ? (
                    <p className="text-xs sm:text-sm mt-1 text-red-600 inline-flex items-center gap-2">
                      <Info size={16} className="shrink-0" />
                      {countDepsFora} dependente(s) fora do limite etário do plano.
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                      Resumo com nome, parentesco e idade.
                    </p>
                  )}
                </div>

                <CTAButton
                  type="button"
                  onClick={openCreate}
                  className="w-full sm:w-auto h-11 min-h-[44px] px-4 text-sm rounded-xl sm:rounded-2xl shrink-0"
                >
                  <Plus size={16} className="mr-2" />
                  Adicionar dependente
                </CTAButton>
              </div>

              {depsNovos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {depsNovos.map((d, idx) => {
                    const idade = d.data_nascimento ? ageFromDate(d.data_nascimento) : null;
                    const parentescoLabel = PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—";

                    const issue = depsIssuesNovos?.[idx];
                    const showIssue =
                      showListIssues && typeof issue === "string" && issue.trim().length > 0;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl sm:rounded-2xl border px-3 py-2.5 shadow-sm ${
                          showIssue ? "ring-1 ring-red-500" : ""
                        }`}
                        style={{
                          borderColor: "color-mix(in srgb, var(--text) 12%, transparent)",
                          background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                        }}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <span
                              className="text-[10px] font-semibold tracking-[0.16em] uppercase"
                              style={{ color: "var(--text-muted)" }}
                            >
                              DEPENDENTE {idx + 1}
                            </span>
                            <span className="text-sm font-medium leading-tight break-words">
                              {d.nome}
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {parentescoLabel}
                              {idade != null ? ` • ${idade} ano${idade === 1 ? "" : "s"}` : ""}
                            </span>

                            {showIssue && (
                              <span className="text-xs text-red-600 mt-1">{issue}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-stretch sm:self-center">
                            <button
                              type="button"
                              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1 min-h-[44px] px-3 rounded-lg border text-xs sm:text-sm hover:opacity-80"
                              style={{
                                color: "var(--primary)",
                                borderColor: "var(--c-border)",
                              }}
                              onClick={() => openEdit(idx)}
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1 min-h-[44px] px-3 rounded-lg border text-xs sm:text-sm text-red-600 hover:opacity-80"
                              style={{ borderColor: "var(--c-border)" }}
                              onClick={() => delDepNovo(idx)}
                            >
                              <Trash2 size={14} /> Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {depsNovos.length === 0 && (
                <div
                  className="mt-4 rounded-xl sm:rounded-2xl border border-dashed p-3 sm:p-4"
                  style={{
                    borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
                    background: "color-mix(in srgb, var(--surface) 94%, var(--text) 3%)",
                    color: "var(--text-muted)",
                  }}
                >
                  <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                    Nenhum dependente adicional cadastrado.
                  </p>
                  <p className="text-xs sm:text-sm mt-1">
                    Se preferir, avance para pagamento e finalize o cadastro.
                  </p>
                </div>
              )}
            </>
          )}

          {mode && (
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-semibold leading-tight">
                    {mode === "create" ? "Novo dependente" : "Editar dependente"}
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
                    Campos com * são obrigatórios.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelForm}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:opacity-80 shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Cancelar cadastro de dependente"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4 min-w-0">
                <div className="min-w-0">
                  <label className="label font-medium text-sm" htmlFor="dep-nome">
                    Nome completo {requiredStar}
                  </label>
                  <input
                    id="dep-nome"
                    ref={nomeRef}
                    className={`${inputClass(formAttempted && !!draftErrors.nome)} mt-1.5`}
                    style={inputSurface}
                    placeholder="Nome do dependente"
                    value={draft.nome}
                    onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                    autoComplete="name"
                  />
                  {formAttempted && draftErrors.nome && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.nome}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                  <div className="min-w-0">
                    <label className="label font-medium text-sm" htmlFor="dep-parentesco">
                      Parentesco {requiredStar}
                    </label>
                    <select
                      id="dep-parentesco"
                      className={`${inputClass(formAttempted && !!draftErrors.parentesco)} mt-1.5`}
                      style={inputSurface}
                      value={draft.parentesco}
                      onChange={(e) => setDraft((d) => ({ ...d, parentesco: e.target.value }))}
                    >
                      <option value="">Selecione…</option>
                      {parentescosDisponiveis.map((v) => (
                        <option key={v} value={v}>
                          {PARENTESCO_LABELS[v] || v}
                        </option>
                      ))}
                    </select>
                    {formAttempted && draftErrors.parentesco && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        {draftErrors.parentesco}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="label font-medium text-sm" htmlFor="dep-sexo">
                      Sexo {requiredStar}
                    </label>
                    <select
                      id="dep-sexo"
                      className={`${inputClass(formAttempted && !!draftErrors.sexo)} mt-1.5`}
                      style={inputSurface}
                      value={draft.sexo}
                      onChange={(e) => setDraft((d) => ({ ...d, sexo: e.target.value }))}
                    >
                      <option value="">Selecione…</option>
                      {SEXO_OPTIONS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    {formAttempted && draftErrors.sexo && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        {draftErrors.sexo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="label font-medium text-sm" htmlFor="dep-cpf">
                    CPF (opcional)
                  </label>
                  <input
                    id="dep-cpf"
                    ref={cpfRef}
                    className={`${inputClass(formAttempted && !!draftErrors.cpf)} mt-1.5`}
                    style={inputSurface}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={formatCPF(draft.cpf || "")}
                    onChange={(e) => {
                      const digits = onlyDigits(e.target.value).slice(0, 11);
                      setDraft((d) => ({ ...d, cpf: digits }));
                    }}
                    autoComplete="off"
                  />
                  {formAttempted && draftErrors.cpf && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.cpf}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label className="label font-medium text-sm">
                    Data de nascimento {requiredStar}
                  </label>
                  <div className="mt-1.5">
                    <DateSelectBR
                      className="w-full min-w-0"
                      idPrefix="dep-nasc"
                      valueISO={draft.data_nascimento}
                      onChangeISO={(iso) => setDraft((d) => ({ ...d, data_nascimento: iso }))}
                      invalid={Boolean(formAttempted && !!draftErrors.data_nascimento)}
                      minAge={Number.isFinite(idadeMinDep) ? Number(idadeMinDep) : undefined}
                      maxAge={Number.isFinite(idadeMaxDep) ? Number(idadeMaxDep) : undefined}
                    />
                  </div>
                  {formAttempted && draftErrors.data_nascimento && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.data_nascimento}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:gap-3">
                <CTAButton
                  type="button"
                  className="w-full min-h-[48px] h-12 px-5 text-sm rounded-xl sm:rounded-2xl !whitespace-normal text-center"
                  onClick={saveDraft}
                >
                  Salvar dependente
                </CTAButton>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CTAButton
                    type="button"
                    variant="outline"
                    className="w-full min-h-[44px] h-11 px-4 text-sm rounded-xl sm:rounded-2xl !whitespace-normal text-center"
                    onClick={cancelForm}
                  >
                    Voltar para lista
                  </CTAButton>

                  <CTAButton
                    type="button"
                    variant="outline"
                    className="w-full min-h-[44px] h-11 px-4 text-sm rounded-xl sm:rounded-2xl !whitespace-normal text-center"
                    onClick={() => {
                      setDraft(emptyDraft);
                      setFormAttempted(false);
                      requestAnimationFrame(() => nomeRef.current?.focus?.());
                    }}
                  >
                    Limpar campos
                  </CTAButton>
                </div>
              </div>

              <p className="mt-3 text-[11px] sm:text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Dica: se o plano tiver limite de idade, a data de nascimento será validada automaticamente.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-1">
          <CTAButton
            type="button"
            variant="outline"
            className="w-full sm:w-auto min-h-[48px] h-12 px-5 rounded-xl sm:rounded-2xl"
            onClick={() => {
              if (mode) cancelForm();
              else setCurrentStep(2);
            }}
          >
            Voltar
          </CTAButton>

          <CTAButton
            type="button"
            className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-xl sm:rounded-2xl"
            onClick={handleContinue}
          >
            Continuar
          </CTAButton>
        </div>
      </div>
    </div>
  );
}
