import StoryRingLogo, { STORY_RING_OUTER } from '@/components/beneficios/StoryRingLogo'
import ScrollRevealRow from '@/components/ui/ScrollRevealRow'

function StripSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden py-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex shrink-0 flex-col items-center gap-1.5 w-[76px]">
          <div
            className="rounded-full animate-pulse"
            style={{
              width: STORY_RING_OUTER.md,
              height: STORY_RING_OUTER.md,
              background: 'color-mix(in srgb, var(--text) 8%, var(--surface))',
            }}
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

export default function BeneficiosPartnerLogoStrip({ partners = [], loading = false }) {
  if (loading) {
    return (
      <div aria-label="Parceiros" aria-busy="true">
        <StripSkeleton />
      </div>
    )
  }

  if (!partners.length) return null

  return (
    <ScrollRevealRow
      rowClassName="flex gap-3 px-1 pb-1 snap-x snap-mandatory -mx-1"
      role="list"
      aria-label="Logos dos parceiros"
    >
      {partners.map((p) => (
        <div
          key={p.id}
          role="listitem"
          className="flex shrink-0 snap-start flex-col items-center gap-1.5 w-[76px]"
          aria-label={p.nome}
        >
          <StoryRingLogo logoUrl={p.logoUrl} nome={p.nome} size="md" variant="story" />
          <span
            className="w-full text-center text-[11px] font-medium leading-snug line-clamp-2 tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            {p.nome}
          </span>
        </div>
      ))}
    </ScrollRevealRow>
  )
}
