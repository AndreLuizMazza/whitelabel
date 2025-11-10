// src/pages/AreaUsuario.jsx
import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import ContratoCard from '@/components/ContratoCard'
import DependentesList from '@/components/DependentesList'
import PagamentoFacil from '@/components/PagamentoFacil'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { showToast } from '@/lib/toast'

/* Preferência de tema do SO */
function usePrefersDark() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )
  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return dark
}

/* Skeleton simples para carregamento */
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

export default function AreaUsuario() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  usePrefersDark() // usado em subcomponentes

  const cpf =
    user?.cpf ||
    user?.documento ||
    (() => {
      try { return JSON.parse(localStorage.getItem('auth_user') || '{}').cpf } catch { return '' }
    })() || ''

  const {
    contratos, contrato, selectedId,
    dependentes, proximaParcela, proximas, historico, isAtraso,
    chooseContrato, loading, erro
  } = useContratoDoUsuario({ cpf })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Usuário',
    [user]
  )

  // toast unificado de erro
  useEffect(() => {
    if (erro) {
      showToast('Não foi possível carregar seus contratos. Tente novamente em instantes.')
    }
  }, [erro])

  const getId = (c) => c?.id ?? c?.contratoId ?? c?.numeroContrato
  const isAtivo = (c) =>
    c?.contratoAtivo === true || String(c?.status || '').toUpperCase() === 'ATIVO'

  return (
    <section className="section" key={cpf}>
      <div className="container-max">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Área do associado</h2>
            <p className="mt-2" style={{ color: 'var(--text)' }}>
              Bem-vindo, {nomeExibicao}! {cpf ? <span>• CPF {cpf}</span> : null}
            </p>
          </div>
          <button className="btn-outline" onClick={logout} aria-label="Sair">Sair</button>
        </div>

        {/* seletor de contrato */}
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
                return <option key={String(id)} value={String(id)}>{label}</option>
              })}
            </select>
          </div>
        )}

        {/* carregando */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-64" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-64" />
            </div>
          </div>
        )}

        {/* erro */}
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

        {/* conteúdo */}
        {!loading && !erro && (
          contrato ? (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COLUNA ESQUERDA */}
              <div className="lg:col-span-1 space-y-6">
                {/* Carteirinha concentra identificação (nome, plano, nº contrato, status) */}
                <CarteirinhaAssociado user={user} contrato={contrato} />

                {/* Pagamento — recebe o contrato para renegociação via WhatsApp */}
                <div id="pagamento" />
                <PagamentoFacil
                  contrato={contrato}
                  parcelaFoco={proximaParcela}
                  proximas={proximas}
                  historico={historico}
                  isAtraso={isAtraso}
                />
              </div>

              {/* COLUNA DIREITA */}
              <div className="lg:col-span-2 space-y-6">
                {/* Cartão do Contrato — sem repetir dados já exibidos na carteirinha */}
                <ContratoCard contrato={contrato} />
                {/* Dependentes — com toasts e WhatsApp */}
                <DependentesList dependentes={dependentes} contrato={contrato} />
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
