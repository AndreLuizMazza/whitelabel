import { memo, useMemo } from "react";
import { getMensal, pick } from "@/lib/planUtils.js";

/* Utils */
function normalize(str = "") {
  return String(str).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
function detectTypeByName(nome = "") {
  const n = normalize(nome);
  if (/\bfamiliar\b/.test(n)) return "FAMILIAR";
  if (/\bempresarial\b/.test(n)) return "EMPRESARIAL";
  if (/\bindividu(a|u)l\b/.test(n)) return "INDIVIDUAL";
  return "OUTROS";
}

/* Fallbacks até a API de benefícios/coberturas chegar */
const FALLBACKS = {
  FAMILIAR: ["Translado 24h", "Assistência familiar", "Documentação inclusa", "Pagamento seguro"],
  EMPRESARIAL: ["Atendimento 24h", "Cobertura nacional", "Gestão de dependentes", "Pagamento seguro"],
  INDIVIDUAL: ["Cobertura essencial", "Atendimento 24h", "Sem fidelidade", "Pagamento seguro"],
  OUTROS: ["Cobertura essencial", "Atendimento 24h", "Pagamento seguro"],
};

function getBenefitsList(plano) {
  const type = detectTypeByName(plano?.nome ?? "");
  const raw = pick(plano || {}, "beneficios") || pick(plano || {}, "coberturas") || [];
  const list = Array.isArray(raw) ? raw : [];
  const safe = list
    .map((x) => (typeof x === "string" ? x : x?.nome || x?.titulo || ""))
    .filter(Boolean);
  const src = safe.length ? safe : FALLBACKS[type] || FALLBACKS.OUTROS;
  return src.slice(0, 4);
}

function money(v = 0) {
  try {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${Number(v).toFixed(2)}`;
  }
}

/**
 * Card do plano (sem checkbox de comparação).
 * Props:
 *  - plano
 *  - onDetails()
 *  - showTypeBadge  (exibe o tipo apenas na aba “Todos”)
 *  - bestSeller     (exibe selo “Mais vendido”)
 */
function PlanoCardPro({ plano, onDetails, showTypeBadge = false, bestSeller = false }) {
  const precoMensal = useMemo(() => getMensal(plano), [plano]);
  const incluidos = Number(plano?.numero_dependentes ?? plano?.numeroDependentes ?? 0);
  const incMensal = (Number(plano?.valor_incremental ?? plano?.valorIncremental ?? 0) || 0) / 12;
  const carenciaU = pick(plano || {}, "unidadeCarencia", "unidade_carencia") || "DIAS";
  const carenciaP = pick(plano || {}, "periodoCarencia", "periodo_carencia") || 0;

  const type = detectTypeByName(plano?.nome ?? "");
  const benefits = useMemo(() => getBenefitsList(plano), [plano]);

  return (
    <article className="relative rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-sm flex flex-col">
      {/* badge de tipo (apenas na aba Todos, estilo anterior) */}
      {showTypeBadge && type !== "OUTROS" ? (
        <span
          className="absolute -top-2 left-4 rounded-full px-2 py-1 text-xs font-medium border"
          style={{
            background: "var(--c-bg)",
            borderColor: "var(--c-border)",
            color: "var(--c-text)",
          }}
        >
          {type === "FAMILIAR" ? "Familiar" : type === "EMPRESARIAL" ? "Empresarial" : "Individual"}
        </span>
      ) : null}

      {/* selo “Mais vendido” (de volta) */}
      {bestSeller ? (
        <span
          className="absolute -top-2 right-4 rounded-full px-2 py-1 text-xs font-semibold"
          style={{
            background: "color-mix(in srgb, var(--primary) 16%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 28%, transparent)",
            color: "var(--primary)",
          }}
        >
          ⭐ Mais vendido
        </span>
      ) : null}

      <header className="mb-2 mt-2">
        <h3 className="text-lg font-extrabold leading-snug">{plano?.nome}</h3>
      </header>

      <div className="mb-3">
        <div className="text-2xl font-black">{money(precoMensal)}</div>
        <div className="text-sm text-[var(--c-muted)]">/ mês</div>
      </div>

      {/* Lista de benefícios/coberturas (até 4) */}
      <ul className="mb-4 space-y-1.5 text-sm">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className="mt-1 inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--primary)" }}
              aria-hidden
            />
            <span className="text-[var(--c-text)]">{b}</span>
          </li>
        ))}
      </ul>

      {/* Meta-infos resumidas */}
      <dl className="mb-5 grid gap-1 text-sm text-[var(--c-text)]">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-[var(--c-muted)]">Dependentes incluídos</dt>
          <dd className="font-semibold">{incluidos}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-[var(--c-muted)]">Excedente por dependente</dt>
          <dd className="font-semibold">{money(incMensal)}/mês</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-[var(--c-muted)]">Carência</dt>
          <dd className="font-semibold">
            {carenciaP} {carenciaU}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onDetails}
        className="mt-auto w-full rounded-full px-4 py-3 font-semibold"
        style={{ background: "var(--primary)", color: "var(--on-primary, #fff)" }}
      >
        Detalhes
      </button>
    </article>
  );
}

export default memo(PlanoCardPro);
