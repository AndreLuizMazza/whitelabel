// src/components/PlanoCardVenda.jsx
import { money } from "@/lib/planUtils.js";

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

export default function PlanoCardVenda({
  plano,
  precoMensal,
  bestSeller = false,
  onDetails,
  showTypeBadge = false, // <- opcional (ligamos só na aba "Todos")
}) {
  if (!plano) return null;

  const incluidos = Number(plano?.numero_dependentes ?? plano?.numeroDependentes ?? 0);
  const carenciaU = plano?.unidade_carencia ?? plano?.unidadeCarencia ?? "DIAS";
  const carenciaP = Number(plano?.periodo_carencia ?? plano?.periodoCarencia ?? 0);

  // Benefícios estáticos por enquanto (API chega depois)
  const benefits = [
    "Translado 24h em todo Brasil",
    "Assistência familiar completa",
    "Documentação inclusa",
    "Atendimento 24h",
    "Pagamento seguro",
  ];

  const type = detectTypeByName(plano?.nome ?? "");

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
        <p className="text-xs text-[var(--c-muted)]">ou {money(precoMensal * 12)} no plano anual</p>
      </div>

      {/* benefícios */}
      <ul className="mb-5 space-y-2 text-sm">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-[var(--primary)]">✔</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

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
