import { Link } from "react-router-dom";

/**
 * Botão de CTA padronizado, 100% baseado em CSS vars
 * Variants:
 *  - primary   (fundo var(--primary), texto var(--on-primary))
 *  - outline   (borda var(--primary), texto var(--primary-dark))
 *  - ghost     (sem borda; hover usa var(--primary-12) se existir, senão usa transparência)
 */
export default function CTAButton({
  as = "button",           // "button" | "link"
  to,                      // quando as="link"
  type = "button",
  onClick,
  disabled = false,
  className = "",
  children,
  iconBefore,
  iconAfter,
  variant = "primary",     // "primary" | "outline" | "ghost"
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const styles = {
    primary:
      "text-[var(--on-primary)] bg-[var(--primary)] " +
      "border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] " +
      "hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] " +
      "focus-visible:ring-[color-mix(in_srgb,var(--primary)_50%,black)]",
    outline:
      "border text-[var(--primary-dark)] " +
      "border-[var(--primary)] bg-transparent " +
      "hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] " +
      "focus-visible:ring-[color-mix(in_srgb,var(--primary)_40%,black)]",
    ghost:
      "bg-transparent text-[var(--primary-dark)] " +
      "hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] " +
      "focus-visible:ring-[color-mix(in_srgb,var(--primary)_30%,black)]",
  };

  const cls = [base, styles[variant], disabled ? "opacity-60 pointer-events-none" : "", className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className="inline-flex items-center gap-2">
      {iconBefore ? <span aria-hidden>{iconBefore}</span> : null}
      <span>{children}</span>
      {iconAfter ? <span aria-hidden>{iconAfter}</span> : null}
    </span>
  );

  if (as === "link") {
    return (
      <Link to={to || "#"} className={cls} aria-disabled={disabled} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>
      {content}
    </button>
  );
}
