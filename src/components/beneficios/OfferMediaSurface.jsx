import { useMemo, useState } from 'react'
import { partnerAccentFromName, partnerInitials } from './beneficiosUtils'

function EditorialFallback({ nome, variant }) {
  const accent = partnerAccentFromName(nome)
  const initials = partnerInitials(nome)

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: accent.gradient }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 28% 18%, rgba(255,255,255,0.28) 0%, transparent 52%), radial-gradient(circle at 82% 88%, rgba(0,0,0,0.12) 0%, transparent 48%)',
        }}
      />
      {variant === 'thumb' ? (
        <span
          className="absolute inset-0 flex items-center justify-center font-bold tracking-tight"
          style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}
          aria-hidden="true"
        >
          {initials}
        </span>
      ) : null}
    </div>
  )
}

/** Superfície de mídia com cascata capa → logo → fallback editorial (nunca broken image). */
export default function OfferMediaSurface({
  capaUrl,
  logoUrl,
  nome = '',
  variant = 'hero',
  className = '',
  showHeroOverlay = true,
}) {
  const sources = useMemo(() => {
    const urls = [capaUrl, logoUrl].filter((url) => url && String(url).trim())
    return [...new Set(urls)]
  }, [capaUrl, logoUrl])
  const [sourceIndex, setSourceIndex] = useState(0)
  const exhausted = sourceIndex >= sources.length
  const currentSrc = exhausted ? null : sources[sourceIndex]
  const isCapa = sourceIndex === 0 && capaUrl && currentSrc === capaUrl
  const isLogo = !isCapa && currentSrc === logoUrl

  const handleError = () => {
    setSourceIndex((idx) => idx + 1)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!exhausted && isCapa ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      ) : null}

      {!exhausted && isLogo ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      ) : null}

      {exhausted ? <EditorialFallback nome={nome} variant={variant} /> : null}

      {showHeroOverlay && variant === 'hero' ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 38%, rgba(0,0,0,0.62) 100%)',
          }}
        />
      ) : null}
    </div>
  )
}
