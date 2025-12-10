// src/pages/DependentesPage.jsx
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import { showToast } from '@/lib/toast'

import DependentesList from '@/components/DependentesList'
import BackButton from '@/components/BackButton'

function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

export default function DependentesPage() {
  const location = useLocation()
  const state = location.state || {}

  // Dados que podem vir da Área do Associado
  const stateDependentes = state.dependentes || null
  const stateNumeroContrato = state.numeroContrato || null
  const stateNomePlano = state.nomePlano || null
  const stateUnidadeNome = state.unidadeNome || null
  const stateContrato = state.contrato || null

  const user = useAuth((s) => s.user)

  // CPF para buscar contratos quando a navegação vem do menu
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

  const hasData = Array.isArray(dependentes) && dependentes.length > 0
  const isLoading = loading && shouldFetchFromHook && !hasData

  return (
    <section className="section">
      <div className="container-max">
        <div className="mb-4">
          <BackButton to="/area" />
        </div>

        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">
            Área do associado
          </p>

          <h1 className="text-2xl font-semibold mt-1">
            Dependentes e Beneficiários
          </h1>

          {(nomePlano || numeroContrato || unidadeNome) && (
            <p className="text-sm mt-1 opacity-75">
              {nomePlano && (
                <>
                  Plano <strong>{nomePlano}</strong>
                </>
              )}
              {numeroContrato && <> • Contrato #{numeroContrato}</>}
              {unidadeNome && <> • Administrado por {unidadeNome}</>}
            </p>
          )}
        </header>

        {isLoading && (
          <div className="card p-5">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-20 mb-2" />
            <Skeleton className="h-20 mb-2" />
          </div>
        )}

        {!isLoading && hasData && (
          <DependentesList dependentes={dependentes} contrato={contratoFinal} />
        )}

        {!isLoading && !hasData && (
          <div className="card p-6">
            <p className="text-sm opacity-80">
              Não encontramos dependentes cadastrados para este contrato.
            </p>
            <p className="text-xs mt-1 opacity-70">
              Caso a informação esteja incorreta, entre em contato com a unidade
              de atendimento.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
