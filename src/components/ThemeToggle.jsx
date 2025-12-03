// src/components/ThemeToggle.jsx
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { applyTheme, resolveTheme } from '@/theme/initTheme'

export default function ThemeToggle({ className = '' }) {
  const [mode, setMode] = useState(() => {
    const initial = resolveTheme()
    return initial === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const isDark = mode === 'dark'

  function toggleMode() {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={
        'inline-flex items-center justify-center rounded-xl p-2 bg-surface/70 backdrop-blur border border-default transition hover:bg-surface ' +
        className
      }
      aria-pressed={isDark}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-text" />
      ) : (
        <Moon className="w-4 h-4 text-text" />
      )}
    </button>
  )
}
