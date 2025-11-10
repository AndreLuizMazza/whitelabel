// src/pages/CarteirinhaPrint.jsx
import { useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import useAuth from '@/store/auth'

/**
 * Como navegar para cá:
 * <Link to="/carteirinha/print" state={{ user, contrato, side: 'both' }}>Imprimir</Link>
 * ou /carteirinha/print?side=front|back|both
 */
export default function CarteirinhaPrint() {
  const { state } = useLocation()
  const [params] = useSearchParams()
  const sideParam = (params.get('side') || state?.side || 'both').toLowerCase()

  // fallback seguro: usa auth quando não vier por state
  const userFromStore = useAuth((s) => s.user)
  const user = state?.user || userFromStore || {}
  const contrato = state?.contrato || state?.data || {}

  // dispara diálogo de impressão após render
  useEffect(() => {
    const t = setTimeout(() => {
      try { window.print() } catch {}
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const renderBoth = sideParam === 'both'
  const sides = useMemo(
    () => (renderBoth ? (['front', 'back']) : [sideParam]),
    [renderBoth, sideParam]
  )

  return (
    <div className="print-wrapper">
      {/* título só na tela */}
      <div className="no-print" style={{ padding: 16 }}>
        <h1 className="text-lg font-semibold">Impressão da carteirinha</h1>
        <p style={{ opacity: .7 }}>
          Use a impressão frente e verso do navegador para produzir o cartão físico.
        </p>
      </div>

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
            />
          </div>
        ))}
      </div>
    </div>
  )
}
