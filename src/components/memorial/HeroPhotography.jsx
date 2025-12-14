import { useEffect, useMemo, useState } from "react";

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function useImageQuality(src) {
  const [state, setState] = useState({ broken: false, lowRes: false });

  useEffect(() => {
    if (!src) {
      setState({ broken: true, lowRes: false });
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      const maxSide = Math.max(w, h);
      const lowRes = maxSide > 0 && maxSide < 900;
      setState({ broken: false, lowRes });
    };

    img.onerror = () => {
      if (cancelled) return;
      setState({ broken: true, lowRes: false });
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return state;
}

export default function HeroPhotography({
  image = null,
  alt = "",
  brandHex = null,
  highContrast = false,
  heightClass = "h-[220px] sm:h-[260px] md:h-[320px]",
  className = "",
}) {
  const { broken, lowRes } = useImageQuality(image);

  const maskOpacity = useMemo(() => {
    if (highContrast) return 0.78;
    return lowRes ? 0.80 : 0.62;
  }, [highContrast, lowRes]);

  const vignetteOpacity = useMemo(() => {
    if (highContrast) return 0.52;
    return lowRes ? 0.56 : 0.36;
  }, [highContrast, lowRes]);

  const blurAmount = lowRes ? 34 : 26;
  const bgOpacity = lowRes ? 0.62 : 0.46;

  const fallbackBg = useMemo(() => {
    // fallback editorial (não depende de vars do tema)
    const base = brandHex || "#0ea5a4";
    return `radial-gradient(900px circle at 12% 22%, color-mix(in srgb, ${base} 32%, transparent), transparent 58%),
            radial-gradient(900px circle at 86% 18%, rgba(0,0,0,.16), transparent 60%),
            linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.06))`;
  }, [brandHex]);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl ring-1",
        heightClass,
        className,
      ].join(" ")}
      style={{
        background: "var(--surface)",
        borderColor: highContrast
          ? "color-mix(in srgb, black 30%, transparent)"
          : "color-mix(in srgb, var(--c-border) 90%, transparent)",
        boxShadow: "0 22px 70px rgba(0,0,0,.10)",
      }}
    >
      {!broken && image ? (
        <>
          {/* BACKGROUND BLUR COVER */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: `blur(${blurAmount}px) saturate(${lowRes ? 1.12 : 1.08}) contrast(${lowRes ? 1.10 : 1.04})`,
              transform: "scale(1.14)",
              opacity: bgOpacity,
            }}
            aria-hidden="true"
          />

          {/* MAIN IMAGE — SEM CORTES */}
          <img
            src={image}
            alt={alt}
            draggable={false}
            className="absolute inset-0 h-full w-full"
            style={{
              objectFit: "contain",
              objectPosition: "center",
              background: "rgba(0,0,0,.10)",
              filter: lowRes
                ? "saturate(1.02) contrast(1.08) brightness(1.05) blur(0.55px)"
                : "saturate(1.03) contrast(1.02)",
              transform: `scale(${clamp(lowRes ? 0.965 : 1.01, 0.96, 1.02)})`,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: fallbackBg }} aria-hidden="true" />
      )}

      {/* EDITORIAL MASK */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: maskOpacity,
          background:
            "linear-gradient(90deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.22) 26%, rgba(0,0,0,.10) 50%, rgba(0,0,0,.22) 74%, rgba(0,0,0,.62) 100%)",
        }}
        aria-hidden="true"
      />

      {/* VIGNETTE */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: vignetteOpacity,
          background:
            "radial-gradient(1200px circle at 50% 45%, rgba(0,0,0,0) 34%, rgba(0,0,0,.44) 100%)",
        }}
        aria-hidden="true"
      />

      {/* GRAIN (sutil) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: highContrast ? 0.10 : lowRes ? 0.14 : 0.08,
          backgroundImage:
            "radial-gradient(circle at 20% 12%, rgba(255,255,255,.10), transparent 35%), radial-gradient(circle at 80% 32%, rgba(255,255,255,.08), transparent 40%), radial-gradient(circle at 40% 82%, rgba(0,0,0,.12), transparent 45%)",
          mixBlendMode: "overlay",
        }}
        aria-hidden="true"
      />

      {/* PREMIUM GLOW */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px circle at 12% 30%, rgba(255,255,255,.12), transparent 55%), radial-gradient(900px circle at 85% 15%, color-mix(in srgb, var(--brand, var(--primary)) 18%, transparent), transparent 55%)",
          mixBlendMode: "screen",
          opacity: 0.78,
        }}
        aria-hidden="true"
      />

      {/* HAIRLINE BOTTOM */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "rgba(255,255,255,.16)" }}
        aria-hidden="true"
      />
    </div>
  );
}
