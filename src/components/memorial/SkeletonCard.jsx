export default function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)', border: '1px solid var(--c-border)' }}
    >
      <div className="h-1.5 w-full" style={{ background: 'var(--surface-alt)' }} />
      <div className="p-4 sm:p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full animate-pulse" style={{ background: 'var(--surface-alt)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded animate-pulse" style={{ background: 'var(--surface-alt)' }} />
          <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: 'var(--surface-alt)' }} />
        </div>
      </div>
    </div>
  )
}
