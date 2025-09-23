import { useMemo } from 'react'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import ContratoCard from '@/components/ContratoCard'
import DependentesList from '@/components/DependentesList'
import PagamentoFacil from '@/components/PagamentoFacil'
import { Link } from 'react-router-dom'

export default function AreaUsuario() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  // CPF do payload do login (ajuste se necessário)
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

  const {
    contratos, contrato, selectedId,
    dependentes, proximaParcela, proximas, historico, isAtraso,
    chooseContrato, loading, erro
  } = useContratoDoUsuario({ cpf })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Usuário',
    [user]
  )

  const getId = (c) => c?.id ?? c?.contratoId ?? c?.numeroContrato
  const isAtivo = (c) => c?.contratoAtivo === true || String(c?.status || '').toUpperCase() === 'ATIVO'

  return (
    <section className="section" key={cpf /* remount ao trocar usuário */}>
      <div className="container-max">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Área do Usuário</h2>
            <p className="mt-2" style={{ color: 'var(--text)' }}>
              Bem-vindo, {nomeExibicao}! {cpf ? <span style={{ color: 'var(--text)' }}>• CPF {cpf}</span> : null}
            </p>
          </div>
          <button
            className="btn-outline"
            onClick={logout}
            aria-label="Sair"
          >
            Sair
          </button>
        </div>

        {/* Se houver mais de um contrato, mostra seletor */}
        {!loading && Array.isArray(contratos) && contratos.length > 1 && (
          <div className="mt-4 card p-4">
            <label className="block text-sm mb-2" style={{ color: 'var(--text)' }}>
              Selecione o contrato para visualizar
            </label>
            <select
              className="w-full rounded px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--c-border)' }}
              value={selectedId ?? ''}
              onChange={(e) => chooseContrato(e.target.value)}
            >
              {contratos.map((c) => {
                const id = getId(c)
                const labelPlano = c?.nomePlano ?? c?.plano?.nome ?? 'Plano'
                const ativoTag = isAtivo(c) ? ' (ATIVO)' : ''
                const label = `#${c?.numeroContrato ?? id} — ${labelPlano} — efetivado em ${c?.dataEfetivacao ?? '—'}${ativoTag}`
                return (
                  <option key={String(id)} value={String(id)}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {loading && (
          <div className="mt-6 card p-6">
            <p>Carregando seus dados…</p>
          </div>
        )}

        {!loading && erro && (
          <div
            className="mt-6 card p-6"
            style={{
              border: '1px solid var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)'
            }}
          >
            <p className="font-medium" style={{ color: 'var(--primary)' }}>
              Não foi possível carregar os contratos
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--primary)' }}>{erro}</p>
          </div>
        )}

        {!loading && !erro && (
          contrato ? (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ContratoCard contrato={contrato} />
                <DependentesList dependentes={dependentes} />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <PagamentoFacil
                  parcelaFoco={proximaParcela}
                  proximas={proximas}
                  historico={historico}
                  isAtraso={isAtraso}
                />
              </div>
            </div>
          ) : (
            <div className="mt-8 card p-6 text-center">
              <h3 className="text-lg font-semibold">Nenhum contrato localizado</h3>
              <p className="mt-1" style={{ color: 'var(--text)' }}>
                Este CPF não possui contratos para esta empresa no momento.
              </p>
              <div className="mt-4">
                <Link to="/planos" className="btn-primary">Contratar um plano</Link>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
