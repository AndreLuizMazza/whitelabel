import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight, LogIn, Smartphone } from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { setPageSEO } from '@/lib/seo'
import { resolveBrandDisplayName } from '@/lib/branding/tenantContract'
import useParceirosPreview from '@/hooks/useParceirosPreview'
import BeneficiosPartnerLogoStrip from '@/components/beneficios/public/BeneficiosPartnerLogoStrip'
import BeneficiosPartnerOffersList from '@/components/beneficios/public/BeneficiosPartnerOffersList'

export default function BeneficiosPublico() {
  const empresa = useTenant((s) => s.empresa)
  const isLogged = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )

  const { loading, error, partners, offers, hasPreview, hasOffers, showPreview } =
    useParceirosPreview()

  const brandName = resolveBrandDisplayName(
    typeof window !== 'undefined' ? window.__TENANT__ : null,
    empresa
  )

  useEffect(() => {
    setPageSEO({
      title: 'Clube de parceiros',
      description: `Descontos e vantagens com parceiros ${brandName}. Prévia da rede na vitrine comercial.`,
    })
  }, [brandName])

  const showPartnerContent = showPreview && !error && (loading || hasPreview)
  const memberTo = isLogged ? '/area/beneficios' : '/login'
  const memberState = isLogged ? undefined : { from: { pathname: '/area/beneficios' } }

  return (
    <section className="section pb-6">
      <div className="container-max max-w-5xl">
        {isLogged ? (
          <div
            className="mb-5 rounded-2xl border px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--c-border))',
              background: 'color-mix(in srgb, var(--primary) 8%, var(--surface))',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Veja parceiros, ofertas e detalhes completos na área do associado.
            </p>
            <Link to="/area/beneficios" className="btn-primary text-sm shrink-0 justify-center">
              Meu clube de parceiros
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        <div className="min-h-[calc(100dvh-11rem)] flex flex-col">
          <header className="mb-5 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
              Clube de parceiros
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
              Descontos perto de você
            </h1>
            <p className="mt-3 text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
              Prévia da rede {brandName} — estabelecimentos locais com condições exclusivas para associados.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/planos" className="btn-primary justify-center">
                Quero me associar
              </Link>
              <Link to="/servicos-digitais" className="btn-outline justify-center gap-2">
                <Smartphone size={16} />
                Serviços digitais
              </Link>
            </div>
          </header>

          {showPartnerContent ? (
            <div className="flex-1 flex flex-col rounded-[22px] border p-4 md:p-5" style={{ borderColor: 'var(--c-border)', background: 'linear-gradient(160deg, color-mix(in srgb, var(--primary) 4%, var(--surface)), var(--surface))' }}>
              <BeneficiosPartnerLogoStrip partners={partners} loading={loading} />

              {!loading && hasPreview ? (
                <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Ofertas de todos os parceiros, em sequência. Detalhes completos após associação.
                </p>
              ) : null}

              <div className="flex-1 mt-2">
                <BeneficiosPartnerOffersList offers={offers} loading={loading} isLogged={isLogged} />
              </div>

              {!loading && hasPreview && !hasOffers ? (
                <p className="mt-4 text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  Parceiros cadastrados — ofertas disponíveis na área do associado.
                </p>
              ) : null}
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-[22px] border p-8 text-center"
              style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
            >
              <p className="text-lg font-semibold">Rede de parceiros em expansão</p>
              <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
                Associe-se e acompanhe novidades do clube de descontos {brandName}.
              </p>
              <Link to="/planos" className="btn-primary mt-6 justify-center">
                Conhecer planos
              </Link>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
            <Link to={memberTo} state={memberState} className="text-sm font-semibold inline-flex items-center gap-1 min-h-[44px]" style={{ color: 'var(--primary)' }}>
              {isLogged ? 'Área do associado' : (
                <>
                  <LogIn size={15} />
                  Já sou associado
                </>
              )}
            </Link>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>·</span>
            <Link to="/servicos-digitais" className="text-sm font-semibold min-h-[44px] inline-flex items-center" style={{ color: 'var(--text-muted)' }}>
              Serviços digitais do plano
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
