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
    <section className="section !py-4 md:!py-8 pb-5">
      <div className="container-max max-w-5xl">
        {isLogged ? (
          <div
            className="mb-3 rounded-xl border px-3 py-2 flex items-center justify-between gap-2 sm:gap-3"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--c-border))',
              background: 'color-mix(in srgb, var(--primary) 8%, var(--surface))',
            }}
          >
            <p className="text-xs sm:text-sm leading-snug min-w-0" style={{ color: 'var(--text)' }}>
              Detalhes completos na área do associado.
            </p>
            <Link
              to="/area/beneficios"
              className="btn-primary text-xs sm:text-sm shrink-0 justify-center h-9 px-3"
            >
              Meu clube
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}

        {showPartnerContent ? (
          <>
            <div
              className="rounded-[20px] border p-3 sm:p-4 md:p-5"
              style={{
                borderColor: 'var(--c-border)',
                background:
                  'linear-gradient(160deg, color-mix(in srgb, var(--primary) 4%, var(--surface)), var(--surface))',
              }}
            >
              <div className="mb-2.5 sm:mb-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-[20px] sm:text-2xl font-bold tracking-tight leading-tight">
                    Clube de parceiros
                  </h1>
                  {!loading && hasPreview ? (
                    <p
                      className="text-[12px] sm:text-[13px] mt-0.5 truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Rede {brandName}
                    </p>
                  ) : null}
                </div>
                {!isLogged ? (
                  <Link
                    to="/planos"
                    className="text-[13px] font-semibold shrink-0 min-h-[36px] inline-flex items-center active:opacity-70"
                    style={{ color: 'var(--primary)' }}
                  >
                    Associar-se
                  </Link>
                ) : null}
              </div>

              <div>
                <p
                  className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Marcas
                </p>
                <BeneficiosPartnerLogoStrip partners={partners} loading={loading} />
              </div>

              <div className="mt-3 sm:mt-4">
                {loading || hasOffers ? (
                  <p
                    className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Ofertas
                  </p>
                ) : null}
                <BeneficiosPartnerOffersList offers={offers} loading={loading} isLogged={isLogged} />
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
                to={memberTo}
                state={memberState}
                className="font-semibold inline-flex items-center gap-1 min-h-[40px] active:opacity-70"
                style={{ color: 'var(--primary)' }}
              >
                {isLogged ? (
                  'Área do associado'
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
          </>
        ) : (
          <div className="min-h-[50dvh] flex flex-col">
            <header className="mb-4 text-center md:text-left">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--primary)' }}
              >
                Clube de parceiros
              </p>
              <h1 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight">
                Descontos perto de você
              </h1>
              <p
                className="mt-2 text-sm leading-relaxed max-w-2xl"
                style={{ color: 'var(--text-muted)' }}
              >
                Prévia da rede {brandName} — estabelecimentos locais com condições exclusivas para
                associados.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                <Link to="/planos" className="btn-primary justify-center h-11 text-sm">
                  Quero me associar
                </Link>
                <Link
                  to="/servicos-digitais"
                  className="btn-outline justify-center gap-2 h-11 text-sm"
                >
                  <Smartphone size={15} />
                  Serviços digitais
                </Link>
              </div>
            </header>

            <div
              className="flex-1 flex flex-col items-center justify-center rounded-[20px] border p-6 sm:p-8 text-center"
              style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
            >
              <p className="text-base sm:text-lg font-semibold">Rede de parceiros em expansão</p>
              <p className="mt-2 text-sm max-w-md leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Associe-se e acompanhe novidades do clube de descontos {brandName}.
              </p>
              <Link to="/planos" className="btn-primary mt-5 justify-center h-11 text-sm">
                Conhecer planos
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 justify-center md:justify-start text-[13px]">
              <Link
                to={memberTo}
                state={memberState}
                className="font-semibold inline-flex items-center gap-1 min-h-[40px] active:opacity-70"
                style={{ color: 'var(--primary)' }}
              >
                {isLogged ? (
                  'Área do associado'
                ) : (
                  <>
                    <LogIn size={14} />
                    Já sou associado
                  </>
                )}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
