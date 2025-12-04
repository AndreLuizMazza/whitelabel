import { useMemo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api.js'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import ContratoCard from '@/components/ContratoCard'
import DependentesList from '@/components/DependentesList'
import PagamentoFacil from '@/components/PagamentoFacil'
import NotificationsCenter from '@/components/NotificationsCenter'
import useNotificationsStore from '@/store/notifications'
import { showToast } from '@/lib/toast'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, User, FileText, IdCard, MessageCircle, Clock3 } from 'lucide-react'

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
          border: '1px solid var(--c-border)',
        }}
      >
        {text}
      </span>
    </span>
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

function buildWhats(number, msg) {
  const digits = String(number || '').replace(/\D+/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null
}

/* ============================================================
   CARD DE DESTAQUE DO PLANO (estilo Nubank / whitelabel)
   ============================================================ */
function PlanoHighlightCard({ contrato, proximaParcela /* totalEmAberto */ }) {
  if (!contrato) return null

  const ativo =
    contrato.contratoAtivo ??
    String(contrato.status || '').toUpperCase() === 'ATIVO'
  const nomePlano = contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano de assinatura'
  const numeroContrato = contrato.numeroContrato ?? contrato.id ?? contrato.contratoId
  const dataProx = proximaParcela?.dataVencimento ?? null
  const valorProx = proximaParcela?.valorParcela ?? null

  return (
    <section
      className="rounded-[24px] px-5 py-5 sm:px-6 sm:py-6 shadow-lg"
      style={{
        background:
          'radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--primary) 40%, #ffffff00) 0, transparent 55%),' +
          'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, #000000) 0%, color-mix(in srgb, var(--primary) 60%, #ffffff) 60%, color-mix(in srgb, var(--primary) 40%, #ffffff) 100%)',
        color: 'var(--on-primary, #ffffff)',
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* lado esquerdo */}
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] opacity-90">
            Plano de assinatura
          </p>
          <h3 className="mt-1 text-lg sm:text-xl font-semibold leading-snug">
            {nomePlano}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: ativo ? '#4ade80' : '#facc15' }}
              />
              {ativo ? 'Ativo' : 'Aguardando ativação'}
            </span>
          </div>

          {numeroContrato && (
            <p className="mt-2 text-[11px] sm:text-xs opacity-80">
              Contrato #{numeroContrato}
            </p>
          )}
        </div>

        {/* lado direito */}
        <div className="flex flex-col items-end justify-between gap-3 sm:items-end text-right">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Próximo pagamento
            </p>
            {dataProx && valorProx ? (
              <>
                <p className="text-base sm:text-xl font-semibold leading-tight">
                  {fmtDate(dataProx)}
                </p>
                <p className="text-xs sm:text-sm opacity-90">
                  {fmtBRL(valorProx)}
                </p>
              </>
            ) : (
              <p className="text-sm opacity-80">Nenhuma parcela em aberto</p>
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
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.45)',
                color: 'var(--on-primary, #ffffff)',
              }}
            >
              Pagar agora
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   AÇÕES RÁPIDAS (2x2 / 4 colunas no desktop)
   ============================================================ */

function QuickAction({ icon: Icon, label, helper, to, onClick }) {
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
      'card h-full px-3 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left hover:shadow-sm transition-shadow',
    style: {
      borderColor: 'var(--c-border)',
      background: 'var(--surface)',
    },
  }

  if (to) {
    return (
      <Link to={to} {...baseProps} aria-label={label}>
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
  const logout = useAuth((s) => s.logout)
  usePrefersDark()

  const {
    items: notifications,
    loading: loadingNotifications,
    setUnread,
  } = useNotificationsStore()

  /* ===== CPF bruto (nunca formate aqui) ===== */
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
    contratos,
    contrato,
    selectedId,
    dependentes,
    proximaParcela,
    proximas,
    historico,
    isAtraso,
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

  /* ===== unidade / contatos para header e ações ===== */
  const unidade = contrato?.unidade || contrato?.empresa || {}
  const contatos = contrato?.contatos || {}
  const unidadeNome =
    unidade?.nomeFantasia || unidade?.razaoSocial || null
  const whatsappAtendimento = unidade.whatsapp || contatos.celular || null

  /* ===== PLANO do contrato (para identificar se há links) ===== */
  const [plano, setPlano] = useState(null)
  const [loadingPlano, setLoadingPlano] = useState(false)
  const [planoErro, setPlanoErro] = useState('')

  useEffect(() => {
    setPlanoErro('')
    const planoId = contrato?.planoId || contrato?.plano_id || contrato?.plano?.id
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

  /* ===== total em aberto para uso futuro, se precisar ===== */
  const totalEmAberto = useMemo(() => {
    const arr = []
    if (proximaParcela) arr.push(proximaParcela)
    if (Array.isArray(proximas)) arr.push(...proximas)

    const vistos = new Set()
    return arr
      .filter(Boolean)
      .filter((p) => {
        const status = String(p.status || '').toUpperCase()
        if (status === 'PAGA' || status === 'PAID') return false
        const key = p.id ?? p.numeroDuplicata ?? p.numero
        if (!key) return true
        if (vistos.has(key)) return false
        vistos.add(key)
        return true
      })
      .reduce((s, it) => s + Number(it.valorParcela || 0), 0)
  }, [proximaParcela, proximas])

  /* ===== ações rápidas (anchors) ===== */
  function scrollToPagamento() {
    const el = document.getElementById('pagamento')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToHistorico() {
    const el = document.getElementById('historico-pagamentos')
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

  return (
    <section className="section relative" key={cpf}>
      {/* halo de fundo da página */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            'radial-gradient(circle at 0 0, color-mix(in srgb, var(--primary) 15%, transparent) 0, transparent 55%)',
          opacity: 0.9,
        }}
      />

      <div className="container-max relative">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Área do associado
            </h2>

            {/* Sub-head com unidade / contexto */}
            <p
              className="mt-1 text-xs sm:text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {unidadeNome
                ? <>Plano administrado por <strong>{unidadeNome}</strong>. </>
                : null}
              Acompanhe seus pagamentos, dependentes e benefícios em um só lugar.
            </p>

            {/* Cabeçalho com CPF protegido + cadeado + tooltip */}
            <p
              className="mt-2 text-sm flex flex-wrap items-center gap-1"
              style={{ color: 'var(--text)' }}
            >
              <span>Bem-vindo, {nomeExibicao}!</span>
              {cpf && (
                <>
                  <span>•</span>
                  <InfoTooltip text="Por segurança (LGPD), exibimos o CPF parcialmente. Você pode revelar por 10 segundos.">
                    <span className="inline-flex items-center gap-1">
                      <Lock size={14} aria-hidden="true" />
                      <span>
                        CPF{' '}
                        {cpfReveal ? formatCPF(cpf) : displayCPF(cpf, 'last2')}
                      </span>
                    </span>
                  </InfoTooltip>
                  <button
                    type="button"
                    className="btn-link text-xs"
                    onClick={startReveal10s}
                    aria-label="Mostrar CPF completo por 10 segundos"
                    disabled={cpfReveal}
                    title={
                      cpfReveal
                        ? 'CPF já está visível'
                        : 'Mostrar por 10 segundos'
                    }
                  >
                    {cpfReveal ? `Visível (${cpfSeconds}s)` : 'Mostrar por 10s'}
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Ações (responsivo): Meu Perfil + Sair */}
          <div className="flex items-center gap-2 self-start">
            <Link
              to="/perfil"
              className="btn-outline inline-flex items-center gap-1"
              aria-label="Abrir Meu Perfil"
              title="Meu Perfil"
            >
              <User size={16} /> Meu Perfil
            </Link>
            <button
              className="btn-outline"
              onClick={logout}
              aria-label="Sair"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Seletor de contrato */}
        {!loading && Array.isArray(contratos) && contratos.length > 1 && (
          <div className="mt-4 card p-4">
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

        {/* Loading */}
        {loading && (
          <div className="mt-8 space-y-6">
            <Skeleton className="h-40" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
              <div className="lg:col-span-1 space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-56" />
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {!loading && erro && (
          <div
            className="mt-6 card p-6"
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

        {/* Conteúdo */}
        {!loading && !erro && (
          contrato ? (
            <>
              {/* 1) Card de destaque do plano */}
              <div className="mt-8">
                <PlanoHighlightCard
                  contrato={contrato}
                  proximaParcela={proximaParcela}
                  totalEmAberto={totalEmAberto}
                />
              </div>

              {/* 2) Ações rápidas */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Atalhos do seu plano
                  </h3>
                  <p
                    className="text-[11px] sm:text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Acesse as funções mais usadas em poucos toques.
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <QuickAction
                    icon={FileText}
                    label="2ª via"
                    helper="Emita o boleto ou código de pagamento"
                    onClick={scrollToPagamento}
                  />
                  <QuickAction
                    icon={IdCard}
                    label="Meu cartão"
                    helper="Veja sua carteirinha digital completa"
                    to="/carteirinha"
                  />
                  <QuickAction
                    icon={MessageCircle}
                    label="Atendimento"
                    helper="Fale com a unidade pelo WhatsApp"
                    onClick={abrirAtendimento}
                  />
                  <QuickAction
                    icon={Clock3}
                    label="Histórico"
                    helper="Veja os pagamentos já realizados"
                    onClick={scrollToHistorico}
                  />
                </div>
              </div>

              {/* 3) Grid principal – dependentes à esquerda, alertas à direita */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA PRINCIPAL: dependentes + pagamentos + contrato */}
                <div className="lg:col-span-2 space-y-6">
                  <DependentesList
                    dependentes={dependentes}
                    contrato={contrato}
                  />

                  <div id="pagamento">
                    <PagamentoFacil
                      contrato={contrato}
                      parcelaFoco={proximaParcela}
                      proximas={proximas}
                      historico={historico}
                      isAtraso={isAtraso}
                    />
                  </div>

                  <ContratoCard contrato={contrato} />

                  {loadingPlano && !plano && (
                    <div className="card p-4">
                      <p
                        className="text-sm"
                        style={{ color: 'var(--text)' }}
                      >
                        Carregando serviços digitais do seu plano...
                      </p>
                    </div>
                  )}

                  {planoLinks.length > 0 && planoIdForRoute && (
                    <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

                  {/* âncora para o histórico dentro dos pagamentos */}
                  <div id="historico-pagamentos" className="h-0" aria-hidden="true" />
                </div>

                {/* COLUNA LATERAL: alertas / notificações (sticky) */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6 space-y-6">
                    <NotificationsCenter
                      items={notifications}
                      loading={loadingNotifications}
                      contextKey={cpf || 'default'}
                      onUnreadChange={setUnread}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 card p-6 text-center">
              <h3 className="text-lg font-semibold">
                Nenhum contrato encontrado
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
