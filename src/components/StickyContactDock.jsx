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
 * - Evita BANNERS fixos (ex.: cookies) — não soma rodapé no offset
 * - Reserva espaço global via --app-bottom-safe
 * - Compacta perto do rodapé (sem deslocar para o meio)
 * - Auto-hide no scroll (opcional) para ganhar espaço no mobile
 */
export default function StickyContactDock({
  whatsappNumber,
  phoneNumber,
  message,
  position = "bottom-right", // bottom-right | bottom-left
  showLabels = true,
  className = "",
  utm = "utm_source=site&utm_medium=cta-sticky&utm_campaign=whitelabel",
  // ⚠️ não incluir footer aqui! deixa o footer para o modo compactNearFooter
  avoidSelector = "[data-cookie-banner], [data-bottom-avoid]",
  extraAction, // { label, href?, onClick?, ariaLabel?, badge? }
  reserveSpace = true,
  compactNearFooter = true,
  hideOnKeyboard = true,
  autoHideOnScroll = true, // ⟵ novo
}) {
  const empresa = useTenant((s) => s.empresa);
  const dockRef = useRef(null);
  const [dockH, setDockH] = useState(0);
  const [nearFooter, setNearFooter] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [hiddenByScroll, setHiddenByScroll] = useState(false);

  // mede alturas de elementos fixos (ex.: cookie banner)
  const avoidOffset = useAvoidOverlap(avoidSelector); // px

  // hrefs
  const { waHref, telHref } = useMemo(() => {
    const base = (whatsappNumber || resolveTenantPhone(empresa) || resolveGlobalFallback()).toString();
    const phone = (phoneNumber || base).toString();

    const wa = buildWaHref({
      number: base,
      message: message || `Olá! Tenho interesse no plano de assistência da ${empresa?.nomeFantasia || empresa?.nome || "sua empresa"}.`,
    });

    const tel = phone.replace(/\D+/g, "");
    const finalWa = utm ? (wa.includes("?") ? `${wa}&${utm}` : `${wa}?${utm}`) : wa;
    return { waHref: finalWa, telHref: tel ? `tel:${tel}` : "#" };
  }, [whatsappNumber, phoneNumber, message, empresa, utm]);

  const isLeft = position === "bottom-left";
  const primary = "var(--primary, #16a34a)";
  const onPrimary = "var(--on-primary, #ffffff)";
  const surface = "var(--surface, #ffffff)";
  const text = "var(--text, #0f172a)";

  const track = (label) => {
    try {
      if (window?.gtag) window.gtag("event", "click_cta_contact", { label });
      if (window?.dataLayer) window.dataLayer.push({ event: "click_cta_contact", label });
    } catch {}
  };

  // mede altura real do dock
  useEffect(() => {
    if (!dockRef.current) return;
    const ro = new ResizeObserver(() => {
      setDockH(dockRef.current?.getBoundingClientRect().height || 0);
    });
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

  // “near footer” sem deslocar, só compacta visualmente
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

  // teclado (mobile): esconde enquanto digita
  useEffect(() => {
    if (!hideOnKeyboard) return;
    let baseline = window.innerHeight;
    const onResize = () => {
      const dh = baseline - window.innerHeight;
      setKeyboardOpen(dh > 140); // heurística
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

  // offsets
  const mbMobile = Math.max(avoidOffset + 6, 6); // ⟵ mínimo pequeno
  const bottomDesktop = Math.max(avoidOffset + 24, 24);
  const compact = compactNearFooter && nearFooter;

  // estilos mobile: sempre colado no fundo
  const mobileWrapperStyle = {
    paddingBottom: `calc(max(env(safe-area-inset-bottom), 0px) + ${mbMobile}px)`,
    transition: "transform 180ms ease, opacity 160ms ease",
    transform: keyboardOpen || hiddenByScroll ? "translateY(110%)" : "translateY(0)",
    opacity: keyboardOpen || hiddenByScroll ? 0 : 1,
  };

  // estilos desktop
  const desktopWrapperStyle = {
    bottom: bottomDesktop,
    transition: "bottom 200ms ease, transform 180ms ease, opacity 160ms ease",
    transform: keyboardOpen ? "translateY(20px)" : "translateY(0)",
    opacity: keyboardOpen ? 0 : 1,
  };

  // badge
  const Badge = ({ children }) => (
    <span
      className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-black/5"
      style={{ background: "color-mix(in srgb, var(--surface) 70%, transparent)", color: "color-mix(in srgb, var(--text) 80%, transparent)" }}
    >
      {children}
    </span>
  );

  return (
    <>
      {/* ===== Mobile dock (sempre no fundo) ===== */}
      <div
        ref={dockRef}
        className={`fixed inset-x-0 bottom-0 z-[60] md:hidden ${className}`}
        style={mobileWrapperStyle}
        aria-label="Ações rápidas de contato"
        role="region"
        data-sticky-dock
      >
        <div
          className={`mx-3 mb-2 flex overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 ${compact ? "scale-[0.98]" : ""}`}
          style={{
            background: surface,
            boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)", // sombra superior sutil
            transition: "transform 160ms ease",
          }}
        >
          <a
            href={waHref}
            onClick={() => track("whatsapp_mobile")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 py-3 font-medium"
            style={{ color: onPrimary, background: primary }}
            aria-label="Falar no WhatsApp"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {showLabels && <span>WhatsApp</span>}
          </a>

          {extraAction && (
            <a
              href={extraAction.href || "#"}
              onClick={(e) => {
                if (extraAction.onClick) {
                  e.preventDefault();
                  extraAction.onClick(e);
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 py-3 font-medium"
              style={{ color: text }}
              aria-label={extraAction.ariaLabel || extraAction.label}
            >
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              {showLabels && (
                <>
                  <span>{extraAction.label}</span>
                  {extraAction.badge ? <Badge>{extraAction.badge}</Badge> : null}
                </>
              )}
            </a>
          )}

          <a
            href={telHref}
            onClick={() => track("ligar_mobile")}
            className="flex flex-1 items-center justify-center gap-2 py-3 font-medium"
            style={{ color: text }}
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
      >
        <div className="flex flex-col items-stretch gap-3">
          <a
            href={waHref}
            onClick={() => track("whatsapp_desktop")}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full px-4 py-3 shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5"
            style={{ background: primary, color: onPrimary }}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            {showLabels && <span className="text-sm font-semibold leading-none">Falar no WhatsApp</span>}
          </a>

          {extraAction && (
            <a
              href={extraAction.href || "#"}
              onClick={(e) => {
                if (extraAction.onClick) {
                  e.preventDefault();
                  extraAction.onClick(e);
                }
              }}
              className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5"
              style={{ color: text }}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
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

          <a
            href={telHref}
            onClick={() => track("ligar_desktop")}
            className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5"
            style={{ color: text }}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
              <Phone className="h-4 w-4" aria-hidden="true" />
            </span>
            {showLabels && <span>Ligar agora</span>}
          </a>
        </div>
      </div>
    </>
  );
}
