import { useEffect, useState, useRef } from "react";
import {
  formatCPF,
  maskCPF,
  formatPhoneBR,
  onlyDigits,
  normalizeISODate,
} from "@/lib/br";
import { Loader2, ChevronRight } from "lucide-react";

/* ============================================================
   COMPONENTE PRINCIPAL — STEP 1 (DADOS DO TITULAR)
   ============================================================ */
export default function Step1DadosComplementares({
  titular,
  onChange,
  onNext,
  lookupCpf,
  loadingCpf,
  usuarioLogado,
}) {
  const t = titular || {};

  /* -----------------------
     AUTOLOAD DO USUÁRIO LOGADO
     ----------------------- */
  useEffect(() => {
    if (!usuarioLogado) return;

    onChange({
      ...t,
      nome: usuarioLogado.nome ?? t.nome ?? "",
      email: usuarioLogado.email ?? t.email ?? "",
      cpf: usuarioLogado.cpf ?? t.cpf ?? "",
      celular: usuarioLogado.celular ?? t.celular ?? "",
      dataNascimento:
        normalizeISODate(usuarioLogado.data_nascimento) ??
        t.dataNascimento ??
        "",
    });
  }, [usuarioLogado]);

  /* -----------------------
     LOOKUP DE CPF COM DEBOUNCE
     ----------------------- */
  const cpfTimeout = useRef(null);

  useEffect(() => {
    const digits = onlyDigits(t.cpf);
    if (digits.length !== 11) return;

    clearTimeout(cpfTimeout.current);

    cpfTimeout.current = setTimeout(() => {
      lookupCpf(digits);
    }, 450);

    return () => clearTimeout(cpfTimeout.current);
  }, [t.cpf]);

  /* -----------------------
     FUNÇÃO DE ATUALIZAÇÃO
     ----------------------- */
  function update(field, value) {
    onChange({ ...t, [field]: value });
  }

  /* -----------------------
     REGRAS DE VALIDAÇÃO
     ----------------------- */
  const ready =
    t.nome?.trim() &&
    onlyDigits(t.cpf)?.length === 11 &&
    onlyDigits(t.celular)?.length >= 10 &&
    t.dataNascimento &&
    t.sexo &&
    t.estadoCivil;

  /* -----------------------
     RENDER
     ----------------------- */
  return (
    <div className="space-y-8 pb-10">
      {/* NOME */}
      <InputBlock label="Nome completo">
        <input
          type="text"
          className="input-premium"
          placeholder="Digite seu nome completo"
          value={t.nome || ""}
          onChange={(e) => update("nome", e.target.value)}
        />
      </InputBlock>

      {/* CPF */}
      <InputBlock label="CPF">
        <div className="relative">
          <input
            type="text"
            className="input-premium pr-12"
            placeholder="000.000.000-00"
            value={maskCPF(t.cpf || "")}
            maxLength={14}
            onChange={(e) => update("cpf", formatCPF(e.target.value))}
          />

          {loadingCpf && (
            <Loader2
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[var(--primary)]"
              size={20}
            />
          )}
        </div>
      </InputBlock>

      {/* CELULAR */}
      <InputBlock label="Celular">
        <input
          type="text"
          className="input-premium"
          placeholder="(00) 00000-0000"
          value={formatPhoneBR(t.celular || "")}
          onChange={(e) => update("celular", e.target.value)}
        />
      </InputBlock>

      {/* EMAIL */}
      <InputBlock label="E-mail">
        <input
          type="email"
          className="input-premium"
          placeholder="seu@email.com"
          value={t.email || ""}
          onChange={(e) => update("email", e.target.value)}
        />
      </InputBlock>

      {/* DATA DE NASCIMENTO */}
      <InputBlock label="Data de nascimento">
        <input
          type="date"
          className="input-premium"
          value={t.dataNascimento || ""}
          onChange={(e) => update("dataNascimento", e.target.value)}
        />
      </InputBlock>

      {/* SEXO */}
      <InputBlock label="Sexo">
        <select
          className="input-premium"
          value={t.sexo || ""}
          onChange={(e) => update("sexo", e.target.value)}
        >
          <option value="">Selecione</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMININO">Feminino</option>
          <option value="OUTRO">Outro</option>
        </select>
      </InputBlock>

      {/* ESTADO CIVIL */}
      <InputBlock label="Estado civil">
        <select
          className="input-premium"
          value={t.estadoCivil || ""}
          onChange={(e) => update("estadoCivil", e.target.value)}
        >
          <option value="">Selecione</option>
          <option value="SOLTEIRO(A)">Solteiro(a)</option>
          <option value="CASADO(A)">Casado(a)</option>
          <option value="DIVORCIADO(A)">Divorciado(a)</option>
          <option value="VIUVO(A)">Viúvo(a)</option>
          <option value="UNIAO ESTAVEL">União estável</option>
        </select>
      </InputBlock>

      {/* BOTÃO CONTINUAR */}
      <button
        onClick={onNext}
        disabled={!ready}
        className={`w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all
          ${
            ready
              ? "bg-[var(--primary)] text-white shadow-lg active:scale-[0.97]"
              : "bg-[var(--c-surface-2)] text-[var(--c-muted)] opacity-50"
          }
        `}
      >
        Continuar <ChevronRight size={20} />
      </button>
    </div>
  );
}

/* ============================================================
   SUBCOMPONENTE — BLOCO DE INPUT PREMIUM
   ============================================================ */
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

/* ============================================================
   STYLES — INPUT PREMIUM
   (Estilo C, leve, elegante, ideal para white-label)
   ============================================================ */
const style = document.createElement("style");
style.innerHTML = `
  .input-premium {
    width: 100%;
    height: 48px;
    padding: 0 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--c-surface) 92%, transparent);
    border: 1px solid color-mix(in srgb, var(--c-border) 70%, transparent);
    transition: all .2s;
    font-size: 15px;
    outline: none;
  }
  .input-premium:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent);
  }
`;
document.head.appendChild(style);
