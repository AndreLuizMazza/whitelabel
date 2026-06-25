import { Link } from 'react-router-dom'
import { ArrowRight, BadgePercent } from 'lucide-react'
import OfferMediaSurface from '@/components/beneficios/OfferMediaSurface'

function CompactOfferCard({ offer, ctaTo, ctaState, ctaLabel }) {
  return (
    <article
      className="flex shrink-0 snap-start flex-col w-[min(220px,72vw)] overflow-hidden rounded-[16px]"
      style={{
        border: '0.5px solid var(--separator, var(--c-border))',
        background: 'var(--surface)',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--text) 6%, transparent)',
      }}
    >
      <div className="flex items-stretch min-h-[88px]">
        <div
          className="relative w-[72px] shrink-0 overflow-hidden self-stretch min-h-[88px]"
          style={{ borderRight: '0.5px solid var(--separator, var(--c-border))' }}
        >
          <OfferMediaSurface
            capaUrl={offer.capaUrl}
            logoUrl={offer.logoUrl}
            nome={offer.partnerNome}
            variant="thumb"
            showHeroOverlay={false}
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center px-3 py-2.5 min-w-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-wide truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {offer.partnerNome}
          </p>
          <p className="mt-0.5 text-[15px] font-bold leading-snug line-clamp-2 tracking-tight">
            {offer.headline}
          </p>
          {offer.cidadeUF ? (
            <p className="mt-1 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              {offer.cidadeUF}
            </p>
          ) : null}
        </div>
      </div>

      <Link
        to={ctaTo}
        state={ctaState}
        className="flex items-center justify-between gap-2 px-3 py-2 min-h-[36px] text-[12px] font-semibold active:opacity-70"
        style={{
          borderTop: '0.5px solid var(--separator, var(--c-border))',
          background: 'color-mix(in srgb, var(--primary) 5%, var(--surface))',
          color: 'var(--primary)',
        }}
      >
        <span className="inline-flex items-center gap-1">
          <BadgePercent size={13} strokeWidth={2.25} />
          {ctaLabel || 'Ver na área do associado'}
        </span>
        <ArrowRight size={14} strokeWidth={2.5} />
      </Link>
    </article>
  )
}

function OffersSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="shrink-0 w-[min(220px,72vw)] h-[124px] rounded-[16px] animate-pulse"
          style={{ background: 'color-mix(in srgb, var(--text) 7%, var(--surface))' }}
        />
      ))}
    </div>
  )
}

export default function BeneficiosPartnerOffersList({
  offers = [],
  loading = false,
  ctaTo = '/login',
  ctaState = { from: { pathname: '/area/beneficios' } },
  ctaLabel = 'Ver na área do associado',
}) {

  if (loading) {
    return (
      <section aria-label="Ofertas de parceiros" aria-busy="true" className="mt-4">
        <OffersSkeleton />
      </section>
    )
  }

  if (!offers.length) return null

  return (
    <section aria-label="Ofertas de parceiros" className="mt-4">
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {offers.map((offer) => (
          <CompactOfferCard
            key={offer.offerKey}
            offer={offer}
            ctaTo={ctaTo}
            ctaState={ctaState}
            ctaLabel={ctaLabel}
          />
        ))}
      </div>
    </section>
  )
}
