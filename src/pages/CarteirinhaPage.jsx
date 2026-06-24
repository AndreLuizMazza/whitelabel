// src/pages/CarteirinhaPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { X, Maximize2, RotateCw, Printer } from 'lucide-react'
import { showToast } from '@/lib/toast'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import { MemberGroupedList, MemberListRow } from '@/components/member/MemberGroupedList'
import Skeleton from '@/components/ui/Skeleton.jsx'

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

  useEffect(() => {
    if (loading) return
    if (erro && !contrato) {
      showToast('Não foi possível carregar os dados do contrato para a carteirinha.')
    }
  }, [loading, erro, contrato])

  const printableState =
    contrato && user ? { user, contrato, side: 'both' } : null

  const [fsOpen, setFsOpen] = useState(false)
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

  const numeroContrato = contrato?.numeroContrato ?? contrato?.id ?? null
  const nomePlano = contrato?.nomePlano ?? contrato?.plano?.nome ?? null

  const headerMeta = useMemo(() => {
    if (nomePlano) return formatDisplayLabel(nomePlano)
    return null
  }, [nomePlano])

  const toolbarPx = 88
  const safePad = 16
  const portraitW = `min(calc(100svw - ${safePad * 2}px), calc((100svh - ${toolbarPx}px - ${safePad * 2}px) * (85.6 / 54)))`
  const landscapeW = `min(calc(100svh - ${safePad * 2}px), calc((100svw - ${toolbarPx}px - ${safePad * 2}px) * (85.6 / 54)))`

  const cardWrapStyle =
    fsOrientation === 'portrait'
      ? { width: portraitW, transform: 'rotate(0deg)' }
      : { width: landscapeW, transform: 'rotate(90deg)' }

  const rotationLabel = fsOrientation === 'landscape' ? 'Paisagem' : 'Retrato'

  const fullscreenOverlay =
    fsOpen && contrato && user
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Carteirinha em tela cheia"
            style={{
              background: 'rgba(0,0,0,0.92)',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeFullscreen()
            }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white/65">Apresentação</p>
                <p className="text-[17px] font-semibold text-white truncate tracking-tight">
                  {nomeExibicao}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleOrientation}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 active:scale-95 transition-transform"
                  aria-label={`Girar: ${rotationLabel}`}
                  title={rotationLabel}
                  style={{
                    background: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <RotateCw size={19} strokeWidth={1.85} />
                </button>
                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-95 transition-transform"
                  aria-label="Fechar"
                  style={{
                    background: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 min-h-0">
              <div
                style={{
                  ...cardWrapStyle,
                  transformOrigin: 'center center',
                  transition: 'transform 220ms ease, width 220ms ease',
                }}
              >
                <CarteirinhaAssociado
                  user={user}
                  contrato={contrato}
                  printable={false}
                  matchContratoHeight={false}
                  loadAvatar
                  showSideTabs={false}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="w-full max-w-6xl mx-auto pb-4">
      {fullscreenOverlay}

      <MemberSubpageNav to="/area" label="Início" />

      <MemberSubpageHeader title="Carteirinha" meta={headerMeta} />

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-[220px] rounded-[22px] max-w-[480px] mx-auto" />
          <MemberGroupedList>
            <div className="px-4 py-4 space-y-3">
              <Skeleton className="h-11 rounded-lg" />
              <Skeleton className="h-11 rounded-lg" />
            </div>
          </MemberGroupedList>
        </div>
      ) : null}

      {!loading && !contrato && !erro ? (
        <MemberGroupedList>
          <div className="px-4 py-10 text-center">
            <p className="text-[17px] font-semibold leading-snug tracking-tight">
              Carteirinha indisponível
            </p>
            <p
              className="text-[15px] mt-2 leading-relaxed max-w-sm mx-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              Assim que seu contrato for efetivado, sua carteirinha digital aparecerá aqui.
            </p>
            <Link to="/planos" className="btn-primary inline-flex mt-6 text-[15px]">
              Ver planos
            </Link>
          </div>
        </MemberGroupedList>
      ) : null}

      {!loading && contrato ? (
        <div className="space-y-6">
          <section aria-label="Documento digital" className="flex justify-center px-1">
            <div className="w-full max-w-[min(480px,92vw)]">
              <CarteirinhaAssociado
                user={user}
                contrato={contrato}
                printable={false}
                matchContratoHeight={false}
                loadAvatar
                showSideTabs={false}
              />
            </div>
          </section>

          <section aria-label="Opções">
            <p
              className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Opções
            </p>
            <MemberGroupedList className="rounded-[20px]">
              <MemberListRow
                icon={Maximize2}
                label="Tela cheia"
                detail={isMobile ? 'Apresentar na unidade' : 'Modo apresentação'}
                onClick={openFullscreen}
              />

              {printableState ? (
                <MemberListRow
                  icon={Printer}
                  label="Imprimir"
                  detail="Frente e verso"
                  to="/carteirinha/print"
                  state={printableState}
                />
              ) : null}
            </MemberGroupedList>
          </section>
        </div>
      ) : null}
    </div>
  )
}
