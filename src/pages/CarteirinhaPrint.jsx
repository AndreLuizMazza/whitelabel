// src/pages/CarteirinhaPrint.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { getAvatarBlobUrl } from '@/lib/profile'
import BackButton from '@/components/BackButton'

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
    empresa?.logo ||
    empresa?.logoUrl ||
    empresa?.logo_path ||
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
      img.crossOrigin = 'anonymous'
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
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLogoCandidate])

  // Aguarda fontes, avatar e logo antes de liberar impressão
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

    return () => {
      cancelled = true
    }
  }, [avatarReady, logoReady])

  // ✅ Dispara impressão automática SOMENTE quando autoprint=1
  useEffect(() => {
    if (!autoprint) return
    if (!readyToPrint) return
    const t = setTimeout(() => {
      try {
        window.print()
      } catch {}
    }, 150)
    return () => clearTimeout(t)
  }, [readyToPrint, autoprint])

  const handlePrint = () => {
    try {
      window.print()
    } catch {}
  }

  const renderBoth = sideParam === 'both'
  const sides = useMemo(
    () => (renderBoth ? ['front', 'back'] : [sideParam]),
    [renderBoth, sideParam]
  )

  return (
    <div className="print-wrapper">
      <ScreenStyles />

      {/* Cabeçalho apenas quando não for autoprint */}
      {!autoprint && (
        <div className="no-print head-note">
          <div className="mb-4 flex items-center justify-between">
            <BackButton to="/carteirinha" className="mb-0" />
          </div>

          <h1 className="title">Impressão da carteirinha</h1>
          <p className="muted">
            Para melhor resultado, use “frente e verso” no navegador.
          </p>

          {!readyToPrint && (
            <p className="muted small">
              Preparando impressão{avatarUrl || tenantLogoUrl ? ' (carregando imagens)…' : '…'}
            </p>
          )}
        </div>
      )}

      {/* MOBILE: barra superior sticky */}
      {!autoprint && (
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
      )}

      {/* Conteúdo */}
      <div className="print-grid">
        {/* “Folha” central (tanto para preview quanto para print) */}
        <div className="sheet">
          {sides.map((side) => (
            <div key={side} className="card-physical">
              {/* IMPORTANTE:
                  - printable=true garante que o componente não mostre interações e respeite "side"
                  - injetamos avatar/logo já decodificados para evitar diferenças e re-fetch */}
                <CarteirinhaAssociado
                  user={user}
                  contrato={contrato}
                  printable
                  printMode="screenLike"
                  side={side === 'front' ? 'front' : 'back'}
                  matchContratoHeight={false}
                  loadAvatar={false}
                  fotoUrl={avatarUrl}
                  tenantLogoUrl={tenantLogoUrl}
                />
            </div>
          ))}
        </div>

        {/* DESKTOP: toolbar lateral */}
        {!autoprint && (
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

            <div className="hint">
              <div className="hint-title">Dica</div>
              <div className="hint-text">
                No diálogo de impressão, escolha <strong>Sem margens</strong> se disponível,
                e use <strong>Escala 100%</strong>.
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

/** CSS essencial */
function ScreenStyles() {
  return (
    <style>{`
      /* ===== PRINT ===== */
      @page {
        size: A4;
        margin: 12mm;
      }

      @media print {
        .no-print { display: none !important; }
        .sheet { box-shadow: none !important; border: none !important; background: transparent !important; }
        .print-wrapper { background: transparent !important; }
      }

      /* ===== SCREEN WRAPPER ===== */
      .print-wrapper {
        min-height: 100vh;
        background: var(--surface, #fff);
      }

      .head-note { padding: 16px; }
      .title { font-size: 1.125rem; font-weight: 700; margin: 0 0 4px; }
      .muted { opacity: .72; margin: 0; }
      .small { font-size: .875rem; margin-top: 8px; }

      /* GRID: folha + toolbar */
      .print-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        align-items: start;
        padding: 0 16px 24px;
      }
      @media (min-width: 1024px) {
        .print-grid {
          grid-template-columns: 1fr auto;
          gap: 24px;
          padding: 0 24px 32px;
        }
      }

      /* Toolbar lateral */
      .side-tools {
        position: sticky;
        top: 24px;
        align-self: start;
        display: none;
        gap: 12px;
        flex-direction: column;
      }
      @media (min-width: 1024px) {
        .side-tools { display: flex; }
      }

      .hint {
        border-radius: 16px;
        border: 1px solid var(--c-border, rgba(0,0,0,.10));
        background: color-mix(in srgb, var(--surface, #fff) 92%, #000000);
        padding: 12px 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,.08);
        max-width: 240px;
      }
      .hint-title { font-weight: 700; font-size: 12px; margin-bottom: 6px; opacity: .9; }
      .hint-text { font-size: 12px; opacity: .8; line-height: 1.35; }

      /* Mobile printbar */
      .mobile-printbar {
        position: sticky;
        top: 0;
        z-index: 40;
        padding: 10px 12px;
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
        font-weight: 700;
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
        cursor: not-allowed;
        opacity: .6;
      }

      /* ===== SHEET =====
         - Na tela: parece uma folha central (preview)
         - No print: vira só o conteúdo (sem borda/sombra via @media print)
      */
      .sheet {
        margin: 0 auto;
        max-width: 820px;
        width: 100%;
        border-radius: 20px;
        border: 1px solid var(--c-border, rgba(0,0,0,.08));
        background: color-mix(in srgb, var(--surface, #fff) 96%, #000000);
        box-shadow: 0 16px 44px rgba(0,0,0,.08);
        padding: 18px;
        display: grid;
        gap: 14mm;
        justify-items: center;
      }

      /* ===== CARTÃO EM TAMANHO REAL =====
         85.6mm × 54mm (ISO/IEC 7810 ID-1)
      */
      .card-physical {
        width: 85.6mm;
        height: 54mm;
        display: flex;
        align-items: center;
        justify-content: center;
        /* evita qualquer “estouro” de inline styles do card */
        overflow: hidden;
      }

      /* Na tela: deixa um pouco maior para visualização (não afeta impressão) */
      @media screen {
        .card-physical {
          transform: scale(1.35);
          transform-origin: top center;
        }
        @media (max-width: 480px) {
          .card-physical {
            transform: scale(1.05);
          }
        }
      }
    `}</style>
  )
}
