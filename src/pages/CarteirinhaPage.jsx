// src/pages/CarteirinhaPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Eye, EyeOff, X, Maximize2, RotateCw, Printer } from 'lucide-react'
import { showToast } from '@/lib/toast'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
} from '@/components/member/MemberDashboardUI'
import {
  MemberGroupedList,
  MemberListRow,
} from '@/components/member/MemberGroupedList'
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

  const [cpfReveal, setCpfReveal] = useState(false)
  const [cpfSeconds, setCpfSeconds] = useState(0)
  const timerRef = useRef(null)
  const tickRef = useRef(null)

  function startReveal10s() {
    if (!cpf || cpfReveal) return
    setCpfReveal(true)
    setCpfSeconds(10)

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

  const cpfDisplay = cpf
    ? cpfReveal
      ? formatCPF(cpf)
      : displayCPF(cpf, 'last2')
    : null

  const headerMeta = useMemo(() => {
    const parts = [nomeExibicao]
    if (cpfDisplay) parts.push(`CPF ${cpfDisplay}`)
    return parts.join(' · ')
  }, [nomeExibicao, cpfDisplay])

  const numeroContrato = contrato?.numeroContrato ?? contrato?.id ?? null
  const nomePlano = contrato?.nomePlano ?? contrato?.plano?.nome ?? null

  const planMeta = useMemo(() => {
    const parts = []
    if (nomePlano) parts.push(nomePlano)
    if (numeroContrato) parts.push(`Contrato #${numeroContrato}`)
    return parts.length ? parts.join(' · ') : null
  }, [nomePlano, numeroContrato])

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
              background: 'rgba(0,0,0,0.88)',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeFullscreen()
            }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white/70">Carteirinha</p>
                <p className="text-[15px] font-semibold text-white truncate">{nomeExibicao}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleOrientation}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 active:opacity-60"
                  aria-label={`Girar: ${rotationLabel}`}
                  title={rotationLabel}
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <RotateCw size={20} strokeWidth={1.85} />
                </button>
                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white active:opacity-60"
                  aria-label="Fechar"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
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
    <div className="w-full max-w-6xl mx-auto">
      {fullscreenOverlay}

      <MemberSubpageNav to="/area" label="Início" />

      <MemberSubpageHeader title="Carteirinha" meta={headerMeta} />

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-[220px] rounded-[20px] max-w-[480px] mx-auto" />
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
          <div className="px-4 py-8 text-center">
            <p className="text-[17px] font-medium leading-snug">Carteirinha indisponível</p>
            <p className="text-[15px] mt-2 leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              Assim que seu contrato for efetivado, sua carteirinha digital aparecerá aqui.
            </p>
            <Link to="/planos" className="btn-primary inline-flex mt-5 text-[15px]">
              Ver planos
            </Link>
          </div>
        </MemberGroupedList>
      ) : null}

      {!loading && contrato ? (
        <div className="space-y-5">
          <section aria-label="Documento digital">
            {planMeta ? (
              <p
                className="text-[13px] text-center mb-3 px-2 leading-snug"
                style={{ color: 'var(--text-muted)' }}
              >
                {planMeta}
              </p>
            ) : null}

            <div className="flex justify-center px-1">
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

          <section aria-label="Ações">
            <p
              className="px-1 mb-2 text-[13px] font-normal uppercase tracking-[0.02em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Ações
            </p>

            <MemberGroupedList>
              {cpf ? (
                <MemberListRow
                  icon={cpfReveal ? EyeOff : Eye}
                  label={cpfReveal ? `CPF visível · ${cpfSeconds}s` : 'Mostrar CPF'}
                  detail={
                    cpfReveal
                      ? 'Ocultando automaticamente'
                      : 'Exibe o número completo por 10 segundos'
                  }
                  onClick={startReveal10s}
                  showChevron={false}
                />
              ) : null}

              <MemberListRow
                icon={Maximize2}
                label="Tela cheia"
                detail={isMobile ? 'Ideal para apresentar na unidade' : 'Modo apresentação ampliado'}
                onClick={openFullscreen}
              />

              {printableState ? (
                <MemberListRow
                  icon={Printer}
                  label="Imprimir"
                  detail="Frente e verso em PDF"
                  to="/carteirinha/print"
                  state={printableState}
                />
              ) : null}
            </MemberGroupedList>

            <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Documento digital válido enquanto exibido pelo associado. Em caso de dúvida, contate
              a unidade responsável.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  )
}
