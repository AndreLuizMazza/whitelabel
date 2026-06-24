import { useState } from 'react'
import { partnerInitials } from '@/components/beneficios/beneficiosUtils'

/** Anel gradiente estilo Instagram Stories + logo encaixada. */
function StoryRingLogo({ partner }) {
  const [failed, setFailed] = useState(false)
  const initials = partnerInitials(partner.nome)

  return (
    <div
      className="relative shrink-0 rounded-full p-[2.5px]"
      style={{
        background:
          'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 55%, var(--secondary, #fff)) 48%, color-mix(in srgb, var(--primary) 75%, #000) 100%)',
      }}
    >
      <div
        className="rounded-full p-[2.5px]"
        style={{ background: 'var(--surface, #fff)' }}
      >
        <span
          className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--text) 4%, var(--surface))',
            boxShadow: 'inset 0 0 0 0.5px color-mix(in srgb, var(--text) 8%, transparent)',
          }}
        >
          {partner.logoUrl && !failed ? (
            <img
              src={partner.logoUrl}
              alt=""
              className="h-full w-full object-contain p-2.5"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
            />
          ) : (
            <span
              className="text-[14px] font-bold tracking-tight"
              style={{ color: 'var(--primary)' }}
              aria-hidden="true"
            >
              {initials}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

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
    <div
      className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Logos dos parceiros"
    >
      {partners.map((p) => (
        <div
          key={p.id}
          role="listitem"
          className="flex shrink-0 snap-start flex-col items-center gap-2 w-[76px]"
          aria-label={p.nome}
        >
          <StoryRingLogo partner={p} />
          <span
            className="w-full text-center text-[10px] font-medium leading-snug line-clamp-2"
            style={{ color: 'var(--text)' }}
          >
            {p.nome}
          </span>
        </div>
      ))}
    </div>
  )
}
