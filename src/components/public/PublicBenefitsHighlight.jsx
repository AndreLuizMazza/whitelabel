import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Gift,
  HeartHandshake,
  Layers,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

import { getHomeBenefitHighlights, getTenantContract } from '@/lib/tenantContent'
import { isBeneficiosEnabled, isMemorialEnabled } from '@/lib/tenantModules'

const ICONS = {
  Gift,
  HeartHandshake,
  Layers,
  MessageCircle,
  ShieldCheck,
  Sparkles,
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resolveBenefitTileRoute({ title, text, to }, empresa) {
  const explicit = String(to || '').trim()
  if (explicit && explicit !== '/sobre-nos') return explicit

  const haystack = normalizeText(`${title} ${text}`)
  if (/(beneficio|beneficios|clube|rede|parceir|vantagen)/.test(haystack) && isBeneficiosEnabled(empresa)) {
    return '/beneficios'
  }
  if (/memorial/.test(haystack) && isMemorialEnabled(empresa)) {
    return '/memorial'
  }
  if (/plano/.test(haystack)) return '/planos'
  if (/(filial|unidade|atendimento|contato)/.test(haystack)) return '/filiais'

  return explicit || '/sobre-nos'
}

function buildModuleFallbackTiles(empresa) {
  const tiles = [
    {
      icon: Layers,
      title: 'Planos para cada momento',
      text: 'Opções familiares e individuais com cobertura pensada para o dia a dia.',
      to: '/planos',
    },
  ]

  if (isBeneficiosEnabled(empresa)) {
    tiles.push({
      icon: Gift,
      title: 'Clube de Benefícios',
      text: 'Descontos e vantagens em parceiros locais para quem é associado.',
      to: '/beneficios',
    })
  }

  if (isMemorialEnabled(empresa)) {
    tiles.push({
      icon: HeartHandshake,
      title: 'Memorial online',
      text: 'Espaço respeitoso para homenagens e informações das cerimônias.',
      to: '/memorial',
    })
  }

  tiles.push({
    icon: MessageCircle,
    title: 'Atendimento humanizado',
    text: 'Unidades, telefone e canais digitais para orientar você quando precisar.',
    to: '/filiais',
  })

  return tiles.slice(0, 4)
}

export default function PublicBenefitsHighlight({ empresa, mounted = true }) {
  const tiles = useMemo(() => {
    const contract = getTenantContract()
    const fromJson = getHomeBenefitHighlights(contract)
    if (fromJson.length >= 2) {
      return fromJson.slice(0, 4).map((item) => ({
        icon: ICONS[item.icon] || ShieldCheck,
        title: item.title,
        text: item.text,
        to: resolveBenefitTileRoute(item, empresa),
      }))
    }
    return buildModuleFallbackTiles(empresa)
  }, [empresa])

  if (tiles.length < 2) return null

  return (
    <section className="mt-12 md:mt-16" aria-labelledby="home-benefits-heading">
      <div
        className={[
          'rounded-3xl border p-6 md:p-10 public-home-enter',
          mounted ? 'is-mounted' : '',
        ].join(' ')}
        style={{
          borderColor: 'color-mix(in srgb, var(--primary) 18%, var(--c-border))',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--surface)) 0%, var(--surface) 55%)',
        }}
      >
        <div className="max-w-2xl">
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Por que escolher a gente
          </p>
          <h2 id="home-benefits-heading" className="mt-1 text-2xl md:text-3xl font-black tracking-tight">
            Mais do que um plano: cuidado de verdade
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = tile.icon
            const content = (
              <>
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 12%, var(--surface) 88%)',
                    color: 'var(--primary)',
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold leading-snug">{tile.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{tile.text}</p>
                {tile.to ? (
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    Saiba mais
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : null}
              </>
            )

            if (!tile.to) {
              return (
                <article
                  key={tile.title}
                  className="rounded-2xl border bg-[var(--surface)]/80 p-5 h-full"
                  style={{ borderColor: 'var(--c-border)' }}
                >
                  {content}
                </article>
              )
            }

            return (
              <Link
                key={tile.title}
                to={tile.to}
                className="group rounded-2xl border bg-[var(--surface)]/80 p-5 h-full transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: 'var(--c-border)' }}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
