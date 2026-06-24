// src/pages/AreaUsuario.jsx
import { useMemo, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import api from '@/lib/api.js'
import useAuth from '@/store/auth'
import { fetchAuthenticatedCpf } from '@/lib/postAuthNavigation'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import PagamentoFacil from '@/components/PagamentoFacil'
import NotificationsCenter from '@/components/NotificationsCenter'
import useNotificationsStore from '@/store/notifications'
import { showToast } from '@/lib/toast'
import {
  MemberGroupedList,
  MemberSection,
} from '@/components/member/MemberGroupedList'
import {
  MemberHero,
  MemberContentSheet,
  MemberSectionHeading,
  MemberNextPaymentCard,
  MemberPaymentStatusCard,
  MemberQuickGrid,
  MemberQuickGridTile,
  MemberCareBanner,
  MemberDigitalServicesSection,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import {
  IdCard,
  Clock3,
  User,
  ClipboardList,
} from 'lucide-react'

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

/* ===== helpers locais ===== */
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(v || 0)
  )

const fmtDate = (s) => {
  if (!s) return '—'
  const txt = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(txt)) return txt
  const [Y, M, D] = txt.split('T')[0].split('-')
  return Y && M && D ? `${D}/${M}/${Y}` : txt
}

function extractDiaFromDateString(s) {
  if (!s) return null
  const txt = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(txt)) {
    return txt.slice(0, 2)
  }
  const base = txt.split('T')[0]
  const parts = base.split('-')
  if (parts.length === 3) {
    const [, , D] = parts
    return D?.padStart(2, '0') || null
  }
  return null
}

function buildWhats(number, msg) {
  const digits = String(number || '').replace(/\D+/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null
}

/**
 * ✅ Parse local robusto
 * IMPORTANTE: nunca usar new Date("YYYY-MM-DD") (vira UTC e pode “voltar um dia” no Brasil).
 */
function parseDateLocal(s) {
  if (!s) return null
  const t = String(s)

  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split('/')
    const d = new Date(+yyyy, +mm - 1, +dd)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // yyyy-mm-dd (ou yyyy-mm-ddTHH:mm...)
  const base = t.split('T')[0]
  const parts = base.split('-')
  if (parts.length === 3) {
    const [Y, M, D] = parts
    const d = new Date(+Y, +M - 1, +D) // ✅ local time (meia-noite local)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // fallback (evitar)
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function isSameDay(a, b) {
  if (!a || !b) return false
  const da = a instanceof Date ? a : parseDateLocal(a)
  const db = b instanceof Date ? b : parseDateLocal(b)
  if (!da || !db) return false
  const x = new Date(da.getFullYear(), da.getMonth(), da.getDate())
  const y = new Date(db.getFullYear(), db.getMonth(), db.getDate())
  return x.getTime() === y.getTime()
}

/* ============================================================
   PÁGINA
   ============================================================ */

export default function AreaUsuario() {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  const [mostrarValores, setMostrarValores] = useState(true)
  const [cpfLookup, setCpfLookup] = useState('')
  const [cpfLoading, setCpfLoading] = useState(true)
  usePrefersDark()

  const adhesionContratoId = location.state?.contratoId || null
  const fromAdhesion = Boolean(location.state?.fromAdhesion)

  const {
    items: notifications,
    loading: loadingNotifications,
    setUnread,
  } = useNotificationsStore()

  const cpfFromAuth =
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

  useEffect(() => {
    let alive = true
    const digits = String(cpfFromAuth || '').replace(/\D/g, '')
    if (digits.length >= 11) {
      setCpfLookup(digits)
      setCpfLoading(false)
      return
    }

    setCpfLoading(true)
    fetchAuthenticatedCpf()
      .then((resolved) => {
        if (alive) setCpfLookup(resolved)
      })
      .finally(() => {
        if (alive) setCpfLoading(false)
      })

    return () => {
      alive = false
    }
  }, [cpfFromAuth])

  const cpf = cpfLookup || cpfFromAuth

  /* ===== dados do contrato/área ===== */
  const {
    contratos,
    contrato,
    selectedId,
    dependentes,
    proximaParcela,
    proximas,
    historico,
    isAtraso: _isAtrasoRaw, // ignorado
    chooseContrato,
    loading,
    erro,
  } = useContratoDoUsuario({
    cpf: cpfLoading ? '' : cpf,
    initialContratoId: adhesionContratoId,
    retryOnEmpty: fromAdhesion ? 2 : 0,
  })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Usuário',
    [user]
  )

  useEffect(() => {
    if (cpfLoading || loading) return
    if (erro && !contrato) {
      showToast(
        'Não foi possível carregar seus contratos. Tente novamente em instantes.'
      )
    }
  }, [cpfLoading, loading, erro, contrato])

  const getId = (c) => c?.id ?? c?.contratoId ?? c?.numeroContrato
  const isAtivo = (c) =>
    c?.contratoAtivo === true ||
    String(c?.status || '').toUpperCase() === 'ATIVO'

  /* ===== unidade / contatos ===== */
  const unidade = contrato?.unidade || contrato?.empresa || {}
  const contatos = contrato?.contatos || {}
  const unidadeNome =
    unidade?.nomeFantasia || unidade?.razaoSocial || null
  const whatsappAtendimento = unidade.whatsapp || contatos.celular || null

  /* ===== PLANO do contrato (para links digitais) ===== */
  const [plano, setPlano] = useState(null)
  const [loadingPlano, setLoadingPlano] = useState(false)
  const [planoErro, setPlanoErro] = useState('')

  useEffect(() => {
    setPlanoErro('')
    const planoId =
      contrato?.planoId || contrato?.plano_id || contrato?.plano?.id
    if (!planoId) {
      setPlano(null)
      return
    }

    let cancelado = false

    async function fetchPlano(planId) {
      setLoadingPlano(true)
      try {
        const { data } = await api.get(`/api/v1/planos/${planId}`, {
          transformRequest: [
            (d, headers) => {
              try {
                delete headers.Authorization
              } catch {}
              return d
            },
          ],
          __skipAuthRedirect: true,
        })
        if (!cancelado) setPlano(data)
      } catch (e1) {
        try {
          const { data } = await api.get(`/api/v1/planos/${planId}`, {
            headers: { Authorization: '' },
            __skipAuthRedirect: true,
          })
          if (!cancelado) setPlano(data)
        } catch (e2) {
          console.error('Falha ao carregar plano da Área do Associado', e2)
          if (!cancelado) {
            setPlano(null)
            setPlanoErro(
              'Não foi possível carregar os acessos digitais do plano.'
            )
          }
        }
      } finally {
        if (!cancelado) setLoadingPlano(false)
      }
    }

    fetchPlano(planoId)

    return () => {
      cancelado = true
    }
  }, [contrato?.planoId, contrato?.plano_id, contrato?.plano?.id])

  useEffect(() => {
    if (planoErro) showToast(planoErro)
  }, [planoErro])

  const planoLinks = useMemo(() => {
    if (!plano || !Array.isArray(plano.links)) return []
    return plano.links.filter((item) => item && item.link && item.visivel !== false)
  }, [plano])

  const planoIdForRoute =
    contrato?.planoId || contrato?.plano_id || plano?.id || null
  const numeroContrato = contrato?.numeroContrato ?? contrato?.id ?? null
  const nomePlano = contrato?.nomePlano ?? plano?.nome ?? null

  /* ===== função de atraso por parcela (para PagamentoFacil) ===== */
  const isParcelaEmAtraso = (p) => {
    // ✅ Regra: atraso somente quando vencimento < hoje (sem horário)
    if (!p?.dataVencimento) return false
    const status = String(p.status || '').toUpperCase()
    if (status === 'PAGA' || status === 'PAID' || status === 'CANCELADA') {
      return false
    }

    const dt = parseDateLocal(p.dataVencimento)
    if (!dt) return false

    const hoje = startOfToday()
    dt.setHours(0, 0, 0, 0)
    return dt < hoje
  }

  const isParcelaVencendoHoje = (p) => {
    if (!p?.dataVencimento) return false
    const status = String(p.status || '').toUpperCase()
    if (status === 'PAGA' || status === 'PAID' || status === 'CANCELADA') return false
    return isSameDay(p.dataVencimento, startOfToday())
  }

  /* ===== total em atraso (somente parcelas vencidas e não pagas) ===== */
  const totalEmAtraso = useMemo(() => {
    const todas = []
    if (proximaParcela) todas.push(proximaParcela)
    if (Array.isArray(proximas)) todas.push(...proximas)
    if (Array.isArray(historico)) todas.push(...historico)

    return todas
      .filter(Boolean)
      .filter(isParcelaEmAtraso)
      .reduce((s, it) => s + Number(it.valorParcela || 0), 0)
  }, [proximaParcela, proximas, historico])

  /* ===== total já pago (baseado no histórico) ===== */
  const totalPago = useMemo(() => {
    if (!Array.isArray(historico)) return 0
    return historico
      .filter((p) => {
        const status = String(p.status || '').toUpperCase()
        return status === 'PAGA' || status === 'PAID'
      })
      .reduce(
        (s, it) =>
          s +
          Number(
            it.valorParcelaRecebida ??
              it.valorParcela ??
              0
          ),
        0
      )
  }, [historico])

  /* ===== boolean de atraso para o card ===== */
  const hasAtraso = totalEmAtraso > 0

  /* ===== contrato ativo (para “plano em dia”) ===== */
  const contratoAtivo = Boolean(contrato && isAtivo(contrato))

  /* ===== “vence hoje” (só se NÃO for atraso) ===== */
  const vencendoHoje = Boolean(
    proximaParcela &&
      isParcelaVencendoHoje(proximaParcela) &&
      !isParcelaEmAtraso(proximaParcela)
  )

  /* ===== âncoras ===== */
  function scrollToPagamento() {
    const el = document.getElementById('pagamento')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function abrirAtendimento() {
    const href = buildWhats(
      whatsappAtendimento,
      `Olá! Preciso de ajuda com meu contrato #${
        contrato?.numeroContrato || contrato?.id || ''
      }.`
    )
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      showToast('Canal de atendimento indisponível no momento.')
    }
  }

  const handleAtalhoPagamento = () => {
    scrollToPagamento()
  }

  const valorProx = proximaParcela?.valorParcela ?? null
  const dataProx = proximaParcela?.dataVencimento ?? null
  const hasPaymentAmount = valorProx != null && Number(valorProx) > 0

  const paymentStatusTone = hasAtraso
    ? 'danger'
    : vencendoHoje
      ? 'warn'
      : contratoAtivo
        ? 'ok'
        : 'muted'
  const paymentStatusLabel = hasAtraso
    ? 'Em atraso'
    : vencendoHoje
      ? 'Vence hoje'
      : contratoAtivo
        ? 'Em dia'
        : 'Aguardando'
  const paymentTitle = hasAtraso ? 'Mensalidade em atraso' : 'Próximo pagamento'
  const paymentEmptyPrimary = !hasPaymentAmount
    ? !contratoAtivo
      ? 'Aguardando ativação'
      : 'Sem cobranças no momento'
    : undefined
  const paymentDataLabel = hasPaymentAmount
    ? hasAtraso
      ? `Venceu em ${fmtDate(dataProx)}`
      : `Vencimento: ${fmtDate(dataProx)}`
    : !contratoAtivo
      ? 'Suas cobranças aparecerão aqui após a ativação.'
      : 'Nenhuma parcela em aberto no momento.'

  const ultimaParcelaPaga = useMemo(() => {
    if (!Array.isArray(historico)) return null
    return historico.find((p) =>
      ['PAGA', 'PAID'].includes(String(p?.status || '').toUpperCase())
    )
  }, [historico])

  const cpfDigits = String(cpf || '').replace(/\D/g, '')
  const contractLoading = cpfLoading || loading
  const shouldRedirectToPlanos =
    !contractLoading &&
    !erro &&
    cpfDigits.length >= 11 &&
    Array.isArray(contratos) &&
    contratos.length === 0 &&
    !contrato

  if (shouldRedirectToPlanos) {
    return <Navigate to="/planos" replace state={{ onboarding: true }} />
  }

  return (
    <div className="w-full max-w-6xl mx-auto md:px-4" key={cpf}>
      {!loading && !erro && contrato ? (
        <>
          <div className="md:hidden">
            <MemberHero
              nomeExibicao={nomeExibicao}
              numeroContrato={numeroContrato}
              contratoAtivo={contratoAtivo}
              unidadeNome={unidadeNome}
            />
          </div>

          <MemberContentSheet overlap className="md:mt-4">
            {loading ? (
              <Skeleton className="h-44 rounded-[22px]" />
            ) : (
              <>
                <div className="hidden md:flex items-end justify-between gap-4 mb-5 px-1">
                  <div>
                    <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
                      Olá, {nomeExibicao?.split(' ')?.[0] || 'Associado'}
                    </p>
                    <h1 className="member-large-title mt-1">{unidadeNome || 'Início'}</h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarValores((v) => !v)}
                    className="text-[13px] font-medium min-h-[44px] px-2"
                    style={{ color: 'var(--primary)' }}
                  >
                    {mostrarValores ? 'Ocultar valores' : 'Mostrar valores'}
                  </button>
                </div>

                {Array.isArray(contratos) && contratos.length > 1 ? (
                  <MemberSection title="Contrato" className="mb-5">
                    <MemberGroupedList>
                      <div className="px-4 py-2">
                        <label htmlFor="contrato-select" className="sr-only">
                          Selecione o contrato
                        </label>
                        <select
                          id="contrato-select"
                          className="w-full border-0 bg-transparent text-[17px] py-2 outline-none"
                          style={{ color: 'var(--text)' }}
                          value={selectedId ?? ''}
                          onChange={(e) => chooseContrato(e.target.value)}
                        >
                          {contratos.map((c) => {
                            const id = getId(c)
                            const labelPlano = c?.nomePlano ?? c?.plano?.nome ?? 'Plano'
                            const ativoTag = isAtivo(c) ? ' · Ativo' : ''
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

                <div className="space-y-6">
                  <MemberNextPaymentCard
                    titulo={paymentTitle}
                    valor={hasPaymentAmount ? fmtBRL(valorProx) : null}
                    emptyPrimary={paymentEmptyPrimary}
                    dataLabel={paymentDataLabel}
                    statusLabel={paymentStatusLabel}
                    statusTone={paymentStatusTone}
                    onClick={hasPaymentAmount ? handleAtalhoPagamento : undefined}
                    onToggleValues={
                      hasPaymentAmount
                        ? () => setMostrarValores((v) => !v)
                        : undefined
                    }
                    mostrarValores={mostrarValores}
                  />

                  {!hasPaymentAmount && ultimaParcelaPaga ? (
                    <MemberPaymentStatusCard
                      titulo="Situação do pagamento"
                      status="Paga"
                      detail={`Última parcela · ${fmtDate(ultimaParcelaPaga.dataVencimento)}`}
                      statusTone="ok"
                    />
                  ) : null}

                  <div>
                    <MemberSectionHeading grouped>Acesso rápido</MemberSectionHeading>
                    <MemberQuickGrid>
                      <MemberQuickGridTile
                        icon={IdCard}
                        label="Carteirinha"
                        detail="Sua carteirinha digital"
                        to="/carteirinha"
                      />
                      <MemberQuickGridTile
                        icon={User}
                        label="Dependentes"
                        detail="Gerencie seus dependentes"
                        to="/area/dependentes"
                        state={{
                          dependentes,
                          contrato,
                          numeroContrato,
                          nomePlano,
                          unidadeNome,
                        }}
                      />
                      <MemberQuickGridTile
                        icon={Clock3}
                        label="Pagamentos"
                        detail="Boletos e histórico"
                        to="/area/pagamentos"
                        state={{ historico, numeroContrato, nomePlano, unidadeNome }}
                      />
                      {planoIdForRoute && nomePlano ? (
                        <MemberQuickGridTile
                          icon={ClipboardList}
                          label="Benefícios"
                          detail={formatDisplayLabel(nomePlano)}
                          to="/area/beneficios"
                          state={{
                            planoId: planoIdForRoute,
                            numeroContrato,
                            nomePlano,
                          }}
                        />
                      ) : null}
                    </MemberQuickGrid>
                  </div>

                  <MemberCareBanner onClick={abrirAtendimento} />

                  {planoLinks.length > 0 && planoIdForRoute ? (
                    <MemberDigitalServicesSection
                      beneficiosTo="/area/beneficios"
                      beneficiosState={{
                        planoId: planoIdForRoute,
                        numeroContrato,
                        nomePlano,
                      }}
                    />
                  ) : null}

                  <div id="pagamento">
                    <PagamentoFacil
                      variant="home"
                      contrato={contrato}
                      parcelaFoco={proximaParcela}
                      proximas={proximas}
                      historico={historico}
                      isAtraso={isParcelaEmAtraso}
                    />
                  </div>

                  {(loadingNotifications || (notifications && notifications.length > 0)) ? (
                    <div>
                      <MemberSectionHeading grouped>Notificações</MemberSectionHeading>
                      <NotificationsCenter
                        variant="inset"
                        items={notifications}
                        loading={loadingNotifications}
                        contextKey={cpf || 'default'}
                        onUnreadChange={setUnread}
                      />
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </MemberContentSheet>
        </>
      ) : null}

      {(cpfLoading || (loading && !contrato)) ? (
        <Skeleton className="h-52 rounded-[22px] mx-4 md:mx-0 mt-4" />
      ) : null}

      {!loading && erro ? (
        <MemberContentSheet overlap={false} className="mx-0 md:mx-0">
          <MemberGroupedList>
            <div className="px-4 py-4">
              <p className="text-[17px] font-medium" style={{ color: 'var(--danger, #dc2626)' }}>
                Não foi possível carregar os contratos
              </p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {erro}
              </p>
            </div>
          </MemberGroupedList>
        </MemberContentSheet>
      ) : null}
    </div>
  )
}
