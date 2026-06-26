import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import useParceirosPreview from '@/hooks/useParceirosPreview'
import useMemberAreaLink from '@/hooks/useMemberAreaLink'
import CTAButton from '@/components/ui/CTAButton'
import PublicPageHeader from '@/components/public/PublicPageHeader'
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
    <section aria-labelledby="home-clube-heading">
      <div className={['public-home-enter', mounted ? 'is-mounted' : ''].join(' ')}>
        <PublicPageHeader
          kicker="Clube de benefícios"
          title="Descontos perto de você"
          description={pageDescription}
          id="home-clube-heading"
          titleAs="h2"
          actions={
            <Link to="/beneficios" className="public-section-link">
              Ver clube completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="public-surface-card p-3 sm:p-4 md:p-5 min-w-0">
          <div className="mb-2.5 sm:mb-3">
            {!loading && hasPreview ? (
              <p className="text-[12px] sm:text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>
                Rede {brandName}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="public-kicker px-1 mb-1.5 normal-case tracking-[0.14em]">Marcas</p>
            <BeneficiosPartnerLogoStrip partners={partners} loading={loading} />
          </div>

          <div className="mt-3 sm:mt-4 min-w-0">
            {loading || hasOffers ? (
              <p className="public-kicker px-1 mb-1.5 normal-case tracking-[0.14em]">Ofertas</p>
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

        {!isLogged ? (
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
            <CTAButton as="link" to="/planos" size="lg" className="sm:w-auto w-full justify-center">
              Quero me associar
            </CTAButton>
            <Link
              to={memberLink.to}
              state={memberLink.state}
              className="text-sm font-semibold text-center sm:text-left min-h-[44px] inline-flex items-center justify-center hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Já sou associado
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
