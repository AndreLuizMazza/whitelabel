// src/pages/CarteirinhaPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, X, Maximize2, RotateCw } from 'lucide-react'
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

export default function CarteirinhaPage() {
  const user = useAuth((s) => s.user)
  const isMobile = useMediaQuery('(max-width: 768px)')

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
    if (erro) {
      showToast('Não foi possível carregar os dados do contrato para a carteirinha.')
    }
  }, [erro])

  const printableState =
    contrato && user ? { user, contrato, side: 'both' } : null

  // ===== Fullscreen =====
  const [fsOpen, setFsOpen] = useState(false)

  // ✅ SEM AUTO-ROTAÇÃO: apenas manual (portrait | landscape)
  const [fsOrientation, setFsOrientation] = useState('portrait')
  const toggleOrientation = () =>
    setFsOrientation((v) => (v === 'portrait' ? 'landscape' : 'portrait'))

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

  const rotationLabel = fsOrientation === 'landscape' ? 'Paisagem' : 'Retrato'

  // ✅ Maximização real em tela cheia (cresce no limite do viewport sem cortar)
  // Reservamos espaço para a top-bar (títulos/botões). Ajuste o toolbarPx se mudar a barra.
  const toolbarPx = 120
  const safePad = 16

  const portraitW = `min(calc(100svw - ${safePad * 2}px), calc((100svh - ${toolbarPx}px - ${
    safePad * 2
  }px) * (85.6 / 54)))`

  // No paisagem (rotacionado 90°): a "largura" vira a altura disponível.
  // Fica visivelmente maior (estilo Apple Wallet).
  const landscapeW = `min(calc(100svh - ${safePad * 2}px), calc((100svw - ${toolbarPx}px - ${
    safePad * 2
  }px) * (85.6 / 54)))`

  const cardWrapStyle =
    fsOrientation === 'portrait'
      ? {
          width: portraitW,
          transform: 'rotate(0deg)',
        }
      : {
          width: landscapeW,
          transform: 'rotate(90deg)',
        }

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
                        onClick={toggleOrientation}
                        className="inline-flex items-center justify-center rounded-full"
                        aria-label="Girar carteirinha (Retrato/Paisagem)"
                        title={`Rotação: ${rotationLabel}`}
                        style={iconBtnStyle(fsOrientation === 'landscape')}
                      >
                        <RotateCw size={18} />
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
                      <strong style={{ color: 'rgba(255,255,255,0.95)' }}>
                        {rotationLabel}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card fullscreen */}
              <div
                className="flex-1 flex items-center justify-center px-4 pb-6"
                style={{ minHeight: 0 }}
              >
                <div
                  style={{
                    ...cardWrapStyle,
                    transformOrigin: 'center center',
                    transition: 'transform 220ms ease, width 220ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
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
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <section className="section">
      {fullscreenOverlay}

      <div className="container-max max-w-5xl">
        {/* Barra superior com Voltar */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton to="/area" className="mb-4" />
        </div>

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Carteirinha do Associado
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
              {nomeExibicao}
              {cpf && (
                <>
                  {' '}
                  • CPF{' '}
                  {cpfReveal ? formatCPF(cpf) : displayCPF(cpf, 'last2')}
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
            <p className="font-medium">
              Nenhum contrato localizado para exibir a carteirinha.
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              Assim que seu contrato for efetivado, sua carteirinha digital
              ficará disponível aqui.
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
