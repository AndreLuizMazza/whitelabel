import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight, LogIn, Smartphone, Sparkles, ShieldCheck, BadgePercent } from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { setPageSEO } from '@/lib/seo'
import { resolveBrandDisplayName } from '@/lib/branding/tenantContract'
import useMemberAreaLink from '@/hooks/useMemberAreaLink'

const DIGITAL_ITEMS = [
  {
    id: 'telemedicina',
    icon: Sparkles,
    title: 'Telemedicina 24h',
    desc: 'Orientação médica à distância para titular e dependentes, com praticidade no dia a dia.',
  },
  {
    id: 'apps',
    icon: Smartphone,
    title: 'Apps e plataformas do plano',
    desc: 'Acessos online incluídos na contratação — parceiros digitais do seu plano.',
  },
  {
    id: 'cobertura',
    icon: ShieldCheck,
    title: 'Assistência digital',
    desc: 'Benefícios do plano com suporte e transparência para o associado.',
  },
]

export default function ServicosDigitaisPublico() {
  const empresa = useTenant((s) => s.empresa)
  const isLogged = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )

  const brandName = resolveBrandDisplayName(
    typeof window !== 'undefined' ? window.__TENANT__ : null,
    empresa
  )

  useEffect(() => {
    setPageSEO({
      title: 'Serviços digitais',
      description: `Telemedicina e serviços online inclusos nos planos ${brandName}.`,
    })
  }, [brandName])

  const memberLink = useMemberAreaLink('/area/servicos-digitais')

  return (
    <section className="section pb-8">
      <div className="container-max max-w-5xl">
        {memberLink.isLogged && !memberLink.checking ? (
          <div
            className="mb-5 rounded-2xl border px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--c-border))',
              background: 'color-mix(in srgb, var(--primary) 8%, var(--surface))',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {memberLink.hasMemberAccess
                ? 'Acesse telemedicina e apps do seu plano na área do associado.'
                : 'Contrate um plano para liberar telemedicina e serviços digitais.'}
            </p>
            <Link
              to={memberLink.to}
              state={memberLink.state}
              className="btn-primary text-sm shrink-0 justify-center"
            >
              {memberLink.hasMemberAccess ? (
                <>
                  Abrir meus serviços
                  <ArrowRight size={16} />
                </>
              ) : (
                'Ver planos'
              )}
            </Link>
          </div>
        ) : null}

        <div className="min-h-[calc(100dvh-11rem)] flex flex-col">
          <header className="mb-6 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
              Serviços digitais
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
              Tudo online, incluso no plano
            </h1>
            <p className="mt-3 text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
              Telemedicina, apps e plataformas parceiras — diferente do clube de descontos com estabelecimentos
              locais.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/planos" className="btn-primary justify-center">
                Quero no meu plano
              </Link>
              <Link to="/beneficios" className="btn-outline justify-center gap-2">
                <BadgePercent size={16} />
                Ver clube de parceiros
              </Link>
            </div>
          </header>

          <div className="flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 content-start">
            {DIGITAL_ITEMS.map(({ id, icon: Icon, title, desc }) => (
              <article
                key={id}
                id={id}
                className="rounded-[18px] border p-5 scroll-mt-24 flex flex-col"
                style={{
                  borderColor: 'var(--c-border)',
                  background: 'var(--surface)',
                  boxShadow: '0 1px 3px color-mix(in srgb, var(--text) 5%, transparent)',
                }}
              >
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] mb-3"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
                    color: 'var(--primary)',
                  }}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <h2 className="text-lg font-bold leading-snug">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
              </article>
            ))}
          </div>

          <div
            className="mt-6 rounded-2xl border px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Já é associado? Acesse os links reais do seu plano na área logada.
            </p>
            <Link
              to={memberLink.to}
              state={memberLink.state}
              className="btn-outline justify-center shrink-0"
            >
              {memberLink.hasMemberAccess ? (
                <>Abrir serviços digitais</>
              ) : memberLink.isLogged ? (
                <>Contratar plano</>
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
