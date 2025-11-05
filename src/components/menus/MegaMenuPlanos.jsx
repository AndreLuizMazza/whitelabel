// src/components/MegaMenuPlanos.jsx
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Users, HeartHandshake, Sparkles, BadgeDollarSign } from 'lucide-react'
import useTenant from '@/store/tenant'
import { planosItems, planosCta } from '@/data/planosItems'

const IconMap = { ShieldCheck, Users, HeartHandshake, Sparkles, BadgeDollarSign }

export default function MegaMenuPlanos() {
  const empresa = useTenant(s => s.empresa)
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  const items = planosItems.filter(it =>
    (typeof it.predicate === 'function' ? it.predicate(empresa) : true)
  )

  // Fecha no ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fecha em clique fora
  useEffect(() => {
    function onDocClick(e) {
      const t = e.target
      if (!menuRef.current) return
      if (menuRef.current.contains(t)) return
      if (triggerRef.current && triggerRef.current.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Hover abre (desktop); mouseleave fecha
  function onMouseEnter() { setOpen(true) }
  function onMouseLeave(e) {
    // só fecha se mouse saiu do container inteiro
    if (!menuRef.current?.contains(e.relatedTarget)) setOpen(false)
  }

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Botão gatilho: clique alterna, foco abre, 100% por CSS vars */}
      <button
        ref={triggerRef}
        type="button"
        className="relative pl-4 pr-3 py-2 rounded-md transition-colors focus:outline-none focus-visible:ring-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="megamenu-planos"
        onClick={() => setOpen(v => !v)}
        onFocus={() => setOpen(true)}
        style={{
          color: open ? 'var(--primary)' : 'var(--text)',
          background: open
            ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
            : 'transparent'
        }}
      >
        {/* marcador lateral quando aberto */}
        {open && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded"
            style={{ background: 'var(--primary)' }}
          />
        )}
        Planos
      </button>

      {open && (
        <div
          id="megamenu-planos"
          role="menu"
          aria-label="Seletor de planos"
          className="absolute left-0 mt-2 w-[720px] rounded-2xl shadow-xl p-5 z-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--c-border)'
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            {items.map(({ id, to, icon, title, desc }) => {
              const Ico = IconMap[icon] || ShieldCheck
              return (
                <Link
                  key={id}
                  to={to}
                  role="menuitem"
                  className="group rounded-xl p-4 outline-none transition-colors"
                  style={{ border: '1px solid transparent' }}
                  onClick={() => setOpen(false)}
                  onFocus={() => setOpen(true)}
                >
                  <div className="flex items-start gap-3">
                    <Ico
                      className="h-5 w-5 mt-0.5"
                      style={{ color: 'var(--primary)' }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>
                        {title}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>

                  {/* hover/focus visuais baseados em tokens */}
                  <style>{`
                    a.group:hover,
                    a.group:focus-visible {
                      background: var(--surface);
                      border-color: var(--c-border);
                      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 16%, transparent);
                    }
                  `}</style>
                </Link>
              )
            })}
          </div>

          <div
            className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--c-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {planosCta.help}
            </p>

            {/* CTA final controlado por tokens */}
            <Link
              to={planosCta.to}
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => setOpen(false)}
              aria-label={planosCta.label}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {planosCta.label}
            </Link>
          </div>

          {/* Link redundante “Ver todos os planos” para mobile/teclado */}
          <div className="mt-3 text-right">
            <Link
              to="/planos"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors"
              style={{ borderColor: 'var(--c-border)', color: 'var(--text)' }}
              onClick={() => setOpen(false)}
            >
              Ver todos os planos
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
