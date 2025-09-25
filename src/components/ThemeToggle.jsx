// src/components/ThemeToggle.jsx (corrigido)
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

  useEffect(() => { applyTheme(mode) }, [mode])

  return (
    <div className={"flex items-center gap-1 rounded-2xl p-1 bg-surface/70 backdrop-blur border border-default " + className}>
      {MODES.map(({ key, Icon, label }) => {
        const active = mode === key
        return (
          <button
            key={key}
            onClick={() => setMode(key)}
            title={label}
            aria-pressed={active}
            className={`px-2.5 py-1.5 rounded-xl transition ${active ? 'bg-surface shadow-sm' : 'hover:bg-surface'}`}
          >
            <span className="sr-only">{label}</span>
            <Icon className="w-4 h-4 text-text" />
          </button>
        )
      })}
    </div>
  )
}
