// src/components/ui/CTAButton.jsx
import { Link } from "react-router-dom";

/**
 * Botão de CTA padronizado, 100% baseado em CSS vars.
 * Variants: 'primary' | 'outline' | 'ghost'
 * as: 'button' | 'link' | 'a'
 */
export default function CTAButton({
  as = "button",           // "button" | "link" | "a"
  to,                      // quando as="link"
  href,                    // quando as="a"
  target,
  rel,
  type = "button",
  onClick,
  disabled = false,
  className = "",
  size = "md",             // "sm" | "md" | "lg"
  variant = "primary",     // "primary" | "outline" | "ghost"
  iconBefore,
  iconAfter,
  children,
  ...rest
}) {
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  const variants = {
    primary:
      "bg-[var(--primary)] text-[var(--on-primary)] border border-[color-mix(in_srgb,var(--primary)_70%,transparent)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed",
    outline:
      "bg-[var(--surface)] text-[var(--primary-dark)] border border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] disabled:opacity-60 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-[var(--primary-dark)] border border-transparent hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] disabled:opacity-60 disabled:cursor-not-allowed",
  };

  const cls =
    `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${sizes[size]} ${variants[variant]} ${className}`;

  const content = (
    <>
      {iconBefore ? <span className="shrink-0">{iconBefore}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {iconAfter ? <span className="shrink-0">{iconAfter}</span> : null}
    </>
  );

  // ===== Navegação SPA =====
  if (as === "link") {
    return (
      <Link
        to={to || "#"}
        className={cls}
        aria-disabled={disabled ? "true" : undefined}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  // ===== Anchor externa (WhatsApp, lojas, etc.) =====
  if (as === "a") {
    const safeHref = (typeof href === "string" && href.trim()) ? href.trim() : undefined;

    const effectiveRel =
      safeHref && target === "_blank"
        ? (rel || "noopener noreferrer")
        : rel;

    const handleClick = (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      // Se não há href (ex.: vamos abrir via onClick/window.open), evita navegação padrão
      if (!safeHref) {
        e.preventDefault();
      }
      onClick?.(e);
    };

    return (
      <a
        href={disabled ? undefined : safeHref}
        target={disabled ? undefined : target}
        rel={disabled ? undefined : effectiveRel}
        onClick={handleClick}
        aria-disabled={disabled ? "true" : undefined}
        className={cls}
        role={!safeHref ? "button" : undefined}
        {...rest}
      >
        {content}
      </a>
    );
  }

  // ===== Botão padrão =====
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      {...rest}
    >
      {content}
    </button>
  );
}
