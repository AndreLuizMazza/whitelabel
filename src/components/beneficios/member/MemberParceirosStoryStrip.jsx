import { Link } from 'react-router-dom'
import StoryRingLogo from '@/components/beneficios/StoryRingLogo'

function StripSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden py-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex shrink-0 flex-col items-center gap-2 w-[76px]">
          <div
            className="h-[67px] w-[67px] rounded-full animate-pulse"
            style={{ background: 'color-mix(in srgb, var(--text) 8%, var(--surface))' }}
          />
          <div
            className="h-3 w-14 rounded animate-pulse"
            style={{ background: 'color-mix(in srgb, var(--text) 6%, var(--surface))' }}
          />
        </div>
      ))}
    </div>
  )
}

export default function MemberParceirosStoryStrip({
  parceiros = [],
  loading = false,
  detailBase = '/area/beneficios',
}) {
  if (loading) return <StripSkeleton />
  if (!parceiros.length) return null

  return (
    <div
      className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Marcas parceiras"
    >
      {parceiros.map((p) => (
        <Link
          key={p.id}
          to={`${detailBase}/${p.id}`}
          role="listitem"
          className="flex shrink-0 snap-start flex-col items-center gap-2 w-[76px] active:opacity-75 transition-opacity"
          aria-label={`Ver ${p.nome}`}
        >
          <StoryRingLogo logoUrl={p.imagem} nome={p.nome} size="md" />
          <span
            className="w-full text-center text-[10px] font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--text)' }}
          >
            {p.nome}
          </span>
        </Link>
      ))}
    </div>
  )
}
