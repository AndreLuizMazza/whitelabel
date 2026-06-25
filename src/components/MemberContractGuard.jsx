import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import {
  fetchAuthenticatedCpf,
  POST_AUTH_DEFAULT,
} from '@/lib/postAuthNavigation'

/**
 * Bloqueia a área do associado quando o usuário está autenticado mas não tem contrato.
 */
export default function MemberContractGuard({ children }) {
  const sessionReady = useAuth((s) => s.sessionReady)
  const user = useAuth((s) => s.user)
  const [cpf, setCpf] = useState('')
  const [cpfReady, setCpfReady] = useState(false)

  useEffect(() => {
    if (!sessionReady) return undefined

    let alive = true
    const fromUser = String(user?.cpf || user?.documento || '').replace(/\D/g, '')

    if (fromUser.length >= 11) {
      setCpf(fromUser)
      setCpfReady(true)
      return undefined
    }

    setCpfReady(false)
    fetchAuthenticatedCpf()
      .then((resolved) => {
        if (alive) setCpf(resolved)
      })
      .finally(() => {
        if (alive) setCpfReady(true)
      })

    return () => {
      alive = false
    }
  }, [sessionReady, user?.cpf, user?.documento, user?.id])

  const { contratos, contrato, loading, erro } = useContratoDoUsuario({ cpf })

  if (!sessionReady || !cpfReady || loading) {
    return (
      <div
        className="min-h-[40dvh] flex items-center justify-center px-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Carregando sua área…
        </p>
      </div>
    )
  }

  const semContrato =
    !erro &&
    Array.isArray(contratos) &&
    contratos.length === 0 &&
    !contrato

  if (semContrato) {
    return (
      <Navigate
        to={POST_AUTH_DEFAULT}
        replace
        state={{ onboarding: true, reason: 'no_contract' }}
      />
    )
  }

  return children
}
