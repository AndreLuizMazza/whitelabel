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

  // Dispara diálogo de impressão somente quando tudo estiver ok
  useEffect(() => {
    if (!readyToPrint) return
    const t = setTimeout(() => {
      try { window.print() } catch {}
    }, 150)
    return () => clearTimeout(t)
  }, [readyToPrint])

  const renderBoth = sideParam === 'both'
  const sides = useMemo(
    () => (renderBoth ? ['front', 'back'] : [sideParam]),
    [renderBoth, sideParam]
  )

  return (
    <div className="print-wrapper">
      {/* Cabeçalho apenas quando não for autoprint */}
      {!autoprint && (
        <div className="no-print" style={{ padding: 16 }}>
          <h1 className="text-lg font-semibold">Impressão da carteirinha</h1>
          <p style={{ opacity: .7 }}>
            Use a impressão frente e verso do navegador para produzir o cartão físico.
          </p>
          {!readyToPrint && (
            <p className="mt-2 text-sm" style={{ opacity: .7 }}>
              Preparando impressão{avatarUrl || tenantLogoUrl ? ' (carregando imagens)…' : '…'}
            </p>
          )}
        </div>
      )}

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
              loadAvatar={false}           // evita refetch — usaremos o blob desta página
              fotoUrl={avatarUrl}          // prioriza avatar pré-carregado
              tenantLogoUrl={tenantLogoUrl} // injeta logo já decodificada
            />
          </div>
        ))}
      </div>
    </div>
  )
}
