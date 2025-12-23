// src/components/MessagesList.jsx
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MessageSquareText,
  BookHeart,
  Flame,
  Flower2,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

const DEFAULT_TZ = "America/Sao_Paulo";
const PAGE_SIZE = 8;
const RECENT_HOURS = 24;

const UI_TYPES = {
  MENSAGEM: { label: "Enviou mensagem", icon: MessageSquareText, needsText: true },
  LIVRO: { label: "Assinou o livro", icon: BookHeart, needsText: false },
  VELA: { label: "Acendeu uma vela", icon: Flame, needsText: false },
  FLOR: { label: "Enviou uma flor", icon: Flower2, needsText: false },
};

/* =========================
   Hooks
========================= */

function useDebouncedValue(value, delay = 160) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* =========================
   Utils
========================= */

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function hasExplicitTZ(s) {
  const v = String(s || "");
  return /Z$/.test(v) || /[+-]\d{2}:?\d{2}$/.test(v);
}

function fmtDateTimeSmart(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "—";

  if (hasExplicitTZ(raw)) {
    const d = new Date(raw);
    if (isNaN(d)) return "—";
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      timeZone: DEFAULT_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return fmt.replace(",", " às");
  }

  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return raw;

  const dd = m[3],
    mo = m[2],
    yy = m[1];
  const hh = m[4] || "00",
    mi = m[5] || "00";
  return `${dd}/${mo}/${yy} às ${hh}:${mi}`;
}

function ymdFromIsoSmart(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "";

  if (hasExplicitTZ(raw)) {
    const d = new Date(raw);
    if (isNaN(d)) return "";
    const txt = new Intl.DateTimeFormat("pt-BR", {
      timeZone: DEFAULT_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const [dd, mm, yy] = txt.split("/");
    return `${yy}-${mm}-${dd}`;
  }

  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function todayYmdTZ() {
  const now = new Date();
  const txt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: DEFAULT_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
  const [dd, mm, yy] = txt.split("/");
  return `${yy}-${mm}-${dd}`;
}

function addDaysYmd(ymd, delta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [Y, M, D] = ymd.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(Y, (M || 1) - 1, D || 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = String(dt.getUTCFullYear()).padStart(4, "0");
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function groupLabelFromYmd(ymd) {
  const hoje = todayYmdTZ();
  const ontem = addDaysYmd(hoje, -1);
  if (ymd === hoje) return "Hoje";
  if (ymd === ontem) return "Ontem";

  const [Y, M, D] = ymd.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mi = Math.max(0, Math.min(11, Number(M) - 1));
  return `${D} ${months[mi]} ${Y}`;
}

function normalizeTipo(v) {
  const raw = String(v || "").trim();
  if (!raw) return "MENSAGEM";

  const upper = raw.toUpperCase();
  if (UI_TYPES[upper]) return upper;

  const t = raw.toLowerCase().replace(/\s+/g, "_");
  const map = {
    mensagem: "MENSAGEM",
    mensagem_condolencia: "MENSAGEM",
    condolencia: "MENSAGEM",

    vela: "VELA",
    vela_digital: "VELA",
    acender_vela: "VELA",

    livro: "LIVRO",
    livro_digital: "LIVRO",
    livro_visitas: "LIVRO",
    assinar_livro: "LIVRO",

    flor: "FLOR",
    flor_digital: "FLOR",
    enviar_flor: "FLOR",
  };

  return map[t] || "MENSAGEM";
}

function homenagensLabel(n) {
  if (n === 0) return "0 homenagens";
  if (n === 1) return "1 homenagem";
  return `${n} homenagens`;
}

function safeTimeMs(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return NaN;

  if (hasExplicitTZ(raw)) {
    const d = new Date(raw);
    return isNaN(d) ? NaN : d.getTime();
  }

  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return NaN;

  const Y = Number(m[1]),
    Mo = Number(m[2]) - 1,
    D = Number(m[3]);
  const hh = Number(m[4] || "0"),
    mi = Number(m[5] || "0");
  const d = new Date(Y, Mo, D, hh, mi, 0, 0);
  return isNaN(d) ? NaN : d.getTime();
}

/* =========================
   Visual tokens
========================= */

function badgeTokens(tipo) {
  const base = tipo === "MENSAGEM" ? "var(--brand)" : "var(--highlight)";
  return {
    borderColor: `color-mix(in srgb, ${base} 30%, var(--c-border))`,
    color: "color-mix(in srgb, var(--text) 92%, transparent)",
    background: `color-mix(in srgb, ${base} 12%, var(--surface))`,
  };
}

function subtleRecentRing() {
  return {
    boxShadow:
      "0 0 0 1px color-mix(in srgb, var(--brand) 22%, transparent) inset, 0 14px 36px rgba(0,0,0,.06)",
  };
}

/* =========================
   Micro components
========================= */

function Pill({ children, style, title }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5",
        "text-[11px] font-semibold",
        "px-2.5 py-1 rounded-full ring-1 whitespace-nowrap"
      )}
      style={style}
      title={title}
    >
      {children}
    </span>
  );
}

function Segmented({ value, onChange }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 rounded-2xl p-1 ring-1",
        "bg-[color:color-mix(in_srgb,var(--surface-alt)_82%,transparent)]",
        "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
        "shadow-[0_10px_26px_rgba(0,0,0,.05)]"
      )}
      role="tablist"
      aria-label="Modo de visualização"
    >
      <button
        type="button"
        onClick={() => onChange?.("cards")}
        className={cx(
          "px-3 py-2 rounded-xl text-sm font-semibold transition inline-flex items-center gap-2",
          value === "cards"
            ? "bg-[var(--surface)] ring-1 ring-[color:color-mix(in_srgb,var(--brand)_40%,transparent)] shadow-[0_10px_22px_rgba(0,0,0,.10)]"
            : "opacity-80 hover:opacity-100"
        )}
        role="tab"
        aria-selected={value === "cards"}
      >
        <LayoutGrid className="h-4 w-4" />
        Cards
      </button>

      <button
        type="button"
        onClick={() => onChange?.("compact")}
        className={cx(
          "px-3 py-2 rounded-xl text-sm font-semibold transition inline-flex items-center gap-2",
          value === "compact"
            ? "bg-[var(--surface)] ring-1 ring-[color:color-mix(in_srgb,var(--brand)_40%,transparent)] shadow-[0_10px_22px_rgba(0,0,0,.10)]"
            : "opacity-80 hover:opacity-100"
        )}
        role="tab"
        aria-selected={value === "compact"}
      >
        Lista
      </button>
    </div>
  );
}

function Select({ value, onChange, options = [] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cx(
          "appearance-none w-full rounded-2xl px-3 py-2 text-sm font-semibold",
          "bg-[color:color-mix(in_srgb,var(--surface-alt)_82%,transparent)]",
          "ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
          "shadow-[0_10px_26px_rgba(0,0,0,.05)]",
          "text-[var(--text)] outline-none"
        )}
        aria-label="Ordenação"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" />
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="rounded-2xl p-5 bg-[color:color-mix(in_srgb,var(--surface-alt)_80%,transparent)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_55%,transparent)]">
          <Sparkles className="h-5 w-5 opacity-80" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text)]">Nada por aqui</div>
          <div className="mt-1 text-sm text-[var(--text)] opacity-75 leading-relaxed">
            Quando alguém enviar uma homenagem, ela aparecerá nesta lista.
          </div>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold ring-1 bg-[var(--surface)] text-[var(--text)] ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]"
            >
              Limpar busca
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main
========================= */

export default function MessagesList({
  items = [],
  highContrast = false,
  groupByDay = true,
  defaultView = "cards",
  title = "Assinaturas e mensagens",
}) {
  const reduceMotion = useReducedMotion();

  const [compactBar, setCompactBar] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompactBar(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [view, setView] = useState(defaultView === "compact" ? "compact" : "cards");
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 160);
  const query = String(qDebounced || "").trim().toLowerCase();

  const [order, setOrder] = useState("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const normalized = useMemo(() => {
    return (items || []).map((m) => {
      const dt = m?.dtInteracao || m?.data || m?.createdAt || m?.created_at || m?.dtCadastro;

      let tipo = normalizeTipo(m?.tipo);

      const msg = String(m?.mensagem || "").trim();
      if (msg) tipo = "MENSAGEM";

      const tms = safeTimeMs(dt);
      const recent = !isNaN(tms) ? Date.now() - tms <= RECENT_HOURS * 3600 * 1000 : false;

      const ymd = ymdFromIsoSmart(dt);

      return { ...m, _tipo: tipo, _dt: dt, _msg: msg, _ymd: ymd, _tms: tms, _recent: recent };
    });
  }, [items]);

  const filtered = useMemo(() => {
    if (!query) return normalized;
    return normalized.filter((m) => {
      const nome = String(m?.nome || "").toLowerCase();
      const msg = String(m?._msg || "").toLowerCase();
      const tipo = String(m?._tipo || "").toLowerCase();
      return nome.includes(query) || msg.includes(query) || tipo.includes(query);
    });
  }, [normalized, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const ta = a?._dt ? String(a._dt) : "";
      const tb = b?._dt ? String(b._dt) : "";
      const da = hasExplicitTZ(ta) ? new Date(ta).getTime() : NaN;
      const db = hasExplicitTZ(tb) ? new Date(tb).getTime() : NaN;
      if (!isNaN(da) && !isNaN(db)) return order === "recent" ? db - da : da - db;
      return order === "recent" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });
    return arr;
  }, [filtered, order]);

  useEffect(() => setVisible(PAGE_SIZE), [query, order]);

  const sliced = useMemo(() => sorted.slice(0, visible), [sorted, visible]);

  const groups = useMemo(() => {
    if (!groupByDay) return [{ key: "all", label: "", items: sliced }];

    const map = new Map();
    for (const it of sliced) {
      const k = it?._ymd || "sem-data";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }

    const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    if (order === "old") keys.reverse();

    return keys.map((k) => ({
      key: k,
      label: k === "sem-data" ? "Sem data" : groupLabelFromYmd(k),
      items: map.get(k) || [],
    }));
  }, [sliced, groupByDay, order]);

  const ring = highContrast
    ? "ring-black/30 dark:ring-white/30"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  const heroBg =
    "radial-gradient(900px 320px at 14% 0%, color-mix(in srgb, var(--brand) 14%, transparent), transparent 58%)," +
    "radial-gradient(720px 280px at 92% 10%, color-mix(in srgb, var(--highlight) 11%, transparent), transparent 62%)";

  const subtitle = homenagensLabel(sorted.length);
  const remaining = Math.max(0, sorted.length - visible);
  const canLoadMore = remaining > 0;

  const motionFast = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-3xl p-4 sm:p-6 ring-1",
        ring,
        "bg-[var(--surface)]",
        "shadow-[0_18px_55px_rgba(0,0,0,.06)]"
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-90" style={{ background: heroBg }} />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] sm:text-lg font-semibold text-[var(--text)] leading-tight">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--text)] opacity-75">
              {subtitle}
              {groupByDay ? <span className="opacity-80"> • agrupado por dia</span> : null}
            </p>
          </div>
        </div>

        {/* Command bar */}
        <div
          className={cx(
            "sticky z-20 mt-4 top-2 sm:top-3 rounded-2xl ring-1",
            "bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur",
            "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]",
            "shadow-[0_14px_42px_rgba(0,0,0,.08)]"
          )}
        >
          <div className={cx("flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3", compactBar ? "p-2.5" : "p-3")}>
            <div className="relative w-full sm:w-[380px]">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
                <Search className="h-[18px] w-[18px]" />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onInput={(e) => setQ(e.currentTarget.value)}
                className={cx(
                  "w-full rounded-2xl bg-[color:color-mix(in_srgb,var(--surface-alt)_86%,transparent)]",
                  "pl-10 pr-3",
                  compactBar ? "py-2" : "py-2.5",
                  "text-[var(--text)] outline-none ring-1",
                  "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
                  "focus:ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]",
                  "placeholder:text-[color:color-mix(in_srgb,var(--text)_45%,transparent)]"
                )}
                placeholder="Buscar por nome ou mensagem…"
                name="messages_search"
              />
            </div>

            <div className="flex flex-1 items-center justify-between sm:justify-end gap-2">
              <div className="w-[170px]">
                <Select
                  value={order}
                  onChange={setOrder}
                  options={[
                    { value: "recent", label: "Mais recentes" },
                    { value: "old", label: "Mais antigas" },
                  ]}
                />
              </div>

              <Segmented value={view} onChange={setView} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {!sliced.length ? (
            <EmptyState onClear={query ? () => setQ("") : null} />
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {groups.map((g) => (
                <motion.div
                  key={g.key}
                  layout
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0, transition: motionFast }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -6, transition: motionFast }}
                  className="space-y-3"
                >
                  {groupByDay ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1",
                          "bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)]",
                          "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]"
                        )}
                      >
                        <CalendarDays className="h-4 w-4 opacity-75" />
                        <span className="text-xs font-semibold text-[var(--text)] opacity-90">
                          {g.label}
                        </span>
                      </span>

                      <span className="text-xs text-[var(--text)] opacity-60">• {g.items.length}</span>
                    </div>
                  ) : null}

                  <motion.div layout className="space-y-3">
                    <AnimatePresence initial={false}>
                      {g.items.map((m, i) => (
                        <motion.div
                          key={(m?.id || "") + "_" + i}
                          layout
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                          animate={{ opacity: 1, y: 0, transition: motionFast }}
                          exit={{ opacity: 0, y: reduceMotion ? 0 : -8, transition: motionFast }}
                        >
                          {view === "compact" ? (
                            <MessageCompactRow m={m} />
                          ) : (
                            <MessageCard m={m} showRecent={order === "recent"} />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load more */}
        {canLoadMore ? (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(sorted.length, v + PAGE_SIZE))}
              className={cx(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1",
                "bg-[color:color-mix(in_srgb,var(--surface-alt)_85%,transparent)]",
                "text-[var(--text)]",
                "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
                "shadow-[0_12px_32px_rgba(0,0,0,.06)]",
                "hover:opacity-95"
              )}
            >
              Carregar mais ({Math.min(PAGE_SIZE, remaining)} de {remaining} restantes)
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            {remaining > PAGE_SIZE * 2 ? (
              <button
                type="button"
                onClick={() => setVisible(sorted.length)}
                className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text)] opacity-85 hover:opacity-100")}
              >
                Ver todas
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* =========================
   Card view — nome em cima, data/hora embaixo
========================= */

function MessageCard({ m, showRecent = true }) {
  const reduceMotion = useReducedMotion();

  const tipo = m?._tipo || "MENSAGEM";
  const meta = UI_TYPES[tipo] || UI_TYPES.MENSAGEM;
  const Icon = meta.icon || MessageSquareText;

  const name = String(m?.nome || "").trim() || "Visitante";
  const when = fmtDateTimeSmart(m?._dt);

  const msg = String(m?._msg || "").trim();
  const body = msg ? msg : `${meta.label}.`;

  const long = body.length > 220;
  const [open, setOpen] = useState(false);
  const clip = long && !open ? body.slice(0, 220) + "…" : body;

  const isRecent = showRecent && Boolean(m?._recent);

  return (
    <article
      className={cx(
        "group relative rounded-2xl p-4",
        "bg-[var(--surface-alt)] ring-1",
        "ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]",
        "transition"
      )}
      style={isRecent ? subtleRecentRing() : { boxShadow: "0 10px 26px rgba(0,0,0,.05)" }}
    >
      {/* pressão */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity"
        style={{
          background:
            "radial-gradient(520px 180px at 20% 0%, color-mix(in srgb, var(--brand) 14%, transparent), transparent 60%)",
        }}
      />

      {/* Header responsivo:
          - mobile: badge vai para baixo quando necessário
          - nome e data/hora sempre em coluna */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex items-start gap-2.5">
          <span
            className={cx(
              "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 shrink-0",
              "bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)]",
              "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]"
            )}
          >
            <Icon className="h-[18px] w-[18px] opacity-85" />
          </span>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text)] truncate">
              {name}
            </div>
            <div className="mt-1 text-xs text-[var(--text)] opacity-70">
              {when}
            </div>

            {isRecent ? (
              <div className="mt-1 text-[11px] text-[var(--text)] opacity-70">
                Recente
              </div>
            ) : null}
          </div>
        </div>

        <div className="sm:pt-0">
          <Pill style={badgeTokens(tipo)} title={tipo}>
            <span className="opacity-90">{meta.label}</span>
          </Pill>
        </div>
      </div>

      {/* Corpo */}
      <motion.div
        layout
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-3 text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap"
      >
        {clip}
      </motion.div>

      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--text)] opacity-80 hover:opacity-100"
        >
          {open ? (
            <>
              Ler menos <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Ler mais <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      ) : null}
    </article>
  );
}

/* =========================
   Compact row — data/hora embaixo do nome
========================= */

function MessageCompactRow({ m }) {
  const tipo = m?._tipo || "MENSAGEM";
  const meta = UI_TYPES[tipo] || UI_TYPES.MENSAGEM;
  const Icon = meta.icon || MessageSquareText;

  const name = String(m?.nome || "").trim() || "Visitante";
  const when = fmtDateTimeSmart(m?._dt);

  const msg = String(m?._msg || "").trim();
  const body = msg ? msg : `${meta.label}.`;

  return (
    <div
      className={cx(
        "relative rounded-2xl px-3.5 py-3",
        "bg-[var(--surface-alt)] ring-1",
        "ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]",
        "shadow-[0_10px_22px_rgba(0,0,0,.04)]"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2.5">
          <span
            className={cx(
              "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 shrink-0",
              "bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)]",
              "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]"
            )}
          >
            <Icon className="h-[18px] w-[18px] opacity-85" />
          </span>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text)] truncate">
              {name}
            </div>
            <div className="mt-1 text-xs text-[var(--text)] opacity-70">
              {when}
            </div>

            <div className="mt-2 text-sm text-[var(--text)] opacity-90 leading-relaxed line-clamp-2">
              {body}
            </div>
          </div>
        </div>

        <div className="sm:pt-0">
          <Pill style={badgeTokens(tipo)} title={tipo}>
            <span className="opacity-90">{meta.label}</span>
          </Pill>
        </div>
      </div>
    </div>
  );
}
