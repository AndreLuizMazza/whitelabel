import { useCallback, useEffect, useMemo, useState } from 'react'

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true
  )
}

/**
 * Instalação do app: lojas (via URL externa) ou prompt nativo / instruções iOS.
 */
export default function useAppInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode())
  const [showIosHelp, setShowIosHelp] = useState(false)

  const platform = useMemo(() => detectPlatform(), [])

  useEffect(() => {
    setIsInstalled(isStandaloneMode())
  }, [])

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canNativeInstall = Boolean(deferredPrompt) && !isInstalled

  const promptInstall = useCallback(async () => {
    if (isInstalled) return { ok: true, reason: 'installed' }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }))
      setDeferredPrompt(null)
      if (choice?.outcome === 'accepted') {
        setIsInstalled(true)
        return { ok: true, reason: 'accepted' }
      }
      return { ok: false, reason: 'dismissed' }
    }

    if (platform === 'ios') {
      setShowIosHelp(true)
      return { ok: false, reason: 'ios_help' }
    }

    return { ok: false, reason: 'unavailable' }
  }, [deferredPrompt, isInstalled, platform])

  const closeIosHelp = useCallback(() => setShowIosHelp(false), [])

  return {
    platform,
    isInstalled,
    canNativeInstall,
    showIosHelp,
    promptInstall,
    closeIosHelp,
  }
}
