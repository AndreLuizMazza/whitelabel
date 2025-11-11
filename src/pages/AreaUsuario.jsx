// src/pages/AreaUsuario.jsx
import { useMemo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import ContratoCard from '@/components/ContratoCard'
import DependentesList from '@/components/DependentesList'
import PagamentoFacil from '@/components/PagamentoFacil'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { showToast } from '@/lib/toast'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, Printer } from 'lucide-react' // ícones

/* ===== analytics opcional (no-op) ===== */
const track = (..._args) => {}

/* ===== preferências de tema ===== */
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

/* ===== skeleton simples ===== */
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

/* ===== Tooltip acessível leve (hover/focus) ===== */
function InfoTooltip({ text, children }) {
  return (
    <span className="relative inline-flex items-center group">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity
                   absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs px-2 py-1 rounded shadow-sm z-10"
        style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--c-border)'
        }}
      >
        {text}
      </span>
    </span>
  )
}

/* ===== Segmented control (Frente/Verso) ===== */
function SegmentedPrintButtons({ user, contrato }) {
  const btnBase = {
    padding: '6px 10px',
    fontSize: '12px',
    border: '1px solid var(--c-border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    lineHeight: 1,
  }

  const activeStyles = {
    background: 'var(--nav-active-bg)',
    color: 'var(--nav-active-color)',
    borderColor: 'var(--nav-active-bg)',
  }

  return (
    <div
      role="group"
      aria-label="Opções de impressão"
      className="inline-flex items-center rounded-md overflow-hidden"
      style={{ border: '1px solid var(--c-border)' }}
    >
      <Link
        to="/carteirinha/print?side=front"
        state={{ user, contrato }}
        className="no-underline"
        style={{ ...btnBase, border: 'none', borderRight: '1px solid var(--c-border)' }}
        aria-pressed="false"
      >
        Frente
      </Link>
      <Link
        to="/carteirinha/print?side=back"
        state={{ user, contrato }}
        className="no-underline"
        style={{ ...btnBase, border: 'none', ...activeStyles }}
        aria-pressed="true"
      >
        Verso
      </Link>
    </div>
  )
}

export default function AreaUsuario() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  usePrefersDark()

  /* ===== CPF bruto (nunca formate aqui) ===== */
  const cpf =
    user?.cpf ||
    user?.documento ||
    (() => {
      try { return JSON.parse(localStorage.getItem('auth_user') || '{}').cpf } catch { return '' }
    })() || ''

  /* ===== revelação temporária (10s) ===== */
  const [cpfReveal, setCpfReveal] = useState(false)
  const [cpfSeconds, setCpfSeconds] = useState(0)
  const timerRef = useRef(null)
  const tickRef = useRef(null)

  function startReveal10s() {
    if (!cpf) return
    setCpfReveal(true)
    setCpfSeconds(10)
    track('cpf_reveal', { ts: Date.now() })
    showToast('CPF visível por 10 segundos.', null, null, 3500)

    tickRef.current && clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setCpfSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)

    timerRef.current && clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCpfReveal(false)
      setCpfSeconds(0)
      clearInterval(tickRef.current)
      tickRef.current = null
      showToast('CPF ocultado novamente.')
    }, 10000)
  }

  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current)
      tickRef.current && clearInterval(tickRef.current)
    }
  }, [])

  /* ===== dados do contrato/área ===== */
  const {
    contratos, contrato, selectedId,
    dependentes, proximaParcela, proximas, historico, isAtraso,
    chooseContrato, loading, erro
  } = useContratoDoUsuario({ cpf })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Usuário',
    [user]
  )

  useEffect(() => {
    if (erro) showToast('Não foi possível carregar seus contratos. Tente novamente em instantes.')
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

            {/* Cabeçalho com CPF protegido + cadeado + tooltip */}
            <p className="mt-2 text-sm flex items-center gap-1" style={{ color: 'var(--text)' }}>
              <span>Bem-vindo, {nomeExibicao}!</span>
              {cpf && (
                <>
                  <span>•</span>
                  <InfoTooltip text="Por segurança (LGPD), exibimos o CPF parcialmente. Você pode revelar por 10 segundos.">
                    <span className="inline-flex items-center gap-1">
                      <Lock size={14} aria-hidden="true" />
                      <span>CPF {cpfReveal ? formatCPF(cpf) : displayCPF(cpf, 'last2')}</span>
                    </span>
                  </InfoTooltip>
                  <button
                    type="button"
                    className="btn-link text-xs"
                    onClick={startReveal10s}
                    aria-label="Mostrar CPF completo por 10 segundos"
                    disabled={cpfReveal}
                    title={cpfReveal ? 'CPF já está visível' : 'Mostrar CPF por 10 segundos'}
                  >
                    {cpfReveal ? `Visível (${cpfSeconds}s)` : 'Mostrar por 10s'}
                  </button>
                </>
              )}
            </p>
          </div>

          <button className="btn-outline" onClick={logout} aria-label="Sair">Sair</button>
        </div>

        {/* Seletor de contrato */}
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

        {/* Loading */}
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

        {/* Erro */}
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

        {/* Conteúdo */}
        {!loading && !erro && (
          contrato ? (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ESQUERDA */}
              <div className="lg:col-span-1 space-y-6">
                <h4 className="sr-only">Resumo do Associado</h4>
                <CarteirinhaAssociado user={user} contrato={contrato} />

                {/* Barra de ações de impressão */}
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to="/carteirinha/print"
                    state={{ user, contrato, side: 'both' }}
                    className="btn-outline text-sm inline-flex items-center gap-1"
                    title="Imprimir frente e verso"
                    aria-label="Imprimir frente e verso"
                  >
                    <Printer size={14} /> Imprimir (frente e verso)
                  </Link>

                  <SegmentedPrintButtons user={user} contrato={contrato} />
                </div>

                <div id="pagamento" />
                <PagamentoFacil
                  contrato={contrato}
                  parcelaFoco={proximaParcela}
                  proximas={proximas}
                  historico={historico}
                  isAtraso={isAtraso}
                />
              </div>

              {/* DIREITA */}
              <div className="lg:col-span-2 space-y-6">
                <ContratoCard contrato={contrato} />
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
