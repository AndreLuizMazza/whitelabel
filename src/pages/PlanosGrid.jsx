// src/pages/PlanosGrid.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import PlanoCardVenda from "@/components/PlanoCardVenda.jsx";
import { getMensal } from "@/lib/planUtils.js";

/* ---------------- Utils ---------------- */
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
const LS_KEY = "planos_tab";

/* ---------------- Página Planos ---------------- */
export default function PlanosGrid() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planos, setPlanos] = useState([]);

  // preferir "FAMILIAR" inicialmente; se houver um salvo, respeitar
  const initialTab = (() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved || "FAMILIAR";
    } catch {
      return "FAMILIAR";
    }
  })();
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/v1/planos?status=ATIVO");
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.content || [];
        setPlanos(list);
      } catch (e) {
        console.error(e);
        const msg =
          e?.response?.data?.error ||
          e?.response?.statusText ||
          e?.message ||
          "Erro desconhecido";
        setError("Não foi possível carregar os planos: " + msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // normaliza e enriquece
  const enriched = useMemo(() => {
    return (planos || []).map((p) => ({
      ...p,
      precoMensal: getMensal(p),
      _type: detectTypeByName(p?.nome ?? ""),
      _nameN: normalize(p?.nome ?? ""),
    }));
  }, [planos]);

  // contadores por tipo
  const counts = useMemo(() => {
    const base = { TODOS: enriched.length, FAMILIAR: 0, EMPRESARIAL: 0, INDIVIDUAL: 0 };
    enriched.forEach((p) => {
      if (p._type === "FAMILIAR") base.FAMILIAR++;
      else if (p._type === "EMPRESARIAL") base.EMPRESARIAL++;
      else if (p._type === "INDIVIDUAL") base.INDIVIDUAL++;
    });
    return base;
  }, [enriched]);

  // define as tabs visíveis e ordem
  const tabs = useMemo(() => {
    const hasAnyType = counts.FAMILIAR || counts.EMPRESARIAL || counts.INDIVIDUAL;
    const ordered = [
      { key: "FAMILIAR", label: "Familiar", count: counts.FAMILIAR },
      { key: "EMPRESARIAL", label: "Empresarial", count: counts.EMPRESARIAL },
      { key: "INDIVIDUAL", label: "Individual", count: counts.INDIVIDUAL },
    ].filter((t) => t.count > 0);
    if (hasAnyType) {
      ordered.push({ key: "TODOS", label: "Todos", count: counts.TODOS });
      return ordered;
    }
    return [{ key: "TODOS", label: "Todos", count: counts.TODOS }];
  }, [counts]);

  // garantir aba válida
  useEffect(() => {
    const available = tabs.map((t) => t.key);
    const typesAvailable = available.some((k) => k !== "TODOS");
    if (!typesAvailable) return;

    const preferredOrder = ["FAMILIAR", "EMPRESARIAL", "INDIVIDUAL", "TODOS"];
    const best = preferredOrder.find((k) => available.includes(k)) || "TODOS";

    if (!available.includes(tab)) {
      setTab(best);
    }
  }, [tabs, tab]);

  // guardar preferência da aba
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, tab);
    } catch {}
  }, [tab]);

  // filtro por aba
  const byTab = useMemo(() => {
    if (tab === "TODOS") return enriched;
    return enriched.filter((p) => p._type === tab);
  }, [enriched, tab]);

  // filtro por busca
  const byQuery = useMemo(() => {
    const nq = normalize(q).trim();
    if (!nq) return byTab;
    return byTab.filter((p) => p._nameN.includes(nq));
  }, [byTab, q]);

  // marca 2º mais caro como "Mais vendido"
  const marcados = useMemo(() => {
    if (!byQuery.length) return [];
    const desc = [...byQuery].sort(
      (a, b) => (b.precoMensal || 0) - (a.precoMensal || 0)
    );
    const secondId = desc[1]?.id;
    return byQuery.map((p) => ({ ...p, bestSeller: p.id === secondId }));
  }, [byQuery]);

  // ordenar barato -> caro
  const planosOrdenados = useMemo(
    () => [...marcados].sort((a, b) => (a.precoMensal || 0) - (b.precoMensal || 0)),
    [marcados]
  );

  return (
    <section className="section">
      <div className="container-max">
        <div className="mb-6">
          <h2 className="text-3xl font-black tracking-tight">Planos</h2>
          <p className="mt-1 text-[var(--c-muted)]">
            Escolha seu plano e conclua a contratação em minutos. Sem complicação.
          </p>
        </div>

        {/* Sub-navbar (tabs + busca) */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="relative -mx-2 overflow-x-auto md:mx-0" aria-label="Filtrar planos por tipo">
            <ul className="flex gap-2 min-w-max">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <li key={t.key}>
                    <button
                      onClick={() => setTab(t.key)}
                      className="px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
                      style={{
                        borderColor: active ? "transparent" : "var(--c-border)",
                        background: active
                          ? "color-mix(in srgb, var(--primary) 14%, transparent)"
                          : "var(--c-bg)",
                        color: active ? "var(--primary)" : "var(--c-text)",
                        boxShadow: active
                          ? "0 0 0 1px color-mix(in srgb, var(--primary) 32%, transparent)"
                          : "none",
                      }}
                      aria-current={active ? "page" : undefined}
                    >
                      {t.label}
                      <span className="ml-2 rounded-full px-2 py-0.5 text-xs ring-1 ring-[var(--c-border)]">
                        {t.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <label htmlFor="q" className="sr-only">Buscar plano</label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome…"
              className="input h-10 w-full md:w-80"
            />
          </div>
        </div>

        {/* estados */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]" />
            ))}
          </div>
        )}

        {!loading && error && <p className="text-[var(--primary)]">{error}</p>}

        {!loading && !error && planosOrdenados.length === 0 && (
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-8 text-center">
            <p className="text-[var(--c-text)] font-medium">
              Nenhum plano encontrado
              {tab !== "TODOS" ? ` em ${tabs.find((t) => t.key === tab)?.label}` : ""}.
            </p>
            {q ? <p className="mt-1 text-sm text-[var(--c-muted)]">Tente limpar o filtro de busca ou mudar a categoria.</p> : null}
          </div>
        )}

        {/* grid de cards (vendas) */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {planosOrdenados.map((p) => (
            <PlanoCardVenda
              key={p.id}
              plano={p}
              precoMensal={p.precoMensal}
              bestSeller={p.bestSeller}
              showTypeBadge={tab === "TODOS"}
              onDetails={() => navigate(`/planos/${p.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
