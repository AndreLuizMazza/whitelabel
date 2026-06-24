import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import { showToast } from '@/lib/toast'
import { fmtBRL, isAtrasoPorData } from '@/lib/paymentUtils'
import {
  MemberSubpageNav,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import { MemberSection, MemberGroupedList } from '@/components/member/MemberGroupedList'
import MemberPaymentHero from '@/components/member/MemberPaymentHero'
import MemberPaymentsHub from '@/components/member/MemberPaymentsHub'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { Eye, EyeOff, Receipt } from 'lucide-react'

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
          <span
            className="text-[17px] font-semibold tabular-nums leading-snug"
            style={{ color: 'var(--text)' }}
          >
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

export default function AreaPagamentos() {
  const location = useLocation()
  const state = location.state || {}
  const [mostrarValores, setMostrarValores] = useState(true)

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
    contratos,
    contrato,
    selectedId,
    chooseContrato,
    proximaParcela,
    proximas,
    historico: hookHistorico,
    isAtraso,
    loading,
    erro,
  } = useContratoDoUsuario({ cpf })

  useEffect(() => {
    if (erro) {
      showToast('Não foi possível carregar os pagamentos. Tente novamente em instantes.')
    }
  }, [erro])

  const historico = useMemo(() => {
    if (Array.isArray(state.historico) && state.historico.length > 0) return state.historico
    if (Array.isArray(hookHistorico)) return hookHistorico
    return []
  }, [state.historico, hookHistorico])

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

  const totalEmAtraso = useMemo(() => {
    const all = [proximaParcela, ...(proximas || [])].filter(Boolean).filter((p) => {
      const status = String(p.status || '').toUpperCase()
      return status !== 'PAGA' && isAtraso?.(p) && isAtrasoPorData(p)
    })
    return all.reduce((sum, it) => sum + Number(it?.valorParcela || 0), 0)
  }, [proximaParcela, proximas, isAtraso])

  const numeroContrato =
    state.numeroContrato || contrato?.numeroContrato || contrato?.id || null
  const nomePlano = state.nomePlano || contrato?.nomePlano || contrato?.plano?.nome || null
  const unidadeNome =
    state.unidadeNome ||
    contrato?.unidade?.nomeFantasia ||
    contrato?.empresa?.razaoSocial ||
    null

  const meta = buildMeta({ nomePlano, numeroContrato, unidadeNome })
  const contratoAtivo =
    contrato?.contratoAtivo === true || String(contrato?.status || '').toUpperCase() === 'ATIVO'
  const isLoading = loading && !contrato && historico.length === 0

  const getId = (c) => c?.id ?? c?.contratoId ?? c?.numeroContrato

  return (
    <div className="w-full max-w-6xl mx-auto pb-4">
      <MemberSubpageNav to="/area" label="Início" />

      <div className="flex items-center justify-end gap-2 mb-2 -mt-1">
        <button
          type="button"
          onClick={() => setMostrarValores((v) => !v)}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-2 text-[13px] font-semibold active:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          {mostrarValores ? <EyeOff size={15} /> : <Eye size={15} />}
          {mostrarValores ? 'Ocultar valores' : 'Mostrar valores'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[180px] rounded-[22px]" />
          <Skeleton className="h-[220px] rounded-[20px]" />
          <Skeleton className="h-[160px] rounded-[20px]" />
        </div>
      ) : null}

      {!isLoading && contrato ? (
        <>
          {Array.isArray(contratos) && contratos.length > 1 ? (
            <MemberSection title="Contrato" className="mb-4">
              <MemberGroupedList>
                <div className="px-4 py-2">
                  <label htmlFor="pagamentos-contrato-select" className="sr-only">
                    Selecione o contrato
                  </label>
                  <select
                    id="pagamentos-contrato-select"
                    className="w-full border-0 bg-transparent text-[17px] py-2 outline-none"
                    style={{ color: 'var(--text)' }}
                    value={selectedId ?? ''}
                    onChange={(e) => chooseContrato(e.target.value)}
                  >
                    {contratos.map((c) => {
                      const id = getId(c)
                      const labelPlano = c?.nomePlano ?? c?.plano?.nome ?? 'Plano'
                      const ativoTag =
                        c?.contratoAtivo || String(c?.status || '').toUpperCase() === 'ATIVO'
                          ? ' · Ativo'
                          : ''
                      return (
                        <option key={String(id)} value={String(id)}>
                          #{c?.numeroContrato ?? id} — {labelPlano}
                          {ativoTag}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </MemberGroupedList>
            </MemberSection>
          ) : null}

          <MemberPaymentHero
            parcela={proximaParcela}
            isAtraso={isAtraso}
            contratoAtivo={contratoAtivo}
            totalEmAtraso={totalEmAtraso}
            mostrarValores={mostrarValores}
            numeroContrato={numeroContrato}
          />

          {meta ? (
            <p className="px-1 -mt-3 mb-4 text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
              {meta}
            </p>
          ) : null}

          <MemberPaymentsHub
            contrato={contrato}
            parcelaFoco={proximaParcela}
            proximas={proximas}
            isAtraso={isAtraso}
            mostrarValores={mostrarValores}
          />

          <MemberSection title={`Histórico · ${currentYear}`} className="mt-6">
            {pagosAno.length === 0 ? (
              <MemberGroupedList>
                <div className="px-4 py-8 text-center">
                  <p className="text-[17px] font-medium leading-snug">
                    Nenhum pagamento confirmado em {currentYear}
                  </p>
                  <p
                    className="text-[14px] mt-2 leading-relaxed max-w-sm mx-auto"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Assim que uma parcela for confirmada, ela aparecerá nesta lista.
                  </p>
                </div>
              </MemberGroupedList>
            ) : (
              <>
                <div
                  className="rounded-[16px] px-4 py-3.5 mb-3 flex items-center justify-between gap-3"
                  style={{
                    background: 'var(--surface)',
                    border: '0.5px solid var(--separator, var(--c-border))',
                  }}
                >
                  <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    Total pago em {currentYear}
                  </span>
                  <span
                    className="text-[20px] font-bold tabular-nums tracking-tight"
                    style={{ color: 'var(--text)' }}
                  >
                    {mostrarValores ? fmtBRL(totalAno) : '••••••'}
                  </span>
                </div>

                <MemberGroupedList>
                  {pagosAno.map((p, i) => {
                    const key = p?.id || p?.numeroDuplicata || p?.numero || `hist-${i}`
                    return <PagamentoHistoricoRow key={key} parcela={p} />
                  })}
                </MemberGroupedList>

                <p
                  className="px-1 mt-2 text-[12px] leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Exibindo parcelas com pagamento confirmado em {currentYear}.
                </p>
              </>
            )}
          </MemberSection>
        </>
      ) : null}

      {!isLoading && !contrato && !erro ? (
        <MemberGroupedList>
          <div className="px-4 py-10 text-center">
            <p className="text-[17px] font-medium">Nenhum contrato encontrado</p>
            <p className="text-[14px] mt-2" style={{ color: 'var(--text-muted)' }}>
              Seus pagamentos aparecerão aqui quando o contrato estiver disponível.
            </p>
          </div>
        </MemberGroupedList>
      ) : null}
    </div>
  )
}
