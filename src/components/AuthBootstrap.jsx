import { useEffect, useState } from 'react'
import useAuth from '@/store/auth'
import { registerSessionBridge } from '@/lib/auth/sessionBridge'

export default function AuthBootstrap({ children }) {
  const sessionReady = useAuth((s) => s.sessionReady)
  const isBootstrapping = useAuth((s) => s.isBootstrapping)
  const [hydrated, setHydrated] = useState(() => useAuth.persist.hasHydrated())

  useEffect(() => {
    registerSessionBridge(
      (accessToken, refreshToken) => {
        useAuth.getState().setTokens(accessToken, refreshToken)
      },
      () => {
        void (async () => {
          await useAuth.getState().logout({ skipServer: true })
          if (window.location.pathname !== '/login') {
            window.location.assign('/login?session_expired=1')
          }
        })()
      }
    )
  }, [])

  useEffect(() => {
    if (hydrated) return undefined
    return useAuth.persist.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    void useAuth.getState().bootstrapSession()
  }, [hydrated])

  if (!hydrated || !sessionReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--surface, #f8fafc)', color: 'var(--text-muted, #64748b)' }}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium">Restaurando sessão…</p>
      </div>
    )
  }

  if (isBootstrapping) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--surface, #f8fafc)', color: 'var(--text-muted, #64748b)' }}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium">Restaurando sessão…</p>
      </div>
    )
  }

  return children
}
