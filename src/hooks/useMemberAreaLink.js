import { useEffect, useState } from 'react'
import useAuth from '@/store/auth'
import {
  fetchAuthenticatedCpf,
  fetchContratosForCpf,
  POST_AUTH_DEFAULT,
} from '@/lib/postAuthNavigation'

/**
 * Resolve destino de links públicos para a área do associado.
 * Sem login → /login; com contrato → memberPath; sem contrato → /planos.
 */
export default function useMemberAreaLink(memberPath, loginFrom = memberPath) {
  const isLogged = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )
  const [to, setTo] = useState('/login')
  const [state, setState] = useState(undefined)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!isLogged) {
      setTo('/login')
      setState({ from: { pathname: loginFrom } })
      setChecking(false)
      return undefined
    }

    let alive = true
    setChecking(true)

    ;(async () => {
      const cpf = await fetchAuthenticatedCpf()
      const contratos = cpf ? await fetchContratosForCpf(cpf) : null
      if (!alive) return

      if (Array.isArray(contratos) && contratos.length > 0) {
        setTo(memberPath)
        setState(undefined)
      } else {
        setTo(POST_AUTH_DEFAULT)
        setState({ onboarding: true, reason: 'no_contract' })
      }
      setChecking(false)
    })()

    return () => {
      alive = false
    }
  }, [isLogged, memberPath, loginFrom])

  const hasMemberAccess = isLogged && !checking && to === memberPath

  return { to, state, isLogged, checking, hasMemberAccess }
}
