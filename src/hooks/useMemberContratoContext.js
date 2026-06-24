import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'

export default function useMemberContratoContext() {
  const location = useLocation()
  const state = location.state || {}

  const user = useAuth((s) => s.user)
  const cpf =
    user?.cpf ||
    user?.documento ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || '{}').cpf
      } catch {
        return ''
      }
    })() ||
    ''

  const { contrato, loading, erro } = useContratoDoUsuario({ cpf })

  const nomePlano = contrato?.nomePlano ?? contrato?.plano?.nome ?? state.nomePlano ?? null
  const numeroContrato = contrato?.numeroContrato ?? contrato?.id ?? state.numeroContrato ?? null
  const unidadeNome =
    contrato?.unidade?.nomeFantasia ??
    contrato?.unidade?.razaoSocial ??
    state.unidadeNome ??
    null

  const planoId = useMemo(
    () => contrato?.planoId || contrato?.plano_id || contrato?.plano?.id || state.planoId || null,
    [contrato, state.planoId]
  )

  return {
    user,
    cpf,
    contrato,
    loading,
    erro,
    nomePlano,
    numeroContrato,
    unidadeNome,
    planoId,
    routeState: state,
  }
}
