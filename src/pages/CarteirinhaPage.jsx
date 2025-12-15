// src/pages/CarteirinhaPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, X, Maximize2 } from 'lucide-react'
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(max-width: 768px)')?.matches ?? false
  })

  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia('(max-width: 768px)')
    const onChange = (e) => setIsMobile(!!e.matches)
    mq.addEventListener?.('change', onChange)
    mq.addListener?.(onChange)
    return () => {
      mq.removeEventListener?.('change', onChange)
      mq.removeListener?.(onChange)
    }
  }, [])

  return isMobile
}

function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(orientation: landscape)')?.matches ?? false
  })

  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia('(orientation: landscape)')
    const onChange = (e) => setIsLandscape(!!e.matches)
    mq.addEventListener?.('change', onChange)
    mq.addListener?.(onChange)
    return () => {
      mq.removeEventListener?.('change', onChange)
      mq.removeListener?.(onChange)
    }
  }, [])

  return isLandscape
}

export default function CarteirinhaPage() {
  const user = useAuth((s) => s.user)
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscape()

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

  /* revelação de CPF só aqui em cima, opcional */
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
      showToast(
        'Não foi possível carregar os dados do contrato para a carteirinha.'
      )
    }
  }, [erro])

  const printableState = contrato && user ? { user, contrato, side: 'both' } : null

  // ===== Fullscreen (mobile) =====
  const [fsOpen, setFsOpen] = useState(false)

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
                'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.10) 0, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.72) 100%)',
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
              {/* Topbar fullscreen (portrait) / compacta (landscape) */}
              <div
                className="px-4 pt-4 flex items-center justify-between"
                style={{
                  paddingBottom: isLandscape ? 8 : 0,
                }}
              >
                <div className="min-w-0">
                  <div
                    className="text-[12px] font-semibold tracking-tight"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    Carteirinha do Associado
                  </div>
                  <div
                    className="text-[12px] mt-0.5 truncate"
                    style={{ color: 'rgba(255,255,255,0.72)' }}
                    title={nomeExibicao}
                  >
                    {nomeExibicao}
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full"
                  onClick={closeFullscreen}
                  aria-label="Fechar tela cheia"
                  style={{
                    width: 40,
                    height: 40,
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    color: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Card fullscreen */}
              <div
                className="flex-1 flex items-center justify-center px-4 pb-6"
                style={{
                  minHeight: 0,
                  paddingBottom: isLandscape ? 14 : 24,
                }}
              >
                <CarteirinhaAssociado
                  user={user}
                  contrato={contrato}
                  printable={false}
                  matchContratoHeight={false}
                  loadAvatar={true}
                  fullscreen={true}
                  fullscreenLayout={isLandscape ? 'landscape' : 'portrait'}
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
