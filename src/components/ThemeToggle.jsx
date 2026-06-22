// src/components/ThemeToggle.jsx
import { useCallback, useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { applyTheme, resolveTheme } from '@/theme/initTheme'

function readEffectiveDark() {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.mode === 'dark'
}

function readThemeChoice() {
  return resolveTheme()
}

export default function ThemeToggle({ className = '', tone = 'default' }) {
  const [isDark, setIsDark] = useState(readEffectiveDark)

  const syncFromDom = useCallback(() => {
    setIsDark(readEffectiveDark())
  }, [])

  useEffect(() => {
    syncFromDom()

    const observer = new MutationObserver(syncFromDom)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode', 'data-theme', 'class'],
    })

    window.addEventListener('storage', syncFromDom)
    return () => {
      observer.disconnect()
      window.removeEventListener('storage', syncFromDom)
    }
  }, [syncFromDom])

  function toggleMode() {
    const choice = readThemeChoice()
    const effective = readEffectiveDark()

    let next
    if (choice === 'system') {
      next = effective ? 'light' : 'dark'
    } else {
      next = effective ? 'light' : 'dark'
    }

    applyTheme(next)
    setIsDark(next === 'dark')
  }

  const isOnDark = tone === 'onDark'

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition active:scale-95 ${className}`}
      style={
        isOnDark
          ? {
              borderColor: 'rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
            }
          : {
              borderColor: 'var(--separator, var(--c-border))',
              background: 'var(--surface)',
              color: 'var(--text)',
            }
      }
      aria-pressed={isDark}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={1.85} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.85} aria-hidden="true" />
      )}
    </button>
  )
}
