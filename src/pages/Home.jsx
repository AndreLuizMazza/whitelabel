// src/pages/Home.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,

  // ✅ ícones para ValuePills por slide (vindos do tenant JSON)
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

function isExternalHref(href) {
  return /^https?:\/\//i.test(href || '')
}

/* ===================== peças utilitárias ===================== */

function IconBadge({ children }) {
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
      style={{
        background:
          'color-mix(in srgb, var(--primary) 12%, var(--surface) 88%)',
        color: 'var(--primary)',
        border:
          '1px solid color-mix(in srgb, var(--primary) 28%, var(--c-border))',
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

/* ========================================================================
   FEATURE CARD – PREMIUM
   ======================================================================== */

function FeatureCardPremium({ icon, title, desc, to, cta, mounted, delay = 0 }) {
  if (!to) return null

  const isExternal = /^https?:\/\//i.test(to)
  const Wrapper = isExternal ? 'a' : Link
  const wrapperProps = isExternal
    ? { href: to, target: '_blank', rel: 'noopener noreferrer' }
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
          boxShadow:
            '0 1px 0 rgba(0,0,0,.04), 0 10px 30px rgba(15,23,42,.06)',
        }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <IconBadge>{icon}</IconBadge>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold leading-tight">
              {title}
              {isExternal ? (
                <span className="sr-only"> (abre em nova aba)</span>
              ) : null}
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

function ValuePills({ pills }) {
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
  const fallback = [
    { icon: 'IdCard', label: 'Carteirinha digital' },
    { icon: 'QrCode', label: 'PIX & boletos' },
    { icon: 'Gift', label: 'Clube de benefícios' },
  ]

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

/* =================== HERO SLIDER =================== */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = () => setReduced(!!mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    const v =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    setIsTouch(!!v)
  }, [])
  return isTouch
}

function HeroCtaButton({ cta }) {
  if (!cta?.to || !cta?.label) return null
  const external = isExternalHref(cta.to)

  const buttonInner = (
    <CTAButton
      as="span"
      size="lg"
      className="
        min-w-[190px] justify-center rounded-full px-7
        text-sm font-semibold tracking-[0.06em] uppercase
        shadow-[0_18px_45px_rgba(15,23,42,0.55)]
      "
      variant={cta.variant || 'primary'}
    >
      {cta.label}
    </CTAButton>
  )

  const frameStyle = {
    borderRadius: 999,
    padding: '2px',
    background:
      'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.6), transparent 55%), ' +
      'linear-gradient(135deg, color-mix(in srgb,var(--primary) 78%,#ffffff), #020617)',
    display: 'inline-block',
  }

  const innerStyle = {
    borderRadius: 999,
    background:
      'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.16), transparent 60%), ' +
      'color-mix(in srgb, #020617 80%, black)',
  }

  if (external) {
    return (
      <motion.a
        href={cta.to}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={frameStyle}
        aria-label={`${cta.label} (abre em nova aba)`}
      >
        <div style={innerStyle}>{buttonInner}</div>
      </motion.a>
    )
  }

  return (
    <Link to={cta.to} className="inline-block" aria-label={cta.label}>
      <motion.span
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={frameStyle}
      >
        <div style={innerStyle}>{buttonInner}</div>
      </motion.span>
    </Link>
  )
}

function HeroSecondaryButton({ cta }) {
  if (!cta?.to || !cta?.label) return null
  const external = isExternalHref(cta.to)

  const inner = (
    <CTAButton
      as="span"
      size="lg"
      variant={cta.variant || 'outline'}
      className="min-w-[190px] justify-center rounded-full px-7 text-sm font-semibold"
    >
      {cta.label}
    </CTAButton>
  )

  if (external) {
    return (
      <motion.a
        href={cta.to}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        aria-label={`${cta.label} (abre em nova aba)`}
        className="inline-block"
      >
        {inner}
      </motion.a>
    )
  }

  return (
    <Link to={cta.to} className="inline-block" aria-label={cta.label}>
      <motion.span
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {inner}
      </motion.span>
    </Link>
  )
}

function HeroIconButton({ ariaLabel, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="h-9 w-9 rounded-full inline-flex items-center justify-center ring-1 transition active:scale-[0.98]"
      style={{
        background: 'rgba(255,255,255,.10)',
        border: '1px solid rgba(255,255,255,.14)',
        backdropFilter: 'blur(10px)',
        color: 'rgba(255,255,255,.92)',
      }}
    >
      {children}
    </button>
  )
}

function HomeHeroSlideLayer({ slide, isActive, prefersReduced }) {
  const [broken, setBroken] = useState(false)

  // ✅ crítico: imagem mudou -> reseta o broken
  useEffect(() => {
    setBroken(false)
  }, [slide?.image])

  const img = slide?.image
  const finalImg = !broken && img ? img : slide?.fallbackImage

  return (
    <div
      className={[
        'absolute inset-0 transition-opacity duration-700',
        isActive ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-hidden={!isActive}
      style={{ zIndex: isActive ? 1 : 0 }}
    >
      {finalImg ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${finalImg})`,
              backgroundSize: 'cover',
              backgroundPosition: slide?.focus || 'center',
              filter: 'blur(22px) saturate(1.06)',
              transform: 'scale(1.10)',
              opacity: 0.40,
            }}
          />
          <img
            src={finalImg}
            alt={slide?.title || ''}
            className="absolute inset-0 h-full w-full"
            draggable={false}
            loading={isActive ? 'eager' : 'lazy'}
            onError={() => setBroken(true)}
            referrerPolicy="no-referrer"
            style={{
              objectFit: 'cover',
              objectPosition: slide?.focus || 'center',
              filter: 'saturate(1.03) contrast(1.02)',
              transform: prefersReduced ? 'none' : 'scale(1.03)',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px circle at 15% 20%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 55%), ' +
              'radial-gradient(900px circle at 85% 30%, rgba(0,0,0,.10), transparent 60%), ' +
              'linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.06))',
          }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,.64) 0%, rgba(0,0,0,.40) 52%, rgba(0,0,0,.18) 100%)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(900px circle at 12% 30%, rgba(255,255,255,.12), transparent 55%), ' +
            'radial-gradient(900px circle at 85% 15%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 55%)',
          mixBlendMode: 'screen',
          opacity: 0.75,
        }}
      />
    </div>
  )
}

function HeroSlider({ slides, mounted, onActiveSlideChange }) {
  const prefersReduced = usePrefersReducedMotion()
  const isTouch = useIsTouchDevice()

  const safeSlides = useMemo(
    () => (Array.isArray(slides) ? slides.filter(Boolean) : []),
    [slides]
  )
  const hasSlides = safeSlides.length > 0

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  // ✅ FIX: hover/focus precisam ser reativos (useState) para rearmar o timer
  const [isHovering, setIsHovering] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const timeoutRef = useRef(null)

  const startXRef = useRef(null)
  const deltaXRef = useRef(0)

  const next = useCallback(
    () => setIndex((i) => (hasSlides ? (i + 1) % safeSlides.length : 0)),
    [hasSlides, safeSlides.length]
  )
  const prev = useCallback(
    () =>
      setIndex((i) =>
        hasSlides ? (i - 1 + safeSlides.length) % safeSlides.length : 0
      ),
    [hasSlides, safeSlides.length]
  )

  // ✅ reporta slide ativo para o Home (ValuePills por slide)
  useEffect(() => {
    if (!hasSlides) return
    const s = safeSlides[index] || safeSlides[0]
    onActiveSlideChange?.(s)
  }, [hasSlides, safeSlides, index, onActiveSlideChange])

  useEffect(() => {
    clearTimeout(timeoutRef.current)

    if (!hasSlides) return
    if (prefersReduced) return
    if (paused) return
    if (isHovering) return
    if (isFocused) return

    timeoutRef.current = setTimeout(() => next(), 8000)
    return () => clearTimeout(timeoutRef.current)
  }, [index, hasSlides, prefersReduced, paused, isHovering, isFocused, next])

  // preload da próxima
  useEffect(() => {
    if (!hasSlides) return
    const n = safeSlides[(index + 1) % safeSlides.length]
    if (!n?.image) return
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.src = n.image
  }, [hasSlides, safeSlides, index])

  const rootRef = useRef(null)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onKey = (e) => {
      if (!hasSlides) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [hasSlides, next, prev])

  const onPointerDown = (e) => {
    if (!hasSlides || !isTouch) return
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? null
    deltaXRef.current = 0
  }
  const onPointerMove = (e) => {
    if (!hasSlides || !isTouch) return
    if (startXRef.current == null) return
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? startXRef.current
    deltaXRef.current = x - startXRef.current
  }
  const onPointerUp = () => {
    if (!hasSlides || !isTouch) return
    const dx = deltaXRef.current
    startXRef.current = null
    deltaXRef.current = 0
    const threshold = 44
    if (dx > threshold) prev()
    else if (dx < -threshold) next()
  }

  if (!hasSlides) return null
  const slide = safeSlides[index] || safeSlides[0]
  const { tag, title, subtitle, primary, secondary } = slide

  const goTo = (i) => {
    const size = safeSlides.length
    setIndex(((i % size) + size) % size)
  }

  return (
    <section
      ref={rootRef}
      tabIndex={0}
      className={[
        'relative overflow-hidden rounded-3xl ring-1 outline-none',
        'mb-10 md:mb-12',
        'min-h-[260px] md:min-h-[360px] lg:min-h-[420px]',
        'transition-all duration-700',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--c-border)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,.25) inset, 0 18px 60px rgba(15,23,42,.18)',
      }}
      onMouseEnter={() => {
        setIsHovering(true)
        clearTimeout(timeoutRef.current)
      }}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => {
        setIsFocused(true)
        clearTimeout(timeoutRef.current)
      }}
      onBlur={() => setIsFocused(false)}
      onTouchStart={() => isTouch && setPaused(true)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-roledescription="carousel"
      aria-label="Destaques"
    >
      <div className="absolute inset-0 z-0">
        {safeSlides.map((s, i) => (
          <HomeHeroSlideLayer
            key={s.id || i}
            slide={s}
            isActive={i === index}
            prefersReduced={prefersReduced}
          />
        ))}
      </div>

      <div className="relative z-10 px-6 py-10 md:px-10 md:py-16 lg:px-16 lg:py-20 text-white">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={(slide.id || index) + '-content'}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
            <div className="max-w-3xl">
              {tag && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.24em] ring-1"
                  style={{
                    background: 'rgba(255,255,255,.10)',
                    border: '1px solid rgba(255,255,255,.14)',
                    backdropFilter: 'blur(10px)',
                    color: 'rgba(255,255,255,.92)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--primary)' }}
                    aria-hidden="true"
                  />
                  <span>{String(tag).toUpperCase()}</span>
                </div>
              )}

              <h1
                className="mt-3 text-3xl md:text-5xl lg:text-6xl font-black tracking-tight"
                style={{ textShadow: '0 10px 34px rgba(0,0,0,.35)' }}
              >
                {title}
              </h1>

              {subtitle && (
                <p
                  className="mt-4 max-w-xl text-sm md:text-base lg:text-lg"
                  style={{
                    opacity: 0.92,
                    textShadow: '0 6px 22px rgba(0,0,0,.28)',
                  }}
                >
                  {subtitle}
                </p>
              )}

              {(primary || secondary) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <HeroCtaButton cta={primary} />
                  <HeroSecondaryButton cta={secondary} />
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Slides"
              >
                {safeSlides.map((s, i) => {
                  const active = i === index
                  return (
                    <button
                      key={s.id || i}
                      type="button"
                      onClick={() => goTo(i)}
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: active ? 28 : 10,
                        background: active
                          ? 'rgba(255,255,255,.92)'
                          : 'rgba(255,255,255,.42)',
                        boxShadow: active ? '0 0 0 1px rgba(0,0,0,.20)' : 'none',
                      }}
                      aria-label={`Slide ${i + 1}`}
                      aria-current={active ? 'true' : 'false'}
                    />
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <HeroIconButton ariaLabel="Slide anterior" onClick={prev}>
                  <ChevronLeft className="h-4 w-4" />
                </HeroIconButton>

                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="h-9 px-3 rounded-full inline-flex items-center justify-center gap-2 ring-1 transition active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,.10)',
                    border: '1px solid rgba(255,255,255,.14)',
                    backdropFilter: 'blur(10px)',
                    color: 'rgba(255,255,255,.92)',
                  }}
                  aria-label={paused ? 'Reproduzir' : 'Pausar'}
                >
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span className="text-xs font-semibold">
                    {paused ? 'Play' : 'Pause'}
                  </span>
                </button>

                <HeroIconButton ariaLabel="Próximo slide" onClick={next}>
                  <ChevronRight className="h-4 w-4" />
                </HeroIconButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'rgba(255,255,255,.14)' }}
      />
    </section>
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
      empresa?.heroImage || empresa?.tema?.heroImage || HERO_FALLBACKS[0]
    return safeUrl(resolveAssetUrl(raw, assetsBase))
  }, [empresa, assetsBase])

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

  const defaultSlides = useMemo(
    () => [
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
    ],
    [heroTitleDefault, heroSubtitleDefault, heroImageDefault]
  )

  const slides = useMemo(() => {
    const tenantSlides = empresa?.heroSlides || empresa?.tema?.heroSlides || null

    if (Array.isArray(tenantSlides) && tenantSlides.length > 0) {
      return tenantSlides.map((s, i) => {
        const fb = HERO_FALLBACKS[i % HERO_FALLBACKS.length]
        const rawImg =
          s.image || s.heroImage || (i === 0 ? heroImageDefault : fb)

        const resolved = safeUrl(resolveAssetUrl(rawImg, assetsBase))

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
    }

    return defaultSlides
  }, [
    empresa,
    heroTitleDefault,
    heroSubtitleDefault,
    defaultSlides,
    assetsBase,
    heroImageDefault,
  ])

  // ✅ ValuePills por slide (showValuePills)
  const [activeSlide, setActiveSlide] = useState(null)
  const showPills = activeSlide?.showValuePills !== false
  const pills = activeSlide?.valuePills || null

  return (
    <section className="section">
      <div className="container-max relative">
        <HeroSlider slides={slides} mounted={mounted} onActiveSlideChange={setActiveSlide} />

        {showPills && (
          <div
            className={[
              'mt-6 mb-10 md:mb-12 transition-all duration-700',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            ].join(' ')}
            style={{ transitionDelay: '150ms' }}
          >
            <ValuePills pills={pills} />
          </div>
        )}

        <div className="relative grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          <FeatureCardPremium
            icon={<UserSquare2 size={22} strokeWidth={2} />}
            title="Área do Associado"
            desc="Acesse contratos, dependentes e pagamentos."
            to={isLogged ? '/area' : '/login'}
            cta="Acessar área"
            mounted={mounted}
            delay={200}
          />

          {!inCapacitorApp && (
            <FeatureCardPremium
              icon={<Receipt size={22} strokeWidth={2} />}
              title="Segunda via de Boleto"
              desc="Consulte boletos sem senha."
              to="/contratos"
              cta="Pesquisar"
              mounted={mounted}
              delay={230}
            />
          )}

          <FeatureCardPremium
            icon={<Layers size={22} strokeWidth={2} />}
            title="Nossos Planos"
            desc="Proteção completa para toda a família."
            to="/planos"
            cta="Ver planos"
            mounted={mounted}
            delay={260}
          />

          {!inCapacitorApp && (
            <FeatureCardPremium
              icon={<Gift size={22} strokeWidth={2} />}
              title="Clube de Benefícios"
              desc="Parceiros com descontos e vantagens."
              to="/beneficios"
              cta="Ver parceiros"
              mounted={mounted}
              delay={290}
            />
          )}

          <FeatureCardPremium
            icon={<HeartHandshake size={22} strokeWidth={2} />}
            title="Memorial Online"
            desc="Homenagens interativas e informações das cerimônias."
            to="/memorial"
            cta="Ver Memorial"
            mounted={mounted}
            delay={320}
          />

          <FeatureCardPremium
            icon={<MessageCircle size={22} strokeWidth={2} />}
            title="Atendimento"
            desc="Encontre nossas unidades e canais de atendimento."
            to="/filiais"
            cta="Ver unidades"
            mounted={mounted}
            delay={350}
          />
        </div>

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

        <div className="mt-12 md:mt-16">
          <PlanosCTA onSeePlans={() => (window.location.href = '/planos')} />
        </div>

        <div className="mt-12 md:mt-16">
          <MemorialCTA onVisitMemorial={() => (window.location.href = '/memorial')} />
        </div>

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
