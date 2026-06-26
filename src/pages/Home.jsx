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

import FaqSection from '@/components/faq/FaqSection.jsx'
import PublicQuickAccessGrid from '@/components/public/PublicQuickAccessGrid.jsx'
import PublicHeroSection from '@/components/public/PublicHeroSection.jsx'
import PublicPlansPreview from '@/components/public/PublicPlansPreview.jsx'
import PublicClubePreview from '@/components/public/PublicClubePreview.jsx'
import PublicHowItWorks from '@/components/public/PublicHowItWorks.jsx'
import PublicAppDownloadSection from '@/components/public/PublicAppDownloadSection.jsx'
import PublicHomeExternalLinkSection from '@/components/public/PublicHomeExternalLinkSection.jsx'
import ParceirosCTA from '@/components/ParceirosCTA.jsx'
import HeroValuePills from '@/components/public/HeroValuePills.jsx'
import PublicHomeBand from '@/components/public/PublicHomeBand.jsx'
import { resolveBrandDisplayName, resolveContractAssetUrl } from '@/lib/branding/tenantContract'
import { getHomeHeroValuePillsFallback, getHomeExternalLinkSections, getTenantContract } from '@/lib/tenantContent'
import {
  subscribeBrandingRevision,
  getBrandingRevisionSnapshot,
} from '@/boot/brandingSync'
import {
  normalizePartnerSlidePrimary,
  resolvePartnerPrimaryCta,
  PARTNER_HOME_SECTION_ID,
} from '@/lib/partnerFunnel'

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

  const appDisplayName = useMemo(
    () => resolveBrandDisplayName(tenantContract, empresa) || 'App do Associado',
    [tenantContract, empresa]
  )

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
    const hash = location.hash?.replace(/^#/, '')
    if (hash === 'faq') {
      const el = document.getElementById('home-faq')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (hash === PARTNER_HOME_SECTION_ID) {
      const el = document.getElementById(PARTNER_HOME_SECTION_ID)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location])

  useEffect(() => {
    if (inCapacitorApp) return
    const idle =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb) => setTimeout(cb, 1200)
    const cancel =
      typeof cancelIdleCallback === 'function' ? cancelIdleCallback : clearTimeout
    const id = idle(() => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = '/planos'
      document.head.appendChild(link)
    })
    return () => cancel(id)
  }, [inCapacitorApp])

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
        primary: resolvePartnerPrimaryCta(empresa),
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
            primary: normalizePartnerSlidePrimary(s.primary, s.id || i, empresa),
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

  const heroPillsFallback = useMemo(
    () => getHomeHeroValuePillsFallback(tenantContract),
    [tenantContract, brandingRevision]
  )

  const externalLinkSections = useMemo(
    () => getHomeExternalLinkSections(tenantContract),
    [tenantContract, brandingRevision]
  )

  // ✅ ValuePills por slide (showValuePills)
  const [activeSlide, setActiveSlide] = useState(null)
  const showPills = activeSlide?.showValuePills !== false
  const pills = activeSlide?.valuePills || heroPillsFallback

  return (
    <>
      <PublicHeroSection
        slides={slides}
        mounted={mounted}
        onActiveSlideChange={setActiveSlide}
        valuePills={
          showPills ? (
            <HeroValuePills
              pills={pills}
              includeClubeFallbackPill={isBeneficiosEnabled(empresa)}
            />
          ) : null
        }
      />

      <PublicHomeBand variant="command" compactTop>
        <PublicQuickAccessGrid
          empresa={empresa}
          isLogged={isLogged}
          inCapacitorApp={inCapacitorApp}
          mounted={mounted}
          compact
        />
      </PublicHomeBand>

      <PublicHomeBand variant="soft">
        <PublicPlansPreview mounted={mounted} />
      </PublicHomeBand>

      {isBeneficiosEnabled(empresa) ? (
        <PublicHomeBand variant="default">
          <PublicClubePreview empresa={empresa} mounted={mounted} isLogged={isLogged} />
        </PublicHomeBand>
      ) : null}

      <PublicHomeBand variant="muted" className="public-home-band--section-close">
        <PublicHowItWorks mounted={mounted} />
      </PublicHomeBand>

      {externalLinkSections.map((section, index) => (
        <PublicHomeBand
          key={section.id}
          variant={section.band}
          className={
            index === 0 && externalLinkSections.length > 0
              ? 'public-home-band--section-open'
              : ''
          }
        >
          <PublicHomeExternalLinkSection section={section} mounted={mounted} />
        </PublicHomeBand>
      ))}

      {!inCapacitorApp ? (
        <PublicHomeBand variant="soft" className="public-home-band--section-open public-home-band--cta-lead">
          <ParceirosCTA mounted={mounted} />
        </PublicHomeBand>
      ) : null}

      {!inCapacitorApp ? (
        <PublicHomeBand variant="command" className="public-home-band--cta-follow">
          <PublicAppDownloadSection mounted={mounted} appName={appDisplayName} />
        </PublicHomeBand>
      ) : null}

      <PublicHomeBand variant="inset" id="home-faq" className="faq-dark">
        <FaqSection isLogged={isLogged} areaDest={isLogged ? '/area' : '/login'} embedded />
      </PublicHomeBand>
    </>
  )
}
