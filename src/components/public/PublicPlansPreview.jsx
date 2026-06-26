import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Layers } from 'lucide-react'

import PlanoCardVenda from '@/components/PlanoCardVenda.jsx'
import CTAButton from '@/components/ui/CTAButton'
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-[var(--c-border)] bg-[var(--surface-alt,var(--surface))]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {planos.map((p) => (
              <PlanoCardVenda
                key={p.id}
                plano={p}
                precoMensal={p.precoMensal}
                maxBenefits={4}
                enableExpand={false}
                onDetails={() => navigate(`/planos/${p.id}`)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <CTAButton
            as={Link}
            to="/planos"
            iconBefore={<Layers size={16} />}
            iconAfter={<ArrowRight size={16} />}
            size="lg"
          >
            Comparar todos os planos
          </CTAButton>
          <p className="text-xs text-[var(--text-muted)]">
            Sem fidelidade • Adesão online • Suporte humano
          </p>
        </div>
      </div>
    </section>
  )
}
