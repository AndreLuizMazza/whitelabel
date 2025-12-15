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
}) {
  const prefersDark = usePrefersDark()
  const reducedMotion = usePrefersReducedMotion()
  const warnedRef = useRef(false)

  const [imgErro, setImgErro] = useState(false)

  // ✅ uiSide controla flip
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
            width: 220,
          })
          if (!disposed) setQrDataUrl(dataUrl)
        }
      } catch {}
    })()
    return () => {
      disposed = true
    }
  }, [cpfDigits, verifyUrl, qrDataUrl])

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

  // autoavaliação
  useEffect(() => {
    if (warnedRef.current) return
    if (!nome) showToast('Nome do titular ausente na carteirinha.')
    if (!plano) showToast('Plano não identificado.')
    if (!numero) showToast('Número do contrato ausente.')
    if (!cpfDigits || cpfDigits.length !== 11)
      showToast('CPF inválido ou não informado.')
    warnedRef.current = true
  }, [nome, plano, numero, cpfDigits])

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

  // ===== estilos =====
  const cardShadow = printable
    ? 'none'
    : prefersDark
    ? '0 18px 46px rgba(0,0,0,0.55)'
    : '0 18px 46px rgba(15,23,42,0.30)'

  // ✅ FIX: largura explícita => nunca colapsa no flex do page
  const cardWidth = printable ? '600px' : 'min(480px, 92vw)'

  const cardStyle = {
    width: cardWidth,
    ...(matchHeight && !printable
      ? { height: `${matchHeight}px` }
      : { aspectRatio: '85.6 / 54' }),
    marginTop: printable ? 0 : 'clamp(-4px, -0.4vw, -8px)',
    borderRadius: printable ? '14px' : '22px',
    boxShadow: cardShadow,
    overflow: 'hidden',
    color: 'var(--on-primary, #ffffff)',
    background:
      'radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--primary) 40%, transparent) 0, transparent 55%),' +
      'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, #000000) 0%, color-mix(in srgb, var(--primary) 60%, #ffffff) 55%, color-mix(in srgb, var(--primary) 42%, #ffffff) 100%)',
    position: 'relative',
    // flip setup
    perspective: printable ? 'none' : '1100px',
    WebkitPerspective: printable ? 'none' : '1100px',
  }

  const innerStyle = {
    position: 'absolute',
    inset: 0,
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transition: printable
      ? 'none'
      : reducedMotion
      ? 'none'
      : 'transform 560ms cubic-bezier(.2,.9,.2,1)',
    willChange: 'transform',
    transform: uiSide === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }

  const faceBase = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: printable ? '18px' : 'clamp(16px, 2.4vh, 20px)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  }

  const frontStyle = { ...faceBase }
  const backStyle = { ...faceBase, transform: 'rotateY(180deg)' }

  // shine/halo durante o flip
  const shineStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: printable ? 0 : 1,
    mixBlendMode: 'soft-light',
    background:
      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 55%),' +
      'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.14) 35%, transparent 70%)',
    transform: uiSide === 'back' ? 'translateX(-6%)' : 'translateX(6%)',
    transition: printable
      ? 'none'
      : reducedMotion
      ? 'none'
      : 'transform 560ms cubic-bezier(.2,.9,.2,1)',
  }

  const hintStyle = {
    position: 'absolute',
    right: '14px',
    bottom: '14px',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.26)',
    color: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 16px 44px rgba(0,0,0,0.25)',
    userSelect: 'none',
  }

  function toggleSide() {
    if (printable) return
    setUiSide((s) => (s === 'front' ? 'back' : 'front'))
  }

  return (
    <section
      className={`relative mx-auto ${printable ? 'printable-card' : ''}`}
      style={cardStyle}
      aria-label={`Carteirinha do Associado • ${nome}`}
      role={!printable ? 'button' : undefined}
      tabIndex={!printable ? 0 : -1}
      onClick={!printable ? toggleSide : undefined}
      onKeyDown={
        !printable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleSide()
              }
            }
          : undefined
      }
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
        }}
      />

      {/* shine do flip */}
      <div aria-hidden="true" style={shineStyle} />

      {/* hint discreto */}
      {!printable && <div aria-hidden="true" style={hintStyle}>Toque para virar</div>}

      {/* ===================== FLIP INNER ===================== */}
      <div style={innerStyle}>
        {/* ===================== FRENTE ===================== */}
        <div style={frontStyle} aria-hidden={uiSide === 'back'}>
          <header className="relative flex items-start justify-between gap-4 z-[1]">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative shrink-0">
                {avatarUrl && !imgErro ? (
                  <img
                    src={avatarUrl}
                    alt={nome}
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
                      background:
                        'color-mix(in srgb, var(--primary) 60%, #000000)',
                      border:
                        '2px solid color-mix(in srgb, var(--primary) 60%, transparent)',
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
                    fontSize: `${fontForName(nome)}px`,
                    color: 'var(--on-primary, #ffffff)',
                    wordBreak: 'break-word',
                    ...(printable
                      ? {}
                      : {
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
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
                    fontSize: `${fontForPlano(plano)}px`,
                    color: 'var(--on-primary, #ffffff)',
                    opacity: 0.96,
                    wordBreak: 'break-word',
                    ...(printable
                      ? {}
                      : {
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }),
                  }}
                >
                  {plano}
                </div>

                <div className="mt-1 flex items-center flex-wrap gap-2">
                  <span
                    className="text-[11px] opacity-90"
                    style={{ color: 'var(--on-primary, #ffffff)' }}
                  >
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
                        style={{
                          backgroundColor: ativo ? '#4ade80' : '#facc15',
                        }}
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
                style={{
                  color: 'var(--on-primary, #ffffff)',
                  opacity: 0.85,
                }}
              >
                Efetivação
              </div>
              <div
                className="text-[13px] font-semibold"
                style={{ color: 'var(--on-primary, #ffffff)' }}
              >
                {fmtDateBR(efetivacao)}
              </div>

              {tenantLogo && (
                <img
                  src={tenantLogo}
                  alt={tenantName}
                  className="mt-3 object-contain ml-auto"
                  style={{
                    maxWidth: 100,
                    maxHeight: 46,
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
              className="text-[10px] leading-snug max-w-md"
              style={{
                color: 'var(--on-primary, #ffffff)',
                opacity: 0.88,
              }}
            >
              Documento digital válido enquanto exibido pelo Associado. Em caso
              de dúvida, contate a unidade responsável.
            </p>

            {!printable && (
              <div className="mt-3 flex gap-2">
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
        </div>

        {/* ===================== VERSO ===================== */}
        <div style={backStyle} aria-hidden={uiSide === 'front'}>
          <header className="relative flex items-start justify-between gap-4 z-[1]">
            <div className="min-w-0">
              <div
                className="text-[10px] uppercase tracking-[0.14em] font-medium opacity-90"
                style={{ color: 'var(--on-primary, #ffffff)' }}
              >
                {tenantName}
              </div>

              <div
                className="text-[14px] font-semibold mt-1"
                style={{ color: 'var(--on-primary, #ffffff)' }}
              >
                Carteirinha do Associado
              </div>

              <div
                className="text-[12px] mt-2 leading-snug"
                style={{
                  color: 'var(--on-primary, #ffffff)',
                  opacity: 0.92,
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
                    maxWidth: 90,
                    maxHeight: 44,
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
                className="text-[10px] leading-snug"
                style={{
                  color: 'var(--on-primary, #ffffff)',
                  opacity: 0.9,
                }}
              >
                Verifique esta carteirinha pelo site oficial da empresa ou
                escaneando o QR Code ao lado.
              </p>

              {tenantPhone && (
                <p
                  className="text-[10px] mt-2"
                  style={{
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
                  style={{ width: 74, height: 74 }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </footer>

          {!printable && (
            <div className="mt-3 flex gap-2 z-[1]">
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
        </div>
      </div>
    </section>
  )
}
