// src/pages/CarteirinhaPrint.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import useAuth from '@/store/auth'
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

  // avatar pré-carregado para impressão (Blob URL via BFF)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [readyToPrint, setReadyToPrint] = useState(false)

  useEffect(() => {
    let revoked = false
    let currentUrl = ''

    ;(async () => {
      try {
        const url = await getAvatarBlobUrl().catch(() => '')
        if (revoked) return
        currentUrl = url || ''
        setAvatarUrl(currentUrl)

        // Se houver avatar, aguarde a decodificação de imagem
        if (currentUrl) {
          const img = new Image()
          img.src = currentUrl
          try {
            if ('decode' in img) {
              await img.decode()
            } else {
              await new Promise((res) => {
                img.onload = () => res()
                img.onerror = () => res() // não bloqueia em caso de erro
              })
            }
          } catch {
            // não bloqueia
          }
        }

        // Aguarda fontes e um frame de render antes de imprimir
        try {
          if ('fonts' in document && document.fonts?.ready) {
            await document.fonts.ready
          }
        } catch {}
        await new Promise((r) => requestAnimationFrame(() => r()))
        setReadyToPrint(true)
      } catch {
        setReadyToPrint(true) // não bloqueia
      }
    })()

    return () => {
      revoked = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [])

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
              Preparando impressão{avatarUrl ? ' (carregando foto do avatar)…' : '…'}
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
            />
          </div>
        ))}
      </div>
    </div>
  )
}
