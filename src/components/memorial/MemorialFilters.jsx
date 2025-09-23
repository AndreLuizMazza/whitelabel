import { CalendarDays, HeartHandshake, Sparkles } from 'lucide-react'

// Apenas visual (a API continua igual). Se quiser filtrar de verdade na lista,
// propague o onChange para o componente da listagem.
const presets = [
  { key: 'todos', label: 'Todos',       icon: Sparkles },
  { key: 'nasc',  label: 'Nascimento',  icon: CalendarDays },
  { key: 'falec', label: 'Falecimento', icon: HeartHandshake },
  { key: 'setimo',label: '7º Dia',      icon: CalendarDays },
]

export default function MemorialFilters({ value = 'todos', onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(p => {
        const ActiveIcon = p.icon
        const active = value === p.key
        return (
          <button
            key={p.key}
            onClick={() => onChange?.(p.key)}
            className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
            style={{
              background: active ? 'var(--primary)' : 'var(--surface)',
              color: active ? 'var(--on-primary)' : 'var(--text)',
              border: `1px solid ${active ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : 'var(--c-border)'}`
            }}
          >
            <ActiveIcon
              className="h-4 w-4"
              style={{ color: active ? 'var(--on-primary)' : 'var(--primary)' }}
            />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
