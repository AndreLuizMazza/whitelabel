// src/pages/AreaUsuario.jsx
import { useMemo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api.js'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import ContratoCard from '@/components/ContratoCard'
import DependentesList from '@/components/DependentesList'
import PagamentoFacil from '@/components/PagamentoFacil'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import NotificationsCenter from '@/components/NotificationsCenter'
import useNotificationsStore from '@/store/notifications'
import { showToast } from '@/lib/toast'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, Printer, User } from 'lucide-react'

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

/* ===== Segmented control (Frente/Verso) ===== */
function SegmentedPrintButtons() {
  return (
    <div
      role="group"
      aria-label="Opções de impressão"
      className="inline-flex items-center rounded-md overflow-hidden"
      style={{ border: '1px solid var(--c-border)' }}
    >
      {/* Mantido vazio para não alterar comportamento existente */}
    </div>
  )
}

/* ===== helpers para links do plano (apenas existência) ===== */
function extractPlanoLinks(plano) {
  if (!plano || !Array.isArray(plano.links)) return []
  return plano.links.filter((item) => item && item.link && item.visivel !== false)
}

/* ===== helpers de formatação ===== */
function fmtCurrencyBRL(v) {
  if (v == null) return '—'
  const num = Number(v)
  if (Number.isNaN(num)) return String(v)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDatePT(d) {
  if (!d) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [Y, M, D] = d.split('-')
    return `${D}/${M}/${Y}`
  }
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function AreaUsuario() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  usePrefersDark()

  const {
    items: notifications,
    loading: loadingNotifications,
    setLoading: setNotifLoading,
    setNotifications: storeSetNotifications,
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

  /* ===== Notificações (histórico de eventos de pagamento) ===== */
  const lastEventIdRef = useRef(null)

  useEffect(() => {
    if (!cpf) return
    let cancelado = false
    let intervalId = null

    async function fetchNotifications() {
      try {
        setNotifLoading(true)

        const { data } = await api.get('/api/webhooks/progem/history', {
          params: { cpf, limit: 10 },
          __skipAuthRedirect: true,
        })

        if (cancelado) return

        let list = []

        if (Array.isArray(data)) {
          list = data
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.items)) {
            list = data.items
          } else if (Array.isArray(data.eventos)) {
            list = data.eventos
          } else if (data.eventId || data.id || data.eventType || data.evento) {
            list = [data]
          }
        }

        if (!list.length) {
          storeSetNotifications([])
          return
        }

        const normalizedList = list.map((ev, idx) => {
          const id =
            ev.eventId ||
            ev.id ||
            `${ev.eventType || ev.tipo || 'evt'}-${
              ev.parcelaId || ev.numeroContrato || idx
            }`
          return {
            ...ev,
            _id: id,
          }
        })

        const newest = normalizedList[0]
        const eventId = newest?._id

        storeSetNotifications(normalizedList)

        if (eventId && eventId !== lastEventIdRef.current) {
          lastEventIdRef.current = eventId

          const status = String(newest.status || '').toUpperCase()
          if (status === 'PAGA' || status === 'PAID') {
            showToast(
              `Pagamento da parcela do contrato #${
                newest.numeroContrato || ''
              } foi registrado com sucesso.`,
              'success'
            )
          }
        }
      } catch (e) {
        console.error('Falha ao carregar notificações de pagamento', e)
        if (!cancelado) {
          storeSetNotifications([])
        }
      } finally {
        if (!cancelado) setNotifLoading(false)
      }
    }

    fetchNotifications()
    intervalId = setInterval(fetchNotifications, 15000)

    return () => {
      cancelado = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [cpf, setNotifLoading, storeSetNotifications])

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

  const planoLinks = useMemo(() => extractPlanoLinks(plano), [plano])

  const planoIdForRoute =
    contrato?.planoId || contrato?.plano_id || plano?.id || null
  const numeroContrato = contrato?.numeroContrato ?? contrato?.id ?? null
  const nomePlano = contrato?.nomePlano ?? plano?.nome ?? null

  return (
    <section className="section" key={cpf}>
      <div className="container-max">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Área do associado
            </h2>

            {/* Cabeçalho com CPF protegido + cadeado + tooltip */}
            <p
              className="mt-2 text-sm flex items-center gap-1"
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
                const labelPlano = c?.nomePlano ?? c?.plano?.nome ?? 'Plano'
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
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-64" />
            </div>
            <div className="lg:col-span-1 space-y-6">
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
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* BLOCO 1 — Carteirinha + Impressão + Pagamento */}
              <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
                <h4 className="sr-only">Resumo do Associado e Pagamentos</h4>
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

                  <SegmentedPrintButtons />
                </div>

                {/* Pagamento (sticky apenas no desktop) */}
                <div className="lg:sticky lg:top-3 space-y-4">
                  <div id="pagamento" />

                  {/* Centro de notificações (histórico de eventos) */}
                  <NotificationsCenter
                    items={notifications}
                    loading={loadingNotifications}
                    contextKey={cpf || 'default'}
                    onUnreadChange={setUnread}
                  />

                  <PagamentoFacil
                    contrato={contrato}
                    parcelaFoco={proximaParcela}
                    proximas={proximas}
                    historico={historico}
                    isAtraso={isAtraso}
                  />
                </div>
              </div>

              {/* BLOCO 2 — Contrato + CTA Serviços Digitais + Dependentes */}
              <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
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
                        Acesse plataformas e benefícios online vinculados ao seu
                        plano, como clubes de descontos, aplicativos e outros
                        serviços digitais.
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

                <DependentesList
                  dependentes={dependentes}
                  contrato={contrato}
                />
              </div>
            </div>
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
