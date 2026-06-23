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
  Smartphone,
} from "lucide-react";
import HeaderNotificationsBell from "@/components/HeaderNotificationsBell.jsx";
import useTenant from "@/store/tenant";
import { useTenantLogoOnPrimaryUrl } from "@/lib/tenantLogoRuntime";
import useUserAvatar from "@/hooks/useUserAvatar";

const cardShadow =
  "0 0.5px 0 color-mix(in srgb, var(--text) 8%, transparent), 0 1px 2px color-mix(in srgb, var(--text) 4%, transparent), 0 8px 24px color-mix(in srgb, var(--text) 4%, transparent)";

const cardShellStyle = {
  background: "var(--surface)",
  boxShadow: cardShadow,
  border: "0.5px solid color-mix(in srgb, var(--text) 6%, transparent)",
};

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

function MemberHeroLogo({ align = "left" }) {
  const logoUrl = useTenantLogoOnPrimaryUrl();
  const tenant = useTenant((s) => s.empresa);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fallback = tenant?.nomeFantasia || tenant?.razaoSocial || "Logo";
  const alignClass =
    align === "center" ? "justify-center" : "justify-start";

  if (failed || !logoUrl) {
    return (
      <span
        className={`block max-w-[min(180px,52vw)] truncate text-[15px] font-semibold tracking-tight leading-tight ${align === "center" ? "text-center" : "text-left"}`}
      >
        {fallback}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex h-10 min-w-[88px] max-w-[min(180px,52vw)] items-center ${alignClass}`}
    >
      {!loaded ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 inset-y-1 rounded-lg opacity-40 animate-pulse"
          style={{ background: "rgba(255,255,255,0.14)" }}
        />
      ) : null}
      <img
        src={logoUrl}
        alt={fallback}
        className={`relative h-10 w-auto max-w-full object-contain object-left transition-opacity duration-300 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        decoding="async"
        fetchPriority="high"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function MemberHeroAvatar({ nomeExibicao }) {
  const { avatarUrl, avatarErro, setAvatarErro, initials } = useUserAvatar();
  const label = initials || initialsFromName(nomeExibicao);

  return (
    <Link
      to="/perfil"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0 overflow-hidden text-[12px] font-semibold transition active:scale-[0.94]"
      style={{
        background: avatarUrl && !avatarErro ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.18)",
        border: "0.5px solid rgba(255,255,255,0.32)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.1)",
      }}
      aria-label="Ir para perfil"
    >
      {avatarUrl && !avatarErro ? (
        <img
          src={avatarUrl}
          alt={nomeExibicao || "Perfil"}
          className="h-full w-full object-cover"
          decoding="async"
          onError={() => setAvatarErro(true)}
        />
      ) : (
        label
      )}
    </Link>
  );
}

function MemberWelcomeCard({
  primeiroNome,
  unidadeNome,
  planoLabel,
  numeroContrato,
  contratoAtivo,
  planoDetailTo,
  planoDetailState,
}) {
  const logoUrl = useTenantLogoOnPrimaryUrl();
  const subtitle = unidadeNome
    ? `Área do associado · ${formatDisplayLabel(unidadeNome)}`
    : "Que bom ter você por aqui!";

  return (
    <div
      className="relative mt-3.5 -mb-1 overflow-hidden rounded-[22px] px-4 py-3.5 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)",
        border: "0.5px solid rgba(255,255,255,0.24)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          className="member-welcome-watermark pointer-events-none absolute -right-4 top-1/2 h-[96px] w-auto max-w-none -translate-y-1/2 select-none opacity-[0.07]"
          draggable={false}
        />
      ) : null}

      <div className="relative z-[1]">
        <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight">
          Olá,{" "}
          <span style={{ color: "var(--secondary, var(--on-primary, #fff))" }}>
            {primeiroNome}
          </span>
        </h1>
        <p className="mt-1 text-[14px] leading-snug text-white/80">{subtitle}</p>

        {numeroContrato ? (
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-white/90"
              style={{
                background: "rgba(0,0,0,0.18)",
                border: "0.5px solid rgba(255,255,255,0.12)",
              }}
            >
              <ShieldCheck size={12} className="shrink-0 opacity-90" />
              <span>{contratoAtivo ? "Contrato ativo" : "Aguardando ativação"}</span>
              <span className="opacity-70 tabular-nums">#{numeroContrato}</span>
            </span>
          </div>
        ) : null}

        {planoLabel && planoDetailTo ? (
          <Link
            to={planoDetailTo}
            state={planoDetailState}
            className="mt-2.5 inline-flex min-h-[36px] items-center text-[13px] font-medium text-white/90 underline decoration-white/35 underline-offset-[3px] transition active:opacity-70"
          >
            Ver detalhes do plano · {planoLabel}
          </Link>
        ) : planoLabel ? (
          <p className="mt-2.5 text-[13px] leading-snug text-white/75">{planoLabel}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MemberHero({
  nomeExibicao,
  nomePlano,
  numeroContrato,
  contratoAtivo,
  unidadeNome,
  planoDetailTo = null,
  planoDetailState = null,
}) {
  const primeiroNome = nomeExibicao?.split(" ")?.[0] || "Associado";
  const planoLabel = formatDisplayLabel(nomePlano);

  return (
    <section
      className="relative overflow-hidden pb-4"
      style={{
        background:
          "linear-gradient(168deg, var(--primary-dark, var(--primary)) 0%, var(--primary) 52%, color-mix(in srgb, var(--primary) 68%, #000) 100%)",
        color: "var(--on-primary, #fff)",
        paddingTop: "max(0.625rem, env(safe-area-inset-top))",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 85% -10%, rgba(255,255,255,0.28) 0%, transparent 52%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(0,0,0,0.12) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-[1] px-4 pt-0.5">
        <div className="flex min-h-[44px] items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <MemberHeroLogo align="left" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HeaderNotificationsBell tone="onDark" />
            <MemberHeroAvatar nomeExibicao={nomeExibicao} />
          </div>
        </div>

        <MemberWelcomeCard
          primeiroNome={primeiroNome}
          unidadeNome={unidadeNome}
          planoLabel={planoLabel}
          numeroContrato={numeroContrato}
          contratoAtivo={contratoAtivo}
          planoDetailTo={planoDetailTo}
          planoDetailState={planoDetailState}
        />
      </div>
    </section>
  );
}

export function MemberContentSheet({ children, className = "", overlap = true }) {
  return (
    <div
      className={`relative px-4 pt-5 pb-6 ${
        overlap
          ? "-mt-10 rounded-t-[28px] md:mt-4 md:rounded-[24px]"
          : "rounded-[24px] mt-4"
      } ${className}`}
      style={{
        background: "var(--grouped-bg, var(--surface-alt, var(--surface)))",
        boxShadow: overlap
          ? "0 -1px 0 color-mix(in srgb, var(--text) 6%, transparent), 0 -12px 40px color-mix(in srgb, var(--text) 6%, transparent)"
          : cardShadow,
        borderTop: overlap
          ? "0.5px solid color-mix(in srgb, var(--text) 5%, transparent)"
          : undefined,
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
            ? "member-section-label text-[12px] font-semibold uppercase tracking-[0.06em]"
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

  const shellStyle = { ...cardShellStyle };

  if (onClick && onToggleValues) {
    return (
      <div className="member-dashboard-card rounded-[20px] overflow-hidden" style={shellStyle}>
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
      className={`member-dashboard-card w-full text-left rounded-[20px] px-4 py-3.5 flex items-center gap-3 transition ${
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
      className="member-dashboard-card rounded-[22px] px-4 py-4 flex items-center gap-3.5"
      style={cardShellStyle}
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

export function MemberQuickGrid({ children, className = "" }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>{children}</div>
  );
}

export function MemberQuickGridTile({
  icon: Icon,
  label,
  detail,
  to,
  state,
  onClick,
  badgeIcon: BadgeIcon,
}) {
  const inner = (
    <>
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-full shrink-0"
        style={iconSquircle}
      >
        <Icon size={20} strokeWidth={1.85} />
      </span>
      {BadgeIcon ? (
        <span
          className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--secondary, var(--highlight, #c9a227)) 92%, #fff)",
            color: "var(--primary-dark, var(--text))",
          }}
        >
          <BadgeIcon size={10} strokeWidth={2.5} />
        </span>
      ) : null}
      <span className="block text-[15px] font-semibold leading-snug tracking-tight">
        {label}
      </span>
      {detail ? (
        <span
          className="block text-[12px] leading-snug line-clamp-2"
          style={{ color: "var(--text-muted)" }}
        >
          {detail}
        </span>
      ) : null}
    </>
  );

  const className =
    "member-dashboard-card relative rounded-[20px] p-4 text-left min-h-[104px] flex flex-col items-start justify-between gap-2 transition active:scale-[0.98]";

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className={className}
        style={cardShellStyle}
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
      style={cardShellStyle}
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
    "member-dashboard-card w-full rounded-[22px] px-4 py-3.5 flex items-center gap-3 transition active:scale-[0.99] text-left";

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className={className}
        style={cardShellStyle}
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
      style={cardShellStyle}
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
      className="member-dashboard-card w-full rounded-[22px] overflow-hidden flex items-stretch min-h-[80px] text-left transition active:scale-[0.99]"
      style={cardShellStyle}
    >
      <span
        className="w-[72px] shrink-0 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(165deg, var(--primary-dark, var(--primary)), var(--primary))",
          color: "var(--on-primary, #fff)",
        }}
      >
        <HeartHandshake size={24} strokeWidth={1.75} />
      </span>
      <span className="flex-1 px-4 py-3.5 flex items-center justify-between gap-3 min-w-0">
        <span>
          <span className="block text-[15px] font-semibold leading-snug tracking-tight">
            Estamos aqui para cuidar de você
          </span>
          <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
            Fale com nossa equipe quando precisar
          </span>
        </span>
        <ChevronRight
          size={16}
          strokeWidth={2.5}
          className="member-grid-chevron shrink-0 opacity-80"
        />
      </span>
    </button>
  );
}

/** Benefícios digitais do plano (sem duplicar atendimento do grid/banner) */
export function MemberDigitalServicesSection({ beneficiosTo, beneficiosState }) {
  if (!beneficiosTo) return null;

  return (
    <div className="space-y-2">
      <MemberSectionHeading grouped>Serviços digitais</MemberSectionHeading>
      <MemberServiceRow
        icon={Smartphone}
        label="Benefícios digitais"
        detail="Serviços incluídos no seu plano"
        to={beneficiosTo}
        state={beneficiosState}
      />
    </div>
  );
}

/** Lista vertical de atalhos — um card contínuo estilo iOS inset group */
export function MemberQuickList({ children, className = "" }) {
  return (
    <div
      className={`member-dashboard-card rounded-[22px] overflow-hidden divide-y ${className}`}
      style={{
        ...cardShellStyle,
        borderColor: "var(--separator, var(--c-border))",
      }}
    >
      {children}
    </div>
  );
}

export function MemberQuickListRow({ icon: Icon, label, detail, to, state, onClick }) {
  const rowClass =
    "flex items-center gap-3 w-full min-h-[56px] px-4 py-3 text-left transition active:opacity-80";

  const content = (
    <>
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
        style={iconSquircle}
      >
        <Icon size={19} strokeWidth={1.85} />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[16px] font-semibold leading-snug tracking-tight">{label}</span>
        {detail ? (
          <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
            {detail}
          </span>
        ) : null}
      </span>
      <ChevronRight
        size={16}
        strokeWidth={2.5}
        className="member-grid-chevron shrink-0 opacity-60"
      />
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
