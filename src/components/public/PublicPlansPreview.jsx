import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import PlanoCardVenda from '@/components/PlanoCardVenda.jsx'
import usePublicPlanos from '@/hooks/usePublicPlanos.js'

export default function PublicPlansPreview({ mounted = true, limit = 3 }) {
  const navigate = useNavigate()
  const { planos, loading, error } = usePublicPlanos(limit)

  if (!loading && (error || planos.length === 0)) return null

  return (
    <section className="mt-12 md:mt-16" aria-labelledby="home-plans-heading">
      <div
        className={[
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 md:mb-8">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Nossos planos
            </p>
            <h2 id="home-plans-heading" className="mt-1 text-2xl md:text-3xl font-black tracking-tight">
              Escolha a proteção ideal para você
            </h2>
            <p className="mt-2 text-sm md:text-base text-[var(--text-muted)] max-w-2xl">
              Valores reais, benefícios inclusos e adesão digital em poucos minutos.
            </p>
          </div>

          <Link
            to="/planos"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline w-fit"
            style={{ color: 'var(--primary)' }}
          >
            Ver todos os planos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="plans-preview-track flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 snap-start w-[min(300px,85vw)] sm:w-auto sm:shrink h-72 animate-pulse rounded-2xl border border-[var(--c-border)] bg-[var(--surface-alt,var(--surface))]"
              />
            ))}
          </div>
        ) : (
          <div className="plans-preview-track flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible [scrollbar-width:none] sm:[scrollbar-width:thin] [&::-webkit-scrollbar]:hidden sm:[&::-webkit-scrollbar]:block">
            {planos.map((p) => (
              <div
                key={p.id}
                className="shrink-0 snap-start w-[min(300px,85vw)] sm:w-auto sm:shrink flex"
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
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Sem fidelidade • Adesão online • Suporte humano
        </p>
      </div>
    </section>
  )
}
