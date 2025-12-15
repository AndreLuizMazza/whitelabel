// src/pages/CarteirinhaPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, X, Maximize2, RotateCw, Compass, Check } from 'lucide-react'
import { showToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'

/* simples helper para skeleton */
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.(query)?.matches ?? false
  })

  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatches(!!e.matches)
    mq.addEventListener?.('change', onChange)
    mq.addListener?.(onChange)
    return () => {
      mq.removeEventListener?.('change', onChange)
      mq.removeListener?.(onChange)
    }
  }, [query])

  return matches
}

/**
 * Debounce de orientação para evitar “oscilações” (piscadas) no fullscreen.
 * Só assume a nova orientação se ficar estável por X ms.
 */
function useStableBool(value, ms = 220) {
  const [stable, setStable] = useState(value)
  const tRef = useRef(null)

  useEffect(() => {
    if (value === stable) return
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(() => {
      setStable(value)
      tRef.current = null
    }, ms)
    return () => {
      if (tRef.current) clearTimeout(tRef.current)
    }
  }, [value, ms, stable])

  return stable
}

export default function CarteirinhaPage() {
  const user = useAuth((s) => s.user)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isLandscapeMQ = useMediaQuery('(orientation: landscape)')

  // ✅ orientação estável (para AUTO)
  const isLandscapeStable = useStableBool(isLandscapeMQ, 220)

  const cpf =
    user?.cpf ||
    user?.documento ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || '{}').cpf
      } catch {
        return ''
      }
    })() ||
    ''

  const { contrato, loading, erro } = useContratoDoUsuario({ cpf })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Associado(a)',
    [user]
  )

  /* revelação de CPF */
  const [cpfReveal, setCpfReveal] = useState(false)
  const [cpfSeconds, setCpfSeconds] = useState(0)
  const timerRef = useRef(null)
  const tickRef = useRef(null)

  function startReveal10s() {
    if (!cpf) return
    setCpfReveal(true)
    setCpfSeconds(10)
    showToast('CPF visível por 10 segundos.', null, null, 3500)

    tickRef.current && clearInterval(tickRef.current)
    tickRef.current = setInterval(
      () => setCpfSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000
    )

    timerRef.current && clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCpfReveal(false)
      setCpfSeconds(0)
      clearInterval(tickRef.current)
      tickRef.current = null
      showToast('CPF ocultado novamente.')
    }, 10000)
  }

  useEffect(
    () => () => {
      timerRef.current && clearTimeout(timerRef.current)
      tickRef.current && clearInterval(tickRef.current)
    },
    []
  )

  useEffect(() => {
    if (erro) showToast('Não foi possível carregar os dados do contrato para a carteirinha.')
  }, [erro])

  const printableState = contrato && user ? { user, contrato, side: 'both' } : null

  // ===== Fullscreen =====
  const [fsOpen, setFsOpen] = useState(false)

  // Rotação: auto | portrait | landscape
  const [rotationLock, setRotationLock] = useState('auto')

  // ✅ Correção do “1 clique” + usando orientação estável
  function nextRotationLock() {
    setRotationLock((v) => {
      if (v === 'auto') return isLandscapeStable ? 'portrait' : 'landscape'
      if (v === 'portrait') return 'landscape'
      return 'auto'
    })
  }

  // ✅ effectiveOrientation: se travado, ignora MQ (sem oscilação)
  const effectiveOrientation =
    rotationLock === 'auto'
      ? isLandscapeStable
        ? 'landscape'
        : 'portrait'
      : rotationLock

  // Tilt (giroscópio)
  const [tiltOn, setTiltOn] = useState(true)
  const [tiltAllowed, setTiltAllowed] = useState(false)
  const [tiltNeedsPermission, setTiltNeedsPermission] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasDeviceOrientation = typeof window.DeviceOrientationEvent !== 'undefined'
    if (!hasDeviceOrientation) {
      setTiltNeedsPermission(false)
      setTiltAllowed(false)
      return
    }
    const needs = typeof window.DeviceOrientationEvent?.requestPermission === 'function'
    setTiltNeedsPermission(needs)
    setTiltAllowed(!needs)
  }, [])

  async function requestTiltPermissionIfNeeded() {
    try {
      const fn = window?.DeviceOrientationEvent?.requestPermission
      if (typeof fn !== 'function') {
        setTiltAllowed(true)
        return true
      }
      const res = await fn.call(window.DeviceOrientationEvent)
      const ok = String(res).toLowerCase() === 'granted'
      setTiltAllowed(ok)
      if (!ok) showToast('Permissão de movimento negada.')
      return ok
    } catch {
      setTiltAllowed(false)
      showToast('Não foi possível ativar o movimento neste dispositivo.')
      return false
    }
  }

  async function toggleTilt() {
    if (!tiltOn) {
      if (tiltNeedsPermission && !tiltAllowed) {
        const ok = await requestTiltPermissionIfNeeded()
        if (!ok) return
      }
      setTiltOn(true)
      showToast('Movimento ativado.')
    } else {
      setTiltOn(false)
      showToast('Movimento desativado.')
    }
  }

  useEffect(() => {
    if (!fsOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [fsOpen])

  function openFullscreen() {
    if (!contrato || !user) return
    setFsOpen(true)
  }
  function closeFullscreen() {
    setFsOpen(false)
  }

  // ===== UI helpers (legibilidade premium) =====
  const topTextStyle = {
    color: 'rgba(255,255,255,0.95)',
    textShadow: '0 2px 12px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)',
  }
  const subTextStyle = {
    color: 'rgba(255,255,255,0.78)',
    textShadow: '0 2px 12px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)',
  }
  const chipStyle = {
    color: 'rgba(255,255,255,0.90)',
    background: 'rgba(0,0,0,0.26)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }
  const iconBtnStyle = (active = false) => ({
    width: 40,
    height: 40,
    background: active ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.22)',
    border: '1px solid rgba(255,255,255,0.16)',
    color: 'rgba(255,255,255,0.95)',
    boxShadow: '0 12px 36px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  })

  const rotationLabel =
    rotationLock === 'auto'
      ? `Auto (${effectiveOrientation === 'landscape' ? 'Paisagem' : 'Retrato'})`
      : rotationLock === 'portrait'
      ? 'Retrato (travado)'
      : 'Paisagem (travado)'

  const fullscreenOverlay =
    fsOpen && contrato && user
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex"
            role="dialog"
            aria-modal="true"
            aria-label="Carteirinha em tela cheia"
            style={{
              background:
                'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.10) 0, rgba(0,0,0,0.58) 55%, rgba(0,0,0,0.76) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeFullscreen()
            }}
          >
            <div
              className="relative w-full"
              style={{
                height: '100svh',
                maxHeight: '100svh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* TOP GLASS BAR (legível) */}
              <div className="px-4 pt-4">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.28) 100%)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 18px 50px rgba(0,0,0,0.30)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold tracking-tight" style={topTextStyle}>
                        Carteirinha do Associado
                      </div>
                      <div className="text-[12px] mt-0.5 truncate" style={subTextStyle} title={nomeExibicao}>
                        {nomeExibicao}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={nextRotationLock}
                        className="inline-flex items-center justify-center rounded-full"
                        aria-label="Travar rotação (Auto / Retrato / Paisagem)"
                        title={rotationLabel}
                        style={iconBtnStyle(rotationLock !== 'auto')}
                      >
                        <RotateCw size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={toggleTilt}
                        className="inline-flex items-center justify-center rounded-full"
                        aria-label="Ativar ou desativar movimento"
                        title={tiltOn ? 'Movimento: Ativo' : 'Movimento: Desativado'}
                        style={iconBtnStyle(tiltOn)}
                      >
                        {tiltOn ? <Check size={18} /> : <Compass size={18} />}
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full"
                        onClick={closeFullscreen}
                        aria-label="Fechar tela cheia"
                        style={iconBtnStyle(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <div className="text-[11px] px-2 py-1 rounded-full" style={chipStyle}>
                      Rotação:{' '}
                      <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{rotationLabel}</strong>
                    </div>

                    <div className="text-[11px] px-2 py-1 rounded-full" style={chipStyle}>
                      Movimento:{' '}
                      <strong style={{ color: 'rgba(255,255,255,0.95)' }}>
                        {tiltOn ? 'Ativo' : 'Desativado'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card fullscreen */}
              <div className="flex-1 flex items-center justify-center px-4 pb-6" style={{ minHeight: 0 }}>
                {/* ✅ IMPORTANTE: sem key (evita remount / piscada) */}
                <CarteirinhaAssociado
                  user={user}
                  contrato={contrato}
                  printable={false}
                  matchContratoHeight={false}
                  loadAvatar={true}
                  fullscreen={true}
                  orientation={effectiveOrientation}
                  tiltEnabled={tiltOn && tiltAllowed}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <section className="section">
      {fullscreenOverlay}

      <div className="container-max max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <BackButton to="/area" className="mb-4" />
        </div>

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Carteirinha do Associado</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
              {nomeExibicao}
              {cpf && (
                <>
                  {' '}
                  • CPF {cpfReveal ? formatCPF(cpf) : displayCPF(cpf, 'last2')}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {cpf && (
              <button
                type="button"
                className="btn-outline text-xs"
                onClick={startReveal10s}
                disabled={cpfReveal}
              >
                <Lock size={14} className="mr-1" />
                {cpfReveal ? `CPF visível (${cpfSeconds}s)` : 'Mostrar CPF por 10s'}
              </button>
            )}

            {isMobile && contrato && user && (
              <button
                type="button"
                className="btn-primary text-xs inline-flex items-center gap-1"
                onClick={openFullscreen}
              >
                <Maximize2 size={14} />
                Tela cheia
              </button>
            )}
          </div>
        </header>

        {loading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-10" />
          </div>
        )}

        {!loading && !contrato && !erro && (
          <div className="mt-6 card p-6 text-center">
            <p className="font-medium">Nenhum contrato localizado para exibir a carteirinha.</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              Assim que seu contrato for efetivado, sua carteirinha digital ficará disponível aqui.
            </p>
            <div className="mt-4">
              <Link to="/planos" className="btn-primary">
                Conhecer planos
              </Link>
            </div>
          </div>
        )}

        {!loading && contrato && (
          <>
            <div className="mt-6 flex justify-center">
              <div
                role={isMobile ? 'button' : undefined}
                tabIndex={isMobile ? 0 : -1}
                onClick={() => {
                  if (isMobile) openFullscreen()
                }}
                onKeyDown={(e) => {
                  if (!isMobile) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openFullscreen()
                  }
                }}
                className={isMobile ? 'cursor-pointer' : ''}
                aria-label={isMobile ? 'Abrir carteirinha em tela cheia' : undefined}
              >
                <CarteirinhaAssociado
                  user={user}
                  contrato={contrato}
                  printable={false}
                  matchContratoHeight={false}
                  loadAvatar={true}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {printableState && (
                <Link
                  to="/carteirinha/print"
                  state={printableState}
                  className="btn-outline text-sm inline-flex items-center gap-1"
                >
                  <Lock size={14} />
                  Imprimir (frente e verso)
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
