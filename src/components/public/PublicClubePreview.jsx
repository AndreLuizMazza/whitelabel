import { Link } from 'react-router-dom'
import { ArrowRight, LogIn, Smartphone } from 'lucide-react'

import useParceirosPreview from '@/hooks/useParceirosPreview'
import useMemberAreaLink from '@/hooks/useMemberAreaLink'
import { resolveBrandDisplayName } from '@/lib/branding/tenantContract'
import { getTenantContract } from '@/lib/tenantContent'
import BeneficiosPartnerLogoStrip from '@/components/beneficios/public/BeneficiosPartnerLogoStrip'
import BeneficiosPartnerOffersList from '@/components/beneficios/public/BeneficiosPartnerOffersList'

const HOME_OFFERS_LIMIT = 8

export default function PublicClubePreview({ empresa, mounted = true, isLogged = false }) {
  const { loading, error, partners, offers, hasPreview, hasOffers, showPreview } =
    useParceirosPreview()

  const memberLink = useMemberAreaLink('/area/beneficios')
  const brandName = resolveBrandDisplayName(getTenantContract(), empresa)
  const showPartnerContent = showPreview && !error && (loading || hasPreview)
  const previewOffers = offers.slice(0, HOME_OFFERS_LIMIT)

  if (!showPartnerContent) return null

  const pageDescription = `Prévia da rede ${brandName} — estabelecimentos locais com condições exclusivas para associados.`

  return (
    <section className="mt-12 md:mt-16" aria-labelledby="home-clube-heading">
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
              Clube de parceiros
            </p>
            <h2 id="home-clube-heading" className="mt-1 text-2xl md:text-3xl font-black tracking-tight">
              Descontos perto de você
            </h2>
            <p className="mt-2 text-sm md:text-base text-[var(--text-muted)] max-w-2xl">
              {pageDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {!isLogged ? (
              <Link
                to="/planos"
                className="text-sm font-semibold inline-flex items-center min-h-[36px] hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Associar-se
              </Link>
            ) : null}
            <Link
              to="/beneficios"
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline w-fit"
              style={{ color: 'var(--primary)' }}
            >
              Ver clube completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div
          className="rounded-[20px] border p-3 sm:p-4 md:p-5 min-w-0"
          style={{
            borderColor: 'var(--c-border)',
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--primary) 4%, var(--surface)), var(--surface))',
          }}
        >
          <div className="mb-2.5 sm:mb-3">
            {!loading && hasPreview ? (
              <p className="text-[12px] sm:text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>
                Rede {brandName}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <p
              className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Marcas
            </p>
            <BeneficiosPartnerLogoStrip partners={partners} loading={loading} />
          </div>

          <div className="mt-3 sm:mt-4 min-w-0">
            {loading || hasOffers ? (
              <p
                className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Ofertas
              </p>
            ) : null}
            <BeneficiosPartnerOffersList
              offers={previewOffers}
              loading={loading}
              ctaTo={memberLink.to}
              ctaState={memberLink.state}
              ctaLabel={
                memberLink.hasMemberAccess
                  ? 'Ver na área do associado'
                  : memberLink.isLogged
                    ? 'Contratar para acessar'
                    : 'Ver na área do associado'
              }
            />
          </div>

          {!loading && hasPreview && !hasOffers ? (
            <p
              className="mt-3 text-xs text-center py-3 leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Parceiros cadastrados — ofertas disponíveis na área do associado.
            </p>
          ) : null}
        </div>

        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
          {!isLogged ? (
            <Link to="/planos" className="btn-primary justify-center h-11 text-sm flex-1">
              Quero me associar
            </Link>
          ) : null}
          <Link
            to="/servicos-digitais"
            className="btn-outline justify-center gap-2 h-11 text-sm flex-1 sm:flex-none sm:min-w-[180px]"
          >
            <Smartphone size={15} />
            Serviços digitais
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center md:justify-start text-[13px]">
          <Link
            to={memberLink.to}
            state={memberLink.state}
            className="font-semibold inline-flex items-center gap-1 min-h-[40px] active:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            {memberLink.hasMemberAccess ? (
              'Área do associado'
            ) : memberLink.isLogged ? (
              'Contratar plano'
            ) : (
              <>
                <LogIn size={14} />
                Já sou associado
              </>
            )}
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <Link
            to="/servicos-digitais"
            className="font-semibold min-h-[40px] inline-flex items-center active:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Serviços digitais do plano
          </Link>
        </div>
      </div>
    </section>
  )
}
