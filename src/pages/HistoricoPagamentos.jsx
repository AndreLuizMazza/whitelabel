// src/pages/HistoricoPagamentos.jsx
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import { showToast } from '@/lib/toast'

import BackButton from '@/components/BackButton'

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(v || 0))

const fmtDate = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const [Y, M, D] = t.split('T')[0].split('-')
  return Y && M && D ? `${D}/${M}/${Y}` : t
}

// Extrai o ano de strings no formato ISO ou DD/MM/YYYY
const getYear = (s) => {
  if (!s) return null
  const t = String(s)

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [, , Y] = t.split('/')
    return Number(Y) || null
  }

  // ISO YYYY-MM-DDTHH:mm:ss
  const [Y] = t.split('T')[0].split('-')
  return Number(Y) || null
}

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

export default function HistoricoPagamentos() {
  const location = useLocation()
  const state = location.state || {}

  const stateHistorico = state.historico || null
  const stateNumeroContrato = state.numeroContrato || null
  const stateNomePlano = state.nomePlano || null
  const stateUnidadeNome = state.unidadeNome || null

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

  const {
    contrato,
    historico: hookHistorico,
    loading,
    erro,
  } = useContratoDoUsuario({ cpf })

  useEffect(() => {
    if (erro) {
      showToast(
        'Não foi possível carregar o histórico de pagamentos. Tente novamente em instantes.'
      )
    }
  }, [erro])

  const historico = useMemo(() => {
    if (Array.isArray(stateHistorico) && stateHistorico.length > 0) {
      return stateHistorico
    }
    if (Array.isArray(hookHistorico)) {
      return hookHistorico
    }
    return []
  }, [stateHistorico, hookHistorico])

  const currentYear = new Date().getFullYear()

  const pagos = Array.isArray(historico)
    ? historico.filter((p) => {
        const st = String(p.status || '').toUpperCase()
        return st === 'PAGA' || st === 'PAID'
      })
    : []

  const pagosAno = pagos.filter((p) => {
    const yReceb = getYear(p?.dataRecebimento)
    const yVenc = getYear(p?.dataVencimento)
    const y = yReceb || yVenc
    return y === currentYear
  })

  const numeroContrato =
    stateNumeroContrato ||
    contrato?.numeroContrato ||
    contrato?.id ||
    null

  const nomePlano =
    stateNomePlano ||
    contrato?.nomePlano ||
    contrato?.plano?.nome ||
    null

  const unidadeNome =
    stateUnidadeNome ||
    contrato?.unidade?.nomeFantasia ||
    contrato?.empresa?.razaoSocial ||
    null

  const isLoading = loading && historico.length === 0

  return (
    <section className="section">
      <div className="container-max">
        {/* Barra superior com Voltar */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton to="/area" className="mb-4" />
        </div>

        <header className="mb-6">
          <p
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Área do associado
          </p>
          <h1 className="text-2xl font-semibold mt-1">
            Histórico de Pagamentos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {nomePlano && (
              <>
                Plano <strong>{nomePlano}</strong>
                {' • '}
              </>
            )}
            {numeroContrato && <>Contrato #{numeroContrato} • </>}
            {unidadeNome && <>Administrado por {unidadeNome}</>}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Exibindo pagamentos confirmados de {currentYear}.
          </p>
        </header>

        {isLoading && (
          <div className="card p-5">
            <Skeleton className="h-5 w-48 mb-3" />
            <Skeleton className="h-8 mb-2" />
            <Skeleton className="h-8 mb-2" />
            <Skeleton className="h-8 mb-2" />
          </div>
        )}

        {!isLoading && pagosAno.length === 0 && (
          <div className="card p-6">
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Ainda não encontramos pagamentos confirmados para este contrato em{' '}
              {currentYear}.
            </p>
          </div>
        )}

        {!isLoading && pagosAno.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    background:
                      'color-mix(in srgb, var(--primary) 10%, var(--surface) 90%)',
                  }}
                >
                  <th className="text-left px-4 py-2">Parcela</th>
                  <th className="text-left px-4 py-2">Vencimento</th>
                  <th className="text-left px-4 py-2">Pago em</th>
                  <th className="text-right px-4 py-2">Valor pago</th>
                </tr>
              </thead>
              <tbody>
                {pagosAno.map((p, i) => {
                  const key =
                    p?.id ||
                    p?.numeroDuplicata ||
                    p?.numero ||
                    `hist-${i}`

                  return (
                    <tr
                      key={key}
                      className="border-t"
                      style={{ borderColor: 'var(--c-border)' }}
                    >
                      <td className="px-4 py-2">
                        #{p?.numeroDuplicata || p?.numero || '—'}
                      </td>
                      <td className="px-4 py-2">
                        {fmtDate(p?.dataVencimento)}
                      </td>
                      <td className="px-4 py-2">
                        {fmtDate(p?.dataRecebimento)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {fmtBRL(
                          p?.valorParcelaRecebida ?? p?.valorParcela ?? 0
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
