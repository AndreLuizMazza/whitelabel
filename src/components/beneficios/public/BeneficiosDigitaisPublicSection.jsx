import { Link } from 'react-router-dom'
import { ArrowRight, Smartphone, Sparkles, ShieldCheck } from 'lucide-react'

const DIGITAL_ITEMS = [
  {
    id: 'telemedicina',
    icon: Sparkles,
    title: 'Telemedicina 24h',
    desc: 'Orientação médica à distância para titular e dependentes.',
    anchor: 'telemedicina',
  },
  {
    id: 'apps',
    icon: Smartphone,
    title: 'Serviços digitais do plano',
    desc: 'Acessos online incluídos no plano contratado — apps e plataformas parceiras.',
  },
  {
    id: 'cobertura',
    icon: ShieldCheck,
    title: 'Assistência e cobertura',
    desc: 'Benefícios do plano com transparência e suporte da equipe.',
  },
]

function DigitalCard({ item, ctaTo, ctaState }) {
  const Icon = item.icon

  return (
    <article
      className="flex shrink-0 snap-start flex-col w-[min(240px,78vw)] rounded-[16px] p-4"
      style={{
        border: '0.5px solid var(--separator, var(--c-border))',
        background: 'var(--surface)',
        boxShadow: '0 1px 3px color-mix(in srgb, var(--text) 5%, transparent)',
      }}
    >
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] mb-3"
        style={{
          background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
          color: 'var(--primary)',
        }}
      >
        <Icon size={20} strokeWidth={1.85} />
      </span>
      <h3 className="text-[16px] font-bold leading-snug tracking-tight">{item.title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
        {item.desc}
      </p>
      <Link
        to={ctaTo}
        state={ctaState}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold min-h-[40px] active:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        Saiba mais
        <ArrowRight size={14} strokeWidth={2.5} />
      </Link>
    </article>
  )
}

export default function BeneficiosDigitaisPublicSection({ isLogged = false }) {
  const ctaTo = isLogged ? '/area/beneficios' : '/planos'
  const ctaState = isLogged ? undefined : undefined

  return (
    <section id="digitais" className="mb-10 scroll-mt-24" aria-labelledby="sec-digitais-title">
      <div className="mb-4">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Benefícios digitais
        </p>
        <h2 id="sec-digitais-title" className="text-xl md:text-2xl font-bold tracking-tight">
          Inclusos no plano, na palma da mão
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
          Telemedicina, apps e serviços online — diferentes do clube de descontos com parceiros locais.
        </p>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DIGITAL_ITEMS.map((item) => (
          <DigitalCard
            key={item.id}
            item={item}
            ctaTo={item.id === 'telemedicina' && !isLogged ? '/planos' : ctaTo}
            ctaState={ctaState}
          />
        ))}
      </div>
    </section>
  )
}
