// src/pages/DependentesPage.jsx
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import { showToast } from '@/lib/toast'

import DependentesList from '@/components/DependentesList'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import { MemberGroupedList } from '@/components/member/MemberGroupedList'
import Skeleton from '@/components/ui/Skeleton.jsx'

function buildMeta({ nomePlano, numeroContrato, unidadeNome }) {
  const parts = []
  if (nomePlano) parts.push(formatDisplayLabel(nomePlano))
  if (numeroContrato) parts.push(`Contrato #${numeroContrato}`)
  if (unidadeNome) parts.push(formatDisplayLabel(unidadeNome))
  return parts.length ? parts.join(' · ') : null
}

export default function DependentesPage() {
  const location = useLocation()
  const state = location.state || {}

  const stateDependentes = state.dependentes || null
  const stateNumeroContrato = state.numeroContrato || null
  const stateNomePlano = state.nomePlano || null
  const stateUnidadeNome = state.unidadeNome || null
  const stateContrato = state.contrato || null

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

  const shouldFetchFromHook =
    !Array.isArray(stateDependentes) ||
    stateDependentes.length === 0 ||
    !stateContrato

  const {
    contrato,
    dependentes: hookDependentes,
    loading,
    erro,
  } = useContratoDoUsuario({ cpf })

  useEffect(() => {
    if (erro) {
      showToast(
        'Não foi possível carregar os dependentes. Tente novamente em instantes.'
      )
    }
  }, [erro])

  const dependentes = useMemo(() => {
    if (Array.isArray(stateDependentes) && stateDependentes.length > 0) {
      return stateDependentes
    }
    if (Array.isArray(hookDependentes)) {
      return hookDependentes
    }
    return []
  }, [stateDependentes, hookDependentes])

  const contratoFinal = stateContrato || contrato || null

  const numeroContrato =
    stateNumeroContrato ||
    contratoFinal?.numeroContrato ||
    contratoFinal?.id ||
    null

  const nomePlano =
    stateNomePlano ||
    contratoFinal?.nomePlano ||
    contratoFinal?.plano?.nome ||
    null

  const unidadeNome =
    stateUnidadeNome ||
    contratoFinal?.unidade?.nomeFantasia ||
    contratoFinal?.empresa?.razaoSocial ||
    null

  const meta = buildMeta({ nomePlano, numeroContrato, unidadeNome })
  const hasData = Array.isArray(dependentes) && dependentes.length > 0
  const isLoading = loading && shouldFetchFromHook && !hasData

  return (
    <div className="w-full max-w-6xl mx-auto">
      <MemberSubpageNav to="/area" label="Início" />

      <MemberSubpageHeader title="Dependentes" meta={meta} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <MemberGroupedList>
            <div className="px-4 py-4 space-y-3">
              <Skeleton className="h-[68px] rounded-lg" />
              <Skeleton className="h-[68px] rounded-lg" />
            </div>
          </MemberGroupedList>
        </div>
      ) : null}

      {!isLoading && hasData ? (
        <DependentesList dependentes={dependentes} contrato={contratoFinal} />
      ) : null}

      {!isLoading && !hasData ? (
        <MemberGroupedList>
          <div className="px-4 py-8 text-center">
            <p className="text-[17px] font-medium leading-snug" style={{ color: 'var(--text)' }}>
              Nenhum dependente cadastrado
            </p>
            <p
              className="text-[15px] mt-2 leading-relaxed max-w-sm mx-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              Se a informação estiver incorreta, fale com a unidade de atendimento.
            </p>
          </div>
        </MemberGroupedList>
      ) : null}
    </div>
  )
}
