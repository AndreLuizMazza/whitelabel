// src/components/CarteirinhaAssociado.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { showToast } from '@/lib/toast'
import useTenant from '@/store/tenant'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { getAvatarBlobUrl } from '@/lib/profile'

/* utils */
const onlyDigits = (v = '') => String(v).replace(/\D+/g, '')
const initials = (name = '') =>
  String(name).trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('')

const fmtDateBR = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const d = t.split('T')[0]
  const [Y, M, D] = d.split('-')
  return (Y && M && D) ? `${D}/${M}/${Y}` : t
}
const todayBR = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function usePrefersDark() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
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
const fontForName = (n = '') => (String(n).length > 48 ? 13 : String(n).length > 38 ? 14 : 15)

export default function CarteirinhaAssociado({
  user = {}, contrato = {}, printable = false, side = 'front',
  matchContratoHeight = true, loadAvatar = true, fotoUrl = null,
}) {
  const prefersDark = usePrefersDark()
  const warnedRef = useRef(false)
  const [imgErro, setImgErro] = useState(false)
  const [uiSide, setUiSide] = useState(side)
  const [matchHeight, setMatchHeight] = useState(null)

  // avatar
  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null)
  const lastObjUrlRef = useRef(null)

  // tenant
  const empresa = useTenant(s => s.empresa)
  const tenantName = empresa?.nomeFantasia || empresa?.razaoSocial || 'Sua Marca'
  const tenantLogo =
    empresa?.logo || empresa?.logoUrl || empresa?.logo_path ||
    (typeof window !== 'undefined' && window.__TENANT__?.logo) || '/img/logo.png'
  const tenantPhone = empresa?.telefone || empresa?.whatsapp || ''
  const verifyBase = empresa?.siteOficial || empresa?.dominio || (typeof window !== 'undefined' ? window.location.origin : '')

  // dados
  const nome = contrato.nomeTitular || user?.nome || user?.name || 'Associado(a)'
  const plano = contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano'
  const numero = contrato.numeroContrato ?? contrato.id ?? contrato.contratoId ?? '—'
  const efetivacao = contrato.dataEfetivacao ?? contrato.dataContrato ?? contrato.criadoEm ?? ''
  const ativo = contrato.contratoAtivo ?? (String(contrato.status || '').toUpperCase() === 'ATIVO')
  const fotoDeclarada = user?.fotoUrl || user?.photoURL || contrato?.fotoTitular || ''
  const cpf = user?.cpf || contrato?.cpfTitular || ''
  const cpfShown = useMemo(() => (printable ? formatCPF(cpf) : displayCPF(cpf, 'last2')), [cpf, printable])

  // verificação / QR opcional
  const verifyPath = `/verificar/${encodeURIComponent(numero)}`
  const verifyUrl = `${verifyBase}${verifyPath}`
  const qrCodeUrl = contrato?.qrCodeUrl || contrato?.qr || ''
  const validade = todayBR()

  // carregar avatar via BFF
  useEffect(() => {
    let active = true
    if (!loadAvatar) {
      if (lastObjUrlRef.current) { URL.revokeObjectURL(lastObjUrlRef.current); lastObjUrlRef.current = null }
      setAvatarBlobUrl(null)
      return
    }
    async function load() {
      try {
        const objUrl = await getAvatarBlobUrl()
        if (!active) { if (objUrl) URL.revokeObjectURL(objUrl); return }
        if (lastObjUrlRef.current) URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = objUrl || null
        setAvatarBlobUrl(objUrl || null)
        setImgErro(false)
      } catch { setAvatarBlobUrl(null) }
    }
    load()
    return () => {
      active = false
      if (lastObjUrlRef.current) { URL.revokeObjectURL(lastObjUrlRef.current); lastObjUrlRef.current = null }
    }
  }, [loadAvatar, user?.id, user?.email, cpf, contrato?.pessoaId])

  const avatarUrl = fotoUrl || avatarBlobUrl || fotoDeclarada || ''

  // autoavaliação
  useEffect(() => {
    if (warnedRef.current) return
    if (!nome) showToast('Nome do titular ausente na carteirinha.')
    if (!plano) showToast('Plano não identificado.')
    if (!numero) showToast('Número do contrato ausente.')
    if (!cpf || onlyDigits(cpf).length < 11) showToast('CPF inválido ou não informado.')
    warnedRef.current = true
  }, [nome, plano, numero, cpf])

  // equalizar altura ao card do contrato
  useEffect(() => {
    if (!matchContratoHeight || printable || typeof window === 'undefined') return
    const target = document.getElementById('contrato-card-root')
    if (!target) return
    const isDesktop = () => window.matchMedia?.('(min-width: 1024px)').matches
    const apply = () => {
      if (isDesktop()) setMatchHeight(Math.max(240, Math.round(target.getBoundingClientRect().height)))
      else setMatchHeight(null)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(target)
    window.addEventListener('resize', apply)
    return () => { try { ro.disconnect() } catch {} window.removeEventListener('resize', apply) }
  }, [matchContratoHeight, printable])

  const T = useMemo(() => ({
    gradTopPct: prefersDark ? 6 : 10,
    ringPct: prefersDark ? 32 : 38,
    badgeBgPct: prefersDark ? 14 : 16,
    textMuted: 'var(--text-muted)',
    text: 'var(--text)',
    shadow: printable ? 'none'
      : prefersDark ? '0 10px 28px rgba(0,0,0,0.28), 0 3px 9px rgba(0,0,0,0.20)'
      : '0 10px 28px rgba(0,0,0,0.10), 0 3px 9px rgba(0,0,0,0.06)'
  }), [prefersDark, printable])

  const cardStyle = {
    maxWidth: printable ? '600px' : '480px',
    width: '100%',
    ...(matchHeight && !printable ? { height: `${matchHeight}px` } : { aspectRatio: '85.6 / 54' }),
    marginTop: printable ? 0 : 'clamp(-4px, -0.4vw, -8px)',
    padding: printable ? '18px' : 'clamp(14px, 2.2vh, 18px)',
    background: 'var(--surface)',
    backgroundImage: `linear-gradient(180deg,
      color-mix(in srgb, var(--primary) ${T.gradTopPct}%, var(--surface)) 0%,
      var(--surface) 70%,
      color-mix(in srgb, var(--primary) 4%, var(--surface)) 100%)`,
    border: '1px solid var(--c-border)',
    borderRadius: printable ? '12px' : '16px',
    boxShadow: T.shadow,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }

  const sideToRender = printable ? side : uiSide

  return (
    <section
      className={`card relative mx-auto ${printable ? 'printable-card' : ''}`}
      style={cardStyle}
      aria-label={`Carteirinha do Associado • ${nome} (${sideToRender === 'front' ? 'Frente' : 'Verso'})`}
    >
      {/* faixa superior */}
      <div aria-hidden="true" style={{
        position: 'absolute', insetInline: 0, top: 0, height: printable ? '5px' : '6px',
        background: 'linear-gradient(90deg, color-mix(in srgb, var(--primary) 55%, transparent), transparent 60%)'
      }} />

      {sideToRender === 'front' ? (
        <>
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* avatar */}
              <div className="relative shrink-0" aria-label={`Foto de ${nome}`}>
                {avatarUrl && !imgErro ? (
                  <img
                    src={avatarUrl}
                    alt={nome}
                    className="rounded-full object-cover"
                    style={{ width: 58, height: 58, border: `2px solid color-mix(in srgb, var(--primary) ${T.ringPct}%, transparent)` }}
                    onError={() => { setImgErro(true); if (avatarBlobUrl && lastObjUrlRef.current === avatarBlobUrl) { URL.revokeObjectURL(avatarBlobUrl); lastObjUrlRef.current = null; setAvatarBlobUrl(null) } }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="rounded-full flex items-center justify-center font-semibold"
                    style={{ width: 58, height: 58, background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
                      color: 'var(--primary)', border: `2px solid color-mix(in srgb, var(--primary) ${T.ringPct}%, transparent)` }}>
                    {initials(nome)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: `color-mix(in srgb, var(--primary) ${T.badgeBgPct}%, ${prefersDark ? 'black' : 'white'})`,
                    color: 'var(--primary)', border: '1px solid var(--c-border)', backdropFilter: 'blur(3px)' }}>
                  {ativo ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.06em] font-medium" style={{ color: T.textMuted }}>
                  Carteirinha do Associado • {tenantName}
                </div>
                <div title={nome} className="leading-tight font-semibold"
                  style={{ color: T.text, fontSize: `${fontForName(nome)}px`, lineHeight: 1.1,
                    maxHeight: printable ? 'unset' : '2.2em', display: printable ? 'block' : '-webkit-box',
                    WebkitLineClamp: printable ? 'unset' : 2, WebkitBoxOrient: printable ? 'unset' : 'vertical',
                    overflow: 'hidden', wordBreak: 'break-word' }}>
                  {nome}
                </div>
                <div className="text-[11px] lg:text-[12px] font-medium break-words" style={{ color: T.text }}>
                  Plano: {plano} • Contrato #{numero}
                </div>
              </div>
            </div>

            {/* Efetivação */}
            <div className="text-right shrink-0">
              <div className="text-[10px]" style={{ color: T.textMuted }}>Efetivação</div>
              <div className="text-[12px] font-semibold" style={{ color: T.text }}>
                {fmtDateBR(efetivacao)}
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-[18px]" />

          <footer className="pt-1">
            <div className="text-[9px]" style={{ color: T.textMuted }}>
              Documento digital válido enquanto exibido pelo titular.
            </div>

            {!printable && (
              <div className="mt-2 flex gap-1 self-start">
                <button type="button" onClick={() => setUiSide('front')}
                  className="px-2 py-1 rounded text-[11px]"
                  style={{ background: uiSide === 'front' ? 'var(--nav-active-bg)' : 'var(--surface)',
                    color: uiSide === 'front' ? 'var(--nav-active-color)' : T.text,
                    border: '1px solid var(--c-border)' }} aria-pressed={uiSide === 'front'}>
                  Frente
                </button>
                <button type="button" onClick={() => setUiSide('back')}
                  className="px-2 py-1 rounded text-[11px]"
                  style={{ background: uiSide === 'back' ? 'var(--nav-active-bg)' : 'var(--surface)',
                    color: uiSide === 'back' ? 'var(--nav-active-color)' : T.text,
                    border: '1px solid var(--c-border)' }} aria-pressed={uiSide === 'back'}>
                  Verso
                </button>
              </div>
            )}
          </footer>
        </>
      ) : (
        <>
          <header className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.06em] font-medium" style={{ color: T.textMuted }}>
                {tenantName}
              </div>
              <div className="text-[13px] font-semibold" style={{ color: T.text }}>
                Carteirinha do Associado
              </div>
              <div className="mt-1 text-[11px]" style={{ color: T.text }}>
                CPF: <strong>{cpfShown || '—'}</strong><br />
                Validade: <strong>{validade}</strong>
              </div>
            </div>

            <div className="shrink-0">
              <img src={tenantLogo} alt={tenantName} className="object-contain"
                   style={{ width: 90, height: 48, filter: printable ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
                   referrerPolicy="no-referrer" />
            </div>
          </header>

          <div className="flex-1" />

          <footer>
            <div className="grid grid-cols-3 gap-8 items-center">
              <div className="col-span-2 text-[10px]" style={{ color: T.textMuted }}>
                Verifique a autenticidade: <strong>{verifyUrl}</strong>
              </div>
              {qrCodeUrl && (
                <div className="justify-self-end">
                  <img src={qrCodeUrl} alt="QR code de verificação" style={{ width: 76, height: 76 }} referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {tenantPhone && (
              <div className="mt-2 text-[10px]" style={{ color: T.textMuted }}>
                Contato da unidade: {tenantPhone}
              </div>
            )}

            <div className="mt-2 text-[9px]" style={{ color: T.textMuted }}>
              Em caso de achado, favor devolver à {tenantName}.
            </div>

            {!printable && (
              <div className="mt-2 flex gap-1 self-start">
                <button type="button" onClick={() => setUiSide('front')}
                        className="px-2 py-1 rounded text-[11px]"
                        style={{ background: uiSide === 'front' ? 'var(--nav-active-bg)' : 'var(--surface)',
                          color: uiSide === 'front' ? 'var(--nav-active-color)' : T.text,
                          border: '1px solid var(--c-border)' }} aria-pressed={uiSide === 'front'}>
                  Frente
                </button>
                <button type="button" onClick={() => setUiSide('back')}
                        className="px-2 py-1 rounded text-[11px]"
                        style={{ background: uiSide === 'back' ? 'var(--nav-active-bg)' : 'var(--surface)',
                          color: uiSide === 'back' ? 'var(--nav-active-color)' : T.text,
                          border: '1px solid var(--c-border)' }} aria-pressed={uiSide === 'back'}>
                  Verso
                </button>
              </div>
            )}
          </footer>
        </>
      )}
    </section>
  )
}
