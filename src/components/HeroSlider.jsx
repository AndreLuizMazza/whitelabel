// HeroSlider.jsx (Apple-level: Modo Fotografia + player funcional + suporte a metaLeft/metaRight como ReactNode)
// - Player/autoplay: NÃO trava ao clicar (foco por mouse não pausa autoplay)
// - Acessibilidade: pausa por foco APENAS quando foco veio do teclado (Tab)
// - SEM CORTES: objectFit contain
// - Low-res: fundo mais forte + imagem levemente menor + máscara/vinheta mais intensas + grain
// - Mantém: swipe, preload, CTA, fallback
// - Upgrade: metaLeft/metaRight podem ser string OU ReactNode (para ícones + datas no hero)

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const v =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsTouch(!!v);
  }, []);
  return isTouch;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampTextStyle(lines = 2) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

function isStr(v) {
  return typeof v === "string" || typeof v === "number";
}

export default function HeroSlider({
  title = "Memoriais Públicos",
  subtitle = "Um espaço para lembrar, homenagear e manter vivo o legado.",
  slides = [],
  statsRight = null,
  heightClass = "h-[52vh] md:h-[58vh]",
  intervalMs = 9000,
  className = "",
  ariaLabel = "Destaques do memorial",
  initialIndex = 0,
}) {
  const safeSlides = useMemo(
    () => (Array.isArray(slides) ? slides.filter(Boolean) : []),
    [slides]
  );
  const hasSlides = safeSlides.length > 0;

  const prefersReduced = usePrefersReducedMotion();
  const isTouch = useIsTouchDevice();

  const [index, setIndex] = useState(() => {
    const ii = safeNum(initialIndex, 0);
    return hasSlides ? Math.max(0, Math.min(ii, safeSlides.length - 1)) : 0;
  });
  const [paused, setPaused] = useState(false);

  const timeoutRef = useRef(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);

  // 🔥 distinguir foco do teclado vs clique
  const lastInputRef = useRef("mouse"); // "mouse" | "keyboard" | "touch"

  const startXRef = useRef(null);
  const deltaXRef = useRef(0);

  // garante index válido quando slides mudam
  useEffect(() => {
    if (!hasSlides) {
      setIndex(0);
      return;
    }
    setIndex((i) => {
      const max = safeSlides.length - 1;
      return Math.max(0, Math.min(i, max));
    });
  }, [hasSlides, safeSlides.length]);

  const next = () =>
    setIndex((i) => (hasSlides ? (i + 1) % safeSlides.length : 0));
  const prev = () =>
    setIndex((i) =>
      hasSlides ? (i - 1 + safeSlides.length) % safeSlides.length : 0
    );

  // autoplay com setTimeout
  useEffect(() => {
    if (!hasSlides) return;
    if (prefersReduced) return;
    if (paused) return;

    if (hoverRef.current) return;

    // pausa por foco SOMENTE se foco veio do teclado
    if (focusRef.current && lastInputRef.current === "keyboard") return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      next();
    }, intervalMs);

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, hasSlides, prefersReduced, paused, intervalMs]);

  const rootRef = useRef(null);

  // capturar origem do input (teclado)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onKeyDown = (e) => {
      lastInputRef.current = "keyboard";
      if (!hasSlides) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSlides]);

  // swipe (mobile)
  const onPointerDown = (e) => {
    lastInputRef.current = isTouch ? "touch" : "mouse";
    if (!hasSlides) return;
    if (!isTouch) return;
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? null;
    deltaXRef.current = 0;
  };
  const onPointerMove = (e) => {
    if (!hasSlides) return;
    if (!isTouch) return;
    if (startXRef.current == null) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? startXRef.current;
    deltaXRef.current = x - startXRef.current;
  };
  const onPointerUp = () => {
    if (!hasSlides) return;
    if (!isTouch) return;
    const dx = deltaXRef.current;
    startXRef.current = null;
    deltaXRef.current = 0;

    const threshold = 44;
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
  };

  const active = hasSlides ? safeSlides[index] : null;
  const nextSlide = hasSlides
    ? safeSlides[(index + 1) % safeSlides.length]
    : null;

  // preload do próximo slide
  useEffect(() => {
    if (!nextSlide?.image) return;
    const img = new Image();
    img.src = nextSlide.image;
  }, [nextSlide?.image]);

  // overlay editorial
  const overlayBg =
    "linear-gradient(90deg, rgba(0,0,0,.66) 0%, rgba(0,0,0,.40) 54%, rgba(0,0,0,.18) 100%)";

  const metaLeft = active?.metaLeft ?? null;
  const metaRight = active?.metaRight ?? null;

  return (
    <section
      ref={rootRef}
      tabIndex={0}
      className={[
        "relative overflow-hidden rounded-3xl ring-1 outline-none",
        className,
      ].join(" ")}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--c-border)",
      }}
      onMouseEnter={() => {
        hoverRef.current = true;
        lastInputRef.current = "mouse";
      }}
      onMouseLeave={() => (hoverRef.current = false)}
      onFocusCapture={() => (focusRef.current = true)}
      onBlurCapture={() => (focusRef.current = false)}
      onPointerDownCapture={() => {
        lastInputRef.current = isTouch ? "touch" : "mouse";
      }}
      onTouchStart={() => isTouch && setPaused(true)}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div
        className={["relative", heightClass].join(" ")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* BACKGROUND (z-0) */}
        {hasSlides ? (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {safeSlides.map((s, i) => (
              <SlideLayer
                key={s.id || s.image || i}
                slide={s}
                isActive={i === index}
                prefersReduced={prefersReduced}
                overlayBg={overlayBg}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(900px circle at 15% 20%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 55%), radial-gradient(900px circle at 85% 30%, rgba(0,0,0,.10), transparent 60%), linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.03))",
              }}
            />
            <div className="absolute inset-0" style={{ background: overlayBg }} />
          </div>
        )}

        {/* CONTENT (z-10) */}
        <div className="relative z-10 h-full">
          <div className="h-full px-4 md:px-6 lg:px-8 flex flex-col justify-end">
            <div className="pb-4 md:pb-6 lg:pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-5 lg:gap-6 items-end">
                <div className="min-w-0">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ring-1"
                    style={{
                      background: "rgba(255,255,255,.10)",
                      color: "rgba(255,255,255,.92)",
                      border: "1px solid rgba(255,255,255,.14)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--primary)" }}
                      aria-hidden="true"
                    />
                    <span>
                      {String(active?.kicker || "Memorial").toUpperCase()}
                    </span>
                  </div>

                  <h1
                    className="mt-3 text-[22px] sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight"
                    style={{
                      color: "#fff",
                      textShadow: "0 8px 28px rgba(0,0,0,.35)",
                      ...clampTextStyle(2),
                    }}
                    aria-live="polite"
                    title={active?.headline || title}
                  >
                    {active?.headline || title}
                  </h1>

                  <p
                    className="mt-2 text-sm md:text-base max-w-2xl"
                    style={{
                      color: "rgba(255,255,255,.84)",
                      textShadow: "0 6px 22px rgba(0,0,0,.28)",
                      ...clampTextStyle(2),
                    }}
                  >
                    {active?.description || subtitle}
                  </p>

                  {(metaLeft || metaRight) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                      {metaLeft && (
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1"
                          style={{
                            maxWidth: "100%",
                            background: "rgba(255,255,255,.10)",
                            color: "rgba(255,255,255,.90)",
                            border: "1px solid rgba(255,255,255,.14)",
                            backdropFilter: "blur(10px)",
                          }}
                          title={isStr(metaLeft) ? String(metaLeft) : undefined}
                        >
                          <span className="truncate">{metaLeft}</span>
                        </span>
                      )}
                      {metaRight && (
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1"
                          style={{
                            maxWidth: "min(100%, 520px)",
                            background: "rgba(0,0,0,.18)",
                            color: "rgba(255,255,255,.90)",
                            border: "1px solid rgba(255,255,255,.10)",
                            backdropFilter: "blur(10px)",
                          }}
                          title={isStr(metaRight) ? String(metaRight) : undefined}
                        >
                          <span className="truncate">{metaRight}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {active?.btnLink && active?.btnLabel && (
                    <div className="mt-4">
                      <a
                        href={active.btnLink}
                        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ring-1 transition"
                        style={{
                          background: "rgba(255,255,255,.12)",
                          color: "rgba(255,255,255,.94)",
                          border: "1px solid rgba(255,255,255,.16)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {active.btnLabel}
                      </a>
                    </div>
                  )}
                </div>

                {/* RIGHT SLOT só no desktop */}
                <div className="lg:justify-self-end w-full hidden lg:block">
                  {statsRight ? (
                    <div
                      className="rounded-2xl p-4 ring-1"
                      style={{
                        background: "rgba(255,255,255,.10)",
                        border: "1px solid rgba(255,255,255,.14)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 18px 60px rgba(0,0,0,.22)",
                      }}
                    >
                      {statsRight}
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl p-4 ring-1"
                      style={{
                        background: "rgba(255,255,255,.08)",
                        border: "1px solid rgba(255,255,255,.12)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 18px 60px rgba(0,0,0,.18)",
                      }}
                    >
                      <div
                        className="text-xs uppercase tracking-wide font-semibold"
                        style={{ color: "rgba(255,255,255,.78)" }}
                      >
                        Destaques
                      </div>
                      <div
                        className="mt-2 text-sm"
                        style={{ color: "rgba(255,255,255,.88)" }}
                      >
                        Use a busca para encontrar rapidamente um memorial público.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CONTROLES */}
              {hasSlides && (
                <div className="mt-4 md:mt-5 flex items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-2"
                    role="tablist"
                    aria-label="Slides"
                  >
                    {safeSlides.map((_, i) => {
                      const isActive = i === index;
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => (lastInputRef.current = "mouse")}
                          onClick={() => setIndex(i)}
                          className="h-2.5 rounded-full transition-all"
                          style={{
                            width: isActive ? 26 : 10,
                            background: isActive
                              ? "rgba(255,255,255,.92)"
                              : "rgba(255,255,255,.32)",
                            boxShadow: isActive
                              ? "0 0 0 1px rgba(0,0,0,.20)"
                              : "none",
                          }}
                          aria-label={`Ir para o slide ${i + 1}`}
                          aria-current={isActive ? "true" : "false"}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <IconButton
                      ariaLabel="Slide anterior"
                      onMouseDown={() => (lastInputRef.current = "mouse")}
                      onClick={prev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </IconButton>

                    <button
                      type="button"
                      onMouseDown={() => (lastInputRef.current = "mouse")}
                      onClick={() => setPaused((p) => !p)}
                      className="h-9 px-3 rounded-full inline-flex items-center justify-center gap-2 ring-1 transition"
                      style={{
                        background: "rgba(255,255,255,.10)",
                        border: "1px solid rgba(255,255,255,.14)",
                        backdropFilter: "blur(10px)",
                        color: "rgba(255,255,255,.92)",
                      }}
                      aria-label={paused ? "Reproduzir" : "Pausar"}
                    >
                      {paused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                      <span className="text-xs font-semibold">
                        {paused ? "Play" : "Pause"}
                      </span>
                    </button>

                    <IconButton
                      ariaLabel="Próximo slide"
                      onMouseDown={() => (lastInputRef.current = "mouse")}
                      onClick={next}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "rgba(255,255,255,.14)" }}
          />
        </div>
      </div>
    </section>
  );
}

function IconButton({ ariaLabel, onClick, onMouseDown, children }) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onClick={onClick}
      className="h-9 w-9 rounded-full inline-flex items-center justify-center ring-1 transition"
      style={{
        background: "rgba(255,255,255,.10)",
        border: "1px solid rgba(255,255,255,.14)",
        backdropFilter: "blur(10px)",
        color: "rgba(255,255,255,.92)",
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function SlideLayer({ slide, isActive, prefersReduced, overlayBg }) {
  const [broken, setBroken] = useState(false);
  const [lowRes, setLowRes] = useState(false);

  const onImgLoad = (e) => {
    const w = e?.currentTarget?.naturalWidth || 0;
    const h = e?.currentTarget?.naturalHeight || 0;
    const maxSide = Math.max(w, h);
    setLowRes(maxSide > 0 && maxSide < 900);
  };

  const photographyMaskOpacity = lowRes ? 0.86 : 0.60;

  return (
    <div
      className={[
        "absolute inset-0 transition-opacity duration-700",
        isActive ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden={!isActive}
      style={{ zIndex: isActive ? 1 : 0 }}
    >
      {!broken ? (
        <>
          {/* Fundo (cover + blur) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: lowRes
                ? "blur(34px) saturate(1.12) contrast(1.08)"
                : "blur(26px) saturate(1.08)",
              transform: "scale(1.14)",
              opacity: lowRes ? 0.58 : 0.46,
            }}
          />

          {/* Imagem principal SEM CORTES */}
          <img
            src={slide.image}
            alt={slide.alt || ""}
            className="absolute inset-0 h-full w-full"
            draggable={false}
            loading={isActive ? "eager" : "lazy"}
            onError={() => setBroken(true)}
            onLoad={onImgLoad}
            style={{
              objectFit: "contain",
              objectPosition: "center",
              background: "rgba(0,0,0,.14)",
              filter: lowRes
                ? "saturate(1.02) contrast(1.06) brightness(1.04) blur(0.55px)"
                : "saturate(1.03) contrast(1.02)",
              transform: prefersReduced ? "none" : `scale(${lowRes ? 0.96 : 1.01})`,
            }}
          />

          {/* Máscara editorial */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: photographyMaskOpacity,
              background:
                "linear-gradient(90deg, rgba(0,0,0,.58) 0%, rgba(0,0,0,.22) 20%, rgba(0,0,0,.10) 50%, rgba(0,0,0,.22) 80%, rgba(0,0,0,.58) 100%)",
            }}
          />

          {/* Vinheta */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: lowRes ? 0.54 : 0.34,
              background:
                "radial-gradient(1200px circle at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,.42) 100%)",
            }}
          />

          {/* Grain sutil */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: lowRes ? 0.12 : 0.07,
              backgroundImage:
                "radial-gradient(circle at 20% 10%, rgba(255,255,255,.10), transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,255,255,.08), transparent 40%), radial-gradient(circle at 40% 80%, rgba(0,0,0,.10), transparent 45%)",
              mixBlendMode: "overlay",
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 15% 20%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 55%), radial-gradient(900px circle at 85% 30%, rgba(0,0,0,.10), transparent 60%), linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.05))",
          }}
        />
      )}

      {/* Overlay editorial */}
      <div className="absolute inset-0" style={{ background: overlayBg }} />

      {/* Glow premium */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px circle at 12% 30%, rgba(255,255,255,.12), transparent 55%), radial-gradient(900px circle at 85% 15%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 55%)",
          mixBlendMode: "screen",
          opacity: 0.7,
        }}
      />
    </div>
  );
}
