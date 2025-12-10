import { useEffect, useRef } from "react";
import {
  onlyDigits,
  maskCEP,
  formatCEP,
  sanitizeUF,
} from "@/lib/br";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

/* ============================================================
   STEP 2 — ENDEREÇO
   ============================================================ */
export default function Step2Endereco({
  endereco,
  onChange,
  onNext,
  onPrev,
}) {
  const e = endereco || {};

  /* -----------------------
     VIA CEP — AUTOLOOKUP
     ----------------------- */
  const cepTimeout = useRef(null);

  useEffect(() => {
    const digits = onlyDigits(e.cep || "");
    if (digits.length !== 8) return;

    clearTimeout(cepTimeout.current);

    cepTimeout.current = setTimeout(async () => {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await resp.json();
        if (data.erro) return;

        onChange({
          ...e,
          logradouro: data.logradouro || e.logradouro,
          bairro: data.bairro || e.bairro,
          cidade: data.localidade || e.cidade,
          uf: data.uf || e.uf,
        });
      } catch {}
    }, 400);

    return () => clearTimeout(cepTimeout.current);
  }, [e.cep]);

  /* -----------------------
     FUNÇÃO DE UPDATE
     ----------------------- */
  function update(field, value) {
    onChange({ ...e, [field]: value });
  }

  /* -----------------------
     VALIDAÇÃO
     ----------------------- */
  const ready =
    onlyDigits(e.cep)?.length === 8 &&
    e.logradouro?.trim() &&
    e.numero?.trim() &&
    e.bairro?.trim() &&
    e.cidade?.trim() &&
    e.uf?.trim()?.length === 2;

  /* -----------------------
     RENDER
     ----------------------- */
  return (
    <div className="space-y-8 pb-10">

      {/* CEP */}
      <InputBlock label="CEP">
        <input
          type="text"
          className="input-premium"
          placeholder="00000-000"
          value={maskCEP(e.cep || "")}
          onChange={(ev) => update("cep", formatCEP(ev.target.value))}
          maxLength={9}
        />
      </InputBlock>

      {/* LOGRADOURO */}
      <InputBlock label="Logradouro">
        <input
          type="text"
          className="input-premium"
          placeholder="Rua / Avenida"
          value={e.logradouro || ""}
          onChange={(ev) => update("logradouro", ev.target.value)}
        />
      </InputBlock>

      {/* NÚMERO */}
      <InputBlock label="Número">
        <input
          type="text"
          className="input-premium"
          placeholder="Número"
          value={e.numero || ""}
          onChange={(ev) => update("numero", ev.target.value)}
        />
      </InputBlock>

      {/* BAIRRO */}
      <InputBlock label="Bairro">
        <input
          type="text"
          className="input-premium"
          placeholder="Bairro"
          value={e.bairro || ""}
          onChange={(ev) => update("bairro", ev.target.value)}
        />
      </InputBlock>

      {/* CIDADE */}
      <InputBlock label="Cidade">
        <input
          type="text"
          className="input-premium"
          placeholder="Cidade"
          value={e.cidade || ""}
          onChange={(ev) => update("cidade", ev.target.value)}
        />
      </InputBlock>

      {/* UF */}
      <InputBlock label="UF">
        <input
          type="text"
          maxLength={2}
          className="input-premium"
          placeholder="UF"
          value={e.uf || ""}
          onChange={(ev) => update("uf", sanitizeUF(ev.target.value))}
        />
      </InputBlock>

      {/* BOTÕES */}
      <div className="flex items-center gap-3 pt-4">

        {/* VOLTAR */}
        <button
          onClick={onPrev}
          className="w-1/2 h-14 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-muted-strong)] flex items-center justify-center gap-2"
        >
          <ChevronLeft size={20} />
          Voltar
        </button>

        {/* CONTINUAR */}
        <button
          onClick={onNext}
          disabled={!ready}
          className={`w-1/2 h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all
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
    </div>
  );
}

/* ============================================================
   BLOCO PREMIUM (MESMO DO STEP1)
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
