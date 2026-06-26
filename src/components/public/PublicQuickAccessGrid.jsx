import { Link } from 'react-router-dom'
import {
  Layers,
  Receipt,
  UserSquare2,
  Gift,
  MessageCircle,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import { isBeneficiosEnabled, isMemorialEnabled } from '@/lib/tenantModules'

function IconBadge({ children }) {
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--primary) 12%, var(--surface) 88%)',
        color: 'var(--primary)',
        border: '1px solid color-mix(in srgb, var(--primary) 28%, var(--c-border))',
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

function QuickAccessCard({ icon, title, desc, to, cta, mounted, delay = 0 }) {
  if (!to) return null

  const isExternal = /^https?:\/\//i.test(to)
  const Wrapper = isExternal ? 'a' : Link
  const wrapperProps = isExternal
    ? { href: to, target: '_blank', rel: 'noopener noreferrer' }
    : { to }

  return (
    <Wrapper
      {...wrapperProps}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_60%,black)]"
      aria-label={`${title}. ${cta}`}
      title={title}
    >
      <article
        className={[
          'h-full flex flex-col justify-between rounded-2xl',
          'p-3 sm:p-4 md:p-5',
          'transition-all duration-500 will-change-transform',
          'hover:-translate-y-[2px] hover:shadow-md sm:hover:shadow-xl',
          'hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--c-border)]',
          'active:translate-y-0',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
        style={{
          transitionDelay: `${delay}ms`,
          boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 10px 30px rgba(15,23,42,.06)',
        }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <IconBadge>{icon}</IconBadge>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold leading-tight">
              {title}
              {isExternal ? <span className="sr-only"> (abre em nova aba)</span> : null}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text)] leading-relaxed line-clamp-3">
              {desc}
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 pt-2 border-t border-[var(--c-border)]/50">
          <CTAButton
            as="span"
            iconAfter={<ArrowRight size={14} />}
            className="w-full justify-center sm:w-auto sm:justify-start text-xs sm:text-sm"
          >
            {cta}
          </CTAButton>
        </div>
      </article>
    </Wrapper>
  )
}

export default function PublicQuickAccessGrid({
  empresa,
  isLogged = false,
  inCapacitorApp = false,
  mounted = true,
}) {
  const cards = [
    {
      key: 'area',
      icon: <UserSquare2 size={22} strokeWidth={2} />,
      title: 'Área do Associado',
      desc: 'Acesse contratos, dependentes e pagamentos.',
      to: isLogged ? '/area' : '/login',
      cta: 'Acessar área',
      delay: 200,
      show: true,
    },
    {
      key: 'segunda-via',
      icon: <Receipt size={22} strokeWidth={2} />,
      title: 'Segunda via de Boleto',
      desc: 'Consulte boletos sem senha.',
      to: '/contratos',
      cta: 'Pesquisar',
      delay: 230,
      show: !inCapacitorApp,
    },
    {
      key: 'planos',
      icon: <Layers size={22} strokeWidth={2} />,
      title: 'Nossos Planos',
      desc: 'Proteção completa para toda a família.',
      to: '/planos',
      cta: 'Ver planos',
      delay: 260,
      show: true,
    },
    {
      key: 'beneficios',
      icon: <Gift size={22} strokeWidth={2} />,
      title: 'Clube de Benefícios',
      desc: 'Parceiros com descontos e vantagens.',
      to: '/beneficios',
      cta: 'Ver parceiros',
      delay: 290,
      show: !inCapacitorApp && isBeneficiosEnabled(empresa),
    },
    {
      key: 'memorial',
      icon: <HeartHandshake size={22} strokeWidth={2} />,
      title: 'Memorial Online',
      desc: 'Homenagens interativas e informações das cerimônias.',
      to: '/memorial',
      cta: 'Ver Memorial',
      delay: 320,
      show: isMemorialEnabled(empresa),
    },
    {
      key: 'contato',
      icon: <MessageCircle size={22} strokeWidth={2} />,
      title: 'Atendimento',
      desc: 'Encontre nossas unidades e canais de atendimento.',
      to: '/filiais',
      cta: 'Ver unidades',
      delay: 350,
      show: true,
    },
  ]

  const visible = cards.filter((c) => c.show)

  return (
    <div>
      <div className="mb-5 md:mb-6">
        <p
          className="text-[11px] uppercase tracking-[0.2em] font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Acesso rápido
        </p>
        <h2 className="mt-1 text-xl md:text-2xl font-bold text-[var(--text)]">
          O que você precisa, em um clique
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
        {visible.map((card) => (
          <QuickAccessCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            desc={card.desc}
            to={card.to}
            cta={card.cta}
            mounted={mounted}
            delay={card.delay}
          />
        ))}
      </div>
    </div>
  )
}
