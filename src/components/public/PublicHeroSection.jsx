import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CTAButton from '@/components/ui/CTAButton'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

function isExternalHref(href) {
  return /^https?:\/\//i.test(href || '')
}

function isHomeHashHref(href) {
  return /^\/#\w/.test(String(href || '').trim())
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
  const hashHome = isHomeHashHref(cta.to)
  const variant = cta.variant === 'outline' || cta.variant === 'ghost' ? cta.variant : 'primary'

  const button = (
    <CTAButton
      as="span"
      size="lg"
      tone="onDark"
      variant={variant}
      className="min-w-[190px] justify-center px-7 text-sm font-bold tracking-[0.05em] uppercase"
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
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-block"
        aria-label={`${cta.label} (abre em nova aba)`}
      >
        {button}
      </motion.a>
    )
  }

  if (hashHome) {
    return (
      <motion.a
        href={cta.to}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-block"
        aria-label={cta.label}
      >
        {button}
      </motion.a>
    )
  }

  return (
    <Link to={cta.to} className="inline-block" aria-label={cta.label}>
      <motion.span
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-block"
      >
        {button}
      </motion.span>
    </Link>
  )
}

function HeroSecondaryButton({ cta }) {
  if (!cta?.to || !cta?.label) return null
  const external = isExternalHref(cta.to)
  const variant = cta.variant === 'primary' ? 'primary' : 'outline'

  const button = (
    <CTAButton
      as="span"
      size="lg"
      tone="onDark"
      variant={variant}
      className="min-w-[190px] justify-center px-7 text-sm font-semibold"
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
        {button}
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
        className="inline-block"
      >
        {button}
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
            key={finalImg}
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

function HeroSlider({ slides, mounted, onActiveSlideChange, fullBleed = false, valuePills = null }) {
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
  const slideAnnouncement = [tag, title].filter(Boolean).join(' — ')

  const goTo = (i) => {
    const size = safeSlides.length
    setIndex(((i % size) + size) % size)
  }

  return (
    <section
      ref={rootRef}
      tabIndex={0}
      className={[
        'relative overflow-hidden outline-none',
        fullBleed
          ? 'w-full min-h-[300px] md:min-h-[440px] lg:min-h-[520px] rounded-none'
          : 'rounded-3xl ring-1 mb-10 md:mb-12 min-h-[260px] md:min-h-[360px] lg:min-h-[420px]',
        'public-home-enter',
        mounted ? 'is-mounted' : '',
      ].join(' ')}
      style={
        fullBleed
          ? undefined
          : {
              background: 'var(--surface)',
              border: '1px solid var(--c-border)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,.25) inset, 0 18px 60px rgba(15,23,42,.18)',
            }
      }
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
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {slideAnnouncement}
      </div>
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

            <div className="mt-5 md:mt-6 flex items-center justify-between gap-4 pb-0.5">
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
                      role="tab"
                      onClick={() => goTo(i)}
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: active ? 28 : 10,
                        background: active
                          ? 'rgba(255,255,255,.92)'
                          : 'rgba(255,255,255,.42)',
                        boxShadow: active ? '0 0 0 1px rgba(0,0,0,.20)' : 'none',
                      }}
                      aria-label={`Slide ${i + 1}: ${s.title || 'Destaque'}`}
                      aria-selected={active}
                      tabIndex={active ? 0 : -1}
                    />
                  )
                })}
              </div>

              <div className="hero-carousel-controls">
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
                  <span className="text-xs font-semibold hidden lg:inline">
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

      {valuePills ? (
        <div
          className="relative z-10 border-t"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.42))',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="container-max py-3.5 md:py-4">{valuePills}</div>
        </div>
      ) : null}

      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'rgba(255,255,255,.14)' }}
      />
    </section>
  )
}
export default function PublicHeroSection({ slides, mounted, onActiveSlideChange, valuePills = null }) {
  return (
    <HeroSlider
      slides={slides}
      mounted={mounted}
      onActiveSlideChange={onActiveSlideChange}
      fullBleed
      valuePills={valuePills}
    />
  )
}
