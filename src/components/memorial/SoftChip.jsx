import React from "react";

export default function SoftChip({ children, highContrast = false, className = "" }) {
  const base = highContrast
    ? "bg-[var(--surface)] text-black ring-black/40 dark:bg-black dark:text-white dark:ring-white/40"
    : "bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)] text-[var(--text)] ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)] dark:text-[var(--text)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <span
      className={[
        "inline-flex min-h-[2.1rem] max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-medium leading-tight",
        "backdrop-blur-md ring-1 shadow-[0_10px_28px_rgba(0,0,0,.06)]",
        base,
        className,
      ].join(" ")}
      style={{
        // melhora legibilidade no claro sem “pesar”
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </span>
  );
}
