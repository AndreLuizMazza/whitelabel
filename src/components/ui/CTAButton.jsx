// src/components/ui/CTAButton.jsx
import { Link } from "react-router-dom";

/**
 * Botão de CTA padronizado, 100% baseado em CSS vars.
 * Variants: 'primary' | 'outline' | 'ghost'
 * tone: 'default' | 'onDark' (hero/foto escura)
 * as: 'button' | 'link' | 'a' | 'span'
 */
export default function CTAButton({
  as = "button",
  to,
  href,
  target,
  rel,
  type = "button",
  onClick,
  disabled = false,
  className = "",
  size = "md",
  variant = "primary",
  tone = "default",
  iconBefore,
  iconAfter,
  children,
  ...rest
}) {
  const cls = [
    "cta-btn",
    `cta-btn--${size}`,
    `cta-btn--${variant}`,
    tone === "onDark" ? "cta-btn--on-dark" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {iconBefore ? <span className="shrink-0">{iconBefore}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {iconAfter ? <span className="shrink-0">{iconAfter}</span> : null}
    </>
  );

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

  if (as === "a") {
    const safeHref = typeof href === "string" && href.trim() ? href.trim() : undefined;
    const effectiveRel =
      safeHref && target === "_blank" ? rel || "noopener noreferrer" : rel;

    const handleClick = (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      if (!safeHref) e.preventDefault();
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

  if (as === "span") {
    return (
      <span className={cls} aria-disabled={disabled ? "true" : undefined} {...rest}>
        {content}
      </span>
    );
  }

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
