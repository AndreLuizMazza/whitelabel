// src/components/ui/Button.jsx
import React from "react";

/**
 * Utilidade local — substitui o pacote `clsx`
 * Combina strings e objetos de classes em uma única string.
 * Exemplo: clsx("a", { "b": cond }) → "a b" se cond for true
 */
function clsx(...args) {
  return args
    .flatMap((a) => {
      if (typeof a === "string") return a;
      if (Array.isArray(a)) return clsx(...a);
      if (a && typeof a === "object")
        return Object.keys(a).filter((k) => a[k]);
      return [];
    })
    .join(" ");
}

/**
 * Button — base padronizado por tokens de tema
 *
 * Variants:
 * - primary  (fundo --primary, texto --on-primary)
 * - outline  (borda --c-border, texto --text; hover com leve mix)
 * - ghost    (sem borda, fundo transparente; hover usa --button-hover)
 * - subtle   (fundo var(--surface), borda leve; útil para chips/menus)
 *
 * Size:
 * - sm | md | lg
 *
 * Props principais:
 * - as="button" | "a" — opcional; por padrão renderiza <button>
 * - href — se for link
 * - loading — desabilita e mostra spinner simples
 * - full — largura total
 */
const SPINNER = (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

const sizes = {
  sm: "text-sm px-3 py-1.5 rounded-md",
  md: "text-sm px-4 py-2 rounded-lg",
  lg: "text-base px-5 py-2.5 rounded-xl",
};

const base =
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variants = {
  primary: "text-[length:inherit] border border-transparent",
  outline: "text-[length:inherit] border",
  ghost: "text-[length:inherit] border border-transparent bg-transparent",
  subtle: "text-[length:inherit] border",
};

function styleFor(variant) {
  switch (variant) {
    case "primary":
      return {
        background: "var(--primary)",
        color: "var(--on-primary)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
      };
    case "outline":
      return {
        background: "transparent",
        color: "var(--text)",
        borderColor: "var(--c-border)",
      };
    case "ghost":
      return {
        background: "transparent",
        color: "var(--text)",
      };
    case "subtle":
    default:
      return {
        background: "var(--surface)",
        color: "var(--text)",
        borderColor: "var(--c-border)",
      };
  }
}

function hoverStyle(variant) {
  switch (variant) {
    case "primary":
      return { background: "var(--button-hover)" };
    case "outline":
      return { background: "var(--button-hover)" };
    case "ghost":
      return { background: "var(--button-hover)" };
    case "subtle":
    default:
      return { background: "var(--button-hover)" };
  }
}

export default function Button({
  as,
  href,
  children,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  full,
  className,
  style,
  onClick,
  type = "button",
  ...rest
}) {
  const Comp = as || (href ? "a" : "button");
  const baseStyle = styleFor(variant);

  const [isHover, setHover] = React.useState(false);
  const mergedStyle = {
    ...baseStyle,
    ...(isHover ? hoverStyle(variant) : null),
    ...(style || {}),
  };

  const classes = clsx(base, variants[variant], sizes[size], className, {
    "opacity-60 pointer-events-none": disabled || loading,
    "w-full": full,
  });

  const commonProps = {
    className: classes,
    style: mergedStyle,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick,
    ...rest,
  };

  if (Comp === "button") {
    return (
      <button type={type} disabled={disabled || loading} {...commonProps}>
        {loading ? SPINNER : null}
        {children}
      </button>
    );
  }

  return (
    <Comp href={href} aria-disabled={disabled || loading} {...commonProps}>
      {loading ? SPINNER : null}
      {children}
    </Comp>
  );
}
