// src/pages/HistoricoPagamentos.jsx
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import { showToast } from '@/lib/toast'

import {
  MemberSubpageNav,
  MemberSubpageHeader,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import { MemberGroupedList } from '@/components/member/MemberGroupedList'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { Receipt } from 'lucide-react'

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

const parseDateLocal = (s) => {
  if (!s) return null
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split('/')
    return new Date(+yyyy, +mm - 1, +dd)
  }
  const base = t.split('T')[0]
  const [Y, M, D] = base.split('-')
  if (Y && M && D) return new Date(+Y, +M - 1, +D)
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d
}

const getYear = (s) => {
  const d = parseDateLocal(s)
  return d ? d.getFullYear() : null
}

function buildMeta({ nomePlano, numeroContrato, unidadeNome }) {
  const parts = []
  if (nomePlano) parts.push(formatDisplayLabel(nomePlano))
  if (numeroContrato) parts.push(`Contrato #${numeroContrato}`)
  if (unidadeNome) parts.push(formatDisplayLabel(unidadeNome))
  return parts.length ? parts.join(' · ') : null
}

function PagamentoHistoricoRow({ parcela }) {
  const numero = parcela?.numeroDuplicata || parcela?.numero || '—'
  const valor = fmtBRL(parcela?.valorParcelaRecebida ?? parcela?.valorParcela ?? 0)
  const vencimento = fmtDate(parcela?.dataVencimento)
  const pagoEm = fmtDate(parcela?.dataRecebimento)

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 min-h-[76px]">
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
        style={{
          background: 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
          color: 'var(--primary)',
        }}
      >
        <Receipt size={20} strokeWidth={1.85} aria-hidden="true" />
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-semibold tabular-nums leading-snug" style={{ color: 'var(--text)' }}>
            {valor}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0"
            style={{
              background: 'color-mix(in srgb, #30d158 14%, var(--surface))',
              color: '#248a3d',
              border: '0.5px solid color-mix(in srgb, #30d158 28%, transparent)',
            }}
          >
            Paga
          </span>
        </span>
        <span className="block text-[15px] font-medium mt-0.5 leading-snug" style={{ color: 'var(--text)' }}>
          Parcela #{numero}
        </span>
        <span className="block text-[13px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
          Venc. {vencimento}
          {pagoEm !== '—' ? ` · Pago em ${pagoEm}` : ''}
        </span>
      </span>
    </div>
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

  const pagosAno = useMemo(() => {
    const pagos = Array.isArray(historico)
      ? historico.filter((p) => {
          const st = String(p.status || '').toUpperCase()
          return st === 'PAGA' || st === 'PAID'
        })
      : []

    return pagos
      .filter((p) => {
        const y = getYear(p?.dataRecebimento) || getYear(p?.dataVencimento)
        return y === currentYear
      })
      .sort((a, b) => {
        const da = parseDateLocal(a?.dataRecebimento || a?.dataVencimento)
        const db = parseDateLocal(b?.dataRecebimento || b?.dataVencimento)
        if (!da && !db) return 0
        if (!da) return 1
        if (!db) return -1
        return db - da
      })
  }, [historico, currentYear])

  const totalAno = useMemo(
    () =>
      pagosAno.reduce(
        (sum, p) => sum + Number(p?.valorParcelaRecebida ?? p?.valorParcela ?? 0),
        0
      ),
    [pagosAno]
  )

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

  const meta = buildMeta({ nomePlano, numeroContrato, unidadeNome })
  const isLoading = loading && historico.length === 0

  return (
    <div className="w-full max-w-6xl mx-auto">
      <MemberSubpageNav to="/area" label="Início" />

      <MemberSubpageHeader
        title="Histórico"
        meta={meta || `Pagamentos confirmados em ${currentYear}`}
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-[10px]" />
          <MemberGroupedList>
            <div className="px-4 py-4 space-y-3">
              <Skeleton className="h-[76px] rounded-lg" />
              <Skeleton className="h-[76px] rounded-lg" />
              <Skeleton className="h-[76px] rounded-lg" />
            </div>
          </MemberGroupedList>
        </div>
      ) : null}

      {!isLoading && pagosAno.length === 0 ? (
        <MemberGroupedList>
          <div className="px-4 py-8 text-center">
            <p className="text-[17px] font-medium leading-snug">Nenhum pagamento em {currentYear}</p>
            <p
              className="text-[15px] mt-2 leading-relaxed max-w-sm mx-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              Assim que uma parcela for confirmada, ela aparecerá nesta lista.
            </p>
          </div>
        </MemberGroupedList>
      ) : null}

      {!isLoading && pagosAno.length > 0 ? (
        <section aria-label={`Pagamentos de ${currentYear}`}>
          <div
            className="rounded-[10px] px-4 py-3.5 mb-3 flex items-center justify-between gap-3"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--separator, var(--c-border))',
            }}
          >
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Total pago em {currentYear}
            </span>
            <span className="text-[20px] font-bold tabular-nums tracking-tight" style={{ color: 'var(--text)' }}>
              {fmtBRL(totalAno)}
            </span>
          </div>

          <p
            className="px-1 mb-2 text-[13px] font-normal uppercase tracking-[0.02em]"
            style={{ color: 'var(--text-muted)' }}
          >
            {pagosAno.length} pagamento{pagosAno.length === 1 ? '' : 's'}
          </p>

          <MemberGroupedList>
            {pagosAno.map((p, i) => {
              const key = p?.id || p?.numeroDuplicata || p?.numero || `hist-${i}`
              return <PagamentoHistoricoRow key={key} parcela={p} />
            })}
          </MemberGroupedList>

          <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Exibindo apenas parcelas com pagamento confirmado em {currentYear}.
          </p>
        </section>
      ) : null}
    </div>
  )
}
