// src/pages/CarteirinhaPrint.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { getAvatarBlobUrl } from '@/lib/profile'

/**
 * Navegação:
 *  - Nova aba direta:
 *      /carteirinha/print?side=front|back|both&autoprint=1
 *  - (opcional) Via Link com state:
 *      <Link to="/carteirinha/print" state={{ user, contrato, side: 'both' }}>Imprimir</Link>
 */
export default function CarteirinhaPrint() {
  const { state } = useLocation()
  const [params] = useSearchParams()

  const sideParam = (params.get('side') || state?.side || 'both').toLowerCase()
  const autoprint = params.get('autoprint') === '1'

  // fallback seguro: usa auth quando não vier por state
  const userFromStore = useAuth((s) => s.user)
  const user = state?.user || userFromStore || {}
  const contrato = state?.contrato || state?.data || {}

  // tenant (para logo)
  const empresa = useTenant((s) => s.empresa)
  const tenantLogoCandidate =
    empresa?.logo || empresa?.logoUrl || empresa?.logo_path ||
    (typeof window !== 'undefined' && window.__TENANT__?.logo) ||
    '/img/logo.png'

  // estados de pré-carregamento
  const [avatarUrl, setAvatarUrl] = useState('')
  const [tenantLogoUrl, setTenantLogoUrl] = useState(tenantLogoCandidate || '')
  const [avatarReady, setAvatarReady] = useState(false)
  const [logoReady, setLogoReady] = useState(false)
  const [readyToPrint, setReadyToPrint] = useState(false)

  // util para decodificar imagem (não falha a cadeia se der erro)
  const decodeImage = async (url) => {
    if (!url) return true
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous' // não atrapalha; ajuda se CORS permitir
      img.src = url
      if ('decode' in img) {
        await img.decode()
      } else {
        await new Promise((res) => {
          img.onload = () => res()
          img.onerror = () => res()
        })
      }
      return true
    } catch {
      return true
    }
  }

  // carrega avatar (blob via BFF) e decodifica
  useEffect(() => {
    let revoked = false
    let currentUrl = ''

    ;(async () => {
      try {
        const url = await getAvatarBlobUrl().catch(() => '')
        if (revoked) return
        currentUrl = url || ''
        setAvatarUrl(currentUrl)
        await decodeImage(currentUrl)
        if (!revoked) setAvatarReady(true)
      } catch {
        if (!revoked) setAvatarReady(true)
      }
    })()

    return () => {
      revoked = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [])

  // garante URL da logo e decodifica
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const url = tenantLogoCandidate || ''
        setTenantLogoUrl(url)
        await decodeImage(url)
        if (!cancelled) setLogoReady(true)
      } catch {
        if (!cancelled) setLogoReady(true)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLogoCandidate])

  // Aguarda fontes, avatar e logo antes de imprimir
  useEffect(() => {
    if (!(avatarReady && logoReady)) return
    let cancelled = false

    ;(async () => {
      try {
        if ('fonts' in document && document.fonts?.ready) {
          await document.fonts.ready
        }
      } catch {}
      await new Promise((r) => requestAnimationFrame(() => r()))
      if (!cancelled) setReadyToPrint(true)
    })()

    return () => { cancelled = true }
  }, [avatarReady, logoReady])

  // Dispara diálogo de impressão automaticamente (comportamento original preservado)
  useEffect(() => {
    if (!readyToPrint) return
    const t = setTimeout(() => {
      try { window.print() } catch {}
    }, 150)
    return () => clearTimeout(t)
  }, [readyToPrint])

  const handlePrint = () => {
    try { window.print() } catch {}
  }

  const renderBoth = sideParam === 'both'
  const sides = useMemo(
    () => (renderBoth ? ['front', 'back'] : [sideParam]),
    [renderBoth, sideParam]
  )

  return (
    <div className="print-wrapper">
      <ScreenStyles />

      {/* Cabeçalho apenas quando não for autoprint (desktop e mobile) */}
      {!autoprint && (
        <div className="no-print head-note">
          <h1 className="title">Impressão da carteirinha</h1>
          <p className="muted">
            Use a impressão frente e verso do navegador para produzir o cartão físico.
          </p>
          {!readyToPrint && (
            <p className="muted small">
              Preparando impressão{avatarUrl || tenantLogoUrl ? ' (carregando imagens)…' : '…'}
            </p>
          )}
        </div>
      )}

      {/* MOBILE: barra superior sticky com o botão Imprimir (fica longe do CTA inferior) */}
      <div className="no-print mobile-printbar">
        <button
          type="button"
          onClick={handlePrint}
          disabled={!readyToPrint}
          className="btn-primary"
          aria-label="Imprimir carteirinha"
          title="Imprimir carteirinha"
        >
          🖨️ Imprimir
        </button>
      </div>

      {/* LAYOUT EM GRADE: folha + toolbar lateral (desktop) */}
      <div className="print-grid">
        {/* Folha A4 com cartões em tamanho físico (mm) */}
        <div className="sheet-a4">
          {sides.map((side) => (
            <div key={side} className="card-physical">
              <CarteirinhaAssociado
                user={user}
                contrato={contrato}
                printable
                side={side === 'front' ? 'front' : 'back'}
                matchContratoHeight={false}
                loadAvatar={false}            // evita refetch — usaremos o blob desta página
                fotoUrl={avatarUrl}           // prioriza avatar pré-carregado
                tenantLogoUrl={tenantLogoUrl} // injeta logo já decodificada
              />
            </div>
          ))}
        </div>

        {/* DESKTOP: toolbar lateral sticky, sempre próxima da folha */}
        <aside className="no-print side-tools">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!readyToPrint}
            className="btn-ghost"
            aria-label="Imprimir carteirinha"
            title="Imprimir carteirinha"
          >
            🖨️ Imprimir
          </button>
        </aside>
      </div>
    </div>
  )
}

/** CSS essencial (sem depender do seu pipeline) */
function ScreenStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .mobile-printbar { display: none !important; }
        .side-tools { display: none !important; }
      }

      .head-note { padding: 16px; }
      .title { font-size: 1.125rem; font-weight: 600; margin: 0 0 4px; }
      .muted { opacity: .7; margin: 0; }
      .small { font-size: .875rem; margin-top: 8px; }

      /* Grade: folha + toolbar lateral (só ativa no desktop) */
      .print-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        align-items: start;
      }
      @media (min-width: 1024px) {
        .print-grid {
          grid-template-columns: 1fr auto; /* folha | toolbar */
          gap: 24px;
        }
      }

      /* Toolbar lateral (desktop) */
      .side-tools {
        position: sticky;
        top: 24px;
        align-self: start;
        display: none;
      }
      @media (min-width: 1024px) {
        .side-tools { display: flex; flex-direction: column; gap: 12px; }
      }

      /* Barra superior (mobile) */
      .mobile-printbar {
        position: sticky;
        top: 0;
        z-index: 40;
        padding: 8px 12px;
        background: var(--surface, #fff);
        border-bottom: 1px solid var(--c-border, rgba(0,0,0,.08));
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      @media (min-width: 1024px) {
        .mobile-printbar { display: none; }
      }

      /* Botões */
      .btn-primary, .btn-ghost {
        border-radius: 12px;
        font-weight: 600;
        padding: 10px 14px;
        border: 1px solid var(--c-border, rgba(0,0,0,.12));
        background: var(--surface, #fff);
        color: var(--text, #0b1220);
        box-shadow: 0 6px 24px rgba(0,0,0,.08);
        transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
        cursor: pointer;
      }
      .btn-primary:active, .btn-ghost:active {
        transform: translateY(1px);
        box-shadow: 0 3px 16px rgba(0,0,0,.12);
      }
      .btn-primary[disabled], .btn-ghost[disabled] {
        cursor: not-allowed; opacity: .6;
      }

      /* Você já tem estilos para .sheet-a4 e .card-physical;
         mantive-os como estão no seu projeto. */
    `}</style>
  )
}
