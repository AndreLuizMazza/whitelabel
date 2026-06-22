import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  Clock3,
  HeartHandshake,
  Eye,
  EyeOff,
} from "lucide-react";
import HeaderNotificationsBell from "@/components/HeaderNotificationsBell.jsx";
import useTenant from "@/store/tenant";
import { useTenantLogoUrl } from "@/lib/tenantLogoRuntime";

const cardShadow =
  "0 1px 3px color-mix(in srgb, var(--text) 4%, transparent), 0 0 0 0.5px color-mix(in srgb, var(--text) 6%, transparent)";

const iconSquircle = {
  background: "color-mix(in srgb, var(--primary) 10%, var(--surface))",
  color: "var(--primary)",
};

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatDisplayLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÇ]/.test(text);
  if (!isAllCaps) return text;
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function MemberHeroLogo() {
  const logoUrl = useTenantLogoUrl();
  const tenant = useTenant((s) => s.empresa);
  const [failed, setFailed] = useState(false);
  const fallback = tenant?.nomeFantasia || tenant?.razaoSocial || "Logo";

  if (failed || !logoUrl) {
    return (
      <span className="inline-flex h-9 max-w-[140px] items-center justify-center rounded-xl bg-white/95 px-3 text-[11px] font-semibold leading-tight text-center truncate">
        {fallback}
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 min-w-[96px] max-w-[140px] items-center justify-center rounded-xl bg-white/95 px-2.5 shadow-sm">
      <img
        src={logoUrl}
        alt={fallback}
        className="h-6 w-auto max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function MemberHero({
  nomeExibicao,
  nomePlano,
  numeroContrato,
  contratoAtivo,
  unidadeNome,
}) {
  const primeiroNome = nomeExibicao?.split(" ")?.[0] || "Associado";
  const planoLabel = formatDisplayLabel(nomePlano);

  return (
    <section
      className="relative overflow-hidden pb-12"
      style={{
        background:
          "linear-gradient(168deg, var(--primary-dark, var(--primary)) 0%, var(--primary) 48%, color-mix(in srgb, var(--primary) 72%, #000) 100%)",
        color: "var(--on-primary, #fff)",
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,255,255,0.22) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-[1] px-4 pt-1">
        <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <Link
            to="/perfil"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full shrink-0 text-[13px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.16)",
              border: "0.5px solid rgba(255,255,255,0.24)",
            }}
            aria-label="Ir para perfil"
          >
            {initialsFromName(nomeExibicao)}
          </Link>

          <div className="flex justify-center min-w-0">
            <MemberHeroLogo />
          </div>

          <div className="flex justify-end">
            <HeaderNotificationsBell tone="onDark" />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[15px] opacity-90">Olá,</p>
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight mt-0.5">
            {primeiroNome}
          </h1>
          <p className="mt-1.5 text-[14px] leading-snug opacity-85">
            {unidadeNome
              ? `Área do associado · ${formatDisplayLabel(unidadeNome)}`
              : "Que bom ter você por aqui!"}
          </p>
        </div>

        {numeroContrato ? (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: "rgba(0,0,0,0.16)",
              border: "0.5px solid rgba(255,255,255,0.16)",
            }}
          >
            <ShieldCheck size={14} className="shrink-0 opacity-90" />
            <span className="text-[12px] font-medium">
              {contratoAtivo ? "Contrato ativo" : "Aguardando ativação"}
            </span>
            <span className="text-[12px] opacity-75 tabular-nums">#{numeroContrato}</span>
          </div>
        ) : null}

        {planoLabel ? (
          <div
            className="mt-4 rounded-[20px] px-4 py-3.5 backdrop-blur-md"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "0.5px solid rgba(255,255,255,0.2)",
            }}
          >
            <p className="text-[12px] font-medium opacity-80">Seu plano</p>
            <p className="mt-0.5 text-[17px] font-semibold leading-snug line-clamp-2">
              {planoLabel}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MemberContentSheet({ children, className = "", overlap = true }) {
  return (
    <div
      className={`relative px-4 pt-4 pb-6 ${
        overlap
          ? "-mt-8 rounded-t-[32px] md:mt-4 md:rounded-[24px]"
          : "rounded-[24px] mt-4"
      } ${className}`}
      style={{
        background: "var(--surface)",
        boxShadow: overlap
          ? "0 -4px 24px color-mix(in srgb, var(--text) 5%, transparent)"
          : cardShadow,
      }}
    >
      {children}
    </div>
  );
}

export function MemberSectionHeading({ children, action, grouped = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        grouped ? "mb-2 px-1" : "mb-3"
      }`}
    >
      <h2
        className={
          grouped
            ? "text-[13px] font-normal uppercase tracking-[0.02em]"
            : "text-[17px] font-semibold tracking-tight"
        }
        style={{ color: grouped ? "var(--text-muted)" : "var(--text)" }}
      >
        {children}
      </h2>
      {action || null}
    </div>
  );
}

/** Navegação voltar estilo iOS (chevron + label) */
export function MemberSubpageNav({
  to = "/area",
  label = "Início",
  className = "",
}) {
  return (
    <div className={`mb-1 ${className}`}>
      <Link
        to={to}
        className="inline-flex items-center gap-0.5 min-h-[44px] -ml-1 pl-1 pr-2 text-[17px] transition active:opacity-60"
        style={{ color: "var(--primary)" }}
      >
        <ChevronLeft size={22} strokeWidth={2.25} aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}

/** Cabeçalho de subpágina da área privada */
export function MemberSubpageHeader({ title, meta, children }) {
  return (
    <header className="mb-5">
      <h1
        className="text-[34px] font-bold leading-[1.08] tracking-tight md:text-[28px]"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h1>
      {meta ? (
        <p className="mt-2 text-[15px] leading-snug" style={{ color: "var(--text-muted)" }}>
          {meta}
        </p>
      ) : null}
      {children}
    </header>
  );
}

const statusStyles = {
  ok: {
    bg: "color-mix(in srgb, #30d158 14%, var(--surface))",
    color: "#248a3d",
    border: "color-mix(in srgb, #30d158 28%, transparent)",
  },
  warn: {
    bg: "color-mix(in srgb, #ffd60a 18%, var(--surface))",
    color: "#9a6700",
    border: "color-mix(in srgb, #ffd60a 35%, transparent)",
  },
  danger: {
    bg: "color-mix(in srgb, #ff453a 12%, var(--surface))",
    color: "#c93400",
    border: "color-mix(in srgb, #ff453a 28%, transparent)",
  },
  muted: {
    bg: "color-mix(in srgb, var(--text) 6%, var(--surface))",
    color: "var(--text-muted)",
    border: "color-mix(in srgb, var(--text) 12%, transparent)",
  },
};

export function MemberNextPaymentCard({
  titulo,
  valor,
  dataLabel,
  statusLabel,
  statusTone = "ok",
  onClick,
  onToggleValues,
  mostrarValores = true,
  emptyPrimary,
}) {
  const tone = statusStyles[statusTone] || statusStyles.ok;
  const hasValor = valor != null && String(valor).length > 0;

  let primaryLine = null;
  if (emptyPrimary) {
    primaryLine = (
      <p className="text-[17px] font-semibold leading-snug mt-0.5">{emptyPrimary}</p>
    );
  } else if (hasValor && mostrarValores) {
    primaryLine = (
      <p className="text-[24px] font-bold tabular-nums leading-none mt-0.5 tracking-tight">
        {valor}
      </p>
    );
  } else if (hasValor && !mostrarValores) {
    primaryLine = <p className="text-[24px] font-bold leading-none mt-0.5">••••••</p>;
  }

  const body = (
    <>
      <span
        className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] shrink-0"
        style={iconSquircle}
      >
        {statusTone === "muted" && emptyPrimary ? (
          <Clock3 size={22} strokeWidth={1.75} />
        ) : (
          <CalendarDays size={22} strokeWidth={1.75} />
        )}
      </span>

      <span className="flex-1 min-w-0">
        <span
          className="block text-[13px] font-medium leading-snug"
          style={{ color: "var(--text-muted)" }}
        >
          {titulo}
        </span>
        {primaryLine}
        {dataLabel ? (
          <span className="block text-[13px] mt-1 leading-snug" style={{ color: "var(--text-muted)" }}>
            {dataLabel}
          </span>
        ) : null}
      </span>

      <span className="flex items-center gap-2 shrink-0">
        {statusLabel ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
            style={{
              background: tone.bg,
              color: tone.color,
              border: `0.5px solid ${tone.border}`,
            }}
          >
            {statusTone === "ok" ? <CheckCircle2 size={12} strokeWidth={2.5} /> : null}
            {statusLabel}
          </span>
        ) : null}
        {onClick ? (
          <ChevronRight
            size={18}
            strokeWidth={2.5}
            className="opacity-45 shrink-0"
            style={{ color: "var(--secondary, var(--primary))" }}
          />
        ) : null}
      </span>
    </>
  );

  const shellStyle = { background: "var(--surface)", boxShadow: cardShadow };

  if (onClick && onToggleValues) {
    return (
      <div className="rounded-[20px] overflow-hidden" style={shellStyle}>
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition active:opacity-90"
        >
          {body}
        </button>
        <button
          type="button"
          onClick={onToggleValues}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-medium min-h-[44px] border-t transition active:opacity-70"
          style={{
            color: "var(--primary)",
            borderColor: "var(--separator, var(--c-border))",
          }}
        >
          {mostrarValores ? (
            <>
              <EyeOff size={15} strokeWidth={2} />
              Ocultar valores
            </>
          ) : (
            <>
              <Eye size={15} strokeWidth={2} />
              Mostrar valores
            </>
          )}
        </button>
      </div>
    );
  }

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-[20px] px-4 py-3.5 flex items-center gap-3 transition ${
        onClick ? "active:scale-[0.99]" : ""
      }`}
      style={shellStyle}
    >
      {body}
    </Comp>
  );
}

export function MemberPaymentStatusCard({ titulo, status, detail, statusTone = "ok" }) {
  const ring =
    statusTone === "danger" ? "#ff453a" : statusTone === "warn" ? "#ffd60a" : "#30d158";

  return (
    <div
      className="rounded-[20px] px-4 py-3.5 flex items-center gap-3"
      style={{ background: "var(--surface)", boxShadow: cardShadow }}
    >
      <span
        className="inline-flex h-12 w-12 items-center justify-center rounded-full shrink-0"
        style={{
          background: `color-mix(in srgb, ${ring} 14%, var(--surface))`,
          color: ring,
        }}
      >
        <CheckCircle2 size={22} strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0">
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          {titulo}
        </p>
        <p className="text-[17px] font-semibold mt-0.5">{status}</p>
        {detail ? (
          <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
            {detail}
          </p>
        ) : null}
      </span>
    </div>
  );
}

export function MemberQuickTile({ icon: Icon, label, detail, to, state, onClick }) {
  const inner = (
    <>
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] shrink-0"
        style={iconSquircle}
      >
        <Icon size={20} strokeWidth={1.85} />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[16px] font-semibold leading-snug">{label}</span>
        {detail ? (
          <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
            {detail}
          </span>
        ) : null}
      </span>
      <ChevronRight
        size={17}
        strokeWidth={2.5}
        className="shrink-0 opacity-35"
        style={{ color: "var(--text-muted)" }}
      />
    </>
  );

  const className =
    "rounded-[20px] px-4 py-3.5 flex items-center gap-3 min-h-[72px] transition active:scale-[0.98] text-left w-full";

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className={className}
        style={{ background: "var(--surface)", boxShadow: cardShadow }}
        aria-label={label}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{ background: "var(--surface)", boxShadow: cardShadow }}
      aria-label={label}
    >
      {inner}
    </button>
  );
}

export function MemberQuickGridTile({ icon: Icon, label, to, state, onClick, badgeIcon: BadgeIcon }) {
  const inner = (
    <>
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] mx-auto"
        style={iconSquircle}
      >
        <Icon size={19} strokeWidth={1.85} />
      </span>
      {BadgeIcon ? (
        <span
          className="absolute top-2.5 right-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--secondary, var(--highlight, #c9a227)) 92%, #fff)",
            color: "var(--primary-dark, var(--text))",
          }}
        >
          <BadgeIcon size={10} strokeWidth={2.5} />
        </span>
      ) : null}
      <span className="block text-[13px] font-semibold mt-2.5 leading-snug px-1">{label}</span>
    </>
  );

  const className =
    "relative rounded-[18px] p-3 pt-3.5 text-center min-h-[100px] transition active:scale-[0.98]";

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className={className}
        style={{ background: "var(--surface)", boxShadow: cardShadow }}
        aria-label={label}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} w-full`}
      style={{ background: "var(--surface)", boxShadow: cardShadow }}
      aria-label={label}
    >
      {inner}
    </button>
  );
}

export function MemberServiceRow({
  icon: Icon,
  label,
  detail,
  actionLabel,
  onClick,
  to,
  state,
}) {
  const content = (
    <>
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] shrink-0"
        style={iconSquircle}
      >
        <Icon size={20} strokeWidth={1.85} />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[16px] font-semibold">{label}</span>
        {detail ? (
          <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
            {detail}
          </span>
        ) : null}
      </span>
      {actionLabel ? (
        <span
          className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "var(--on-primary, #fff)" }}
        >
          {actionLabel}
        </span>
      ) : null}
      <ChevronRight
        size={17}
        strokeWidth={2.5}
        className="shrink-0 opacity-35"
        style={{ color: "var(--text-muted)" }}
      />
    </>
  );

  const className =
    "w-full rounded-[20px] px-4 py-3.5 flex items-center gap-3 transition active:scale-[0.99] text-left";

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className={className}
        style={{ background: "var(--surface)", boxShadow: cardShadow }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{ background: "var(--surface)", boxShadow: cardShadow }}
    >
      {content}
    </button>
  );
}

export function MemberCareBanner({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[20px] overflow-hidden flex items-stretch min-h-[84px] text-left transition active:scale-[0.99]"
      style={{ background: "var(--surface)", boxShadow: cardShadow }}
    >
      <span
        className="w-[84px] shrink-0 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(165deg, var(--primary-dark, var(--primary)), var(--primary))",
          color: "var(--on-primary, #fff)",
        }}
      >
        <HeartHandshake size={26} strokeWidth={1.75} />
      </span>
      <span className="flex-1 px-4 py-3.5 flex items-center justify-between gap-3 min-w-0">
        <span>
          <span className="block text-[15px] font-semibold leading-snug">
            Estamos aqui para cuidar de você
          </span>
          <span className="block text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Fale com nossa equipe quando precisar
          </span>
        </span>
        <ChevronRight
          size={17}
          strokeWidth={2.5}
          className="shrink-0 opacity-35"
          style={{ color: "var(--text-muted)" }}
        />
      </span>
    </button>
  );
}

/** Lista vertical de atalhos — um card contínuo estilo iOS inset group */
export function MemberQuickList({ children }) {
  return (
    <div
      className="rounded-[20px] overflow-hidden divide-y"
      style={{
        background: "var(--surface)",
        boxShadow: cardShadow,
        border: "0.5px solid var(--separator, var(--c-border))",
      }}
    >
      {children}
    </div>
  );
}

export function MemberQuickListRow({ icon: Icon, label, detail, to, state, onClick }) {
  const rowClass =
    "flex items-center gap-3 w-full min-h-[68px] px-4 py-3 text-left transition active:opacity-80";

  const content = (
    <>
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] shrink-0"
        style={iconSquircle}
      >
        <Icon size={19} strokeWidth={1.85} />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[16px] font-semibold leading-snug">{label}</span>
        {detail ? (
          <span className="block text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {detail}
          </span>
        ) : null}
      </span>
      <ChevronRight size={17} strokeWidth={2.5} className="opacity-30 shrink-0" style={{ color: "var(--text-muted)" }} />
    </>
  );

  if (to) {
    return (
      <Link to={to} state={state} className={rowClass} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={rowClass} aria-label={label}>
      {content}
    </button>
  );
}
