import SoftChip from "@/components/memorial/SoftChip";
import {
  Eye,
  MapPin,
  Clock3,
  Heart,
  Star,
  Cross,
} from "lucide-react";

function initialsFromName(nome) {
  const parts = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "—";
  return parts.map((p) => p[0]).join("").toUpperCase();
}

export default function IdentityCard({
  nome,
  fotoUrl = null,
  nasc = "—",
  fale = "—",
  horaFal = null,
  idade = null,
  views = 0,
  reacoes = 0,
  naturalidade = null,
  localFalecimento = null,
  highContrast = false,
}) {
  const wrap = highContrast
    ? "bg-[var(--surface)] ring-1 ring-black/30 dark:bg-black dark:ring-white/30"
    : "bg-[var(--surface)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:bg-[var(--surface)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  const portraitBg = "color-mix(in srgb, var(--brand, var(--primary)) 10%, var(--surface))";
  const portraitRing = "color-mix(in srgb, var(--brand, var(--primary)) 16%, var(--c-border))";

  return (
    <section
      className={[
        "rounded-3xl p-4 sm:p-6 shadow-[0_18px_55px_rgba(0,0,0,.06)]",
        wrap,
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {/* Portrait — SEM CORTES */}
        <div className="shrink-0">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              width: 92,
              height: 92,
              background: portraitBg,
              border: `1px solid ${portraitRing}`,
              boxShadow: "0 14px 40px rgba(0,0,0,.10)",
            }}
          >
            {fotoUrl ? (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${fotoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(18px) saturate(1.06)",
                    transform: "scale(1.12)",
                    opacity: 0.55,
                  }}
                  aria-hidden="true"
                />
                <img
                  src={fotoUrl}
                  alt={nome}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    background: "rgba(0,0,0,.06)",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(120px circle at 30% 25%, rgba(255,255,255,.18), transparent 58%), radial-gradient(140px circle at 70% 70%, rgba(0,0,0,.18), transparent 60%)",
                    mixBlendMode: "overlay",
                    opacity: 0.7,
                  }}
                  aria-hidden="true"
                />
              </>
            ) : (
              <div
                className="h-full w-full flex items-center justify-center font-semibold"
                style={{
                  color: "var(--brand, var(--primary))",
                  fontSize: 22,
                  letterSpacing: "-0.02em",
                }}
                aria-label={`Iniciais de ${nome}`}
              >
                {initialsFromName(nome)}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1
            className="leading-tight break-words"
            style={{
              color: "var(--text)",
              fontSize: 20,
              fontWeight: 650,
              letterSpacing: "-0.02em",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {nome}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {/* ⭐ / ✝ datas */}
            <SoftChip highContrast={highContrast}>
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 opacity-90" />
                  <span className="tabular-nums">{nasc}</span>
                </span>
                <span className="opacity-60">—</span>
                <span className="inline-flex items-center gap-1.5">
                  <Cross className="h-4 w-4 opacity-90" />
                  <span className="tabular-nums">{fale}</span>
                </span>
                {horaFal ? (
                  <span className="inline-flex items-center gap-1.5 ml-1">
                    <span className="opacity-60">•</span>
                    <Clock3 className="h-4 w-4 opacity-85" />
                    <span className="tabular-nums">{horaFal}</span>
                  </span>
                ) : null}
              </span>
            </SoftChip>

            {idade != null ? (
              <SoftChip highContrast={highContrast}>
                <span className="tabular-nums">{idade}</span> anos
              </SoftChip>
            ) : null}

            <SoftChip highContrast={highContrast}>
              <Eye className="h-4 w-4 opacity-85" />
              <span className="tabular-nums">{Number(views || 0)}</span>
              <span>visualiza{Number(views || 0) === 1 ? "ção" : "ções"}</span>
            </SoftChip>

            {Number(reacoes || 0) > 0 ? (
              <SoftChip highContrast={highContrast}>
                <Heart className="h-4 w-4 opacity-85" />
                <span className="tabular-nums">{Number(reacoes || 0)}</span>
                <span>reações</span>
              </SoftChip>
            ) : null}

            {naturalidade ? (
              <SoftChip highContrast={highContrast}>
                <MapPin className="h-4 w-4 opacity-85" />
                <span className="break-words">Natural de {naturalidade}</span>
              </SoftChip>
            ) : null}

            {localFalecimento ? (
              <SoftChip highContrast={highContrast}>
                <Clock3 className="h-4 w-4 opacity-85" />
                <span className="break-words">Falecimento: {localFalecimento}</span>
              </SoftChip>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
