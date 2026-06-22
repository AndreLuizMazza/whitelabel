// src/components/member/MemberGroupedList.jsx
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Seção estilo iOS Settings — título footnote + grupo inset + rodapé opcional.
 */
export function MemberSection({ title, footer, children, className = "" }) {
  return (
    <section className={`mb-5 ${className}`}>
      {title ? (
        <h3
          className="px-4 mb-1.5 text-[13px] font-normal"
          style={{ color: "var(--text-muted)" }}
        >
          {title}
        </h3>
      ) : null}
      {children}
      {footer ? (
        <p
          className="px-4 mt-2 text-[13px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {footer}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Container de grupo — cantos 10px, fundo branco/surface, separadores 0.5px.
 */
export function MemberGroupedList({ children, className = "" }) {
  return (
    <div
      className={`rounded-[10px] overflow-hidden divide-y ${className}`}
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--separator, var(--c-border))",
      }}
    >
      {children}
    </div>
  );
}

const rowBase =
  "flex items-center gap-3 w-full min-h-[44px] px-4 py-2.5 text-left transition-colors active:opacity-70";

function RowIcon({ icon: Icon, tint = "primary" }) {
  if (!Icon) return null;
  const bg =
    tint === "danger"
      ? "color-mix(in srgb, var(--danger, #dc2626) 12%, var(--surface))"
      : "color-mix(in srgb, var(--primary) 14%, var(--surface))";
  const color = tint === "danger" ? "var(--danger, #dc2626)" : "var(--primary)";

  return (
    <span
      className="inline-flex h-[29px] w-[29px] items-center justify-center rounded-[7px] shrink-0"
      style={{ background: bg, color }}
    >
      <Icon size={17} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

function RowContent({ label, detail, destructive }) {
  return (
    <span className="flex-1 min-w-0">
      <span
        className="block text-[17px] leading-snug truncate"
        style={{ color: destructive ? "var(--danger, #dc2626)" : "var(--text)" }}
      >
        {label}
      </span>
      {detail ? (
        <span
          className="block text-[13px] leading-snug mt-0.5 truncate"
          style={{ color: "var(--text-muted)" }}
        >
          {detail}
        </span>
      ) : null}
    </span>
  );
}

function RowChevron({ show = true }) {
  if (!show) return null;
  return (
    <ChevronRight
      size={17}
      strokeWidth={2.5}
      className="shrink-0 opacity-35"
      style={{ color: "var(--text-muted)" }}
      aria-hidden="true"
    />
  );
}

export function MemberListRow({
  icon,
  label,
  detail,
  to,
  state,
  onClick,
  showChevron = true,
  destructive = false,
  external = false,
}) {
  const content = (
    <>
      <RowIcon icon={icon} tint={destructive ? "danger" : "primary"} />
      <RowContent label={label} detail={detail} destructive={destructive} />
      <RowChevron show={showChevron && (to || onClick || external)} />
    </>
  );

  if (to) {
    return (
      <Link to={to} state={state} className={rowBase} aria-label={label}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowBase} aria-label={label}>
        {content}
      </button>
    );
  }

  if (external) {
    return (
      <a
        href={external}
        target="_blank"
        rel="noopener noreferrer"
        className={rowBase}
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return <div className={rowBase}>{content}</div>;
}
