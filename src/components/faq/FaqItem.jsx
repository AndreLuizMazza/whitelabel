import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

export default function FaqItem({
  q,
  a,
  defaultOpen = false,
  id,                // opcional: id estável p/ deep-link (#faq-id)
}) {
  const rnd = useId().replace(/[:]/g, "")
  const myId = id || `faq-${rnd}`
  const [open, setOpen] = useState(!!defaultOpen)
  const summaryRef = useRef(null)

  // Abre automaticamente se a hash da URL bater com o id do item
  useEffect(() => {
    const apply = () => {
      const hash = decodeURIComponent(window.location.hash || "").replace(/^#/, "")
      if (hash === myId) {
        setOpen(true)
        // foco suave no summary para acessibilidade
        setTimeout(() => summaryRef.current?.focus({ preventScroll: false }), 60)
      }
    }
    apply()
    window.addEventListener("hashchange", apply)
    return () => window.removeEventListener("hashchange", apply)
  }, [myId])

  return (
    <div className="group rounded-xl border border-[var(--c-border)] bg-[var(--surface)]/80 dark:bg-[var(--surface)]/40">
      <button
        ref={summaryRef}
        aria-controls={`${myId}-content`}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="faq-summary w-full text-left flex items-center justify-between gap-3 px-4 py-3 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_45%,black)] rounded-xl"
      >
        <span className="inline-flex items-center gap-2">
          <HelpCircle size={18} /> {q}
        </span>
        <ChevronDown
          size={18}
          className={["transition-transform", open ? "rotate-180" : "rotate-0"].join(" ")}
          aria-hidden
        />
      </button>

      <div
        id={`${myId}-content`}
        hidden={!open}
        className="faq-content px-4 pb-4 pt-0 text-[var(--text)] dark:text-[var(--text)]"
      >
        {a}
      </div>
    </div>
  )
}
