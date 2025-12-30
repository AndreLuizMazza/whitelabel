// src/components/memorial/IdentityCard.jsx
import { useMemo } from "react";
import {
  Eye,
  Heart,
  MapPin,
  Clock3,
  Star,
  Cross,
} from "lucide-react";

/* =========================
   Helpers
========================= */

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function initialsFromName(nome) {
  const parts = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "—";
  return parts.map((p) => p[0]).join("").toUpperCase();
}

function safeNum(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function plural(n, s, p) {
  return n === 1 ? s : p;
}

/* =========================
   UI atoms
========================= */

function Chip({ children, tone = "neutral" }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-[13px] font-semibold ring-1 whitespace-nowrap";
  const tones = {
    neutral:
      "bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)] text-[var(--text)]",
    brand:
      "bg-[color:color-mix(in_srgb,var(--brand, var(--primary))_12%,var(--surface))] ring-[color:color-mix(in_srgb,var(--brand, var(--primary))_26%,var(--c-border))] text-[var(--text)]",
  };
  return <span className={cx(base, tones[tone] || tones.neutral)}>{children}</span>;
}

function HairlineCard({ children }) {
  return (
    <section
      className={cx(
        "rounded-3xl p-4 sm:p-6 ring-1",
        "bg-[var(--surface)]",
        "ring-[color:color-mix(in_srgb,var(--c-border)_80%,transparent)]",
        "shadow-[0_18px_55px_rgba(0,0,0,.06)]"
      )}
    >
      {children}
    </section>
  );
}

/* =========================
   Component
========================= */

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
}) {
  const v = safeNum(views);
  const r = safeNum(reacoes);

  const portraitBg = useMemo(() => {
    return "color-mix(in srgb, var(--brand, var(--primary)) 10%, var(--surface))";
  }, []);

  const portraitRing = useMemo(() => {
    return "color-mix(in srgb, var(--brand, var(--primary)) 18%, var(--c-border))";
  }, []);

  return (
    <HairlineCard>
      <div className="flex items-start gap-4">
        {/* Portrait (sem cortes) */}
        <div className="shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              width: 96,
              height: 96,
              background: portraitBg,
              border: `1px solid ${portraitRing}`,
              boxShadow: "0 14px 40px rgba(0,0,0,.10)",
            }}
          >
            {fotoUrl ? (
              <>
                {/* fundo blur editorial */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${fotoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(18px) saturate(1.08)",
                    transform: "scale(1.12)",
                    opacity: 0.55,
                  }}
                  aria-hidden="true"
                />
                {/* imagem principal sem corte */}
                <img
                  src={fotoUrl}
                  alt={nome}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    background: "rgba(0,0,0,.06)",
                  }}
                  draggable={false}
                />
                {/* leve máscara para “respeito” */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(120px circle at 30% 25%, rgba(255,255,255,.16), transparent 58%), radial-gradient(140px circle at 70% 70%, rgba(0,0,0,.18), transparent 60%)",
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

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <h1
            className="leading-tight break-words"
            style={{
              color: "var(--text)",
              fontSize: 20,
              fontWeight: 750,
              letterSpacing: "-0.02em",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {nome}
          </h1>

          {/* Datas (hierarquia para leitura) */}
          <div className="mt-2.5 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text)]">
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 opacity-80" />
                <span className="tabular-nums">{nasc}</span>
              </span>

              <span className="opacity-55">—</span>

              <span className="inline-flex items-center gap-2">
                <Cross className="h-4 w-4 opacity-80" />
                <span className="tabular-nums">{fale}</span>
              </span>
            </div>

            {/* Hora embaixo (pedido explícito) */}
            {horaFal ? (
              <div className="text-xs sm:text-sm text-[var(--text)] opacity-75 flex items-center gap-2">
                <Clock3 className="h-4 w-4 opacity-75" />
                <span className="tabular-nums">às {horaFal}</span>
              </div>
            ) : null}
          </div>

          {/* Chips (Facebook/Instagram: badges de contexto) */}
          <div className="mt-3 flex flex-wrap gap-2">
            {idade != null ? (
              <Chip tone="brand">
                <span className="tabular-nums">{idade}</span>
                <span>{plural(Number(idade), "ano", "anos")}</span>
              </Chip>
            ) : null}

            <Chip>
              <Eye className="h-4 w-4 opacity-80" />
              <span className="tabular-nums">{v}</span>
              <span>{plural(v, "visualização", "visualizações")}</span>
            </Chip>

            {r > 0 ? (
              <Chip>
                <Heart className="h-4 w-4 opacity-80" />
                <span className="tabular-nums">{r}</span>
                <span>{plural(r, "reação", "reações")}</span>
              </Chip>
            ) : null}

            {naturalidade ? (
              <Chip>
                <MapPin className="h-4 w-4 opacity-80" />
                <span className="break-words">Natural de {naturalidade}</span>
              </Chip>
            ) : null}

            {localFalecimento ? (
              <Chip>
                <Clock3 className="h-4 w-4 opacity-80" />
                <span className="break-words">Falecimento: {localFalecimento}</span>
              </Chip>
            ) : null}
          </div>
        </div>
      </div>
    </HairlineCard>
  );
}
