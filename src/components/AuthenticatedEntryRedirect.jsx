import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuth from '@/store/auth'
import { resolveAuthenticatedEntryDestination } from '@/lib/postAuthNavigation'

const ENTRY_PATHS = new Set(['/', '/login'])

function isSessionExpiredLogin(pathname, search) {
  if (pathname !== '/login') return false
  try {
    return new URLSearchParams(search).get('session_expired') === '1'
  } catch {
    return false
  }
}

/**
 * Na abertura do app (/, /login), redireciona associados autenticados:
 * - / + com contrato → /area
 * - / + sem contrato → permanece na home pública
 * - /login → resolvePostAuthDestination (ex.: /area ou /planos)
 */
export default function AuthenticatedEntryRedirect({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionReady = useAuth((s) => s.sessionReady)
  const isAuthed = useAuth((s) => s.isAuthenticated())
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!ENTRY_PATHS.has(location.pathname)) {
      setRedirecting(false)
      return undefined
    }

    if (!sessionReady || !isAuthed) {
      setRedirecting(false)
      return undefined
    }

    if (isSessionExpiredLogin(location.pathname, location.search)) {
      setRedirecting(false)
      return undefined
    }

    let alive = true

    resolveAuthenticatedEntryDestination(location.pathname)
      .then((dest) => {
        if (!alive || !dest) return
        setRedirecting(true)
        navigate(dest.path, { replace: true, state: dest.state })
      })
      .finally(() => {
        if (alive) setRedirecting(false)
      })

    return () => {
      alive = false
    }
  }, [sessionReady, isAuthed, location.pathname, location.search, navigate])

  if (redirecting && ENTRY_PATHS.has(location.pathname)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--surface, #f8fafc)', color: 'var(--text-muted, #64748b)' }}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium">Abrindo sua área…</p>
      </div>
    )
  }

  return children
}
