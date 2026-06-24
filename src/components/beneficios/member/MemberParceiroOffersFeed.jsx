import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import StoryRingLogo from '@/components/beneficios/StoryRingLogo'
import OfferMediaSurface from '@/components/beneficios/OfferMediaSurface'

function OfferCard({ offer, detailBase }) {
  return (
    <Link
      to={`${detailBase}/${offer.partnerId}`}
      className="flex shrink-0 snap-start flex-col w-[min(200px,68vw)] overflow-hidden rounded-[16px] active:scale-[0.98] transition-transform duration-150"
      style={{
        border: '0.5px solid var(--separator, var(--c-border))',
        background: 'var(--surface)',
        boxShadow: '0 2px 10px color-mix(in srgb, var(--text) 7%, transparent)',
      }}
      aria-label={`${offer.partnerNome}: ${offer.headline}`}
    >
      <div className="relative h-[92px]">
        <OfferMediaSurface
          capaUrl={offer.capaUrl}
          logoUrl={offer.logoUrl}
          nome={offer.partnerNome}
          variant="hero"
          className="h-full w-full"
        />
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center gap-2">
          <StoryRingLogo
            logoUrl={offer.logoUrl}
            nome={offer.partnerNome}
            size="sm"
            variant="chip"
          />
          <span
            className="text-[11px] font-semibold text-white line-clamp-2 leading-snug flex-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          >
            {offer.partnerNome}
          </span>
        </div>
      </div>
      <div
        className="px-3 py-2.5 flex items-center justify-between gap-2 min-h-[52px]"
        style={{
          borderTop: '0.5px solid color-mix(in srgb, var(--text) 6%, transparent)',
        }}
      >
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
          className="shrink-0 w-[min(200px,68vw)] h-[144px] rounded-[16px] animate-pulse"
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
