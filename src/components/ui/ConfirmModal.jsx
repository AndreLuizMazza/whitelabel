import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import CTAButton from "@/components/ui/CTAButton";
import { ShieldCheck, X, ArrowRight } from "lucide-react";

function useLockBodyScroll(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function getPortalRoot() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "modal-root";
    document.body.appendChild(el);
  }
  return el;
}

export default function ConfirmModal({
  open,
  title = "Confirmar envio",
  description = "",
  icon: Icon = ShieldCheck,
  confirmText = "Concordar e enviar",
  cancelText = "Cancelar",
  onConfirm,
  onClose,
  closeOnBackdrop = true,
  closeOnEsc = true,
  danger = false,
  loading = false,
  disableConfirm = false,
}) {
  useLockBodyScroll(open);

  const root = useMemo(getPortalRoot, []);
  const panelRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement;

    // foco inicial
    const t = setTimeout(() => confirmBtnRef.current?.focus?.(), 0);

    function onKeyDown(e) {
      if (!closeOnEsc) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      // focus-trap simples (TAB) dentro do modal
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;

        const focusables = panel.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(
          (x) => !x.hasAttribute("disabled") && !x.getAttribute("aria-disabled")
        );
        if (!list.length) return;

        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeOnEsc, onClose]);

  useEffect(() => {
    if (open) return;
    // restaura foco
    const el = lastActiveRef.current;
    if (el && typeof el.focus === "function") {
      setTimeout(() => el.focus(), 0);
    }
  }, [open]);

  if (!open || !root) return null;

  const ring = danger
    ? "ring-red-500/25"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]";

  const surface = danger ? "bg-[color:rgba(239,68,68,.08)]" : "bg-[var(--surface)]";

  const backdropBg =
    "bg-[color:rgba(2,6,23,.55)] dark:bg-[color:rgba(0,0,0,.65)]";

  function onBackdropClick(e) {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose?.();
  }

  async function handleConfirm() {
    if (loading || disableConfirm) return;
    await onConfirm?.();
  }

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[2000] flex items-center justify-center p-4",
        backdropBg,
      ].join(" ")}
      style={{ backdropFilter: "blur(10px)" }}
      onMouseDown={onBackdropClick}
      aria-hidden={false}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className={[
          "relative w-full max-w-[560px] rounded-3xl ring-1",
          ring,
          surface,
          "shadow-[0_30px_120px_rgba(0,0,0,.35)]",
          "overflow-hidden",
        ].join(" ")}
      >
        {/* brilho sutil */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px 340px at 15% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 60%)," +
              "radial-gradient(700px 280px at 90% 10%, color-mix(in srgb, var(--highlight) 12%, transparent), transparent 60%)",
          }}
        />

        <div className="relative p-5 sm:p-6">
          {/* header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span
                className={[
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
                  "bg-[color:color-mix(in_srgb,var(--surface-alt)_70%,transparent)]",
                  "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 text-[var(--text)] opacity-90" />
              </span>

              <div className="min-w-0">
                <h3
                  id="confirm-modal-title"
                  className="text-[15px] sm:text-lg font-semibold tracking-[-0.01em] text-[var(--text)]"
                >
                  {title}
                </h3>

                <p
                  id="confirm-modal-desc"
                  className="mt-1 text-sm text-[var(--text)] opacity-80 leading-relaxed"
                >
                  {description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={[
                "shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                "ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]",
                "bg-[color:color-mix(in_srgb,var(--surface-alt)_70%,transparent)]",
                "hover:bg-[color:color-mix(in_srgb,var(--surface-alt)_55%,var(--brand-50))]",
                "transition",
              ].join(" ")}
              aria-label="Fechar"
            >
              <X className="h-5 w-5 text-[var(--text)] opacity-85" />
            </button>
          </div>

          {/* footer */}
          <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <CTAButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </CTAButton>

            <CTAButton
              ref={confirmBtnRef}
              type="button"
              onClick={handleConfirm}
              disabled={loading || disableConfirm}
              className="w-full sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                {confirmText}
                <ArrowRight className="h-4 w-4 opacity-90" />
              </span>
            </CTAButton>
          </div>

          {/* loading line */}
          {loading && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--c-border)_25%,transparent)]">
              <div
                className="h-full w-1/3 animate-[modalprogress_1.1s_ease-in-out_infinite]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand) 60%, transparent), transparent)",
                }}
              />
              <style>
                {`@keyframes modalprogress{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}`}
              </style>
            </div>
          )}
        </div>
      </div>
    </div>,
    root
  );
}
