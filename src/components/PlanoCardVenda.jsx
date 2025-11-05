import { money } from "@/lib/planUtils.js";
import { useState } from "react";

/* helpers para exibir o tipo quando quiser (ex.: só na aba “Todos”) */
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

/**
 * Extrai a lista de benefícios a partir das propriedades vindas da API.
 */
function getBeneficiosFromAPI(plano) {
  const produtos = Array.isArray(plano?.produtos)
    ? plano.produtos
        .map((p) => (typeof p === "string" ? p : p?.nome || p?.descricao || ""))
        .filter(Boolean)
    : [];

  const servicos = Array.isArray(plano?.servicos)
    ? plano.servicos
        .map((s) => (typeof s === "string" ? s : s?.descricao || s?.nome || ""))
        .filter(Boolean)
    : [];

  const all = [...produtos, ...servicos];
  const seen = new Set();
  const deduped = [];
  for (const txt of all) {
    const key = String(txt).trim().toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(String(txt).trim());
  }

  return deduped.length ? deduped : [
    "Assistência familiar",
    "Documentação e suporte",
    "Atendimento 24h",
  ];
}

export default function PlanoCardVenda({
  plano,
  precoMensal,
  bestSeller = false,
  onDetails,
  showTypeBadge = false, // <- opcional (ligamos só na aba "Todos")
  maxBenefits = 5,
  enableExpand = true,
}) {
  if (!plano) return null;

  const incluidos = Number(plano?.numero_dependentes ?? plano?.numeroDependentes ?? 0);
  const carenciaU = plano?.unidade_carencia ?? plano?.unidadeCarencia ?? "DIAS";
  const carenciaP = Number(plano?.periodo_carencia ?? plano?.periodoCarencia ?? 0);

  const type = detectTypeByName(plano?.nome ?? "");

  // Benefícios vindos da API (produtos + serviços)
  const beneficiosAll = getBeneficiosFromAPI(plano);
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const beneficiosLimited = beneficiosAll.slice(0, maxBenefits);
  const beneficiosRest = Math.max(0, beneficiosAll.length - beneficiosLimited.length);

  return (
    <article
      className="relative flex flex-col rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      {/* badge de tipo (apenas quando showTypeBadge = true) */}
      {showTypeBadge && type !== "OUTROS" ? (
        <span
          className="absolute -top-3 left-4 rounded-full border px-2 py-1 text-xs font-medium"
          style={{
            background: "var(--c-bg)",
            borderColor: "var(--c-border)",
            color: "var(--c-text)",
          }}
        >
          {type === "FAMILIAR" ? "Familiar" : type === "EMPRESARIAL" ? "Empresarial" : "Individual"}
        </span>
      ) : null}

      {/* selo destaque */}
      {bestSeller && (
        <span className="absolute -top-3 right-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black shadow">
          ⭐ Mais vendido
        </span>
      )}

      {/* título */}
      <header className="mb-4">
        <h3 className="text-lg font-extrabold leading-snug text-[var(--c-text)]">
          {plano?.nome}
        </h3>
      </header>

      {/* preço */}
      <div className="mb-4">
        <div className="text-3xl font-black text-[var(--primary)]">
          {money(precoMensal)}
          <span className="ml-1 text-base font-medium text-[var(--c-muted)]">/mês</span>
        </div>
      </div>

      {/* benefícios (dinâmicos da API) */}
      <ul className="mb-3 space-y-2 text-sm">
        {(enableExpand && showAllBenefits ? beneficiosAll : beneficiosLimited).map((b, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-[var(--primary)]">✔</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {enableExpand && beneficiosRest > 0 && (
        <button
          type="button"
          onClick={() => setShowAllBenefits((v) => !v)}
          className="mb-5 self-start text-xs font-semibold underline decoration-dotted underline-offset-4 text-[var(--c-muted)] hover:text-[var(--c-text)]"
          aria-expanded={showAllBenefits}
        >
          {showAllBenefits ? "Ver menos" : `Ver todos (+${beneficiosRest})`}
        </button>
      )}

      {/* extras resumidos */}
      <dl className="mb-6 grid gap-1 text-sm text-[var(--c-text)]">
        <div className="flex justify-between">
          <dt>Dependentes incluídos</dt>
          <dd className="font-semibold">{incluidos}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Carência</dt>
          <dd className="font-semibold">
            {carenciaP} {carenciaU}
          </dd>
        </div>
      </dl>

      {/* CTA forte */}
      <button
        type="button"
        onClick={onDetails}
        className="mt-auto w-full rounded-full px-4 py-3 font-bold text-white transition-all hover:brightness-110"
        style={{ background: "var(--primary)" }}
      >
        Quero este plano
      </button>
    </article>
  );
}
