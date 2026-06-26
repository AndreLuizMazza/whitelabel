import { Link } from 'react-router-dom'
import {
  Layers,
  UserSquare2,
  Gift,
  MessageCircle,
  FileText,
} from 'lucide-react'

import ScrollRevealRow from '@/components/ui/ScrollRevealRow'
import { isBeneficiosEnabled } from '@/lib/tenantModules'

const PRIORITY_KEYS = ['area', 'segunda-via', 'planos', 'beneficios', 'contato']
const FEATURED_KEYS = new Set(['area', 'segunda-via'])

function MobileChip({ icon, title, to, mounted, delay = 0, featured = false }) {
  const Wrapper = /^https?:\/\//i.test(to) ? 'a' : Link
  const wrapperProps =
    Wrapper === 'a'
      ? { href: to, target: '_blank', rel: 'noopener noreferrer' }
      : { to }

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        'group shrink-0 snap-start flex flex-col items-center justify-center gap-1.5',
        'public-surface-card px-2 py-2.5 min-h-[76px] w-[5.25rem]',
        'transition-all duration-200 active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
        featured ? 'border-[color-mix(in_srgb,var(--primary)_35%,var(--c-border))]' : '',
      ].join(' ')}
      style={{
        transitionDelay: `${delay}ms`,
        background: featured
          ? 'color-mix(in srgb, var(--primary) 7%, var(--surface))'
          : undefined,
      }}
      aria-label={title}
    >
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{
          background: featured
            ? 'color-mix(in srgb, var(--primary) 88%, var(--surface))'
            : 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
          color: featured ? 'var(--on-primary, #fff)' : 'var(--primary)',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="text-[10px] font-semibold leading-tight text-center text-[var(--text)] line-clamp-2 px-0.5">
        {title}
      </span>
    </Wrapper>
  )
}

function DesktopChip({ icon, title, to, mounted, delay = 0, featured = false }) {
  const Wrapper = /^https?:\/\//i.test(to) ? 'a' : Link
  const wrapperProps =
    Wrapper === 'a'
      ? { href: to, target: '_blank', rel: 'noopener noreferrer' }
      : { to }

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 min-h-[40px]',
        'transition-all duration-200 hover:shadow-sm active:scale-[0.99]',
        mounted ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{
        transitionDelay: `${delay}ms`,
        borderColor: featured
          ? 'color-mix(in srgb, var(--primary) 35%, var(--c-border))'
          : 'var(--c-border)',
        background: featured
          ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
          : 'var(--surface)',
      }}
    >
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          background: featured
            ? 'color-mix(in srgb, var(--primary) 85%, var(--surface))'
            : 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
          color: featured ? 'var(--on-primary, #fff)' : 'var(--primary)',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="text-[13px] font-semibold whitespace-nowrap">{title}</span>
    </Wrapper>
  )
}

export default function PublicQuickAccessGrid({
  empresa,
  isLogged = false,
  inCapacitorApp = false,
  mounted = true,
  compact = false,
}) {
  const cards = [
    {
      key: 'area',
      icon: <UserSquare2 size={16} strokeWidth={2.25} />,
      title: isLogged ? 'Minha área' : 'Área do associado',
      titleMobile: isLogged ? 'Minha área' : 'Área do associado',
      to: isLogged ? '/area' : '/login',
      delay: 80,
      show: true,
    },
    {
      key: 'segunda-via',
      icon: <FileText size={16} strokeWidth={2.25} />,
      title: 'Segunda via de boleto',
      titleMobile: '2ª via',
      to: '/contratos',
      delay: 110,
      show: !inCapacitorApp,
    },
    {
      key: 'planos',
      icon: <Layers size={15} strokeWidth={2.25} />,
      title: 'Planos',
      titleMobile: 'Planos',
      to: '/planos',
      delay: 140,
      show: true,
    },
    {
      key: 'beneficios',
      icon: <Gift size={15} strokeWidth={2.25} />,
      title: 'Benefícios',
      titleMobile: 'Benefícios',
      to: '/beneficios',
      delay: 170,
      show: !inCapacitorApp && isBeneficiosEnabled(empresa),
    },
    {
      key: 'contato',
      icon: <MessageCircle size={15} strokeWidth={2.25} />,
      title: 'Unidades',
      titleMobile: 'Unidades',
      to: '/filiais',
      delay: 200,
      show: true,
    },
  ]

  const visible = cards
    .filter((c) => c.show)
    .sort((a, b) => PRIORITY_KEYS.indexOf(a.key) - PRIORITY_KEYS.indexOf(b.key))

  return (
    <div className="home-command-strip">
      <p className="public-kicker mb-2">
        {compact ? 'Acesso rápido' : 'O que você precisa, em um clique'}
      </p>

      <ScrollRevealRow
        className="md:hidden"
        rowClassName="flex gap-2 pb-0.5 -mx-1 px-1 snap-x snap-mandatory"
      >
        {visible.map((card) => (
          <MobileChip
            key={card.key}
            icon={card.icon}
            title={card.titleMobile || card.title}
            to={card.to}
            mounted={mounted}
            delay={card.delay}
            featured={FEATURED_KEYS.has(card.key)}
          />
        ))}
      </ScrollRevealRow>

      <div className="hidden md:flex flex-wrap gap-2">
        {visible.map((card) => (
          <DesktopChip
            key={card.key}
            icon={card.icon}
            title={card.title}
            to={card.to}
            mounted={mounted}
            delay={card.delay}
            featured={FEATURED_KEYS.has(card.key)}
          />
        ))}
      </div>
    </div>
  )
}
