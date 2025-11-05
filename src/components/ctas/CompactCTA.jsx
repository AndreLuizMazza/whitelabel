// src/components/CompactCTA.jsx
import { ArrowRight } from "lucide-react";
import { usePrimaryColor } from "@/lib/themeColor";

/**
 * Cartão CTA compacto e reutilizável.
 * Alinhado ao tema via CSS Vars:
 *  - --primary, --primary-12, --surface, --text, --c-border
 * Usa btn-primary / btn-outline globais para consistência do whitelabel.
 */
export default function CompactCTA({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  bullets = [],
  primaryLabel = "Saiba mais",
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  className = "",
  "aria-describedby": ariaDescribedby,
}) {
  // Hook segue funcionando, mas agora só para cor do ícone.
  // Todo o resto usa tokens CSS (evita efeitos "piscando" ao trocar tenant).
  const { dark } = usePrimaryColor?.() ?? { dark: "var(--primary)" };

  return (
    <div className={`card p-5 sm:p-6 flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="h-11 w-11 grid place-items-center rounded-2xl"
          style={{ background: "var(--primary-12)" }}
          aria-hidden
        >
          {Icon ? <Icon className="h-5 w-5" style={{ color: dark }} /> : null}
        </div>

        <div className="min-w-0">
          {eyebrow ? (
            <div
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1"
              style={{
                background: "var(--primary-12)",
                color: "var(--text)",
                borderColor: "var(--c-border)",
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <h3 className="mt-2 text-lg font-extrabold leading-tight text-[var(--text)]">
            {title}
          </h3>

          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--text)] line-clamp-2">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {/* Bullets */}
      {bullets?.length ? (
        <ul className="mt-1 grid gap-2">
          {bullets.slice(0, 3).map((b) => (
            <li
              key={b}
              className="text-sm text-[var(--text)] flex items-start gap-2"
            >
              <span
                className="mt-1 h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--primary)" }}
                aria-hidden
              />
              <span className="min-w-0">{b}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Actions */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          className="btn-primary inline-flex items-center gap-1.5"
          aria-describedby={ariaDescribedby}
        >
          {primaryLoading ? "Carregando…" : primaryLabel}
          {!primaryLoading && <ArrowRight size={14} aria-hidden="true" />}
        </button>

        {secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={secondaryDisabled}
            className="btn-outline inline-flex items-center gap-1.5"
            style={{ color: dark }}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
