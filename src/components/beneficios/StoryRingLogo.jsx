import { useState } from 'react'
import { partnerInitials } from './beneficiosUtils'

/** Anel gradiente estilo Instagram Stories + logo encaixada. */
export default function StoryRingLogo({
  logoUrl,
  nome = '',
  size = 'md',
  active = true,
}) {
  const [failed, setFailed] = useState(false)
  const initials = partnerInitials(nome)

  const dim = size === 'sm' ? 48 : size === 'lg' ? 72 : 60
  const pad = size === 'sm' ? 2 : 2.5
  const fontSize = size === 'sm' ? 12 : 14

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        padding: pad,
        background: active
          ? 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 55%, var(--secondary, #fff)) 48%, color-mix(in srgb, var(--primary) 75%, #000) 100%)'
          : 'color-mix(in srgb, var(--text) 18%, var(--c-border))',
      }}
    >
      <div className="rounded-full p-[2.5px]" style={{ background: 'var(--surface, #fff)' }}>
        <span
          className="flex items-center justify-center overflow-hidden rounded-full"
          style={{
            width: dim,
            height: dim,
            background: 'color-mix(in srgb, var(--text) 4%, var(--surface))',
            boxShadow: 'inset 0 0 0 0.5px color-mix(in srgb, var(--text) 8%, transparent)',
          }}
        >
          {logoUrl && !failed ? (
            <img
              src={logoUrl}
              alt=""
              className="h-full w-full object-contain p-2"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
            />
          ) : (
            <span
              className="font-bold tracking-tight"
              style={{ color: 'var(--primary)', fontSize }}
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
