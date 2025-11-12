// src/pages/PlanoDetalhe.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { pick, money, getMensal } from '@/lib/planUtils.js'
import { Sparkles, CheckCircle2, Clock3, MessageCircle } from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import {
  resolveTenantPhone,
  resolveGlobalFallback,
  buildWaHref,
} from '@/lib/whats'

/* ---------- Toast (sutil, para feedbacks menores) ---------- */
function Toast({ show, message }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="pointer-events-auto rounded-full px-4 py-2 text-sm shadow-lg border"
        style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
      >
        {message}
      </div>
    </div>
  )
}

export default function PlanoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  // 🔐 estado de autenticação (mantém compatibilidade com stores antigos)
  const isAuthenticated = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )

  // Dados da unidade/tenant (GET /api/v1/unidades/me carregado pelo bootstrap)
  const empresa = useTenant(s => s.empresa)

  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cupom, setCupom] = useState(() => {
    try {
      const qs = new URLSearchParams(window.location.search)
      return qs.get('cupom') || qs.get('coupon') || ''
    } catch {
      return ''
    }
  })
  const [toast, setToast] = useState({ show: false, message: '' })
  const triggerToast = (message) => {
    setToast({ show: true, message })
    window.clearTimeout(triggerToast._t)
    triggerToast._t = window.setTimeout(() => setToast({ show: false, message: '' }), 1300)
  }

  // Link do WhatsApp (tenant > fallback global)
  const waHref = useMemo(() => {
    const tel = resolveTenantPhone(empresa) || resolveGlobalFallback()
    return buildWaHref({
      number: tel,
      message: plano?.nome ? `Olá! Tenho uma dúvida sobre o plano "${plano.nome}".` : 'Olá! Gostaria de tirar uma dúvida.',
    })
  }, [empresa, plano?.nome])

  // ===== Carregamento do Plano (com fallback de header) =====
  async function fetchPlano(planId) {
    setLoading(true); setError('')
    try {
      const { data } = await api.get(`/api/v1/planos/${planId}`, {
        transformRequest: [(d, headers) => { try { delete headers.Authorization } catch {}; return d }],
        __skipAuthRedirect: true,
      })
      setPlano(data)
    } catch {
      try {
        const { data } = await api.get(`/api/v1/planos/${planId}`, {
          headers: { Authorization: '' },
          __skipAuthRedirect: true,
        })
        setPlano(data)
      } catch (err) {
        console.error(err); setError(`Falha ao carregar o plano (id: ${planId}).`)
      }
    } finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchPlano(id) }, [id])

  // ===== Derivações de preço/limites =====
  const baseMensal = useMemo(() => getMensal(plano), [plano])
  const valorAdesao = Number(pick(plano || {}, 'valorAdesao', 'valor_adesao') || 0)
  const numDepsIncl = Number(pick(plano || {}, 'numeroDependentes', 'numero_dependentes') || 0)
  const valorIncrementalAnual = Number(pick(plano || {}, 'valorIncremental', 'valor_incremental') || 0)
  const valorIncrementalMensal = useMemo(() => valorIncrementalAnual / 12, [valorIncrementalAnual])

  const idadeMinTit = pick(plano||{}, 'idadeMinimaTitular','idade_minima_titular')
  const idadeMaxTit = pick(plano||{}, 'idadeMaximaTitular','idade_maxima_titular')
  const idadeMinDep = pick(plano||{}, 'idadeMinimaDependente','idade_minima_dependente')
  const idadeMaxDep = pick(plano||{}, 'idadeMaximaDependente','idade_maxima_dependente')

  // ===== CTA: seguir para cadastro imediato =====
  const handleContinuar = () => {
    // Snapshot mínimo do plano para o fluxo de cadastro
    const planSnapshot = {
      id: String(id),
      nome: plano?.nome || '',
      numeroDependentes: numDepsIncl,
      valorIncremental: valorIncrementalAnual,
      valorAdesao: valorAdesao,
      idadeMinimaTitular: idadeMinTit ?? null,
      idadeMaximaTitular: idadeMaxTit ?? null,
      idadeMinimaDependente: idadeMinDep ?? null,
      idadeMaximaDependente: idadeMaxDep ?? null,
      mensal: baseMensal,
    }

    const payload = {
      plano: String(id),
      // Sem simulador: decisão de dependentes acontece no cadastro.
      qtdDependentes: 0,
      dependentes: [],
      cupom: cupom || '',
      planSnapshot,
    }

    const params = new URLSearchParams({ p: btoa(encodeURIComponent(JSON.stringify(payload))) })
    const target = `/cadastro?${params.toString()}`

    if (!isAuthenticated) {
      navigate('/criar-conta', { state: { from: target } })
    } else {
      navigate(target)
    }
  }

  // ===== Estados de carregamento/erro =====
  if (loading) {
    return (
      <section className="section">
        <div className="container-max space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-[var(--c-surface)]" />
          <div className="h-24 rounded-2xl animate-pulse bg-[var(--c-surface)]" />
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <div className="h-72 rounded-2xl animate-pulse bg-[var(--c-surface)]" />
            <div className="h-72 rounded-2xl animate-pulse bg-[var(--c-surface)]" />
          </div>
        </div>
      </section>
    )
  }
  if (error) {
    return (
      <section className="section">
        <div className="container-max">
          <p className="mb-3 font-medium" style={{ color: 'var(--primary)' }}>{error}</p>
          <CTAButton onClick={() => fetchPlano(id)}>Tentar de novo</CTAButton>
        </div>
      </section>
    )
  }
  if (!plano) return null

  // ===== UI =====
  return (
    <section className="section">
      <div className="container-max">
        {/* Voltar */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)] focus:outline-none"
          >
            ← Voltar
          </button>
        </div>

        {/* Header do Plano */}
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{plano.nome}</h1>
              <p className="mt-1 text-sm text-[var(--c-muted)]">
                Escolha segura para sua família. Cadastre-se em poucos minutos.
              </p>
            </div>

            <div
              className="inline-flex items-center gap-3 rounded-full px-5 h-12 border border-[var(--c-border)]"
              style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
            >
              <span className="text-sm">Base mensal</span>
              <span className="text-2xl font-extrabold leading-none">{money(baseMensal)}</span>
            </div>
          </div>

          {/* Chips informativos */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
              <span className="text-sm">Dependentes incluídos</span><strong>{numDepsIncl}</strong>
            </div>
            <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
              <span className="text-sm">+ por dependente</span><strong>{money(valorIncrementalMensal)}</strong>
            </div>

            {(Number.isFinite(idadeMinTit) || Number.isFinite(idadeMaxTit)) && (
              <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
                <span className="text-sm">Idade titular</span>
                <strong>
                  {Number.isFinite(idadeMinTit) ? `${idadeMinTit}` : '—'}
                  {Number.isFinite(idadeMaxTit) ? `–${idadeMaxTit}` : '+'} anos
                </strong>
              </div>
            )}

            {(Number.isFinite(idadeMinDep) || Number.isFinite(idadeMaxDep)) && (
              <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
                <span className="text-sm">Idade dependentes</span>
                <strong>
                  {Number.isFinite(idadeMinDep) ? `${idadeMinDep}` : '—'}
                  {Number.isFinite(idadeMaxDep) ? `–${idadeMaxDep}` : '+'} anos
                </strong>
              </div>
            )}
          </div>

          {/* Destaque orientativo */}
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="rounded-full p-2 text-white"
                  style={{ background: 'color-mix(in srgb, var(--primary) 90%, black)' }}
                  aria-hidden
                >
                  <Sparkles size={16} />
                </div>
                <p className="text-sm leading-relaxed">
                  Prossiga para o cadastro para informar seus dados e adicionar dependentes.
                  <br className="hidden md:block" />
                  <span>As regras de idade e vínculos familiares são validadas durante o processo.</span>
                </p>
              </div>

              <div className="flex gap-2">
                <div className="inline-flex items-center gap-1 text-xs"><Clock3 size={14} /> Ativação rápida</div>
                <div className="inline-flex items-center gap-1 text-xs"><CheckCircle2 size={14} /> Pagamento seguro</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal: Resumo + Ações */}
        <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr,1fr]">
          {/* Coluna de descrição/benefícios (opcional, estática ou futura dinâmica) */}
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h3 className="text-lg font-semibold">O que você recebe</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
              <li>• Assistência funeral completa com suporte humanizado.</li>
              <li>• Inclusão de dependentes conforme regras do plano.</li>
              <li>• Gestão online do contrato e 2ª via com facilidade.</li>
              <li>• Comunicação ágil via WhatsApp com a equipe da unidade.</li>
            </ul>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--c-border)] p-4">
                <p className="text-xs text-[var(--c-muted)]">Mensalidade base</p>
                <p className="text-2xl font-extrabold mt-1">{money(baseMensal)}</p>
              </div>
              <div className="rounded-xl border border-[var(--c-border)] p-4">
                <p className="text-xs text-[var(--c-muted)]">Adesão (uma vez)</p>
                <p className="text-2xl font-extrabold mt-1">{money(valorAdesao)}</p>
              </div>
            </div>

            {/* Campo Cupom simples e direto */}
            <div className="mt-6">
              <label className="label" htmlFor="cupom">Cupom (opcional)</label>
              <div className="flex gap-2">
                <input
                  id="cupom"
                  className="input h-11 flex-1"
                  placeholder="EX.: BEMVINDO10"
                  value={cupom}
                  onChange={(e) => setCupom(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="rounded-full border px-4 h-11 text-sm font-semibold hover:bg-[var(--c-surface-alt)]"
                  onClick={() => cupom ? triggerToast('Cupom aplicado') : triggerToast('Informe um cupom')}
                >
                  Aplicar
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--c-muted)]">
                O desconto será validado no checkout.
              </p>
            </div>
          </div>

          {/* Resumo fixo com CTAs */}
          <aside className="p-6 md:sticky md:top-24 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm" aria-live="polite">
              <div className="flex justify-between"><span>Base mensal</span><span>{money(baseMensal)}</span></div>
              <div className="flex justify-between"><span>Adesão</span><span>{money(valorAdesao)}</span></div>
              <hr className="my-2" />
              <p className="text-xs text-[var(--c-muted)]">
                Dependentes e valores adicionais serão definidos no cadastro.
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <CTAButton className="w-full h-11" onClick={handleContinuar} title="Prosseguir para cadastro">
                Continuar cadastro
              </CTAButton>

              <CTAButton
                as="a"
                href={waHref || undefined}
                target={waHref ? "_blank" : undefined}
                rel={waHref ? "noopener noreferrer" : undefined}
                variant="outline"
                className="w-full h-11 justify-center"
                disabled={!waHref}
                title={waHref ? undefined : 'Telefone da unidade não informado'}
              >
                <MessageCircle size={16} className="mr-2" />
                Tirar dúvida no WhatsApp
              </CTAButton>
            </div>
          </aside>
        </div>
      </div>

      {/* Barra inferior (mobile) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)] md:hidden"
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -12px 30px rgba(0,0,0,.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-3 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-[var(--c-muted)] leading-tight">Mensalidade base</p>
            <p className="text-xl font-extrabold leading-tight">{money(baseMensal)}</p>
          </div>
          <CTAButton className="min-w-[46%] h-12" onClick={handleContinuar}>
            Continuar
          </CTAButton>
        </div>
      </div>
      <div className="h-16 md:hidden" aria-hidden />

      <Toast show={toast.show} message={toast.message} />
    </section>
  )
}
