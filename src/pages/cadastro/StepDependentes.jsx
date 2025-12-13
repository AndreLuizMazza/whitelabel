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

  return (
    <>
      {/* Dependentes existentes (somente leitura) — sem titular */}
      {depsExistentesSemTitular.length > 0 && (
        <div className="mt-6 rounded-3xl border p-5 md:p-6" style={panelStyle()}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm md:text-base font-semibold tracking-tight flex items-center gap-2">
                <UsersRound size={18} />
                Dependentes já cadastrados
              </p>
              <p
                className="text-xs md:text-sm mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Lista somente para conferência.
              </p>
            </div>

            <span
              className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] md:text-xs"
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

          <div className="mt-4 space-y-2">
            {depsExistentesSemTitular.map((d, i) => {
              const idade = d.data_nascimento ? ageFromDate(d.data_nascimento) : null;
              const parentescoLabel =
                PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—";

              return (
                <div
                  key={d.id || i}
                  className="rounded-2xl border px-3 py-2 shadow-sm flex items-center justify-between gap-3"
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
                    <span className="text-[13px] md:text-sm font-medium leading-tight truncate">
                      {d.nome}
                    </span>
                    <span className="text-[11px] md:text-xs" style={{ color: "var(--text-muted)" }}>
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

      {/* Card principal */}
      <div className="mt-6 rounded-3xl border shadow-xl p-6 md:p-8" style={cardStyle()}>
        {/* Cabeçalho */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">
              Etapa 3 de 4 · Dependentes
            </p>

            <span
              className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[11px] md:text-xs"
              style={{
                background: "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
                color: "var(--text-muted)",
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--primary)" }}
              />
              {dependentesCount} novo{dependentesCount === 1 ? "" : "s"}
            </span>
          </div>

          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{
              background: "color-mix(in srgb, var(--surface-elevated) 80%, var(--text) 6%)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: "75%", background: "var(--primary)" }}
            />
          </div>

          <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
            Este passo é opcional. Você pode adicionar dependentes agora ou seguir sem incluir ninguém.
          </p>
        </div>

        {/* Painel interno */}
        <div className="mt-5 rounded-2xl border p-4 md:p-5" style={panelStyle()}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm md:text-base font-semibold tracking-tight">
                Dependentes do plano
              </p>

              {countDepsFora > 0 && !mode ? (
                <p className="text-xs md:text-sm mt-1 text-red-600 inline-flex items-center gap-2">
                  <Info size={16} />
                  {countDepsFora} dependente(s) fora do limite etário do plano.
                </p>
              ) : (
                <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Resumo com nome, parentesco e idade.
                </p>
              )}
            </div>

            {!mode && (
              <CTAButton
                type="button"
                onClick={openCreate}
                className="h-11 px-4 text-sm rounded-2xl"
              >
                <Plus size={16} className="mr-2" />
                Adicionar
              </CTAButton>
            )}
          </div>

          {/* Lista resumo */}
          {!mode && depsNovos.length > 0 && (
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
                    className={`rounded-2xl border px-3 py-2 shadow-sm flex items-center justify-between gap-3 ${
                      showIssue ? "ring-1 ring-red-500" : ""
                    }`}
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
                        DEPENDENTE {idx + 1}
                      </span>
                      <span className="text-[13px] md:text-sm font-medium leading-tight truncate">
                        {d.nome}
                      </span>
                      <span className="text-[11px] md:text-xs" style={{ color: "var(--text-muted)" }}>
                        {parentescoLabel}
                        {idade != null ? ` • ${idade} ano${idade === 1 ? "" : "s"}` : ""}
                      </span>

                      {showIssue && (
                        <span className="text-[11px] md:text-xs text-red-600 mt-1">
                          {issue}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:opacity-80"
                        style={{ color: "var(--primary)" }}
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

          {/* Empty state */}
          {!mode && depsNovos.length === 0 && (
            <div
              className="mt-4 rounded-2xl border border-dashed p-4"
              style={{
                borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
                background: "color-mix(in srgb, var(--surface) 94%, var(--text) 3%)",
                color: "var(--text-muted)",
              }}
            >
              <p className="font-medium text-[13px] md:text-sm" style={{ color: "var(--text)" }}>
                Nenhum dependente adicional cadastrado.
              </p>
              <p className="text-xs md:text-sm mt-1">
                Se preferir, avance para Cobranças e finalize o cadastro.
              </p>
            </div>
          )}

          {/* Formulário (create/edit) */}
          {mode && (
            <div
              className="mt-5 rounded-2xl border p-4 md:p-5 shadow-md"
              style={{
                borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-semibold">
                    {mode === "create" ? "Novo dependente" : "Editar dependente"}
                  </p>
                  <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
                    Preencha os dados abaixo. Campos com * são obrigatórios.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelForm}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={16} />
                  Cancelar
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                {/* Nome */}
                <div className="md:col-span-6">
                  <label className="label font-medium text-sm md:text-base" htmlFor="dep-nome">
                    Nome completo {requiredStar}
                  </label>
                  <input
                    id="dep-nome"
                    ref={nomeRef}
                    className={`input h-12 w-full text-base ${fieldRing(
                      formAttempted && !!draftErrors.nome
                    )}`}
                    style={inputSurface}
                    placeholder="Nome do dependente"
                    value={draft.nome}
                    onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                    autoComplete="name"
                  />
                  {formAttempted && draftErrors.nome && (
                    <p className="text-xs md:text-sm text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.nome}
                    </p>
                  )}
                </div>

                {/* Parentesco */}
                <div className="md:col-span-3">
                  <label
                    className="label font-medium text-sm md:text-base"
                    htmlFor="dep-parentesco"
                  >
                    Parentesco {requiredStar}
                  </label>
                  <select
                    id="dep-parentesco"
                    className={`input h-12 w-full text-base ${fieldRing(
                      formAttempted && !!draftErrors.parentesco
                    )}`}
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
                    <p className="text-xs md:text-sm text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.parentesco}
                    </p>
                  )}
                </div>

                {/* Sexo */}
                <div className="md:col-span-3">
                  <label className="label font-medium text-sm md:text-base" htmlFor="dep-sexo">
                    Sexo {requiredStar}
                  </label>
                  <select
                    id="dep-sexo"
                    className={`input h-12 w-full text-base ${fieldRing(
                      formAttempted && !!draftErrors.sexo
                    )}`}
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
                    <p className="text-xs md:text-sm text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.sexo}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-12 mt-4">
                {/* CPF opcional */}
                <div className="md:col-span-6">
                  <label className="label font-medium text-sm md:text-base" htmlFor="dep-cpf">
                    CPF (opcional)
                  </label>
                  <input
                    id="dep-cpf"
                    ref={cpfRef}
                    className={`input h-12 w-full text-base ${fieldRing(
                      formAttempted && !!draftErrors.cpf
                    )}`}
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
                    <p className="text-xs md:text-sm text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.cpf}
                    </p>
                  )}
                </div>

                {/* Data nascimento */}
                <div className="md:col-span-6">
                  <label className="label font-medium text-sm md:text-base">
                    Data de nascimento {requiredStar}
                  </label>
                  <DateSelectBR
                    className="w-full"
                    idPrefix="dep-nasc"
                    valueISO={draft.data_nascimento}
                    onChangeISO={(iso) => setDraft((d) => ({ ...d, data_nascimento: iso }))}
                    invalid={Boolean(formAttempted && !!draftErrors.data_nascimento)}
                    minAge={Number.isFinite(idadeMinDep) ? Number(idadeMinDep) : undefined}
                    maxAge={Number.isFinite(idadeMaxDep) ? Number(idadeMaxDep) : undefined}
                  />
                  {formAttempted && draftErrors.data_nascimento && (
                    <p className="text-xs md:text-sm text-red-600 mt-1" role="alert" aria-live="polite">
                      {draftErrors.data_nascimento}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <CTAButton
                  type="button"
                  variant="outline"
                  className="h-11 px-4 text-sm rounded-2xl"
                  onClick={() => {
                    setDraft(emptyDraft);
                    setFormAttempted(false);
                    requestAnimationFrame(() => nomeRef.current?.focus?.());
                  }}
                >
                  Limpar campos
                </CTAButton>

                <div className="flex items-center gap-3">
                  <CTAButton
                    type="button"
                    variant="outline"
                    className="h-11 px-4 text-sm rounded-2xl"
                    onClick={cancelForm}
                  >
                    Voltar para lista
                  </CTAButton>

                  <CTAButton
                    type="button"
                    className="h-11 px-5 text-sm rounded-2xl"
                    onClick={saveDraft}
                  >
                    Salvar dependente
                  </CTAButton>
                </div>
              </div>

              {/* Nota UX (discreta) */}
              <div className="mt-4 text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
                Dica: se o plano tiver limite de idade, a data de nascimento será validada automaticamente.
              </div>
            </div>
          )}
        </div>

        {/* Rodapé da etapa */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <CTAButton
            type="button"
            variant="outline"
            className="h-12 px-5 rounded-2xl"
            onClick={() => {
              if (mode) cancelForm();
              else setCurrentStep(2);
            }}
          >
            Voltar
          </CTAButton>

          <CTAButton type="button" className="h-12 px-6 rounded-2xl" onClick={handleContinue}>
            Continuar
          </CTAButton>
        </div>
      </div>
    </>
  );
}
