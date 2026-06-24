import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight, LogIn } from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { setPageSEO } from '@/lib/seo'
import { resolveBrandDisplayName } from '@/lib/branding/tenantContract'
import useParceirosPreview from '@/hooks/useParceirosPreview'
import BeneficiosDigitaisPublicSection from '@/components/beneficios/public/BeneficiosDigitaisPublicSection'
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
      title: 'Benefícios',
      description: `Conheça os benefícios do ${brandName}. Telemedicina, clube de descontos e assistência para associados.`,
    })
  }, [brandName])

  const showPartnerBlock = showPreview && !error && (loading || hasPreview)

  return (
    <section className="section">
      <div className="container-max max-w-5xl">
        {isLogged ? (
          <div
            className="mb-6 rounded-2xl border px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--c-border))',
              background: 'color-mix(in srgb, var(--primary) 8%, var(--surface))',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Você já possui acesso de associado. Veja parceiros, serviços digitais e detalhes completos.
            </p>
            <Link to="/area/beneficios" className="btn-primary text-sm shrink-0 justify-center">
              Ver meus benefícios
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        <header className="mb-8 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
            Benefícios
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
            Vantagens para quem é {brandName}
          </h1>
          <p className="mt-3 text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Benefícios digitais do plano e descontos com parceiros locais — prévia comercial. Detalhes completos na
            área do associado.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <a href="#digitais" className="btn-outline justify-center scroll-smooth">
              Benefícios digitais
            </a>
            <a href="#clube" className="btn-outline justify-center scroll-smooth">
              Ver parceiros
            </a>
            <Link to="/planos" className="btn-primary justify-center">
              Quero benefícios
            </Link>
          </div>
        </header>

        <BeneficiosDigitaisPublicSection isLogged={isLogged} />

        {showPartnerBlock ? (
          <div
            id="clube"
            className="mb-10 scroll-mt-24 rounded-[22px] border p-4 md:p-5"
            style={{
              borderColor: 'var(--c-border)',
              background:
                'linear-gradient(160deg, color-mix(in srgb, var(--primary) 4%, var(--surface)), var(--surface))',
            }}
          >
            <div className="mb-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Benefícios de parceiros
              </p>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Clube de descontos</h2>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Rede local com condições exclusivas — role para ver a prévia das ofertas.
              </p>
            </div>

            <BeneficiosPartnerLogoStrip partners={partners} loading={loading} />

            {!loading && hasPreview ? (
              <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Ofertas de todos os parceiros, em sequência. A rede completa fica na área do associado.
              </p>
            ) : null}

            <BeneficiosPartnerOffersList
              offers={offers}
              loading={loading}
              isLogged={isLogged}
            />

            {!loading && hasPreview && !hasOffers ? (
              <p className="mt-4 text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Parceiros cadastrados — detalhes de ofertas disponíveis após associação.
              </p>
            ) : null}
          </div>
        ) : null}

        <div
          className="rounded-2xl border p-6 md:p-8 text-center"
          style={{
            borderColor: 'var(--c-border)',
            background:
              'linear-gradient(145deg, color-mix(in srgb, var(--primary) 6%, var(--surface)), var(--surface))',
          }}
        >
          <h2 className="text-xl md:text-2xl font-bold">Quer aproveitar todos os benefícios?</h2>
          <p className="mt-2 text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Associe-se e tenha acesso ao clube de parceiros, serviços digitais do plano e condições exclusivas.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/planos" className="btn-primary justify-center">
              Conhecer planos
            </Link>
            {isLogged ? (
              <Link to="/area/beneficios" className="btn-outline justify-center">
                Ir para meus benefícios
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: { pathname: '/area/beneficios' } }}
                  className="btn-outline justify-center"
                >
                  <LogIn size={16} />
                  Já sou associado
                </Link>
                <Link to="/criar-conta" className="btn-outline justify-center">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
