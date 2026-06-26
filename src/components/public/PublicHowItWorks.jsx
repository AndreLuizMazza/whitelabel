import { Link } from 'react-router-dom'
import { ClipboardList, UserPlus, UserSquare2, Headphones } from 'lucide-react'

const STEPS = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Escolha seu plano',
    text: 'Compare opções, valores e benefícios inclusos de forma transparente.',
    to: '/planos',
    cta: 'Ver planos',
  },
  {
    icon: UserPlus,
    step: '02',
    title: 'Faça sua adesão',
    text: 'Contrate online com orientação clara em cada etapa do cadastro.',
    to: '/planos',
    cta: 'Começar adesão',
  },
  {
    icon: UserSquare2,
    step: '03',
    title: 'Acesse sua área',
    text: 'Consulte contrato, dependentes, pagamentos e carteirinha digital.',
    to: '/login',
    cta: 'Entrar',
  },
  {
    icon: Headphones,
    step: '04',
    title: 'Conte com nosso time',
    text: 'Unidades, telefone e WhatsApp para tirar dúvidas quando precisar.',
    to: '/filiais',
    cta: 'Falar conosco',
  },
]

export default function PublicHowItWorks({ mounted = true }) {
  return (
    <section className="mt-12 md:mt-16" aria-labelledby="home-how-heading">
      <div
        className={[
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <div className="text-center max-w-2xl mx-auto">
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Como funciona
          </p>
          <h2 id="home-how-heading" className="mt-1 text-2xl md:text-3xl font-black tracking-tight">
            Simples do início ao acompanhamento
          </h2>
          <p className="mt-2 text-sm md:text-base text-[var(--text-muted)]">
            Quatro passos alinhados ao fluxo real de contratação e autoatendimento.
          </p>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((item, index) => {
            const Icon = item.icon
            return (
              <li
                key={item.step}
                className="relative rounded-2xl border bg-[var(--surface)] p-5 md:p-6 h-full flex flex-col"
                style={{ borderColor: 'var(--c-border)' }}
              >
                {index < STEPS.length - 1 ? (
                  <span
                    className="hidden xl:block absolute top-1/2 -right-2 h-px w-4"
                    style={{ background: 'var(--c-border)' }}
                    aria-hidden="true"
                  />
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-[11px] font-bold tracking-[0.18em]"
                    style={{ color: 'var(--primary)' }}
                  >
                    PASSO {item.step}
                  </span>
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 10%, var(--surface) 90%)',
                      color: 'var(--primary)',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] flex-1">
                  {item.text}
                </p>

                <Link
                  to={item.to}
                  className="mt-4 inline-flex text-sm font-semibold hover:underline w-fit"
                  style={{ color: 'var(--primary)' }}
                >
                  {item.cta}
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
