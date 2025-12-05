// src/components/StickyContactDock.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, MessageCircle, ClipboardList } from "lucide-react";
import useTenant from "@/store/tenant";
import { buildWaHref, resolveTenantPhone, resolveGlobalFallback } from "@/lib/whats";
import useAvoidOverlap from "@/hooks/useAvoidOverlap";

/**
 * CTA fixo: WhatsApp + Ligação (+ 3º botão opcional)
 * - Mobile: barra inferior “dock” colada no bottom
 * - Desktop: “pill” flutuante
 * - Evita banners fixos (ex.: cookies) — NÃO soma rodapé no offset
 * - Reserva espaço global via --app-bottom-safe
 * - Compacta perto do rodapé (sem deslocar para o meio)
 * - Auto-hide no scroll, teclado-aware (mobile)
 * - WhatsApp: verde oficial com pulso | Ligar: cor do tenant
 */
export default function StickyContactDock({
  whatsappNumber,
  phoneNumber,
  message,
  position = "bottom-right", // bottom-right | bottom-left
  showLabels = true,
  className = "",
  utm = "utm_source=site&utm_medium=cta-sticky&utm_campaign=whitelabel",
  avoidSelector = "[data-cookie-banner], [data-bottom-avoid]", // ⚠️ não inclua footer aqui
  // extraAction: { label, href?, onClick?, ariaLabel?, badge? }
  extraAction,
  reserveSpace = true,
  compactNearFooter = true,
  hideOnKeyboard = true,
  autoHideOnScroll = true,
}) {
  const empresa = useTenant((s) => s.empresa);
  const dockRef = useRef(null);
  const [dockH, setDockH] = useState(0);
  const [nearFooter, setNearFooter] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [hiddenByScroll, setHiddenByScroll] = useState(false);

  const avoidOffset = useAvoidOverlap(avoidSelector);

  const { waHref, telHref } = useMemo(() => {
    const base = (whatsappNumber || resolveTenantPhone(empresa) || resolveGlobalFallback()).toString();
    const phone = (phoneNumber || base).toString();

    const wa = buildWaHref({
      number: base,
      message:
        message ||
        `Olá! Tenho interesse no plano de assistência da ${empresa?.nomeFantasia || empresa?.nome || "sua empresa"}.`,
    });

    const tel = phone.replace(/\D+/g, "");
    const finalWa = utm ? (wa.includes("?") ? `${wa}&${utm}` : `${wa}?${utm}`) : wa;
    return { waHref: finalWa, telHref: tel ? `tel:${tel}` : "#" };
  }, [whatsappNumber, phoneNumber, message, empresa, utm]);

  const isLeft = position === "bottom-left";
  const primary = "var(--primary, #16a34a)";
  const onPrimary = "var(--on-primary, #ffffff)";
  const surface = "var(--surface, #ffffff)";
  const surfaceAlt = "var(--surface-alt, var(--surface))";
  const text = "var(--text, #0f172a)";
  const border = "var(--c-border, rgba(0,0,0,0.12))";

  const track = (label) => {
    try {
      if (window?.gtag) window.gtag("event", "click_cta_contact", { label });
      if (window?.dataLayer) window.dataLayer.push({ event: "click_cta_contact", label });
    } catch {}
  };

  // mede altura real do dock
  useEffect(() => {
    if (!dockRef.current) return;
    const ro = new ResizeObserver(() => setDockH(dockRef.current?.getBoundingClientRect().height || 0));
    ro.observe(dockRef.current);
    setDockH(dockRef.current.getBoundingClientRect().height || 0);
    return () => ro.disconnect();
  }, []);

  // reserva espaço no layout
  useEffect(() => {
    if (!reserveSpace) return;
    document.documentElement.style.setProperty("--app-bottom-safe", `${Math.max(dockH, 0)}px`);
    return () => document.documentElement.style.removeProperty("--app-bottom-safe");
  }, [reserveSpace, dockH]);

  // “near footer” (compacta sem deslocar)
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      (entries) => setNearFooter(entries.some((e) => e.isIntersecting)),
      { rootMargin: "0px 0px -20% 0px", threshold: 0.01 }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // teclado (mobile)
  useEffect(() => {
    if (!hideOnKeyboard) return;
    let baseline = window.innerHeight;
    const onResize = () => {
      const dh = baseline - window.innerHeight;
      setKeyboardOpen(dh > 140);
      if (!keyboardOpen && window.innerHeight > baseline - 40) baseline = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hideOnKeyboard, keyboardOpen]);

  // auto-hide no scroll (mobile)
  useEffect(() => {
    if (!autoHideOnScroll) return;
    let lastY = window.scrollY;
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastY + 6;
        const goingUp = y < lastY - 6;
        if (goingDown && y > 80) setHiddenByScroll(true);
        else if (goingUp) setHiddenByScroll(false);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [autoHideOnScroll]);

  const mbMobile = Math.max(avoidOffset + 6, 6);
  const bottomDesktop = Math.max(avoidOffset + 64, 64);
  const compact = compactNearFooter && nearFooter;

  const mobileWrapperStyle = {
    paddingBottom: `calc(max(env(safe-area-inset-bottom), 0px) + ${mbMobile}px)`,
    transition: "transform 180ms ease, opacity 160ms ease",
    transform: keyboardOpen || hiddenByScroll ? "translateY(110%)" : "translateY(0)",
    opacity: keyboardOpen || hiddenByScroll ? 0 : 1,
  };

  const desktopWrapperStyle = {
    bottom: compact ? bottomDesktop - 32 : bottomDesktop,
    transition: "bottom 200ms ease, transform 180ms ease, opacity 160ms ease",
    transform: keyboardOpen ? "translateY(20px)" : "translateY(0)",
    opacity: keyboardOpen ? 0 : 1,
  };

  const Badge = ({ children }) => (
    <span
      className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ border: `1px solid ${border}`, background: surfaceAlt, color: text }}
    >
      {children}
    </span>
  );

  return (
    <>
      {/* keyframes + regra global para esconder quando drawer mobile estiver aberto */}
      <style>{`
        @keyframes waGlow {
          0% { box-shadow: 0 0 0 0 rgba(37,211,102,0.35); }
          70% { box-shadow: 0 0 0 10px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        html[data-mobile-drawer-open="true"] [data-sticky-dock] {
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateY(110%) !important;
        }
      `}</style>

      {/* ===== Mobile dock ===== */}
      <div
        ref={dockRef}
        className={`fixed inset-x-0 bottom-0 z-[60] md:hidden ${className}`}
        style={mobileWrapperStyle}
        aria-label="Ações rápidas de contato"
        role="region"
        data-sticky-dock
      >
        <div
          className={`mx-3 mb-2 flex overflow-hidden rounded-2xl shadow-xl`}
          style={{ background: surface, border: `1px solid ${border}` }}
        >
          {/* WhatsApp: verde oficial + pulso suave */}
          <a
            href={waHref}
            onClick={() => track("whatsapp_mobile")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 py-3 font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{
              backgroundColor: "#25D366",
              transition: "background-color .2s ease",
              animation: "waGlow 2.6s ease-out infinite",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#128C7E")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {showLabels && <span>WhatsApp</span>}
          </a>

          {/* Ligar: cor do tenant */}
          <a
            href={telHref}
            onClick={() => track("ligar_mobile")}
            className="flex flex-1 items-center justify-center gap-2 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{
              background: primary,
              color: onPrimary,
              transition: "background-color .2s ease",
            }}
            aria-label="Fazer uma ligação"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
            {showLabels && <span>Ligar</span>}
          </a>
        </div>
      </div>

      {/* ===== Desktop pill ===== */}
      <div
        className={`hidden md:block fixed ${isLeft ? "left-6" : "right-6"} z-[60] ${className}`}
        style={desktopWrapperStyle}
        role="region"
        aria-label="Contato rápido"
        data-sticky-dock
      >
        <div className="flex flex-col items-stretch gap-3">
          {/* WhatsApp: verde oficial + pulso suave */}
          <a
            href={waHref}
            onClick={() => track("whatsapp_desktop")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full px-4 py-3 shadow-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{
              backgroundColor: "#25D366",
              color: "#ffffff",
              animation: "waGlow 2.6s ease-out infinite",
              border: `1px solid ${border}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#128C7E")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            {showLabels && <span className="text-sm font-semibold leading-none">WhatsApp</span>}
          </a>

          {/* Simular plano: neutro, tema-aware, com hover/active */}
          {extraAction && (
            <a
              href={extraAction.href || "#"}
              onClick={(e) => {
                if (extraAction.onClick) {
                  e.preventDefault();
                  extraAction.onClick(e);
                }
              }}
              className="inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-xl transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{
                background: surfaceAlt,
                color: text,
                border: `1px solid ${border}`,
                transitionProperty: "filter, transform, opacity",
                transitionDuration: "150ms",
              }}
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)" }}
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
              </span>
              {showLabels && (
                <>
                  <span>{extraAction.label}</span>
                  {extraAction.badge ? <Badge>{extraAction.badge}</Badge> : null}
                </>
              )}
            </a>
          )}

          {/* Ligar: cor do tenant */}
          <a
            href={telHref}
            onClick={() => track("ligar_desktop")}
            className="inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{
              background: primary,
              color: onPrimary,
              border: `1px solid ${border}`,
            }}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <Phone className="h-4 w-4" aria-hidden="true" />
            </span>
            {showLabels && <span>Ligar agora</span>}
          </a>
        </div>
      </div>
    </>
  );
}
