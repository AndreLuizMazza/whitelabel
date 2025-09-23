import { Sprout } from 'lucide-react'

export default function EmptyState({
  title = 'Nenhum registro',
  subtitle = 'Tente ajustar sua busca.'
}) {
  return (
    <div
      className="mx-auto max-w-md text-center rounded-3xl p-10"
      style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)', border: '1px dashed var(--c-border)' }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--primary)' }}
      >
        <Sprout className="h-7 w-7" style={{ color: 'var(--on-primary)' }} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p className="mt-1" style={{ color: 'var(--text)' }}>
        {subtitle}
      </p>
    </div>
  )
}
