// src/components/CarteirinhaAssociado.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { showToast } from '@/lib/toast'
import useTenant from '@/store/tenant'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { getAvatarBlobUrl } from '@/lib/profile'
import { formatDisplayLabel } from '@/components/member/MemberDashboardUI'
import QRCode from 'qrcode'

/* =============== utils =============== */
const onlyDigits = (v = '') => String(v).replace(/\D+/g, '')
const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

const fmtDateBR = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const d = t.split('T')[0]
  const [Y, M, D] = d.split('-')
  return Y && M && D ? `${D}/${M}/${Y}` : t
}

const todayBR = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}/${d.getFullYear()}`
}

function usePrefersDark() {
  const [dark, setDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return dark
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])
  return reduced
}

/** iPhone/iPadOS WebKit: preserve-3d + overflow em ancestrais costuma vazar faces; usamos fallback 2D. */
function useIosLikeTouchDevice() {
  return useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    if (/iPad|iPhone|iPod/.test(ua)) return true
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
    return false
  }, [])
}

/* fonte adaptativa p/ nome/plano */
function fontForName(n = '') {
  const len = String(n).length
  if (len > 60) return 12
  if (len > 48) return 13
  if (len > 38) return 14
  return 16
}
function fontForPlano(p = '') {
  const len = String(p).length
  if (len > 50) return 10
  if (len > 36) return 11
  return 12
}

/**
 * Props:
 * - user, contrato
 * - printable?: boolean
 * - side?: 'front' | 'back'
 * - matchContratoHeight?: boolean
 * - loadAvatar?: boolean
 * - fotoUrl?: string
 * - tenantLogoUrl?: string
 * - printMode?: 'classic' | 'screenLike' (quando printable=true)
 */
export default function CarteirinhaAssociado({
  user = {},
  contrato = {},
  printable = false,
  side = 'front',
  matchContratoHeight = true,
  loadAvatar = true,
  fotoUrl = null,
  tenantLogoUrl = null,
  printMode = 'classic',
  showSideTabs = true,
}) {
  const prefersDark = usePrefersDark()
  const reducedMotion = usePrefersReducedMotion()
  const iosLike = useIosLikeTouchDevice()
  const warnedRef = useRef(false)

  const [imgErro, setImgErro] = useState(false)

  // flip (somente na tela)
  const [uiSide, setUiSide] = useState(side)

  const [matchHeight, setMatchHeight] = useState(null)

  // avatar (Blob URL vindo do BFF)
  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null)
  const lastObjUrlRef = useRef(null)

  // tenant
  const empresa = useTenant((s) => s.empresa)
  const tenantName =
    empresa?.nomeFantasia || empresa?.razaoSocial || 'Sua Marca Aqui'
  const tenantLogoFromStore =
    empresa?.logo ||
    empresa?.logoUrl ||
    empresa?.logo_path ||
    (typeof window !== 'undefined' && window.__TENANT__?.logo) ||
    '/img/logo.png'
  const tenantLogo = tenantLogoUrl || tenantLogoFromStore
  const verifyBase =
    empresa?.siteOficial ||
    empresa?.dominio ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  // =========================
  // ✅ DADOS (alvo = user quando vier via state)
  // =========================
  const pessoaNome =
    user?.nome ||
    user?.name ||
    contrato?.nome ||
    contrato?.nomeDependente ||
    contrato?.nomePessoa ||
    user?.email ||
    'Associado(a)'

  const nomeTitularInformativo =
    contrato?.nomeTitular || contrato?.titularNome || ''

  const plano = contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano'
  const planoExibicao = formatDisplayLabel(plano)
  const numero =
    contrato.numeroContrato ?? contrato.id ?? contrato.contratoId ?? '—'
  const efetivacao =
    contrato.dataEfetivacao ?? contrato.dataContrato ?? contrato.criadoEm ?? ''
  const ativo =
    contrato.contratoAtivo ??
    String(contrato.status || '').toUpperCase() === 'ATIVO'
  const inactiveMuted = !ativo && !printable

  // foto: se existirem chaves específicas de dependente no futuro, elas entram aqui
  const fotoDeclarada =
    user?.fotoUrl || user?.photoURL || contrato?.fotoTitular || ''

  // CPF sempre do user alvo (state.user quando imprimindo dependente)
  const cpf =
    user?.cpf ||
    user?.documento ||
    contrato?.cpf ||
    contrato?.documento ||
    contrato?.cpfPessoa ||
    ''

  const cpfDigits = onlyDigits(cpf)
  const hasCpfOk = cpfDigits && cpfDigits.length === 11

  const cpfShown = useMemo(
    () => (printable ? formatCPF(cpf) : displayCPF(cpf, 'last2')),
    [cpf, printable]
  )

  // =========================
  // ✅ QR SEMPRE (com fallback)
  // =========================
  const verifyUrl = useMemo(() => {
    const base = verifyBase || ''
    if (hasCpfOk) {
      return `${base}/verificar/${encodeURIComponent(cpfDigits)}`
    }
    // fallback: ainda dá para validar pelo contrato/nome no backoffice
    const q = new URLSearchParams()
    if (numero && numero !== '—') q.set('contrato', String(numero))
    if (pessoaNome) q.set('nome', String(pessoaNome).slice(0, 80))
    return `${base}/verificar?${q.toString()}`
  }, [verifyBase, hasCpfOk, cpfDigits, numero, pessoaNome])

  const validade = todayBR()
  const [qrDataUrl, setQrDataUrl] = useState(
    contrato?.qrCodeUrl || contrato?.qr || ''
  )

  useEffect(() => {
    let disposed = false
    ;(async () => {
      try {
        // sempre tenta gerar, mesmo sem CPF
        const dataUrl = await QRCode.toDataURL(verifyUrl || 'about:blank', {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 220,
        })
        if (!disposed) setQrDataUrl(dataUrl)
      } catch {
        // se falhar, não quebra UI (mas tenta manter algo)
        if (!disposed) setQrDataUrl('')
      }
    })()
    return () => {
      disposed = true
    }
  }, [verifyUrl])

  // ===== Avatar via BFF =====
  useEffect(() => {
    let active = true
    if (!loadAvatar) {
      if (lastObjUrlRef.current) {
        URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = null
      }
      setAvatarBlobUrl(null)
      return () => {}
    }
    async function load() {
      try {
        const objUrl = await getAvatarBlobUrl()
        if (!active) {
          if (objUrl) URL.revokeObjectURL(objUrl)
          return
        }
        if (lastObjUrlRef.current) URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = objUrl || null
        setAvatarBlobUrl(objUrl || null)
        setImgErro(false)
      } catch {
        setAvatarBlobUrl(null)
      }
    }
    load()
    return () => {
      active = false
      if (lastObjUrlRef.current) {
        URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = null
      }
    }
  }, [loadAvatar, user?.id, user?.email, cpfDigits, contrato?.pessoaId])

  const avatarUrl = fotoUrl || avatarBlobUrl || fotoDeclarada || ''

  // autoavaliação (não bloqueia QR)
  useEffect(() => {
    if (warnedRef.current) return
    if (!pessoaNome) showToast('Nome ausente na carteirinha.')
    if (!plano) showToast('Plano não identificado.')
    if (!numero) showToast('Número do contrato ausente.')
    warnedRef.current = true
  }, [pessoaNome, plano, numero])

  // igualar altura ao card do contrato (desktop)
  useEffect(() => {
    if (!matchContratoHeight || printable || typeof window === 'undefined')
      return
    const target = document.getElementById('contrato-card-root')
    if (!target) return
    const isDesktop = () => window.matchMedia?.('(min-width: 1024px)').matches
    const apply = () => {
      if (isDesktop()) {
        const h = Math.max(240, Math.round(target.getBoundingClientRect().height))
        setMatchHeight(h)
      } else setMatchHeight(null)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(target)
    window.addEventListener('resize', apply)
    return () => {
      try {
        ro.disconnect()
      } catch {}
      window.removeEventListener('resize', apply)
    }
  }, [matchContratoHeight, printable])

  // ===== estilos base =====
  const screenLikePrint = printable && printMode === 'screenLike'

  const cardShadow = printable
    ? 'none'
    : prefersDark
      ? '0 18px 46px rgba(0, 0, 0, 0.55)'
      : '0 18px 46px rgba(15, 23, 42, 0.28)'

  const cardWidth = printable ? '100%' : 'min(480px, 92vw)'

  const radius = printable ? (screenLikePrint ? '22px' : '14px') : '22px'
  const paddingValue = printable ? '18px' : 'clamp(16px, 2.4vh, 20px)'

  const cardShadowFinal =
    inactiveMuted && !printable
      ? `${cardShadow}, inset 0 0 0 1px rgba(255, 149, 0, 0.22)`
      : cardShadow

  const cardStyle = {
    width: cardWidth,
    height: printable ? '100%' : undefined,
    ...(matchHeight && !printable
      ? { height: `${matchHeight}px` }
      : printable
      ? {}
      : { aspectRatio: '85.6 / 54' }),
    marginTop: printable ? 0 : 'clamp(-4px, -0.4vw, -8px)',
    borderRadius: radius,
    boxShadow: cardShadowFinal,
    overflow: 'hidden',
    color: 'var(--on-primary, #ffffff)',
    background:
      'radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--primary) 40%, transparent) 0, transparent 55%),' +
      'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, #000000) 0%, color-mix(in srgb, var(--primary) 60%, #ffffff) 55%, color-mix(in srgb, var(--primary) 42%, #ffffff) 100%)',
    position: 'relative',
  }

  const topGlowStyle = {
    position: 'absolute',
    insetInline: '-20%',
    top: '-20%',
    height: '40%',
    background:
      'radial-gradient(circle at 10% 0%, rgba(255,255,255,0.35) 0, transparent 60%)',
    opacity: printable ? 0 : 1,
    pointerEvents: 'none',
  }

  function toggleSide() {
    if (printable) return
    setUiSide((s) => (s === 'front' ? 'back' : 'front'))
  }

  // ===== Helpers de clamp (2 linhas) para SCREEN e PRINT =====
  const nameClampStyle = (() => {
    const fs = fontForName(pessoaNome)
    const lineHeight = 1.15
    return {
      fontSize: `${fs}px`,
      color: 'var(--on-primary, #ffffff)',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      lineHeight,
      ...(printable
        ? {
            maxHeight: `${Math.ceil(fs * lineHeight * 2)}px`,
            overflow: 'hidden',
          }
        : {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }),
    }
  })()

  const planoClampStyle = (() => {
    const fs = fontForPlano(planoExibicao)
    const lineHeight = 1.15
    return {
      fontSize: `${fs}px`,
      color: 'var(--on-primary, #ffffff)',
      opacity: 0.96,
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      lineHeight,
      ...(printable
        ? {
            maxHeight: `${Math.ceil(fs * lineHeight * 2)}px`,
            overflow: 'hidden',
          }
        : {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }),
    }
  })()

  // ===================== RENDER HELPERS =====================
  const Front = ({ hideTabs = false }) => (
    <>
      <header className="relative shrink-0 flex items-start justify-between gap-4 z-[1]">
        <div className="flex items-start gap-4 min-w-0">
          <div className="relative shrink-0">
            {avatarUrl && !imgErro ? (
              <img
                src={avatarUrl}
                alt={pessoaNome}
                className="rounded-full object-cover"
                style={{
                  width: 58,
                  height: 58,
                  border:
                    '2px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                }}
                onError={() => setImgErro(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center font-semibold text-white"
                style={{
                  width: 58,
                  height: 58,
                  background: 'color-mix(in srgb, var(--primary) 60%, #000000)',
                  border:
                    '2px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                }}
              >
                {initials(pessoaNome)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug" style={nameClampStyle}>
              {pessoaNome}
            </div>

            <div className="mt-0.5 font-semibold leading-snug tracking-tight" style={planoClampStyle}>
              {planoExibicao}
            </div>

            <div className="mt-1.5 flex items-center flex-wrap gap-2">
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.92 }}
              >
                Contrato #{numero}
              </span>

              {!printable && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm"
                  style={{
                    background: 'rgba(255,255,255,0.24)',
                    color: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: ativo ? '#30d158' : '#ff9500' }}
                  />
                  {ativo ? 'Ativo' : 'Inativo'}
                </span>
              )}
            </div>


          </div>
        </div>

        <div className="shrink-0 text-right max-w-[38%]">
          <div
            className="text-[10px] uppercase tracking-[0.12em] font-medium"
            style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.85 }}
          >
            Efetivação
          </div>
          <div
            className="text-[13px] font-semibold tabular-nums tracking-tight"
            style={{ color: 'var(--on-primary, #ffffff)' }}
          >
            {fmtDateBR(efetivacao)}
          </div>

          {tenantLogo && (
            <img
              src={tenantLogo}
              alt=""
              aria-hidden="true"
              className="mt-3 object-contain ml-auto"
              style={{
                maxWidth: 96,
                maxHeight: 44,
                width: '100%',
                height: 'auto',
                opacity: 0.5,
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.28))',
              }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 min-w-0" aria-hidden="true" />

      <footer className="relative z-[1] shrink-0 pt-1 pb-0.5">
        <p
          className="text-[10px] leading-snug max-w-md"
          style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.82 }}
        >
          Válido enquanto exibido pelo associado.
        </p>

        {!printable && !hideTabs && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setUiSide('front')
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background:
                  uiSide === 'front'
                    ? 'rgba(255,255,255,0.30)'
                    : 'rgba(255,255,255,0.16)',
                color: '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
              aria-pressed={uiSide === 'front'}
            >
              Frente
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setUiSide('back')
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background:
                  uiSide === 'back'
                    ? 'rgba(255,255,255,0.30)'
                    : 'rgba(255,255,255,0.16)',
                color: '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
              aria-pressed={uiSide === 'back'}
            >
              Verso
            </button>
          </div>
        )}
      </footer>
    </>
  )

  const Back = ({ hideTabs = false }) => (
    <>
      <div className="relative shrink-0 flex items-start justify-between gap-4 z-[1]">
        <div className="min-w-0 flex-1 pr-2">
          <p
            className="text-[10px] uppercase tracking-[0.12em] font-medium"
            style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.72 }}
          >
            {formatDisplayLabel(tenantName)}
          </p>
          <p
            className="text-[13px] mt-2.5 leading-snug"
            style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.92 }}
          >
            CPF <span className="font-semibold tabular-nums">{cpfShown || '—'}</span>
          </p>
          <p
            className="text-[12px] mt-1 tabular-nums"
            style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.75 }}
          >
            Emitida em {validade}
          </p>
        </div>

        <div
          className="shrink-0 rounded-[14px] p-2"
          style={{
            background: 'rgba(255,255,255,0.16)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code de verificação"
              style={{ width: 76, height: 76, display: 'block', borderRadius: 8 }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.08)',
              }}
              aria-label="QR code indisponível"
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0" aria-hidden="true" />

      <footer className="relative z-[1] shrink-0 pb-0.5">
        <p
          className="text-[10px] leading-snug"
          style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.78 }}
        >
          Escaneie para verificar autenticidade.
        </p>

        {!printable && !hideTabs && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setUiSide('front')
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background:
                  uiSide === 'front'
                    ? 'rgba(255,255,255,0.30)'
                    : 'rgba(255,255,255,0.16)',
                color: '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
              aria-pressed={uiSide === 'front'}
            >
              Frente
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setUiSide('back')
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background:
                  uiSide === 'back'
                    ? 'rgba(255,255,255,0.30)'
                    : 'rgba(255,255,255,0.16)',
                color: '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
              aria-pressed={uiSide === 'back'}
            >
              Verso
            </button>
          </div>
        )}
      </footer>
    </>
  )

  // ===================== PRINT: render estático (sem 3D) =====================
  if (printable) {
    const staticPad = {
      padding: paddingValue,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }
    return (
      <section
        className="relative mx-auto printable-card"
        style={cardStyle}
        aria-label={`Carteirinha do Associado • ${pessoaNome} (${
          side === 'front' ? 'Frente' : 'Verso'
        })`}
      >
        <div aria-hidden="true" style={{ ...topGlowStyle, opacity: 0 }} />
        <div style={staticPad}>
          {side === 'back' ? <Back hideTabs /> : <Front hideTabs />}
        </div>
      </section>
    )
  }

  // ===================== SCREEN: flip 3D (desktop/Android) | 2D swap (iOS WebKit) =====================
  const flipRotate = uiSide === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)'
  const innerStyle = {
    position: 'absolute',
    inset: 0,
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transition: reducedMotion
      ? 'none'
      : 'transform 560ms cubic-bezier(.2,.9,.2,1)',
    willChange: 'transform',
    transform: flipRotate,
    WebkitTransform: flipRotate,
  }

  const faceBase = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    padding: paddingValue,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    // Separa planos no Safari e reduz z-fighting entre frente/verso
    transform: 'translateZ(1px)',
    WebkitTransform: 'translateZ(1px)',
  }

  const frontStyle = { ...faceBase }
  const backStyle = {
    ...faceBase,
    transform: 'rotateY(180deg) translateZ(1px)',
    WebkitTransform: 'rotateY(180deg) translateZ(1px)',
  }

  const flatFaceTransition = reducedMotion || iosLike ? 'none' : 'opacity 220ms ease'

  const flatFrontStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    padding: paddingValue,
    opacity: uiSide === 'front' ? 1 : 0,
    visibility: uiSide === 'front' ? 'visible' : 'hidden',
    zIndex: uiSide === 'front' ? 2 : 0,
    pointerEvents: uiSide === 'front' ? 'auto' : 'none',
    transition: flatFaceTransition,
  }

  const flatBackStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    padding: paddingValue,
    opacity: uiSide === 'back' ? 1 : 0,
    visibility: uiSide === 'back' ? 'visible' : 'hidden',
    zIndex: uiSide === 'back' ? 2 : 0,
    pointerEvents: uiSide === 'back' ? 'auto' : 'none',
    transition: flatFaceTransition,
  }

  const shineStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: 1,
    mixBlendMode: 'soft-light',
    background:
      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 55%),' +
      'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.14) 35%, transparent 70%)',
    transform: uiSide === 'back' ? 'translateX(-6%)' : 'translateX(6%)',
    transition: reducedMotion
      ? 'none'
      : 'transform 560ms cubic-bezier(.2,.9,.2,1)',
  }

  // perspective fora do nó com overflow:hidden — evita achatamento do preserve-3d no WebKit
  const flipStageStyle = {
    position: 'absolute',
    inset: 0,
    isolation: 'isolate',
    ...(iosLike
      ? {}
      : {
          perspective: '1100px',
          WebkitPerspective: '1100px',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }),
  }

  return (
    <div className="mx-auto w-full max-w-[min(480px,92vw)] flex flex-col items-stretch">
      <section
        className="relative w-full"
        style={cardStyle}
        aria-label={`Carteirinha do Associado • ${pessoaNome}`}
        aria-describedby="carteirinha-flip-hint"
        role="button"
        tabIndex={0}
        onClick={toggleSide}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleSide()
          }
        }}
      >
        <div style={flipStageStyle}>
          <div aria-hidden="true" style={topGlowStyle} />
          <div aria-hidden="true" style={shineStyle} />

          {iosLike ? (
            <>
              <div style={flatFrontStyle} aria-hidden={uiSide === 'back'}>
                <Front hideTabs={!showSideTabs} />
              </div>
              <div style={flatBackStyle} aria-hidden={uiSide === 'front'}>
                <Back hideTabs={!showSideTabs} />
              </div>
            </>
          ) : (
            <div style={innerStyle}>
              <div style={frontStyle} aria-hidden={uiSide === 'back'}>
                <Front hideTabs={!showSideTabs} />
              </div>
              <div style={backStyle} aria-hidden={uiSide === 'front'}>
                <Back hideTabs={!showSideTabs} />
              </div>
            </div>
          )}
        </div>
      </section>
      <p
        id="carteirinha-flip-hint"
        className="mt-3.5 text-center text-[12px] leading-snug px-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Toque para ver o verso
      </p>
    </div>
  )
}
