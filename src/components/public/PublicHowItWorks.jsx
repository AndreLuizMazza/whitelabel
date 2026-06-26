import { Link } from 'react-router-dom'
import { ClipboardList, UserPlus, UserSquare2, Headphones } from 'lucide-react'

import PublicPageHeader from '@/components/public/PublicPageHeader.jsx'

const STEPS = [
  {
    icon: ClipboardList,
    step: '1',
    title: 'Escolha seu plano',
    text: 'Compare opções e benefícios.',
    to: '/planos',
    cta: 'Ver planos',
  },
  {
    icon: UserPlus,
    step: '2',
    title: 'Faça sua adesão',
    text: 'Contrate online com orientação.',
    to: '/planos',
    cta: 'Começar',
  },
  {
    icon: UserSquare2,
    step: '3',
    title: 'Acesse sua área',
    text: 'Contrato, pagamentos e carteirinha.',
    to: '/login',
    cta: 'Entrar',
  },
  {
    icon: Headphones,
    step: '4',
    title: 'Conte com nosso time',
    text: 'Unidades, telefone e WhatsApp.',
    to: '/filiais',
    cta: 'Contato',
  },
]

export default function PublicHowItWorks({ mounted = true }) {
  return (
    <section aria-labelledby="home-how-heading">
      <div
        className={[
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <PublicPageHeader
          kicker="Como funciona"
          title="Simples do início ao acompanhamento"
          description="Quatro passos alinhados ao fluxo real de contratação e autoatendimento."
          id="home-how-heading"
          titleAs="h2"
          align="left"
          className="mb-4 md:mb-5 [&_.public-lead]:hidden sm:[&_.public-lead]:block"
        />

        <ol className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4 auto-rows-fr">
          {STEPS.map((item) => {
            const Icon = item.icon
            return (
              <li
                key={item.step}
                className="public-surface-card p-3 md:p-4 flex flex-col h-full"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
                      color: 'var(--primary)',
                    }}
                    aria-hidden="true"
                  >
                    {item.step}
                  </span>
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
                      color: 'var(--primary)',
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>

                <h3 className="mt-2 text-[13px] md:text-base font-bold leading-snug">{item.title}</h3>
                <p className="mt-1 text-[11px] md:text-xs leading-snug text-[var(--text-muted)] line-clamp-2 flex-1">
                  {item.text}
                </p>

                <Link
                  to={item.to}
                  className="public-section-link text-[11px] md:text-xs"
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
