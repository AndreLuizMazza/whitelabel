import { useState } from 'react'
import { partnerAccentFromName, partnerInitials } from './beneficiosUtils'

/** Diâmetro externo real (inner + anel + gap branco) para skeleton/alinhamento. */
export const STORY_RING_OUTER = { sm: 48, md: 65, lg: 74 }

const SIZE_MAP = {
  sm: { inner: 40, fontSize: 11, ring: 2, gap: 2 },
  md: { inner: 56, fontSize: 15, ring: 2.5, gap: 2 },
  lg: { inner: 64, fontSize: 17, ring: 3, gap: 2 },
}

const CHIP_MAP = {
  sm: { inner: 32, fontSize: 10 },
  md: { inner: 36, fontSize: 11 },
}

/** Instagram Stories: imagem preenche 100% do disco com object-cover (sem padding). */
function StoryRingImage({ src, onError }) {
  return (
    <img
      src={src}
      alt=""
      className="block h-full w-full object-cover object-center"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={onError}
    />
  )
}

function InitialsFallback({ initials, fontSize, accent, onGradient = false }) {
  return (
    <span
      className="flex h-full w-full items-center justify-center font-bold tracking-tight"
      style={{
        background: onGradient ? accent.gradient : accent.softBg,
        color: onGradient ? 'rgba(255, 255, 255, 0.95)' : accent.initialsColor,
        fontSize,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

/** Anel gradiente estilo Instagram Stories + logo em cover total. */
export default function StoryRingLogo({
  logoUrl,
  nome = '',
  size = 'md',
  active = true,
  variant = 'story',
}) {
  const [failed, setFailed] = useState(false)
  const initials = partnerInitials(nome)
  const accent = partnerAccentFromName(nome)
  const isChip = variant === 'chip'
  const spec = isChip ? CHIP_MAP[size] || CHIP_MAP.sm : SIZE_MAP[size] || SIZE_MAP.md
  const { inner, fontSize } = spec
  const hasLogo = logoUrl && !failed

  const ringBg = active
    ? `conic-gradient(from 210deg, var(--primary) 0deg, color-mix(in srgb, var(--primary) 70%, #fff) 72deg, color-mix(in srgb, var(--primary) 55%, var(--secondary, #7c3aed)) 144deg, var(--primary) 216deg, color-mix(in srgb, var(--primary) 80%, #000) 288deg, var(--primary) 360deg)`
    : 'color-mix(in srgb, var(--text) 16%, var(--c-border))'

  const innerContent = hasLogo ? (
    <StoryRingImage src={logoUrl} onError={() => setFailed(true)} />
  ) : (
    <InitialsFallback
      initials={initials}
      fontSize={fontSize}
      accent={accent}
      onGradient={!isChip}
    />
  )

  if (isChip) {
    return (
      <span
        className="relative inline-flex shrink-0 overflow-hidden rounded-full"
        style={{
          width: inner,
          height: inner,
          background: hasLogo ? 'transparent' : accent.gradient,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.6)',
        }}
      >
        {innerContent}
      </span>
    )
  }

  const ring = spec.ring
  const gap = spec.gap

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        padding: ring,
        background: ringBg,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="rounded-full" style={{ padding: gap, background: '#fff' }}>
        <span
          className="block overflow-hidden rounded-full"
          style={{
            width: inner,
            height: inner,
            background: hasLogo ? 'transparent' : undefined,
          }}
        >
          {innerContent}
        </span>
      </div>
    </div>
  )
}
