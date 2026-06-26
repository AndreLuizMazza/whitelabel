// src/pages/Home.jsx
import { useEffect, useState, useMemo, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import useTenant from '@/store/tenant'
import useAuth from '@/store/auth'
import {
  isBeneficiosEnabled,
  isMemorialEnabled,
  isSlideHiddenByModuleFlags,
} from '@/lib/tenantModules'

import MemorialCTA from '@/components/MemorialCTA'
import ParceirosCTA from '@/components/ParceirosCTA'
import FaqSection from '@/components/faq/FaqSection.jsx'
import PublicQuickAccessGrid from '@/components/public/PublicQuickAccessGrid.jsx'
import PublicHeroSection from '@/components/public/PublicHeroSection.jsx'
import PublicPlansPreview from '@/components/public/PublicPlansPreview.jsx'
import PublicClubePreview from '@/components/public/PublicClubePreview.jsx'
import PublicHowItWorks from '@/components/public/PublicHowItWorks.jsx'
import PublicTrustStrip from '@/components/public/PublicTrustStrip.jsx'

import CTAButton from '@/components/ui/CTAButton'
import {
  Smartphone,
  Apple,
  IdCard,
  QrCode,
  Gift,
  MessageCircle,
  HeartHandshake,
  ShieldCheck,
  Users,
  Clock,
  Percent,
  Store,
  Wallet,
  Video,
  HeartPulse,
  PawPrint,
  Heart,
  Smile,
  BookHeart,
  Globe,
} from 'lucide-react'
import { resolveContractAssetUrl } from '@/lib/branding/tenantContract'
import { getTenantContract } from '@/lib/tenantContent'
import {
  subscribeBrandingRevision,
  getBrandingRevisionSnapshot,
} from '@/boot/brandingSync'

/* ===================== constantes de imagem ===================== */

const HERO_FALLBACKS = ['/img/hero.png', '/img/hero1.png', '/img/hero2.png']

/* ===================== runtime (Capacitor) ===================== */

function isCapacitorRuntime() {
  if (typeof window === 'undefined') return false
  const cap = window.Capacitor
  if (!cap) return false
  if (typeof cap.isNativePlatform === 'function') return !!cap.isNativePlatform()
  if (typeof cap.getPlatform === 'function') return cap.getPlatform() !== 'web'
  return true
}

/* ===================== URL / ASSETS (robusto) ===================== */

function normalizeBase(base) {
  const b = String(base || '').trim()
  if (!b) return ''
  return b.endsWith('/') ? b : b + '/'
}

function cleanUrlInput(v) {
  let s = String(v || '').trim()
  if (!s) return ''
  s = s.replace(/^"+/, '').replace(/"+$/, '')
  s = s.replace(/^'+/, '').replace(/'+$/, '')
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '')
  return s.trim()
}

function resolveAssetUrl(input, base) {
  const raw = cleanUrlInput(input)
  if (!raw) return ''

  if (/^(https?:)?\/\//i.test(raw)) return raw
  if (/^(data|blob):/i.test(raw)) return raw

  try {
    if (raw.startsWith('/')) {
      const origin =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : 'http://localhost'
      return new URL(raw, origin).toString()
    }

    const b = normalizeBase(base)
    if (b) return new URL(raw, b).toString()

    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost'
    return new URL('/' + raw.replace(/^\/+/, ''), origin).toString()
  } catch {
    if (raw.startsWith('/')) return raw
    return base ? normalizeBase(base) + raw.replace(/^\/+/, '') : '/' + raw.replace(/^\/+/, '')
  }
}

function safeUrl(u) {
  const s0 = cleanUrlInput(u)
  if (!s0) return ''
  return s0.replace(/ /g, '%20')
}

/** CDN tenant: path relativo + ?v={assetsRevision}; absoluto/local inalterado. */
function resolveTenantHeroUrl(raw, contract, assetsBaseFallback) {
  const r = cleanUrlInput(raw)
  if (!r) return ''
  if (/^(https?:)?\/\//i.test(r) || /^(data|blob):/i.test(r)) return safeUrl(r)
  if (r.startsWith('/')) return safeUrl(r)

  const t = contract || getTenantContract()
  if (t) return safeUrl(resolveContractAssetUrl(t, r))
  return safeUrl(resolveAssetUrl(r, assetsBaseFallback))
}

/* ===================== peças utilitárias ===================== */

/* ========================================================================
   VALUE PILLS – PREMIUM (por slide)
   ======================================================================== */

const PILL_ICONS = {
  ShieldCheck,
  Users,
  Clock,
  Percent,
  Store,
  Wallet,
  Video,
  HeartPulse,
  PawPrint,
  Heart,
  Smile,
  BookHeart,
  Globe,
  IdCard,
  QrCode,
  Gift,
  MessageCircle,
  HeartHandshake,
}

function ValuePills({ pills, includeClubeFallbackPill = true }) {
  const pillBase =
    'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs font-medium ' +
    'backdrop-blur-md transition-all tracking-wide border'

  const pillStyle = {
    background:
      'color-mix(in srgb, var(--primary) 8%, var(--surface) 92%)',
    color: 'var(--text)',
    borderColor:
      'color-mix(in srgb, var(--primary) 26%, var(--c-border) 74%)',
    boxShadow: '0 10px 30px rgba(15,23,42,0.10)',
  }

  const safe = Array.isArray(pills) ? pills.filter(Boolean) : []

  // ✅ fallback se tenant ainda não mandar valuePills
  let fallback = [
    { icon: 'IdCard', label: 'Carteirinha digital' },
    { icon: 'QrCode', label: 'PIX & boletos' },
    { icon: 'Gift', label: 'Clube de benefícios' },
  ]
  if (!includeClubeFallbackPill) {
    fallback = fallback.filter((p) => p.icon !== 'Gift')
  }

  const list = safe.length ? safe : fallback

  return (
    <div className="flex flex-wrap gap-2" aria-label="Recursos em destaque">
      {list.map((p, idx) => {
        const Icon = PILL_ICONS[p?.icon] || IdCard
        const label = String(p?.label || '').trim() || 'Benefício'
        return (
          <span key={`${p?.icon || 'i'}-${idx}`} className={pillBase} style={pillStyle}>
            <Icon size={13} /> {label}
          </span>
        )
      })}
    </div>
  )
}

/* ============================== HOME ============================== */

export default function Home() {
  const empresa = useTenant((s) => s.empresa)
  const brandingRevision = useSyncExternalStore(
    subscribeBrandingRevision,
    getBrandingRevisionSnapshot,
    () => 0
  )
  const tenantContract = getTenantContract()
  const isLogged = useAuth((s) => s.isLoggedIn())
  const location = useLocation()

  const ANDROID_URL = import.meta.env.VITE_ANDROID_URL || '#'
  const IOS_URL = import.meta.env.VITE_IOS_URL || '#'

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const inCapacitorApp = useMemo(() => isCapacitorRuntime(), [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (inCapacitorApp) document.documentElement.dataset.embedded = 'capacitor'
    else delete document.documentElement.dataset.embedded
  }, [inCapacitorApp])

  useEffect(() => {
    if (location.hash === '#faq') {
      const el = document.getElementById('home-faq')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location])

  // ✅ base pública para assets do tenant (do JSON)
  const assetsBase = useMemo(() => {
    const t = empresa?.tema || {}
    return (
      t.assetsBaseUrl ||
      t.cdnBaseUrl ||
      t.assetBase ||
      empresa?.assetsBaseUrl ||
      empresa?.tema?.assetsBaseUrl ||
      ''
    )
  }, [empresa])

  const heroTitleDefault =
    empresa?.heroTitle ||
    empresa?.tema?.heroTitle ||
    'Proteção e tranquilidade para sua família'

  const heroSubtitleDefault =
    empresa?.heroSubtitle ||
    empresa?.tema?.heroSubtitle ||
    'Planos completos de assistência familiar, benefícios exclusivos e atendimento humanizado.'

  // ✅ heroImageDefault agora resolve relativo via assetsBaseUrl e sanitiza URL
  const heroImageDefault = useMemo(() => {
    const raw =
      tenantContract?.heroImage ||
      empresa?.heroImage ||
      empresa?.tema?.heroImage ||
      HERO_FALLBACKS[0]
    return resolveTenantHeroUrl(raw, tenantContract, assetsBase) || HERO_FALLBACKS[0]
  }, [empresa, assetsBase, tenantContract, brandingRevision])

  const telefoneDigits = useMemo(() => {
    let t = empresa?.contato?.telefone || ''
    let digits = String(t).replace(/\D+/g, '')
    if (!digits) return ''
    if (!digits.startsWith('55')) digits = '55' + digits
    return digits
  }, [empresa])

  const whatsappParceiroHref = useMemo(() => {
    if (!telefoneDigits) return ''
    const msg = encodeURIComponent('Olá! Quero ser parceiro.')
    return `https://wa.me/${telefoneDigits}?text=${msg}`
  }, [telefoneDigits])

  const defaultSlides = useMemo(() => {
    const all = [
      {
        id: 'familia',
        tag: 'Assistência familiar & benefícios',
        title: heroTitleDefault,
        subtitle: heroSubtitleDefault,
        image: heroImageDefault || HERO_FALLBACKS[0],
        fallbackImage: HERO_FALLBACKS[0],
        primary: { label: 'Ver planos agora', to: '/planos', variant: 'primary' },
        secondary: null,
        focus: 'center',
        showValuePills: true,
        valuePills: null,
      },
      {
        id: 'memorial',
        tag: 'Homenagens & lembranças',
        title: 'Visite nosso Memorial Online',
        subtitle:
          'Acompanhe informações das cerimônias, acenda uma vela virtual e deixe sua mensagem de carinho.',
        image: HERO_FALLBACKS[1],
        fallbackImage: HERO_FALLBACKS[1],
        primary: { label: 'Acessar Memorial', to: '/memorial', variant: 'primary' },
        secondary: null,
        focus: 'center',
        showValuePills: false,
        valuePills: null,
      },
      {
        id: 'parceiros',
        tag: 'Benefícios exclusivos',
        title: 'Seja nosso parceiro premium',
        subtitle:
          'Ofereça condições especiais para nossos associados e fortaleça sua marca.',
        image: HERO_FALLBACKS[2],
        fallbackImage: HERO_FALLBACKS[2],
        primary: {
          label: 'Quero ser parceiro(a)',
          to: '/parceiros/inscrever',
          variant: 'primary',
        },
        secondary: null,
        focus: 'center',
        showValuePills: false,
        valuePills: null,
      },
    ]
    return all.filter((s) => {
      if (s.id === 'memorial') return isMemorialEnabled(empresa)
      return true
    })
  }, [heroTitleDefault, heroSubtitleDefault, heroImageDefault, empresa])

  const slides = useMemo(() => {
    const tenantSlides =
      tenantContract?.heroSlides ||
      empresa?.heroSlides ||
      empresa?.tema?.heroSlides ||
      null

    if (Array.isArray(tenantSlides) && tenantSlides.length > 0) {
      const mapped = tenantSlides
        .map((s, i) => {
          const fb = HERO_FALLBACKS[i % HERO_FALLBACKS.length]
          const rawImg =
            s.image || s.heroImage || (i === 0 ? heroImageDefault : fb)

          const resolved =
            resolveTenantHeroUrl(rawImg, tenantContract, assetsBase) || fb

          return {
            id: s.id || i,
            tag: s.tag || s.pill || s.badge || 'Assistência familiar',
            title: s.title || heroTitleDefault,
            subtitle: s.subtitle || heroSubtitleDefault,
            image: resolved || fb,
            fallbackImage: fb,
            primary: s.primary || null,
            secondary: s.secondary || null,
            focus: s.focus || s.objectPosition || 'center',
            showValuePills:
              typeof s.showValuePills === 'boolean' ? s.showValuePills : true,

            // ✅ NOVO: ValuePills por slide (do JSON do tenant)
            valuePills: Array.isArray(s.valuePills) ? s.valuePills : null,
          }
        })
        .filter((slide) => !isSlideHiddenByModuleFlags(slide, empresa))
      if (mapped.length > 0) return mapped
    }

    return defaultSlides
  }, [
    empresa,
    heroTitleDefault,
    heroSubtitleDefault,
    defaultSlides,
    assetsBase,
    heroImageDefault,
    tenantContract,
    brandingRevision,
  ])

  // ✅ ValuePills por slide (showValuePills)
  const [activeSlide, setActiveSlide] = useState(null)
  const showPills = activeSlide?.showValuePills !== false
  const pills = activeSlide?.valuePills || null

  return (
    <>
      <PublicHeroSection
        slides={slides}
        mounted={mounted}
        onActiveSlideChange={setActiveSlide}
      />

      <section className="section">
        <div className="container-max relative">
          {showPills && (
            <div
              className={[
                '-mt-6 md:-mt-8 mb-10 md:mb-12 transition-all duration-700',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
              ].join(' ')}
              style={{ transitionDelay: '150ms' }}
            >
              <ValuePills
                pills={pills}
                includeClubeFallbackPill={isBeneficiosEnabled(empresa)}
              />
            </div>
          )}

          <div className={showPills ? 'mt-10 md:mt-12' : ''}>
            <PublicQuickAccessGrid
              empresa={empresa}
              isLogged={isLogged}
              inCapacitorApp={inCapacitorApp}
              mounted={mounted}
            />
          </div>

          <PublicTrustStrip />

          <PublicPlansPreview mounted={mounted} />

          {isBeneficiosEnabled(empresa) && (
            <PublicClubePreview empresa={empresa} mounted={mounted} isLogged={isLogged} />
          )}

          <PublicHowItWorks mounted={mounted} />

        {!inCapacitorApp && (
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
                  Tenha carteirinha digital, boletos, PIX e benefícios sempre à mão.
                  Receba notificações e acompanhe seus contratos.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <AppStoreButton
                    href={ANDROID_URL}
                    icon={<Smartphone size={16} />}
                    delay={420}
                  >
                    Baixar para Android
                  </AppStoreButton>

                  <AppStoreButton href={IOS_URL} icon={<Apple size={16} />} delay={450}>
                    Baixar para iOS
                  </AppStoreButton>
                </div>
              </div>

              <div className="bg-[var(--surface)] flex items-center justify-center p-8 lg:p-10">
                <div
                  className="rounded-2xl border bg-[var(--surface)]/70 p-10 text-center shadow-sm"
                  style={{
                    boxShadow:
                      '0 1px 0 rgba(255,255,255,.65) inset, 0 18px 50px rgba(15,23,42,.08)',
                  }}
                >
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
        )}

        {isMemorialEnabled(empresa) && (
          <div className="mt-12 md:mt-16">
            <MemorialCTA onVisitMemorial={() => (window.location.href = '/memorial')} />
          </div>
        )}

        {!inCapacitorApp && (
          <div className="mt-12 md:mt-16">
            <ParceirosCTA
              onBecomePartner={() => (window.location.href = '/parceiros/inscrever')}
              whatsappHref={whatsappParceiroHref}
            />
          </div>
        )}

        <div className="faq-dark mt-12 md:mt-16" id="home-faq">
          <FaqSection isLogged={isLogged} areaDest={isLogged ? '/area' : '/login'} />
        </div>
        </div>
      </section>
    </>
  )
}

/* ================== Botão das lojas ================== */

function AppStoreButton({ href, icon, children, delay = 0 }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const disabled = !href || href === '#'

  return (
    <CTAButton
      as="a"
      href={disabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      size="lg"
      iconBefore={icon}
      aria-disabled={disabled ? 'true' : 'false'}
      className={[
        'transition-all duration-500',
        disabled ? 'opacity-60 pointer-events-none' : '',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </CTAButton>
  )
}
