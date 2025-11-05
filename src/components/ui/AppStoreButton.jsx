import { Smartphone, Apple } from "lucide-react";

/**
 * Botão consistente para as lojas do app — evita “pulo” visual no refresh.
 * variant: "solid" (fundo var(--primary)) | "outline" (borda var(--primary))
 * icon: "android" | "ios"
 */
export default function AppStoreButton({ href="#", children, variant="solid", icon="android" }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const solid =
    "text-[var(--on-primary)] bg-[var(--primary)] border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] " +
    "hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] focus-visible:ring-[color-mix(in_srgb,var(--primary)_50%,black)]";
  const outline =
    "text-[var(--primary-dark)] border border-[var(--primary)] bg-transparent " +
    "hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] focus-visible:ring-[color-mix(in_srgb,var(--primary)_40%,black)]";

  const cls = [base, variant === "solid" ? solid : outline].join(" ");
  const Icon = icon === "ios" ? Apple : Smartphone;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      <Icon size={16} /> {children}
    </a>
  );
}
