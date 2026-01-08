// src/pages/AreaUsuario.jsx
import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api.js'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import PagamentoFacil from '@/components/PagamentoFacil'
import NotificationsCenter from '@/components/NotificationsCenter'
import useNotificationsStore from '@/store/notifications'
import { showToast } from '@/lib/toast'
import {
  FileText,
  IdCard,
  MessageCircle,
  Clock3,
  User,
  Eye,
  EyeOff,
  CreditCard,
  Smartphone, // serviços digitais
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
   CARD DE RESUMO DO PLANO – estilo “home de banco premium”
   ============================================================ */
function PlanoHighlightCard({
  contrato,
  proximaParcela,
  totalPago, // mantido na assinatura, não exibido
  totalEmAtraso,
  hasAtraso,
  nomeExibicao,
  contratoAtivo,
  vencendoHoje,
}) {
  // valores visíveis por padrão
  const [mostrarValores, setMostrarValores] = useState(true)

  if (!contrato) return null

  const ativo =
    contrato.contratoAtivo ??
    String(contrato.status || '').toUpperCase() === 'ATIVO'

  const nomePlano =
    contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano de assinatura'

  const numeroContrato =
    contrato.numeroContrato ?? contrato.id ?? contrato.contratoId

  const dataProx = proximaParcela?.dataVencimento ?? null
  const valorProx = proximaParcela?.valorParcela ?? null

  // ✅ Prioridade de mensagem: atraso > vence hoje > próxima
  const tituloMensalidade = hasAtraso
    ? 'Mensalidade em atraso'
    : vencendoHoje
      ? 'Mensalidade vencendo hoje'
      : 'Próxima mensalidade'

  // ✅ “Plano em dia” só se contrato estiver ativo
  const situacaoLabel = hasAtraso
    ? 'Em atraso'
    : contratoAtivo
      ? (vencendoHoje ? 'Vence hoje' : 'Em dia')
      : 'Aguardando ativação'

  const situacaoCor = hasAtraso
    ? '#fb7185'
    : vencendoHoje
      ? '#fbbf24'
      : '#4ade80'

  const diaD = extractDiaFromDateString(dataProx)

  return (
    <section
      className="relative w-full rounded-[24px] p-6 sm:p-7 shadow-xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 40%, white) 55%, color-mix(in srgb, var(--primary) 20%, white) 100%)',
        color: 'var(--on-primary, #ffffff)',
        boxShadow:
          '0 18px 50px rgba(15, 23, 42, 0.35), inset 0 0 0 1px rgba(255,255,255,0.18)',
      }}
    >
      {/* halo interno para dar profundidade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(255,255,255,0.16) 0, transparent 55%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* brilho extra (leve) quando vence hoje */}
      {vencendoHoje && !hasAtraso && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, rgba(251,191,36,0.55) 0, rgba(251,191,36,0.0) 65%)',
            filter: 'blur(8px)',
            opacity: 0.9,
          }}
        />
      )}

      {/* conteúdo principal */}
      <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        {/* lado esquerdo – título, status e usuário */}
        <div className="min-w-0">
          {nomeExibicao && (
            <p className="text-[11px] sm:text-xs opacity-90 mb-1">
              Olá, <span className="font-medium">{nomeExibicao}</span>
            </p>
          )}
          <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">
            Resumo do seu plano
          </p>
          <h3 className="mt-1 text-lg sm:text-2xl font-semibold leading-snug">
            {nomePlano}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.45)',
              }}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: ativo ? '#4ade80' : '#facc15' }}
              />
              {ativo ? 'Plano ativo' : 'Aguardando ativação'}
            </span>

            {numeroContrato && (
              <span className="opacity-90">Contrato #{numeroContrato}</span>
            )}

            {vencendoHoje && !hasAtraso && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold"
                style={{
                  background: 'rgba(251,191,36,0.26)',
                  border: '1px solid rgba(251,191,36,0.62)',
                  color: 'var(--on-primary, #ffffff)',
                }}
              >
                Vence hoje
              </span>
            )}
          </div>
        </div>

        {/* lado direito – mensalidade */}
        <div className="text-right flex flex-col items-end gap-2 sm:gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              {tituloMensalidade}
            </p>

            {dataProx && valorProx ? (
              <>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight">
                  {mostrarValores ? fmtBRL(valorProx) : '••••••'}
                </p>

                <p className="text-xs sm:text-sm opacity-90">
                  {hasAtraso ? (
                    <>Venceu em {fmtDate(dataProx)}</>
                  ) : vencendoHoje ? (
                    <>Vence hoje • {fmtDate(dataProx)}</>
                  ) : (
                    <>Vence em {fmtDate(dataProx)}</>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm opacity-85 mt-1">Nenhuma parcela em aberto</p>
            )}
          </div>

          {dataProx && valorProx && (
            <button
              type="button"
              className="mt-1 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02]"
              onClick={() => {
                const el = document.getElementById('pagamento')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              style={{
                background: vencendoHoje && !hasAtraso ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.16)',
                border: vencendoHoje && !hasAtraso ? '1px solid rgba(251,191,36,0.62)' : '1px solid rgba(255,255,255,0.45)',
                color: 'var(--on-primary, #ffffff)',
              }}
            >
              <CreditCard size={16} className="mr-2" />
              {hasAtraso ? 'Regularizar agora' : vencendoHoje ? 'Pagar hoje' : 'Pagar agora'}
            </button>
          )}
        </div>
      </div>

      {/* métricas inferiores */}
      <div className="relative z-[1] mt-6 pt-4 border-t border-white/25 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex flex-wrap gap-4 sm:gap-8">
          {diaD && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">
                Dia do pagamento
              </p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                Dia {diaD}
              </p>
            </div>
          )}

          {hasAtraso && totalEmAtraso > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">
                Valor em atraso
              </p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {mostrarValores ? fmtBRL(totalEmAtraso) : '••••••'}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">
              Situação
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm sm:text-base font-semibold">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: situacaoCor }}
              />
              {situacaoLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMostrarValores((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium underline underline-offset-2 opacity-95 hover:opacity-100"
        >
          {mostrarValores ? <EyeOff size={14} /> : <Eye size={14} />}
          {mostrarValores ? 'Ocultar valores' : 'Mostrar valores'}
        </button>
      </div>
    </section>
  )
}

/* ============================================================
   AÇÕES RÁPIDAS
   ============================================================ */

function QuickAction({ icon: Icon, label, helper, to, onClick, state }) {
  const content = (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
        style={{
          background:
            'color-mix(in srgb, var(--primary) 12%, var(--surface) 88%)',
          color: 'var(--primary)',
          border:
            '1px solid color-mix(in srgb, var(--primary) 28%, var(--c-border))',
        }}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {helper && (
          <p
            className="mt-0.5 text-[11px] leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            {helper}
          </p>
        )}
      </div>
    </div>
  )

  const baseProps = {
    className:
      'card h-full px-4 py-4 sm:px-5 sm:py-5 rounded-2xl border text-left hover:shadow-md transition-shadow',
    style: {
      borderColor: 'var(--c-border)',
      background: 'var(--surface)',
    },
  }

  if (to) {
    return (
      <Link to={to} state={state} {...baseProps} aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      {...baseProps}
      aria-label={label}
    >
      {content}
    </button>
  )
}

/* ============================================================
   PÁGINA
   ============================================================ */

export default function AreaUsuario() {
  const user = useAuth((s) => s.user)
  usePrefersDark()

  const {
    items: notifications,
    loading: loadingNotifications,
    setUnread,
  } = useNotificationsStore()

  /* ===== CPF bruto (apenas para carregar contratos) ===== */
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
  } = useContratoDoUsuario({ cpf })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Usuário',
    [user]
  )

  useEffect(() => {
    if (erro)
      showToast(
        'Não foi possível carregar seus contratos. Tente novamente em instantes.'
      )
  }, [erro])

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

  return (
    <section className="section relative" key={cpf}>
      {/* halo de fundo geral da página */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-52"
        style={{
          background:
            'radial-gradient(circle at 0 0, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 60%)',
          opacity: 0.9,
        }}
      />

      <div className="container-max relative">
        {/* HEADER + HERO WRAPPER (capa da área do associado) */}
        <div className="relative mb-6">
          {/* halo extra atrás do card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-10 h-52 sm:h-56"
            style={{
              background:
                'radial-gradient(circle at top right, color-mix(in srgb, var(--primary) 30%, transparent) 0, transparent 70%)',
              filter: 'blur(18px)',
            }}
          />

          {/* barra superior da capa – faixa mais "bancária" */}
          <div className="relative z-[5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 mt-1">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Área do associado
              </p>
              {unidadeNome && (
                <h2 className="text-xl font-semibold tracking-tight mt-1">
                  {unidadeNome}
                </h2>
              )}
            </div>

            {contrato && (
              <div
                className="inline-flex items-center gap-3 rounded-2xl px-3.5 py-2.5 border text-xs sm:text-sm shadow-sm"
                style={{
                  borderColor: 'var(--c-border)',
                  background:
                    'color-mix(in srgb, var(--surface-elevated, var(--surface)) 85%, var(--primary) 15%)',
                }}
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background:
                      'color-mix(in srgb, var(--primary) 18%, var(--surface) 82%)',
                    color: 'var(--primary)',
                  }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: hasAtraso ? '#fb7185' : (vencendoHoje ? '#fbbf24' : '#4ade80'),
                    }}
                  />
                  {hasAtraso
                    ? 'Plano com parcelas em atraso'
                    : contratoAtivo
                      ? (vencendoHoje ? 'Vence hoje' : 'Plano em dia')
                      : 'Aguardando ativação'}
                </span>

                {proximaParcela?.dataVencimento && (
                  <span
                    className="hidden sm:inline text-[11px] sm:text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Próximo vencimento:{' '}
                    <strong>
                      {fmtDate(proximaParcela.dataVencimento)}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Loading apenas no topo */}
          {loading && (
            <div className="relative z-[4]">
              <Skeleton className="h-40" />
            </div>
          )}

          {/* Card principal – colado na capa */}
          {!loading && !erro && contrato && (
            <div className="relative z-[4]">
              <PlanoHighlightCard
                contrato={contrato}
                proximaParcela={proximaParcela}
                totalPago={totalPago}
                totalEmAtraso={totalEmAtraso}
                hasAtraso={hasAtraso}
                nomeExibicao={nomeExibicao}
                contratoAtivo={contratoAtivo}
                vencendoHoje={vencendoHoje}
              />
            </div>
          )}
        </div>

        {/* Erro geral */}
        {!loading && erro && (
          <div
            className="mt-2 card p-6"
            style={{
              border: '1px solid var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            }}
          >
            <p className="font-medium" style={{ color: 'var(--primary)' }}>
              Não foi possível carregar os contratos
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--primary)' }}>
              {erro}
            </p>
          </div>
        )}

        {/* Conteúdo principal */}
        {!loading && !erro && (
          contrato ? (
            <>
              {/* Seletor de contrato (após o card) */}
              {Array.isArray(contratos) && contratos.length > 1 && (
                <div className="mt-2 card p-4">
                  <label
                    className="block text-sm mb-2"
                    style={{ color: 'var(--text)' }}
                  >
                    Selecione o contrato para visualizar
                  </label>
                  <select
                    className="w-full rounded px-3 py-2 text-sm"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1px solid var(--c-border)',
                    }}
                    value={selectedId ?? ''}
                    onChange={(e) => chooseContrato(e.target.value)}
                  >
                    {contratos.map((c) => {
                      const id = getId(c)
                      const labelPlano =
                        c?.nomePlano ?? c?.plano?.nome ?? 'Plano'
                      const ativoTag = isAtivo(c) ? ' (ATIVO)' : ''
                      const label = `#${c?.numeroContrato ?? id} — ${labelPlano} — efetivado em ${
                        c?.dataEfetivacao ?? '—'
                      }${ativoTag}`
                      return (
                        <option key={String(id)} value={String(id)}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Grid principal – conteúdo + notificações */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA PRINCIPAL */}
                <div className="lg:col-span-2 space-y-6">
                  {/* ===== BLOCO 1 – RESUMO / ATALHOS ===== */}
                  <div>
                    {/* Ações rápidas */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className="text-sm font-semibold"
                          style={{ color: 'var(--text)' }}
                        >
                          Atalhos do seu plano
                        </h3>
                        <p
                          className="text-[11px] sm:text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Acesse as funções mais usadas em poucos toques.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                        <QuickAction
                          icon={FileText}
                          label="2ª via"
                          helper="Emitir boleto ou código de pagamento"
                          onClick={handleAtalhoPagamento}
                        />
                        <QuickAction
                          icon={Clock3}
                          label="Histórico"
                          helper="Pagamentos já realizados"
                          to="/area/pagamentos"
                          state={{
                            historico,
                            numeroContrato,
                            nomePlano,
                            unidadeNome,
                          }}
                        />
                        <QuickAction
                          icon={IdCard}
                          label="Carteirinha"
                          helper="Veja sua Carteirinha digital"
                          to="/carteirinha"
                        />
                        <QuickAction
                          icon={User}
                          label="Dependentes"
                          helper="Ver e gerenciar beneficiários"
                          to="/area/dependentes"
                          state={{
                              dependentes,
                              contrato,         
                              numeroContrato,    
                              nomePlano,
                              unidadeNome,
                          }}
                        />
                        {planoLinks.length > 0 && planoIdForRoute && (
                          <QuickAction
                            icon={Smartphone}
                            label="Serviços digitais"
                            helper="Acessar benefícios online do seu plano"
                            to="/servicos-digitais"
                            state={{
                              planoId: planoIdForRoute,
                              numeroContrato,
                              nomePlano,
                            }}
                          />
                        )}
                        <QuickAction
                          icon={MessageCircle}
                          label="Atendimento"
                          helper="Fale com a unidade pelo WhatsApp"
                          onClick={abrirAtendimento}
                        />
                      </div>
                    </div>

                    {/* serviços digitais / benefícios (teaser no resumo) */}
                    {loadingPlano && !plano && (
                      <div className="card p-4 mt-5">
                        <p
                          className="text-sm"
                          style={{ color: 'var(--text)' }}
                        >
                          Carregando serviços digitais do seu plano...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ===== BLOCO 2 – PAGAMENTOS ===== */}
                  <div id="pagamento">
                    <PagamentoFacil
                      contrato={contrato}
                      parcelaFoco={proximaParcela}
                      proximas={proximas}
                      historico={historico}
                      isAtraso={isParcelaEmAtraso}
                    />
                  </div>

                  {/* ===== BLOCO 3 – BENEFÍCIOS / SERVIÇOS DIGITAIS ===== */}
                  <div>
                    {loadingPlano && !plano && (
                      <div className="card p-4">
                        <p
                          className="text-sm"
                          style={{ color: 'var(--text)' }}
                        >
                          Carregando benefícios e serviços digitais...
                        </p>
                      </div>
                    )}

                    {!loadingPlano && planoLinks.length === 0 && (
                      <div className="card p-4">
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text)' }}
                        >
                          Seu plano ainda não possui serviços digitais
                          cadastrados.
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Em caso de dúvidas, fale com a unidade pelo
                          atendimento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUNA LATERAL: últimas notificações */}
                <div className="lg:col-span-1">
                  {/* ✅ Removido sticky: não flutua mais ao rolar */}
                  <div className="space-y-6">
                    <NotificationsCenter
                      items={notifications}
                      loading={loadingNotifications}
                      contextKey={cpf || 'default'}
                      onUnreadChange={setUnread}
                    />
                  </div>

                  {planoLinks.length > 0 && planoIdForRoute && (
                    <div className="card p-4 mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold">
                          Serviços digitais incluídos no seu plano
                        </h4>
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--text)' }}
                        >
                          Acesse plataformas e benefícios online vinculados ao
                          seu plano, como clubes de descontos, aplicativos e
                          outros serviços digitais.
                        </p>
                      </div>
                      <Link
                        to="/servicos-digitais"
                        state={{
                          planoId: planoIdForRoute,
                          numeroContrato,
                          nomePlano,
                        }}
                        className="btn-primary text-sm whitespace-nowrap"
                        onClick={() =>
                          track('servicos_digitais_open', {
                            planoId: planoIdForRoute,
                            numeroContrato,
                          })
                        }
                      >
                        Ver serviços digitais
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 card p-6 text-center">
              <h3 className="text-lg font-semibold">
                Nenhum Plano encontrado
              </h3>

              <p className="mt-2" style={{ color: 'var(--text)' }}>
                Parece que você ainda não possui um plano ativo conosco.
                Conheça nossas opções e garanta proteção completa para você e
                sua família.
              </p>

              <div className="mt-5">
                <Link to="/planos" className="btn-primary">
                  Ver planos disponíveis
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
