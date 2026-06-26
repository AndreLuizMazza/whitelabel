import {
  CheckCircle2,
  Handshake,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react'
import { useMemo } from 'react'

import CTAButton from '@/components/ui/CTAButton'
import PublicPageHeader from '@/components/public/PublicPageHeader'
import useTenant from '@/store/tenant'
import { resolvePartnerWhatsAppHref } from '@/lib/partnerFunnel'

const BENEFITS = [
  { icon: Store, text: 'Divulgação para base ativa' },
  { icon: Megaphone, text: 'Indicações e campanhas' },
  { icon: ShieldCheck, text: 'Sem custo fixo' },
  { icon: Truck, text: 'Novos clientes' },
]

const PREMIUM_ITEMS = [
  'Exposição em campanhas digitais',
  'Destaque no Clube de Benefícios',
  'Eventos e ativações exclusivas',
]

const SEGMENTS = [
  'Farmácias',
  'Clínicas',
  'Óticas',
  'Mercados',
  'Academias',
  'Transporte',
  'Serviços Domésticos',
]

export default function ParceirosCTA({ mounted = true, onBecomePartner, whatsappHref }) {
  const empresa = useTenant((s) => s.empresa)

  const waLink = useMemo(() => {
    const hrefProp =
      typeof whatsappHref === 'string' && whatsappHref.trim() ? whatsappHref.trim() : ''
    if (hrefProp) return hrefProp
    return resolvePartnerWhatsAppHref(empresa)
  }, [empresa, whatsappHref])

  const hasWa = !!waLink

  return (
    <section id="parceiros" aria-labelledby="home-partners-heading">
      <div className={['public-home-enter', mounted ? 'is-mounted' : ''].join(' ')}>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0 flex flex-col">
            <PublicPageHeader
              kicker="Parcerias comerciais"
              title="Seja nosso parceiro premium"
              description="Ofereça condições especiais aos associados e receba indicações, visibilidade e novos clientes."
              id="home-partners-heading"
              titleAs="h2"
              size="compact"
              className="mb-5 md:mb-6 [&_.public-lead]:hidden sm:[&_.public-lead]:block"
            />

            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-2.5">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="public-surface-card flex items-center gap-2 rounded-lg px-2.5 py-2.5 min-h-[44px] md:min-h-[48px]"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--primary) 14%, var(--c-border))',
                    background: 'color-mix(in srgb, var(--surface) 96%, var(--primary) 4%)',
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: 'var(--primary)' }}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] md:text-[13px] font-medium leading-tight">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 md:mt-7">
              <CTAButton
                as="a"
                href={hasWa ? waLink : undefined}
                target={hasWa ? '_blank' : undefined}
                rel={hasWa ? 'noopener noreferrer' : undefined}
                size="lg"
                className="w-full sm:w-auto justify-center"
                iconBefore={<MessageSquare size={16} />}
                disabled={!hasWa}
                title={hasWa ? undefined : 'WhatsApp da unidade não configurado'}
                aria-label={
                  hasWa
                    ? 'Quero ser parceiro — abrir WhatsApp com mensagem pronta'
                    : 'WhatsApp indisponível'
                }
                onClick={() => {
                  try {
                    onBecomePartner?.()
                  } catch {}
                }}
              >
                Quero ser parceiro(a)
              </CTAButton>
              {!hasWa ? (
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  Contato por WhatsApp indisponível no momento.
                </p>
              ) : null}
            </div>

            <div
              className="mt-7 md:mt-8 pt-5 md:pt-6 border-t"
              style={{ borderColor: 'color-mix(in srgb, var(--c-border) 85%, transparent)' }}
            >
              <p className="public-kicker normal-case tracking-[0.12em] text-[10px]">
                Segmentos que buscamos
              </p>
              <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
                {SEGMENTS.map((tag) => (
                  <span
                    key={tag}
                    className="shrink-0 text-[10px] md:text-[11px] font-semibold rounded-full px-2.5 py-1 md:px-3 md:py-1"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 9%, var(--surface))',
                      color: 'var(--primary)',
                      border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--c-border))',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="hidden md:block min-w-0">
            <div className="public-surface-card p-4 lg:p-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-9 w-9 rounded-lg grid place-items-center shrink-0"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
                    color: 'var(--primary)',
                  }}
                >
                  <Handshake className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug">Rede de Benefícios Premium</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Empresas selecionadas</p>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {PREMIUM_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12px] leading-snug">
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 mt-0.5"
                      style={{ color: 'var(--primary)' }}
                      strokeWidth={2.25}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
