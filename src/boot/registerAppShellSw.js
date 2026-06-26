/**
 * Registra service worker mínimo para elegibilidade de instalação (PWA) no Chrome.
 * Idempotente — ignora falhas silenciosamente.
 */
export default function registerAppShellSw() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
