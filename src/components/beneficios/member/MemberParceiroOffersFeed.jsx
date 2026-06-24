import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import StoryRingLogo from '@/components/beneficios/StoryRingLogo'
import { CLUB_PLACEHOLDER } from '@/components/beneficios/beneficiosUtils'

function OfferCard({ offer, detailBase }) {
  const thumb = offer.capaUrl || offer.logoUrl

  return (
    <Link
      to={`${detailBase}/${offer.partnerId}`}
      className="flex shrink-0 snap-start flex-col w-[min(200px,68vw)] overflow-hidden rounded-[16px] active:opacity-90 transition-opacity"
      style={{
        border: '0.5px solid var(--separator, var(--c-border))',
        background: 'var(--surface)',
        boxShadow: '0 1px 4px color-mix(in srgb, var(--text) 6%, transparent)',
      }}
      aria-label={`${offer.partnerNome}: ${offer.headline}`}
    >
      <div className="relative h-[88px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `url(${CLUB_PLACEHOLDER}) center/contain no-repeat, color-mix(in srgb, var(--primary) 6%, var(--surface))`,
          }}
        />
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-end gap-2">
          <StoryRingLogo logoUrl={offer.logoUrl} nome={offer.partnerNome} size="sm" />
          <span className="text-[11px] font-semibold text-white line-clamp-2 leading-snug flex-1">
            {offer.partnerNome}
          </span>
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 min-h-[52px]">
        <p className="text-[14px] font-bold leading-snug line-clamp-2 tracking-tight flex-1">
          {offer.headline}
        </p>
        <ChevronRight size={16} className="shrink-0 opacity-40" style={{ color: 'var(--text-muted)' }} />
      </div>
    </Link>
  )
}

function FeedSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="shrink-0 w-[min(200px,68vw)] h-[140px] rounded-[16px] animate-pulse"
          style={{ background: 'color-mix(in srgb, var(--text) 7%, var(--surface))' }}
        />
      ))}
    </div>
  )
}

export default function MemberParceiroOffersFeed({
  offers = [],
  loading = false,
  detailBase = '/area/beneficios',
}) {
  if (loading) return <FeedSkeleton />
  if (!offers.length) return null

  return (
    <div
      className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Ofertas dos parceiros"
    >
      {offers.map((offer) => (
        <OfferCard key={offer.offerKey} offer={offer} detailBase={detailBase} />
      ))}
    </div>
  )
}
