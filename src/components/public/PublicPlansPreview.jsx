import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import PlanoCardVenda from '@/components/PlanoCardVenda.jsx'
import PublicPageHeader from '@/components/public/PublicPageHeader.jsx'
import ScrollRevealRow from '@/components/ui/ScrollRevealRow'
import usePublicPlanos from '@/hooks/usePublicPlanos.js'

export default function PublicPlansPreview({ mounted = true, limit = 3 }) {
  const navigate = useNavigate()
  const { planos, loading, error } = usePublicPlanos(limit)

  if (!loading && (error || planos.length === 0)) return null

  const trackClassName =
    'flex items-stretch gap-4 pb-1 -mx-1 px-1 snap-x snap-mandatory sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:snap-none'

  return (
    <section aria-labelledby="home-plans-heading">
      <div
        className={[
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <PublicPageHeader
          kicker="Nossos planos"
          title="Escolha a proteção ideal para você"
          description="Valores reais, benefícios inclusos e adesão digital em poucos minutos."
          id="home-plans-heading"
          titleAs="h2"
          actions={
            <Link to="/planos" className="public-section-link">
              Ver todos os planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        {loading ? (
          <ScrollRevealRow rowClassName={trackClassName} hint={false}>
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 snap-start w-[min(272px,84vw)] sm:w-auto sm:shrink h-72 animate-pulse public-surface-card"
              />
            ))}
          </ScrollRevealRow>
        ) : (
          <ScrollRevealRow rowClassName={trackClassName}>
            {planos.map((p) => (
              <div
                key={p.id}
                className="shrink-0 snap-start w-[min(272px,84vw)] sm:w-auto sm:shrink flex"
              >
                <PlanoCardVenda
                  plano={p}
                  precoMensal={p.precoMensal}
                  bestSeller={p.bestSeller}
                  maxBenefits={3}
                  enableExpand
                  uniformHeight
                  onDetails={() => navigate(`/planos/${p.id}`)}
                />
              </div>
            ))}
          </ScrollRevealRow>
        )}

        <p className="mt-4 md:mt-5 text-center text-[11px] md:text-xs tracking-wide text-[var(--text-muted)]">
          Sem fidelidade · Adesão online · Suporte humano
        </p>
      </div>
    </section>
  )
}
