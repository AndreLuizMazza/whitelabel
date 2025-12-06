// src/pages/Home.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useTenant from '@/store/tenant'
import useAuth from '@/store/auth'

import PlanosCTA from '@/components/PlanosCTA'
import MemorialCTA from '@/components/MemorialCTA'
import ParceirosCTA from '@/components/ParceirosCTA'
import StatsStrip from '@/components/StatsStrip'
import FaqSection from '@/components/faq/FaqSection.jsx'

import CTAButton from '@/components/ui/CTAButton'
import {
  Layers,
  Receipt,
  UserSquare2,
  Smartphone,
  Apple,
  ArrowRight,
  IdCard,
  QrCode,
  Gift,
  MessageCircle,
  HeartHandshake,
} from 'lucide-react'

/* ===================== peças utilitárias ===================== */

function IconBadge({ children }) {
  return (
    <span
      className="
        inline-flex
        h-10 w-10
        items-center justify-center
        rounded-full
        shrink-0
      "
      style={{
        background:
          'color-mix(in srgb, var(--primary) 12%, var(--surface) 88%)',
        color: 'var(--primary)',
        border:
          '1px solid color-mix(in srgb, var(--primary) 28%, var(--c-border))',
      }}
    >
      {children}
    </span>
  )
}

/* ========================================================================
   FEATURE CARD – OPÇÃO A (PREMIUM / ENTERPRISE)
   ======================================================================== */

function FeatureCardPremium({ icon, title, desc, to, cta, mounted, delay = 0 }) {
  if (!to) return null

  const isExternal = /^https?:\/\//i.test(to)
  const Wrapper = isExternal ? 'a' : Link
  const wrapperProps = isExternal
    ? {
        href: to,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : { to }

  return (
    <Wrapper
      {...wrapperProps}
      className="
        group block h-full 
        focus:outline-none 
        focus-visible:ring-2
        focus-visible:ring-offset-2
        focus-visible:ring-[color-mix(in_srgb,var(--primary)_60%,black)]
      "
      aria-label={`${title}. ${cta}`}
    >
      <article
        className={[
          'h-full flex flex-col justify-between rounded-2xl',
          'p-3 sm:p-4 md:p-5',
          'transition-all duration-500 will-change-transform',
          'hover:-translate-y-[2px] hover:shadow-md sm:hover:shadow-xl',
          'hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--c-border)]',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <IconBadge>{icon}</IconBadge>

          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold leading-tight">
              {title}
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
            className="
              w-full justify-center sm:w-auto sm:justify-start
              text-xs sm:text-sm
            "
          >
            {cta}
          </CTAButton>
        </div>
      </article>
    </Wrapper>
  )
}

/* ========================================================================
   FEATURE CARD – OPÇÃO B (MINIMALISTA CLEAN)
   ======================================================================== */

function FeatureCardMinimal({ icon, title, desc, to, cta, mounted, delay = 0 }) {
  if (!to) return null

  const isExternal = /^https?:\/\//i.test(to)
  const Wrapper = isExternal ? 'a' : Link
  const wrapperProps = isExternal
    ? {
        href: to,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : { to }

  return (
    <Wrapper
      {...wrapperProps}
      className="
        group block h-full
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-offset-2
        focus-visible:ring-[color-mix(in_srgb,var(--primary)_60%,black)]
      "
      aria-label={`${title}. ${cta}`}
    >
      <article
        className={[
          'h-full flex flex-col justify-between rounded-xl',
          'p-3 sm:p-4 md:p-5',
          'transition-all duration-500',
          'hover:-translate-y-[1px] hover:bg-[var(--surface)]/70',
          'hover:border hover:border-[var(--c-border)] shadow-sm hover:shadow-lg',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <IconBadge>{icon}</IconBadge>
          </div>

          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold leading-tight">
              {title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text)] leading-relaxed line-clamp-3">
              {desc}
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <span
            className="
            inline-flex items-center gap-1.5 
            text-[var(--primary)] 
            text-xs sm:text-sm font-medium
            group-hover:translate-x-0.5 transition-transform
          "
          >
            <span>{cta}</span>
            <ArrowRight size={14} />
          </span>
        </div>
      </article>
    </Wrapper>
  )
}

/* ============================================================
   Escolha rápida: qual versão usar nos cards da Home?
   ============================================================ */

const FeatureCard = FeatureCardPremium
// const FeatureCard = FeatureCardMinimal

function ValuePills() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-xs font-medium px-3 py-1.5 backdrop-blur-sm">
        <IdCard size={14} /> Carteirinha digital
      </span>
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-xs font-medium px-3 py-1.5 backdrop-blur-sm">
        <QrCode size={14} /> PIX &amp; boletos
      </span>
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-xs font-medium px-3 py-1.5 backdrop-blur-sm">
        <Gift size={14} /> Clube de benefícios
      </span>
    </div>
  )
}

/* =================== HERO SLIDER (CAPA EM SLIDES) =================== */

function isExternalHref(href) {
  return /^https?:\/\//i.test(href || '')
}

function HeroCtaButton({ cta }) {
  if (!cta?.to || !cta?.label) return null

  const external = isExternalHref(cta.to)

  const button = (
    <CTAButton
      as="span"
      size="lg"
      className="min-w-[180px] justify-center"
      variant={cta.variant || 'primary'}
    >
      {cta.label}
    </CTAButton>
  )

  if (external) {
    return (
      <a href={cta.to} target="_blank" rel="noopener noreferrer">
        {button}
      </a>
    )
  }

  return <Link to={cta.to}>{button}</Link>
}

function HeroSlider({ slides, mounted }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!slides?.length) return
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % slides.length),
      8000
    )
    return () => clearInterval(id)
  }, [slides])

  if (!slides || slides.length === 0) return null

  const slide = slides[index] || slides[0]
  const {
    tag,
    title,
    subtitle,
    image,
    primary,
    secondary,
    showValuePills,
  } = slide

  const goTo = (i) => {
    if (!slides.length) return
    const size = slides.length
    const next = ((i % size) + size) % size
    setIndex(next)
  }

  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl border border-[var(--c-border)]',
        'mb-10 md:mb-12',
        'transition-all duration-700',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      style={{
        backgroundImage: `
          linear-gradient(
            120deg,
            color-mix(in srgb, var(--primary) 55%, transparent),
            color-mix(in srgb, #000000 40%, transparent)
          ),
          url(${image})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 px-6 py-10 md:px-10 md:py-16 lg:px-16 lg:py-20 text-white">
        <div className="max-w-3xl">
          {tag && (
            <p className="text-[11px] uppercase tracking-[0.24em] mb-2 opacity-85">
              {tag}
            </p>
          )}

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-xl text-sm md:text-base lg:text-lg opacity-90">
              {subtitle}
            </p>
          )}

          {(primary || secondary) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {primary && <HeroCtaButton cta={primary} />}
              {secondary && <HeroCtaButton cta={secondary} />}
            </div>
          )}

          {showValuePills && <ValuePills />}
        </div>

        {/* Controles do slider */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                onClick={() => goTo(i)}
                className={[
                  'h-2.5 rounded-full transition-all duration-300',
                  i === index
                    ? 'w-6 bg-white'
                    : 'w-2.5 bg-white/50 hover:bg-white/80',
                ].join(' ')}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              className="h-8 w-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white text-xs backdrop-blur-sm"
              aria-label="Slide anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="h-8 w-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white text-xs backdrop-blur-sm"
              aria-label="Próximo slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================== HOME ============================== */

export default function Home() {
  const empresa = useTenant((s) => s.empresa)
  const { isAuthenticated, token, user } = useAuth((s) => ({
    isAuthenticated: s.isAuthenticated,
    token: s.token,
    user: s.user,
  }))
  const isLogged = isAuthenticated() || !!token || !!user

  const ANDROID_URL = import.meta.env.VITE_ANDROID_URL || '#'
  const IOS_URL = import.meta.env.VITE_IOS_URL || '#'

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const heroTitleDefault =
    empresa?.heroTitle ||
    empresa?.tema?.heroTitle ||
    'Proteção e tranquilidade para sua família'

  const heroSubtitleDefault =
    empresa?.heroSubtitle ||
    empresa?.tema?.heroSubtitle ||
    'Planos completos de assistência familiar, benefícios exclusivos e atendimento humanizado.'

  const heroImageDefault = useMemo(() => {
    return empresa?.heroImage || empresa?.tema?.heroImage || '/img/hero.png'
  }, [empresa])

  const telefoneDigits = useMemo(() => {
    let tel = empresa?.contato?.telefone || ''
    let digits = String(tel).replace(/\D+/g, '')
    if (!digits) return ''
    if (!digits.startsWith('55')) digits = '55' + digits
    return digits
  }, [empresa])

  const whatsappParceiroHref = useMemo(() => {
    if (!telefoneDigits) return ''
    const msg = encodeURIComponent('Olá! Quero ser parceiro.')
    return `https://wa.me/${telefoneDigits}?text=${msg}`
  }, [telefoneDigits])

  const defaultSlides = useMemo(
    () => [
      {
        id: 'familia',
        tag: 'Assistência familiar & benefícios',
        title: heroTitleDefault,
        subtitle: heroSubtitleDefault,
        image: heroImageDefault,
        primary: {
          label: 'Ver planos agora',
          to: '/planos',
          variant: 'primary',
        },
        secondary: {
          label: 'Área do associado',
          to: isLogged ? '/area' : '/login',
          variant: 'outline-light',
        },
        showValuePills: true,
      },
      {
        id: 'memorial',
        tag: 'Homenagens & lembranças',
        title: 'Visite nosso Memorial Online',
        subtitle:
          'Acompanhe informações das cerimônias, acenda uma vela virtual e deixe sua mensagem de carinho.',
        image: '/img/hero.png',
        primary: {
          label: 'Acessar Memorial',
          to: '/memorial',
          variant: 'primary',
        },
        secondary: null,
        showValuePills: false,
      },
      {
        id: 'parceiros',
        tag: 'Benefícios exclusivos para sua empresa',
        title: 'Seja nosso parceiro premium',
        subtitle:
          'Ofereça condições especiais para nossos associados e fortaleça sua marca com indicações qualificadas.',
        image: '/img/hero.png',
        primary: {
          label: 'Quero ser parceiro(a)',
          to: '/parceiros/inscrever',
          variant: 'primary',
        },
        secondary: whatsappParceiroHref
          ? {
              label: 'Falar com o time',
              to: whatsappParceiroHref,
              variant: 'outline-light',
            }
          : null,
        showValuePills: false,
      },
    ],
    [heroTitleDefault, heroSubtitleDefault, heroImageDefault, isLogged, whatsappParceiroHref]
  )

  const slides = useMemo(() => {
    const tenantSlides =
      empresa?.heroSlides || empresa?.tema?.heroSlides || null

    if (Array.isArray(tenantSlides) && tenantSlides.length > 0) {
      return tenantSlides.map((s, idx) => {
        const image =
          s.image || s.heroImage || heroImageDefault || '/img/hero.png'
        return {
          id: s.id || s.slug || `tenant-slide-${idx}`,
          tag: s.tag || s.pill || s.badge || 'Assistência familiar',
          title: s.title || heroTitleDefault,
          subtitle: s.subtitle || heroSubtitleDefault,
          image,
          primary:
            s.primary ||
            (s.ctaPrimaryTo || s.ctaTo || s.to
              ? {
                  label: s.ctaPrimaryLabel || s.ctaLabel || 'Saiba mais',
                  to: s.ctaPrimaryTo || s.ctaTo || s.to,
                  variant: s.ctaPrimaryVariant || 'primary',
                }
              : null),
          secondary:
            s.secondary ||
            (s.ctaSecondaryTo
              ? {
                  label: s.ctaSecondaryLabel || 'Saiba mais',
                  to: s.ctaSecondaryTo,
                  variant: s.ctaSecondaryVariant || 'outline-light',
                }
              : null),
          showValuePills: s.showValuePills ?? idx === 0,
        }
      })
    }

    return defaultSlides
  }, [
    empresa,
    heroTitleDefault,
    heroSubtitleDefault,
    heroImageDefault,
    defaultSlides,
  ])

  return (
    <section className="section">
      <div className="container-max relative">
        {/* HERO SLIDER WHITELABEL */}
        <HeroSlider slides={slides} mounted={mounted} />

        {/* QUADRO DE AÇÕES */}
        <div
          className="
            relative
            grid
            grid-cols-2      /* mobile */
            sm:grid-cols-2   /* tablet */
            lg:grid-cols-3   /* desktop */
            gap-3 sm:gap-5 lg:gap-6
          "
        >
          <FeatureCard
            icon={<UserSquare2 size={22} strokeWidth={2} />}
            title="Área do Associado"
            desc="Acesse contratos, dependentes e pagamentos."
            to={isLogged ? '/area' : '/login'}
            cta="Acessar área"
            mounted={mounted}
            delay={200}
          />

          <FeatureCard
            icon={<Receipt size={22} strokeWidth={2} />}
            title="Segunda via de Boleto"
            desc="Consulte segunda via de Boletos sem senha."
            to="/contratos"
            cta="Pesquisar"
            mounted={mounted}
            delay={230}
          />

          <FeatureCard
            icon={<Layers size={22} strokeWidth={2} />}
            title="Nossos Planos"
            desc="Conheça nossos Planos. Proteção completa para toda família."
            to="/planos"
            cta="Ver planos"
            mounted={mounted}
            delay={260}
          />

          <FeatureCard
            icon={<Gift size={22} strokeWidth={2} />}
            title="Clube de Benefícios"
            desc="Parceiros com descontos e vantagens para associados."
            to="/beneficios"
            cta="Ver parceiros"
            mounted={mounted}
            delay={290}
          />

          <FeatureCard
            icon={<HeartHandshake size={22} strokeWidth={2} />}
            title="Memorial Online"
            desc="Homenagens interativas com fotos, mensagens e histórias."
            to="/memorial"
            cta="Ver Memorial"
            mounted={mounted}
            delay={320}
          />

          <FeatureCard
            icon={<MessageCircle size={22} strokeWidth={2} />}
            title="Atendimento"
            desc="Encontre nossas unidades e canais de atendimento."
            to="/filiais"
            cta="Ver unidades"
            mounted={mounted}
            delay={350}
          />
        </div>

        {/* APP SECTION */}
        <div
          className={[
            'relative mt-10 md:mt-12 card p-0 overflow-hidden transition-all duration-700',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          ].join(' ')}
          style={{ transitionDelay: '380ms' }}
        >
          <div className="grid md:grid-cols-2">
            <div className="p-6 md:p-8 lg:p-10">
              <h2 className="text-2xl font-extrabold text-[var(--primary)]">
                Baixe nosso aplicativo
              </h2>
              <p className="mt-2 text-[var(--text)]">
                Tenha carteirinha digital, boletos, PIX e benefícios sempre à
                mão. Acompanhe seus contratos e receba notificações de
                vencimentos no celular.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <AppStoreButton
                  href={ANDROID_URL}
                  icon={<Smartphone size={16} />}
                  delay={420}
                >
                  Baixar para Android
                </AppStoreButton>
                <AppStoreButton
                  href={IOS_URL}
                  icon={<Apple size={16} />}
                  delay={450}
                >
                  Baixar para iOS
                </AppStoreButton>
              </div>
              {!import.meta.env.VITE_ANDROID_URL &&
                !import.meta.env.VITE_IOS_URL && (
                  <p className="mt-3 text-xs text-[var(--text)]">
                    * Links das lojas ainda não configurados. Defina{' '}
                    <code>VITE_ANDROID_URL</code> e <code>VITE_IOS_URL</code> no
                    seu <code>.env</code>.
                  </p>
                )}
            </div>
            <div className="bg-[var(--surface)] flex items-center justify-center p-8 lg:p-10">
              <div className="rounded-2xl border bg-[var(--surface)]/70 p-10 text-center shadow-sm">
                <div className="text-sm font-semibold text-[var(--text)]">
                  App do Associado
                </div>
                <div className="mt-1 text-xs text-[var(--text)]">
                  Carteirinha • Pagamentos • Benefícios
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROVA SOCIAL */}
        <StatsStrip associados="12.4k+" parceiros="180+" avaliacao="4.8/5" />

        {/* CTA PLANOS */}
        <div className="mt-12 md:mt-16">
          <PlanosCTA onSeePlans={() => (window.location.href = '/planos')} />
        </div>

        {/* CTA MEMORIAL */}
        <div className="mt-12 md:mt-16">
          <MemorialCTA
            onVisitMemorial={() => (window.location.href = '/memorial')}
          />
        </div>

        {/* CTA PARCEIROS */}
        <div className="mt-12 md:mt-16">
          <ParceirosCTA
            onBecomePartner={() =>
              (window.location.href = '/parceiros/inscrever')
            }
            whatsappHref={whatsappParceiroHref}
          />
        </div>

        {/* FAQ */}
        <div className="faq-dark mt-12 md:mt-16">
          <FaqSection
            isLogged={isLogged}
            areaDest={isLogged ? '/area' : '/login'}
          />
        </div>
      </div>
    </section>
  )
}

/* ================== Botão padronizado das lojas ================== */

function AppStoreButton({ href, icon, children, delay = 0 }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <CTAButton
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      size="lg"
      iconBefore={icon}
      className={[
        'transition-all duration-500',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </CTAButton>
  )
}
