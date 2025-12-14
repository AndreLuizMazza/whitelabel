// MemorialList.jsx (Apple-level: mobile compacto + hero com últimos 10 sem URL)
// FIX: ícone da busca não pode ficar sobre o texto -> padding-left maior (pl-12) e hitbox consistente

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listMemorial } from "@/lib/nalapide";
import HeroSlider from "@/components/HeroSlider";
import {
  Search,
  Eye,
  Cake,
  HeartCrack,
  Sun,
  RefreshCcw,
  Loader2,
  Info,
  Sprout,
} from "lucide-react";
import { safeYmd, isSameDay, isSameMonthDay, addDays } from "@/lib/dateUtils";

/* ================= Utils ================= */
function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    const fixed = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
    return fixed.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function toTs(d) {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
}

function byNome(a, b) {
  const na = (a.nomeFalecido || a.nome || "").toLowerCase();
  const nb = (b.nomeFalecido || b.nome || "").toLowerCase();
  return na.localeCompare(nb);
}

/* ================= Micro UI ================= */
function ChipFilter({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm transition"
      style={{
        background: active ? "var(--primary)" : "var(--surface)",
        color: active ? "var(--on-primary)" : "var(--text)",
        border: `1px solid ${
          active ? "color-mix(in srgb, var(--primary) 40%, transparent)" : "var(--c-border)"
        }`,
      }}
    >
      {children}
    </button>
  );
}

function StatTile({ icon: Icon, label, value, hint, compact = false }) {
  return (
    <div
      className="rounded-2xl ring-1"
      style={{
        background: compact ? "var(--surface)" : "rgba(0,0,0,.14)",
        borderColor: compact ? "var(--c-border)" : "rgba(255,255,255,.14)",
        padding: compact ? "12px" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2 p-3 md:p-3.5">
        <div className="min-w-0">
          <div
            className="text-[11px] uppercase tracking-wide font-semibold"
            style={{ color: compact ? "var(--text-muted)" : "rgba(255,255,255,.70)" }}
          >
            {label}
          </div>
          <div
            className="mt-0.5 font-semibold tabular-nums"
            style={{ color: compact ? "var(--text)" : "#fff", fontSize: compact ? 20 : undefined }}
          >
            {value}
          </div>
          {hint ? (
            <div
              className="mt-0.5 text-xs"
              style={{ color: compact ? "var(--text-muted)" : "rgba(255,255,255,.72)" }}
            >
              {hint}
            </div>
          ) : null}
        </div>
        <div
          className="h-9 w-9 rounded-xl inline-flex items-center justify-center ring-1"
          style={{
            background: compact ? "var(--surface-alt)" : "rgba(255,255,255,.08)",
            borderColor: compact ? "var(--c-border)" : "rgba(255,255,255,.12)",
          }}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" style={{ color: compact ? "var(--text)" : "rgba(255,255,255,.88)" }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "0 10px 25px rgba(0,0,0,.05)",
        padding: 12,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full animate-pulse" style={{ background: "var(--surface-alt)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: "var(--surface-alt)" }} />
          <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: "var(--surface-alt)" }} />
          <div className="h-3 w-1/4 rounded animate-pulse" style={{ background: "var(--surface-alt)" }} />
        </div>
      </div>
    </div>
  );
}

function MemorialCard({ it, featured = false }) {
  const nome = it.nomeFalecido || it.nome || "Sem nome";
  const nasc = fmtDate(it.dtNascimento);
  const fale = fmtDate(it.dtFalecimento);
  const views = Number(it.contadorAcessos ?? 0);

  const yearsLine =
    it.dtNascimento && it.dtFalecimento
      ? `${new Date(it.dtNascimento).getUTCFullYear()} — ${new Date(it.dtFalecimento).getUTCFullYear()}`
      : `${nasc} – ${fale}`;

  return (
    <div
      className="rounded-2xl shadow-sm hover:shadow transition"
      style={{
        background: "var(--surface)",
        border: featured
          ? "1px solid color-mix(in srgb, var(--primary) 26%, var(--c-border))"
          : "1px solid var(--c-border)",
        boxShadow: featured ? "0 18px 45px rgba(0,0,0,.10)" : undefined,
        padding: 12,
      }}
    >
      <div className="flex items-center gap-3">
        {it.fotoUrl ? (
          <div className="relative">
            <div
              className="absolute -inset-0.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,.75), rgba(255,255,255,.10) 55%, transparent 70%)",
                opacity: featured ? 0.7 : 0.55,
              }}
              aria-hidden="true"
            />
            <img
              src={it.fotoUrl}
              alt={nome}
              className="relative rounded-full object-cover"
              style={{
                height: 48,
                width: 48,
                boxShadow:
                  "0 0 0 2px color-mix(in srgb, var(--surface) 92%, transparent) inset, 0 0 0 1px color-mix(in srgb, var(--c-border) 100%, transparent)",
              }}
            />
          </div>
        ) : (
          <div
            className="rounded-full flex items-center justify-center font-semibold"
            style={{
              height: 48,
              width: 48,
              background: "color-mix(in srgb, var(--primary) 14%, var(--surface))",
              color: "var(--primary)",
              border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--c-border))",
              fontSize: 14,
            }}
          >
            {nome
              .split(" ")
              .slice(0, 2)
              .map((p) => p.slice(0, 1))
              .join("")
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3
            className="leading-tight truncate"
            style={{ color: "var(--text)", fontWeight: 650, letterSpacing: "-0.01em", fontSize: 14 }}
            title={nome}
          >
            {nome}
          </h3>

          <p className="truncate mt-0.5" style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {yearsLine}
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Eye className="h-3.5 w-3.5" />
              <span className="tabular-nums">{views}</span>
              <span>visualiza{views === 1 ? "ção" : "ções"}</span>
            </p>

            <div
              className="text-[11px] px-2 py-1 rounded-full ring-1"
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-muted)",
                borderColor: "var(--c-border)",
                whiteSpace: "nowrap",
              }}
            >
              Ver
            </div>
          </div>
        </div>
      </div>

      {featured && (
        <div className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
          Destaque • Memorial mais acessado
        </div>
      )}
    </div>
  );
}

/* ================= Página ================= */
export default function MemorialList() {
  const [qp, setQp] = useSearchParams();
  const qInit = qp.get("q") || "";

  const [q, setQ] = useState(qInit);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  const debounceRef = useRef(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listMemorial({ q });
      const items = data?.items || data?.rows || data?.content || data || [];
      setRows(Array.isArray(items) ? items : []);

      setQp((prev) => {
        const n = new URLSearchParams(prev);
        q ? n.set("q", q) : n.delete("q");
        return n;
      });
    } catch (e) {
      console.error("[MemorialList] load error", e);
      setError("Não foi possível carregar o memorial.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load();
    }, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function handleSubmit(e) {
    e?.preventDefault?.();
    clearTimeout(debounceRef.current);
    load();
  }
  function handleClear() {
    setQ("");
    clearTimeout(debounceRef.current);
    load();
  }

  const today = new Date();
  const withDates = rows.map((it) => ({
    ...it,
    _nasc: safeYmd(it.dtNascimento),
    _fale: safeYmd(it.dtFalecimento),
  }));

  const falecidosHoje = withDates.filter((it) => it._fale && isSameDay(it._fale, today)).sort(byNome);
  const aniversarioNasc = withDates.filter((it) => it._nasc && isSameMonthDay(it._nasc, today)).sort(byNome);
  const aniversarioFal = withDates.filter((it) => it._fale && isSameMonthDay(it._fale, today)).sort(byNome);
  const setimoDia = withDates.filter((it) => it._fale && isSameDay(addDays(it._fale, 7), today)).sort(byNome);

  const stats = {
    hoje: falecidosHoje.length,
    nasc: aniversarioNasc.length,
    fal: aniversarioFal.length,
    setimo: setimoDia.length,
  };

  const filteredRows =
    tab === "today"
      ? falecidosHoje
      : tab === "nasc"
      ? aniversarioNasc
      : tab === "fal"
      ? aniversarioFal
      : tab === "setimo"
      ? setimoDia
      : rows;

  const featuredId = useMemo(() => {
    if (!rows?.length) return null;
    const best = [...rows].sort(
      (a, b) => Number(b.contadorAcessos || 0) - Number(a.contadorAcessos || 0)
    )[0];
    return best?.id || best?.slug || null;
  }, [rows]);

  const heroSlides = useMemo(() => {
    const withImage = (rows || []).filter((r) => !!(r?.fotoCapaUrl || r?.fotoUrl));
    const sortedLatest = [...withImage].sort((a, b) => {
      const aTs =
        toTs(a.dtFalecimento) ||
        toTs(a.dtCerimonia) ||
        toTs(a.dtVelorio) ||
        toTs(a.createdAt) ||
        0;
      const bTs =
        toTs(b.dtFalecimento) ||
        toTs(b.dtCerimonia) ||
        toTs(b.dtVelorio) ||
        toTs(b.createdAt) ||
        0;

      if (bTs !== aTs) return bTs - aTs;
      return Number(b.contadorAcessos || 0) - Number(a.contadorAcessos || 0);
    });

    const last10 = sortedLatest.slice(0, 10);

    const fallback = [
      {
        id: "fb1",
        image: "/assets/memorial/hero-1.jpg",
        kicker: "Memorial",
        headline: "Memoriais que preservam histórias",
        description: "Um espaço público para lembrar, homenagear e manter vivo o legado.",
        metaLeft: "Atualizado",
        metaRight: "Com respeito",
      },
      {
        id: "fb2",
        image: "/assets/memorial/hero-2.jpg",
        kicker: "Homenagens",
        headline: "Homenagens recentes",
        description: "Encontre memoriais por nome e acompanhe homenagens e mensagens.",
        metaLeft: "Mensagens & interações",
        metaRight: "24h",
      },
    ];

    if (last10.length < 2) return fallback;

    return last10.map((m, i) => {
      const image = m.fotoCapaUrl || m.fotoUrl;
      const views = Number(m.contadorAcessos || 0);
      return {
        id: m.slug || m.id || `dyn-${i}`,
        image,
        alt: m.nomeFalecido || m.nome || "Memorial",
        kicker: i === 0 ? "Recente" : "Memorial",
        headline: m.nomeFalecido || m.nome || "Memorial",
        description: "Acesse o memorial público e veja homenagens e mensagens.",
        metaLeft: `${fmtDate(m.dtNascimento)} — ${fmtDate(m.dtFalecimento)}`,
        metaRight: `${views} visualiza${views === 1 ? "ção" : "ções"}`,
        btnLabel: "Ver memorial",
        btnLink: `/memorial/${m.slug || m.id}`,
      };
    });
  }, [rows]);

  const statsBlock = (
    <div className="grid grid-cols-2 gap-3">
      <StatTile compact icon={Sun} label="Hoje" value={stats.hoje} hint="homenagens" />
      <StatTile compact icon={Cake} label="Aniv. Nasc." value={stats.nasc} hint="lembranças" />
      <StatTile compact icon={HeartCrack} label="Aniv. Fal." value={stats.fal} hint="datas" />
      <StatTile compact icon={Sprout} label="7º dia" value={stats.setimo} hint="memórias" />
    </div>
  );

  return (
    <div className="container-max py-6 md:py-8">
      <HeroSlider
        slides={heroSlides}
        statsRight={
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={Sun} label="Hoje" value={stats.hoje} hint="homenagens do dia" />
            <StatTile icon={Cake} label="Aniv. Nasc." value={stats.nasc} hint="lembranças de hoje" />
            <StatTile icon={HeartCrack} label="Aniv. Fal." value={stats.fal} hint="datas marcantes" />
            <StatTile icon={Sprout} label="7º dia" value={stats.setimo} hint="memórias recentes" />
          </div>
        }
        className="mb-4"
      />

      <div className="mb-5 lg:hidden">{statsBlock}</div>

      {/* COMMAND BAR */}
      <div className="sticky top-2 z-20 mb-6">
        <div
          className="rounded-2xl p-3 md:p-4 shadow-sm"
          style={{
            background: "color-mix(in srgb, var(--surface) 78%, transparent)",
            border: "1px solid var(--c-border)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <form onSubmit={handleSubmit} className="w-full lg:w-[520px]">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
  <Search
    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
    style={{ color: "var(--text-muted)" }}
    aria-hidden="true"
  />

  <input
    className="input w-full"
    style={{
      paddingLeft: 44, // <- garante espaço real pro ícone (não depende de Tailwind)
      paddingRight: q ? 40 : undefined,
    }}
    placeholder="Buscar por nome…"
    value={q}
    onChange={(e) => setQ(e.target.value)}
  />

  {q && (
    <button
      type="button"
      onClick={handleClear}
      className="absolute right-2 top-1/2 -translate-y-1/2"
      style={{ color: "var(--text)" }}
      title="Limpar"
    >
      <RefreshCcw className="h-4 w-4" />
    </button>
  )}
</div>

              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <ChipFilter active={tab === "all"} onClick={() => setTab("all")}>Todos</ChipFilter>
              <ChipFilter active={tab === "today"} onClick={() => setTab("today")}>Hoje</ChipFilter>
              <ChipFilter active={tab === "nasc"} onClick={() => setTab("nasc")}>Nasc.</ChipFilter>
              <ChipFilter active={tab === "fal"} onClick={() => setTab("fal")}>Falec.</ChipFilter>
              <ChipFilter active={tab === "setimo"} onClick={() => setTab("setimo")}>7º dia</ChipFilter>

              <div className="ml-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Exibindo <strong style={{ color: "var(--text)" }}>{filteredRows.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2" style={{ color: "var(--primary)" }}>
          <Info className="h-4 w-4" /> {error}
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !filteredRows.length && (
        <div
          className="text-center py-16 rounded-3xl"
          style={{ border: "1px solid var(--c-border)", background: "var(--surface)" }}
        >
          <div
            className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--primary-12)", color: "var(--primary)" }}
          >
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-medium" style={{ color: "var(--text)" }}>
            Nenhum memorial encontrado
          </h3>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            Ajuste a busca ou altere os filtros.
          </p>
          <button className="btn-outline mt-4" onClick={handleClear}>
            Limpar
          </button>
        </div>
      )}

      {!loading && !!filteredRows.length && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRows.map((it, idx) => {
              const id = it.id || it.slug;
              const isFeatured = id && featuredId && String(id) === String(featuredId);
              const editorialFeatured = idx % 9 === 0;

              return (
                <Link key={id} to={`/memorial/${it.slug || it.id}`}>
                  <MemorialCard it={it} featured={isFeatured || editorialFeatured} />
                </Link>
              );
            })}
          </div>

          {tab !== "all" && (
            <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              * Filtro aplicado apenas sobre os resultados carregados.
            </p>
          )}
        </>
      )}
    </div>
  );
}
