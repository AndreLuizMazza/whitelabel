// src/components/ThemeToggle.jsx
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { applyTheme, resolveTheme } from '@/theme/initTheme'

const MODES = [
  { key: 'light',   Icon: Sun,    label: 'Claro'  },
  { key: 'dark',    Icon: Moon,   label: 'Escuro' },
  { key: 'system',  Icon: Monitor,label: 'Sistema' },
]

export default function ThemeToggle({ className = '' }) {
  const [mode, setMode] = useState(resolveTheme())

  // aplica e persiste
  useEffect(() => {
    applyTheme(mode)
    try {
      if (mode === 'system') localStorage.removeItem('ui_theme')
      else localStorage.setItem('ui_theme', mode)
    } catch {}
  }, [mode])

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-2xl border border-default bg-surface-alt p-1 shadow-sm ${className}`}
      role="group"
      aria-label="Trocar tema"
    >
      {MODES.map(({ key, Icon, label }) => {
        const active = mode === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={active}
            title={label}
            className={`px-2.5 py-1.5 rounded-xl transition
              ${active
                ? 'bg-surface shadow-sm'
                : 'hover:bg-surface'}
            `}
          >
            <span className="sr-only">{label}</span>
            <Icon className="w-4 h-4 text-text" />
          </button>
        )
      })}
    </div>
  )
}
