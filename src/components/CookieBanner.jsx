// src/components/CookieBanner.jsx
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"

const STORAGE_KEY = "progem_cookie_consent"

const MEMBER_ROUTE_RE = /^\/(area|perfil|carteirinha)(\/|$)/

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  const cookiesPolicyPath = location.pathname.startsWith("/area")
    ? "/area/legal/cookies"
    : "/politica-cookies"
  const isMemberShell = MEMBER_ROUTE_RE.test(location.pathname)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) setVisible(true)

    const onOpen = () => setVisible(true)
    const onEsc = (e) => {
      if (e.key === "Escape") setVisible(false)
    }
    window.addEventListener("open-cookie-banner", onOpen)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("open-cookie-banner", onOpen)
      window.removeEventListener("keydown", onEsc)
    }
  }, [])

  if (!visible) return null

  function saveConsent(status) {
    const payload = { status, ts: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    setVisible(false)
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: payload }))
  }

  return (
    <div
      data-cookie-banner
      className="fixed inset-x-0 bottom-0 z-[120] px-4 pointer-events-none"
      role="region"
      aria-label="Preferências de cookies"
      style={{
        paddingBottom: isMemberShell
          ? "max(calc(54px + env(safe-area-inset-bottom)), 12px)"
          : "max(env(safe-area-inset-bottom), 12px)",
      }}
    >
      <div className="w-full max-w-4xl mx-auto pointer-events-auto mb-3 md:mb-4 rounded-xl border border-[var(--c-border)] bg-[var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.18)] p-4 md:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1 text-sm text-[var(--text)] leading-relaxed">
            <p>
              Usamos cookies para melhorar sua experiência, medir o uso e personalizar conteúdo.
              Você pode aceitar todos, rejeitar os opcionais ou revisar suas preferências. Leia
              nossa{" "}
              <Link
                to={cookiesPolicyPath}
                className="underline font-medium text-[var(--primary)] hover:opacity-90"
                onClick={() => setVisible(false)}
              >
                Política de Cookies
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => saveConsent("rejected")}
              className="btn-outline min-h-[44px] justify-center px-4"
            >
              Rejeitar opcionais
            </button>

            <button
              type="button"
              onClick={() => saveConsent("accepted")}
              className="btn-primary min-h-[44px] min-w-[140px] justify-center"
              title="Aceitar todos os cookies"
            >
              Ok, Entendi!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
