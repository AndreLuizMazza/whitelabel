// src/components/CarteirinhaAssociado.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { showToast } from '@/lib/toast'
import useTenant from '@/store/tenant'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { getAvatarBlobUrl } from '@/lib/profile'
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

function haptic(ms = 12) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms)
  } catch {}
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/**
 * Tilt via giroscópio (deviceorientation)
 * - Atualiza em baixa frequência (RAF)
 * - Retorna { tiltX, tiltY } em graus
 */
function useDeviceTilt({ enabled, orientation }) {
  const [tilt, setTilt] = useState({ tiltX: 0, tiltY: 0 })
  const latestRef = useRef({ beta: 0, gamma: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setTilt({ tiltX: 0, tiltY: 0 })
      return
    }
    if (typeof window === 'undefined') return
    if (typeof window.DeviceOrientationEvent === 'undefined') return

    const onOrientation = (e) => {
      const beta = Number(e?.beta ?? 0)
      const gamma = Number(e?.gamma ?? 0)
      latestRef.current = { beta, gamma }
    }

    window.addEventListener('deviceorientation', onOrientation, { passive: true })

    const tick = () => {
      const { beta, gamma } = latestRef.current

      // Normalização suave (graus finais)
      // portrait: beta -> X (inclinação pra frente/trás), gamma -> Y (esquerda/direita)
      // landscape: troca e ajusta sinais para sensação natural após girar 90°
      let x = 0
      let y = 0
      if (orientation === 'landscape') {
        x = clamp(gamma / 10, -8, 8)
        y = clamp(-beta / 10, -8, 8)
      } else {
        x = clamp(beta / 10, -8, 8)
        y = clamp(gamma / 10, -8, 8)
      }

      // amortecimento (lerp)
      setTilt((prev) => {
        const nx = prev.tiltX + (x - prev.tiltX) * 0.12
        const ny = prev.tiltY + (y - prev.tiltY) * 0.12
        // evita renders inúteis
        if (Math.abs(nx - prev.tiltX) < 0.01 && Math.abs(ny - prev.tiltY) < 0.01) return prev
        return { tiltX: nx, tiltY: ny }
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [enabled, orientation])

  return tilt
}

function useViewportBox({ enabled }) {
  const [box, setBox] = useState(() => {
    if (typeof window === 'undefined') return { w: 0, h: 0 }
    const vv = window.visualViewport
    return {
      w: Math.round(vv?.width ?? window.innerWidth),
      h: Math.round(vv?.height ?? window.innerHeight),
    }
  })

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const update = () => {
      const vv = window.visualViewport
      setBox({
        w: Math.round(vv?.width ?? window.innerWidth),
        h: Math.round(vv?.height ?? window.innerHeight),
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener?.('resize', update)
    window.visualViewport?.addEventListener?.('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener?.('resize', update)
      window.visualViewport?.removeEventListener?.('scroll', update)
    }
  }, [enabled])

  return box
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
 * - fullscreen?: boolean
 * - orientation?: 'portrait' | 'landscape'
 * - tiltEnabled?: boolean
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
  fullscreen = false,
  orientation = 'portrait',
  tiltEnabled = false,
}) {
  const prefersDark = usePrefersDark()
  const warnedRef = useRef(false)
  const [imgErro, setImgErro] = useState(false)
  const [uiSide, setUiSide] = useState(side)
  const [matchHeight, setMatchHeight] = useState(null)

  const isLandscape = fullscreen && orientation === 'landscape'

  // swipe (fullscreen)
  const touchRef = useRef({ startX: 0, startY: 0, active: false })

  // avatar blob
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
  const tenantPhone = empresa?.telefone || empresa?.whatsapp || ''
  const verifyBase =
    empresa?.siteOficial ||
    empresa?.dominio ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  // dados
  const nome = contrato.nomeTitular || user?.nome || user?.name || 'Associado(a)'
  const plano = contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano'
  const numero =
    contrato.numeroContrato ?? contrato.id ?? contrato.contratoId ?? '—'
  const efetivacao =
    contrato.dataEfetivacao ?? contrato.dataContrato ?? contrato.criadoEm ?? ''
  const ativo =
    contrato.contratoAtivo ??
    String(contrato.status || '').toUpperCase() === 'ATIVO'
  const fotoDeclarada =
    user?.fotoUrl || user?.photoURL || contrato?.fotoTitular || ''
  const cpf = user?.cpf || contrato?.cpfTitular || ''
  const cpfDigits = onlyDigits(cpf)
  const cpfShown = useMemo(
    () => (printable ? formatCPF(cpf) : displayCPF(cpf, 'last2')),
    [cpf, printable]
  )

  // verificação + QR
  const verifyPath = `/verificar/${encodeURIComponent(cpfDigits)}`
  const verifyUrl = `${verifyBase}${verifyPath}`
  const validade = todayBR()
  const [qrDataUrl, setQrDataUrl] = useState(
    contrato?.qrCodeUrl || contrato?.qr || ''
  )

  useEffect(() => {
    let disposed = false
    ;(async () => {
      try {
        if (!qrDataUrl && cpfDigits) {
          const dataUrl = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: fullscreen ? 260 : 220,
          })
          if (!disposed) setQrDataUrl(dataUrl)
        }
      } catch {}
    })()
    return () => {
      disposed = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpfDigits, verifyUrl, fullscreen])

  // avatar via BFF
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

  // avisos
  useEffect(() => {
    if (warnedRef.current) return
    if (!nome) showToast('Nome do titular ausente na carteirinha.')
    if (!plano) showToast('Plano não identificado.')
    if (!numero) showToast('Número do contrato ausente.')
    if (!cpfDigits || cpfDigits.length !== 11) showToast('CPF inválido ou não informado.')
    warnedRef.current = true
  }, [nome, plano, numero, cpfDigits])

  // match height no desktop
  useEffect(() => {
    if (!matchContratoHeight || printable || fullscreen || typeof window === 'undefined') return
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
  }, [matchContratoHeight, printable, fullscreen])

  // ===== FULLSCREEN: tamanho fixo respeitando proporção do cartão =====
  const CARD_RATIO = 85.6 / 54 // ~1.585 (cartão real)
  const viewport = useViewportBox({ enabled: fullscreen && !printable })

  const { tiltX, tiltY } = useDeviceTilt({
    enabled: fullscreen && !printable && !!tiltEnabled,
    orientation: isLandscape ? 'landscape' : 'portrait',
  })

  const cardShadow = printable
    ? 'none'
    : prefersDark
    ? '0 18px 46px rgba(0,0,0,0.55)'
    : '0 18px 46px rgba(15,23,42,0.30)'

  const paddingPx = printable ? 18 : fullscreen ? 20 : 18

  // cálculo de cardWidth/Height no fullscreen:
  // - se landscape, o cartão será rotacionado 90°, então o "espaço efetivo" inverte
  const baseW = fullscreen ? (viewport.w || 0) : 0
  const baseH = fullscreen ? (viewport.h || 0) : 0
  const effectiveW = isLandscape ? baseH : baseW
  const effectiveH = isLandscape ? baseW : baseH

  // margens de segurança para topbar + respiro
  const FULL_MARGIN = 28 // px
  const usableW = Math.max(320, effectiveW - FULL_MARGIN * 2)
  const usableH = Math.max(240, effectiveH - FULL_MARGIN * 2)

  let fsWidth = usableW
  let fsHeight = fsWidth / CARD_RATIO
  if (fsHeight > usableH) {
    fsHeight = usableH
    fsWidth = fsHeight * CARD_RATIO
  }

  const baseRotation = isLandscape ? 'rotate(90deg)' : 'rotate(0deg)'
  const tiltRotation = tiltEnabled ? ` rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)` : ''
  const composedTransform = fullscreen
    ? `${baseRotation}${tiltRotation} translateZ(0)`
    : undefined

  const cardStyle = {
    width: fullscreen ? `${Math.round(fsWidth)}px` : '100%',
    height: fullscreen ? `${Math.round(fsHeight)}px` : undefined,
    maxWidth: fullscreen ? undefined : printable ? '600px' : '480px',
    ...(fullscreen
      ? { aspectRatio: '85.6 / 54' }
      : matchHeight && !printable
      ? { height: `${matchHeight}px`, aspectRatio: undefined }
      : { aspectRatio: '85.6 / 54' }),
    marginTop: printable ? 0 : 'clamp(-4px, -0.4vw, -8px)',
    padding: `${paddingPx}px`,
    borderRadius: printable ? '14px' : fullscreen ? '26px' : '22px',
    boxShadow: fullscreen ? '0 28px 80px rgba(0,0,0,0.60)' : cardShadow,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    color: 'var(--on-primary, #ffffff)',
    background:
      'radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--primary) 40%, transparent) 0, transparent 55%),' +
      'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, #000000) 0%, color-mix(in srgb, var(--primary) 60%, #ffffff) 55%, color-mix(in srgb, var(--primary) 42%, #ffffff) 100%)',
    transform: composedTransform,
    transformOrigin: 'center center',
    transition: fullscreen ? 'transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1)' : undefined,
  }

  function flipTo(next, withHaptic = true) {
    setUiSide(next)
    if (withHaptic && fullscreen) haptic(14)
  }

  function onTouchStart(e) {
    if (printable) return
    if (!fullscreen) return
    const t = e.touches?.[0]
    if (!t) return
    touchRef.current = { startX: t.clientX, startY: t.clientY, active: true }
  }

  function onTouchEnd(e) {
    if (!touchRef.current.active) return
    const t = e.changedTouches?.[0]
    if (!t) return
    const dx = t.clientX - touchRef.current.startX
    const dy = t.clientY - touchRef.current.startY
    touchRef.current.active = false

    if (Math.abs(dx) < 40 || Math.abs(dy) > 60) return
    if (dx < 0) flipTo('back')
    else flipTo('front')
  }

  function Front() {
    return (
      <>
        <header className="relative flex items-start justify-between gap-4 z-[1]">
          <div className="flex items-start gap-4 min-w-0">
            <div className="relative shrink-0">
              {avatarUrl && !imgErro ? (
                <img
                  src={avatarUrl}
                  alt={nome}
                  className="rounded-full object-cover"
                  style={{
                    width: fullscreen ? 64 : 58,
                    height: fullscreen ? 64 : 58,
                    border: '2px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                  }}
                  onError={() => setImgErro(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center font-semibold text-white"
                  style={{
                    width: fullscreen ? 64 : 58,
                    height: fullscreen ? 64 : 58,
                    background: 'color-mix(in srgb, var(--primary) 60%, #000000)',
                    border: '2px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                  }}
                >
                  {initials(nome)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div
                className="font-semibold leading-snug"
                style={{
                  fontSize: `${fullscreen ? Math.min(fontForName(nome) + 2, 18) : fontForName(nome)}px`,
                  color: 'var(--on-primary, #ffffff)',
                  wordBreak: 'break-word',
                  ...(printable
                    ? {}
                    : {
                        display: '-webkit-box',
                        WebkitLineClamp: fullscreen ? 3 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }),
                }}
              >
                {nome}
              </div>

              <div
                className="mt-0.5 font-semibold uppercase tracking-[0.08em]"
                style={{
                  fontSize: `${fullscreen ? Math.min(fontForPlano(plano) + 1, 14) : fontForPlano(plano)}px`,
                  color: 'var(--on-primary, #ffffff)',
                  opacity: 0.96,
                  wordBreak: 'break-word',
                  ...(printable
                    ? {}
                    : {
                        display: '-webkit-box',
                        WebkitLineClamp: fullscreen ? 3 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }),
                }}
              >
                {plano}
              </div>

              <div className="mt-1 flex items-center flex-wrap gap-2">
                <span className="text-[11px] opacity-90" style={{ color: 'var(--on-primary, #ffffff)' }}>
                  Contrato #{numero}
                </span>

                {!printable && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm"
                    style={{
                      background: 'rgba(255,255,255,0.22)',
                      color: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.55)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: ativo ? '#4ade80' : '#facc15' }}
                    />
                    {ativo ? 'ATIVO' : 'INATIVO'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right max-w-[42%]">
            <div
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ color: 'var(--on-primary, #ffffff)', opacity: 0.85 }}
            >
              Efetivação
            </div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--on-primary, #ffffff)' }}>
              {fmtDateBR(efetivacao)}
            </div>

            {tenantLogo && (
              <img
                src={tenantLogo}
                alt={tenantName}
                className="mt-3 object-contain ml-auto"
                style={{
                  maxWidth: fullscreen ? 120 : 100,
                  maxHeight: fullscreen ? 54 : 46,
                  width: '100%',
                  height: 'auto',
                  opacity: 0.5,
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.32))',
                }}
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </header>

        <div className="flex-1" />

        <footer className="relative z-[1] pt-1">
          <p
            className="leading-snug max-w-md"
            style={{
              fontSize: fullscreen ? 11 : 10,
              color: 'var(--on-primary, #ffffff)',
              opacity: 0.88,
            }}
          >
            Documento digital válido enquanto exibido pelo Associado. Em caso de dúvida, contate a unidade responsável.
          </p>

          {!printable && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => flipTo('front')}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
                style={{
                  background: uiSide === 'front' ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.16)',
                  color: '#0f172a',
                  backdropFilter: 'blur(6px)',
                }}
                aria-pressed={uiSide === 'front'}
              >
                Frente
              </button>
              <button
                type="button"
                onClick={() => flipTo('back')}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
                style={{
                  background: uiSide === 'back' ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.16)',
                  color: '#0f172a',
                  backdropFilter: 'blur(6px)',
                }}
                aria-pressed={uiSide === 'back'}
              >
                Verso
              </button>

              {fullscreen && (
                <div
                  className="ml-auto text-[11px] px-2 py-1.5 rounded-full"
                  style={{
                    color: 'rgba(15,23,42,0.90)',
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  Deslize para virar
                </div>
              )}
            </div>
          )}
        </footer>
      </>
    )
  }

  function Back() {
    return (
      <>
        <header className="relative flex items-start justify-between gap-4 z-[1]">
          <div className="min-w-0">
            <div
              className="text-[10px] uppercase tracking-[0.14em] font-medium opacity-90"
              style={{ color: 'var(--on-primary, #ffffff)' }}
            >
              {tenantName}
            </div>

            <div
              className="font-semibold mt-1"
              style={{
                color: 'var(--on-primary, #ffffff)',
                fontSize: fullscreen ? 16 : 14,
              }}
            >
              Carteirinha do Associado
            </div>

            <div
              className="mt-2 leading-snug"
              style={{
                color: 'var(--on-primary, #ffffff)',
                opacity: 0.92,
                fontSize: fullscreen ? 13 : 12,
              }}
            >
              CPF: <strong>{cpfShown || '—'}</strong>
              <br />
              Gerada em: <strong>{validade}</strong>
            </div>
          </div>

          {tenantLogo && (
            <div className="shrink-0 max-w-[40%]">
              <img
                src={tenantLogo}
                alt={tenantName}
                className="object-contain ml-auto"
                style={{
                  maxWidth: fullscreen ? 110 : 90,
                  maxHeight: fullscreen ? 52 : 44,
                  width: '100%',
                  height: 'auto',
                  opacity: 0.45,
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </header>

        <div className="flex-1" />

        <footer className="relative z-[1] flex items-end justify-between gap-4">
          <div className="max-w-[60%]">
            <p
              className="leading-snug"
              style={{
                fontSize: fullscreen ? 11 : 10,
                color: 'var(--on-primary, #ffffff)',
                opacity: 0.9,
              }}
            >
              Verifique esta carteirinha pelo site oficial da empresa ou escaneando o QR Code ao lado.
            </p>

            {tenantPhone && (
              <p
                className="mt-2"
                style={{
                  fontSize: fullscreen ? 11 : 10,
                  color: 'var(--on-primary, #ffffff)',
                  opacity: 0.9,
                }}
              >
                Contato da unidade: {tenantPhone}
              </p>
            )}
          </div>

          {qrDataUrl && (
            <div
              className="rounded-2xl p-2 shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <img
                src={qrDataUrl}
                alt="QR code de verificação"
                style={{
                  width: fullscreen ? 92 : 74,
                  height: fullscreen ? 92 : 74,
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </footer>

        {!printable && (
          <div className="mt-3 flex gap-2 z-[1]">
            <button
              type="button"
              onClick={() => flipTo('front')}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: uiSide === 'front' ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.16)',
                color: '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
              aria-pressed={uiSide === 'front'}
            >
              Frente
            </button>
            <button
              type="button"
              onClick={() => flipTo('back')}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: uiSide === 'back' ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.16)',
                color: '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
              aria-pressed={uiSide === 'back'}
            >
              Verso
            </button>

            {fullscreen && (
              <div
                className="ml-auto text-[11px] px-2 py-1.5 rounded-full"
                style={{
                  color: 'rgba(15,23,42,0.90)',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                Deslize para virar
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  const is3DFlip = fullscreen && !printable

  return (
    <section
      className={`relative mx-auto ${printable ? 'printable-card' : ''}`}
      style={cardStyle}
      aria-label={`Carteirinha do Associado • ${nome} (${uiSide === 'front' ? 'Frente' : 'Verso'})`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* brilho suave no topo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetInline: '-20%',
          top: '-20%',
          height: '40%',
          background:
            'radial-gradient(circle at 10% 0%, rgba(255,255,255,0.35) 0, transparent 60%)',
          opacity: printable ? 0 : 1,
          pointerEvents: 'none',
        }}
      />

      {/* MODO NORMAL */}
      {!is3DFlip && <>{uiSide === 'front' ? <Front /> : <Back />}</>}

      {/* MODO FULLSCREEN (flip 3D) */}
      {is3DFlip && (
        <div
          className="absolute inset-0"
          style={{
            perspective: 1200,
            WebkitPerspective: 1200,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transition: 'transform 520ms cubic-bezier(0.2, 0.9, 0.2, 1)',
              transform: uiSide === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Frente */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                padding: `${paddingPx}px`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Front />
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                padding: `${paddingPx}px`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Back />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
