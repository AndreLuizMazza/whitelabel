import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, HelpCircle, ShieldCheck } from 'lucide-react'

const INTENTS = [
  {
    key: 'cliente',
    to: '/criar-conta',
    intent: 'cliente',
    icon: ShieldCheck,
    title: 'Primeiro acesso do associado',
    subtitle: 'Já tenho contrato. Crio minha senha com o CPF do titular - sem nova adesão.',
  },
  {
    key: 'lead',
    to: '/planos',
    intent: null,
    icon: ClipboardList,
    title: 'Conhecer planos',
    subtitle: 'Veja opções e faça sua adesão online.',
  },
  {
    key: 'ajuda',
    to: '/ajuda-acesso',
    intent: null,
    icon: HelpCircle,
    title: 'Recuperar acesso ou falar conosco',
    subtitle: 'Esqueci a senha, CPF não reconhecido ou preciso de atendimento.',
  },
]

function IntentRow({ item, navigationState }) {
  const Icon = item.icon
  const state =
    item.intent && navigationState
      ? { ...navigationState, intent: item.intent }
      : item.intent
        ? { intent: item.intent }
        : navigationState || undefined

  return (
    <Link
      to={item.to}
      state={state}
      className="group flex items-center gap-3 rounded-xl border px-3.5 py-3.5 min-h-[64px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      style={{
        borderColor: 'var(--c-border)',
        background: 'var(--surface)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          'var(--nav-hover-bg, color-mix(in srgb, var(--primary) 6%, var(--surface)))'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface)'
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
          color: 'var(--primary)',
        }}
      >
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-semibold text-[var(--text)] leading-snug">
          {item.title}
        </span>
        <span
          className="block text-xs leading-relaxed mt-0.5 line-clamp-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {item.subtitle}
        </span>
      </span>
      <ChevronRight
        size={18}
        className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
        aria-hidden
      />
    </Link>
  )
}

/**
 * Seção de intenções abaixo do login — separa cliente, lead e ajuda.
 */
export default function LoginIntentSection({ from, intent }) {
  const navigationState = from || intent ? { ...(from ? { from } : {}), ...(intent ? { intent } : {}) } : undefined

  return (
    <section className="mt-8" aria-labelledby="login-intent-heading">
      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
        <h2
          id="login-intent-heading"
          className="text-xs font-medium uppercase tracking-wide text-center shrink-0 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Primeiro acesso ou quer contratar?
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
      </div>

      <ul className="space-y-2.5">
        {INTENTS.map((item) => (
          <li key={item.key}>
            <IntentRow item={item} navigationState={navigationState} />
          </li>
        ))}
      </ul>
    </section>
  )
}
