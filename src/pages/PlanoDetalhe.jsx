// src/pages/PlanoDetalhe.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { pick, money, getMensal } from '@/lib/planUtils.js'
import { Sparkles, CheckCircle2, Clock3, ShieldCheck, BadgeCheck, Info } from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'
import useAuth from '@/store/auth'

/* =========== util/infra =========== */
const track = (..._args) => {} // plugar no seu analytics

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}
const isNum = (v) => Number.isFinite(toNum(v))

/* ---------- Toast (sutil, acessível) ---------- */
function Toast({ show, message }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div
        className="pointer-events-auto rounded-full px-4 py-2 text-sm shadow-lg border bg-[var(--c-surface)]"
        style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
      >
        {message}
      </div>
    </div>
  )
}

/* ---------- Alert inline ---------- */
function InlineNote({ icon, children }) {
  return (
    <div
      className="mt-4 rounded-2xl p-4 border"
      style={{
        background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
        borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="rounded-full p-2 text-white"
            style={{ background: 'color-mix(in srgb, var(--primary) 90%, black)' }}
            aria-hidden
          >
            {icon || <Sparkles size={16} />}
          </div>
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="inline-flex items-center gap-1"><Clock3 size={14} /> Rápido</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 size={14} /> Seguro</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Bullets de valor ---------- */
function Perks({ className='' }) {
  return (
    <div className={`rounded-2xl border bg-[var(--c-surface)] p-6 ${className}`} style={{ borderColor: 'var(--c-border)' }}>
      <h3 className="text-lg font-semibold">O que você recebe</h3>
      <ul className="mt-3 space-y-2 text-sm">
        <li>• Assistência completa com suporte humanizado.</li>
        <li>• Inclusão de dependentes conforme regras do plano.</li>
        <li>• Gestão online do contrato e 2ª via com facilidade.</li>
        <li>• Comunicação ágil com a equipe da unidade.</li>
      </ul>
    </div>
  )
}

/* ---------- Grid de preços rápidos ---------- */
function QuickPrices({ mensal, adesao }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 mt-4">
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--c-border)' }}>
        <p className="text-xs text-[var(--c-muted)]">Mensalidade base</p>
        <p className="text-2xl font-extrabold">{money(mensal)}</p>
      </div>
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--c-border)' }}>
        <p className="text-xs text-[var(--c-muted)]">Adesão (uma vez)</p>
        <p className="text-2xl font-extrabold">{money(adesao)}</p>
      </div>
    </div>
  )
}

export default function PlanoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  // compat com store antiga (isAuthenticated() ou token)
  const isAuthenticated = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )

  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // cupom: lê da URL, mantém sincronizado, e dá feedback
  const [cupom, setCupom] = useState(() => {
    try {
      const qs = new URLSearchParams(window.location.search)
      return qs.get('cupom') || qs.get('coupon') || ''
    } catch { return '' }
  })
  const [toast, setToast] = useState({ show: false, message: '' })
  const triggerToast = (message) => {
    setToast({ show: true, message })
    window.clearTimeout(triggerToast._t)
    triggerToast._t = window.setTimeout(() => setToast({ show: false, message: '' }), 1400)
  }

  // ===== Carregamento do Plano =====
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
        console.error(err)
        setError(`Falha ao carregar o plano (id: ${planId}).`)
      }
    } finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchPlano(id) }, [id])

  // Scroll top e título
  useEffect(() => {
    try { window.scrollTo(0, 0) } catch {}
  }, [])
  useEffect(() => {
    if (plano?.nome) document.title = `${plano.nome} — Planos`
  }, [plano?.nome])

  // ===== Derivações =====
  const baseMensal = useMemo(() => getMensal(plano), [plano])
  const valorAdesao = toNum(pick(plano || {}, 'valorAdesao', 'valor_adesao') || 0)
  const numDepsIncl = toNum(pick(plano || {}, 'numeroDependentes', 'numero_dependentes') || 0)
  const valorIncrementalAnual = toNum(pick(plano || {}, 'valorIncremental', 'valor_incremental') || 0)
  const valorIncrementalMensal = useMemo(() => valorIncrementalAnual / 12, [valorIncrementalAnual])

  const idadeMinTit = pick(plano||{}, 'idadeMinimaTitular','idade_minima_titular')
  const idadeMaxTit = pick(plano||{}, 'idadeMaximaTitular','idade_maxima_titular')
  const idadeMinDep = pick(plano||{}, 'idadeMinimaDependente','idade_minima_dependente')
  const idadeMaxDep = pick(plano||{}, 'idadeMaximaDependente','idade_maxima_dependente')

  const idadeMinTitN = toNum(idadeMinTit)
  const idadeMaxTitN = toNum(idadeMaxTit)
  const idadeMinDepN = toNum(idadeMinDep)
  const idadeMaxDepN = toNum(idadeMaxDep)

  // ===== CTA =====
  const handleContinuar = () => {
    const planSnapshot = {
      id: String(id),
      nome: plano?.nome || '',
      numeroDependentes: isNum(numDepsIncl) ? numDepsIncl : 0,
      valorIncremental: isNum(valorIncrementalAnual) ? valorIncrementalAnual : 0,
      valorAdesao: isNum(valorAdesao) ? valorAdesao : 0,
      idadeMinimaTitular: isNum(idadeMinTitN) ? idadeMinTitN : null,
      idadeMaximaTitular: isNum(idadeMaxTitN) ? idadeMaxTitN : null,
      idadeMinimaDependente: isNum(idadeMinDepN) ? idadeMinDepN : null,
      idadeMaximaDependente: isNum(idadeMaxDepN) ? idadeMaxDepN : null,
      mensal: baseMensal,
    }

    const payload = {
      plano: String(id),
      qtdDependentes: 0,
      dependentes: [],
      cupom: cupom || '',
      planSnapshot,
      sig: null, // futuro: HMAC/server-side
    }

    const params = new URLSearchParams({ p: btoa(encodeURIComponent(JSON.stringify(payload))) })
    const target = `/cadastro?${params.toString()}`
    track('plano.continuar', { id, nome: planSnapshot.nome })

    if (!isAuthenticated) {
      navigate('/criar-conta', { state: { from: target } })
    } else {
      navigate(target)
    }
  }

  // ===== Estados =====
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
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)] focus:outline-none"
            style={{ borderColor: 'var(--c-border)' }}
            aria-label="Voltar"
          >
            ← Voltar
          </button>
        </div>

        {/* Header */}
        <div className="rounded-2xl border bg-[var(--c-surface)] p-6" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{plano.nome}</h1>
              <p className="mt-1 text-sm text-[var(--c-muted)]">Contrate em poucos minutos.</p>
            </div>

            <div
              className="inline-flex items-center gap-3 rounded-full px-5 h-12 border"
              style={{ borderColor: 'var(--c-border)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
              aria-label="Mensalidade base"
            >
              <span className="text-sm">Mensalidade base</span>
              <span className="text-2xl font-extrabold leading-none">{money(baseMensal)}</span>
            </div>
          </div>

          {/* Chips essenciais */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-11 inline-flex items-center justify-between rounded-full border px-4" style={{ borderColor: 'var(--c-border)' }}>
              <span className="text-sm">Dependentes incluídos</span><strong>{isNum(numDepsIncl) ? numDepsIncl : '—'}</strong>
            </div>
            <div className="h-11 inline-flex items-center justify-between rounded-full border px-4" style={{ borderColor: 'var(--c-border)' }}>
              <span className="text-sm">+ por dependente</span><strong>{money(valorIncrementalMensal)}</strong>
            </div>
            {(isNum(idadeMinTitN) || isNum(idadeMaxTitN)) && (
              <div className="h-11 inline-flex items-center justify-between rounded-full border px-4" style={{ borderColor: 'var(--c-border)' }}>
                <span className="text-sm">Idade titular</span>
                <strong>
                  {isNum(idadeMinTitN) ? `${idadeMinTitN}` : '—'}
                  {isNum(idadeMaxTitN) ? `–${idadeMaxTitN}` : '+'} anos
                </strong>
              </div>
            )}
            {(isNum(idadeMinDepN) || isNum(idadeMaxDepN)) && (
              <div className="h-11 inline-flex items-center justify-between rounded-full border px-4" style={{ borderColor: 'var(--c-border)' }}>
                <span className="text-sm">Idade dependentes</span>
                <strong>
                  {isNum(idadeMinDepN) ? `${idadeMinDepN}` : '—'}
                  {isNum(idadeMaxDepN) ? `–${idadeMaxDepN}` : '+'} anos
                </strong>
              </div>
            )}
          </div>

          <InlineNote icon={<ShieldCheck size={16} />}>
            Informe seus dados, adicione dependentes e finalize a contratação com segurança.
          </InlineNote>

          {/* Valor percebido + preços rápidos */}
          <Perks className="mt-6" />
          <QuickPrices mensal={baseMensal} adesao={valorAdesao} />
        </div>

        {/* Principal: Cupom + Resumo/CTA */}
        <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr,1fr]">
          {/* Cupom */}
          <div className="rounded-2xl border bg-[var(--c-surface)] p-6" style={{ borderColor: 'var(--c-border)' }}>
            <h3 className="text-lg font-semibold">Cupom de desconto</h3>
            <div className="mt-3 flex gap-2">
              <input
                id="cupom"
                className="input h-11 flex-1"
                placeholder="EX.: BEMVINDO10"
                value={cupom}
                onChange={(e) => {
                  const v = e.target.value.trim().toUpperCase()
                  setCupom(v)
                  // persiste na URL sem recarregar
                  try {
                    const url = new URL(window.location.href)
                    if (v) url.searchParams.set('cupom', v); else url.searchParams.delete('cupom')
                    window.history.replaceState({}, '', url.toString())
                  } catch {}
                }}
                autoComplete="off"
                aria-label="Código do cupom"
              />
              <button
                type="button"
                className="rounded-full border px-4 h-11 text-sm font-semibold hover:bg-[var(--c-surface-alt)]"
                style={{ borderColor: 'var(--c-border)' }}
                onClick={() => {
                  if (!cupom) return triggerToast('Informe um cupom')
                  // aqui você pode chamar /validar-cupom; por enquanto feedback otimista
                  triggerToast('Cupom aplicado')
                  track('cupom.aplicar', { cupom })
                }}
              >
                Aplicar
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--c-muted)] inline-flex items-center gap-1">
              <Info size={14}/> O desconto é validado no checkout.
            </p>
          </div>

          {/* Resumo + CTA */}
          <aside className="p-6 md:sticky md:top-24 bg-[var(--c-surface)] rounded-2xl border shadow-lg" style={{ borderColor: 'var(--c-border)' }}>
            <h3 className="mb-3 text-lg font-semibold">Associe-se</h3>
            <div className="space-y-2 text-sm" aria-live="polite">
              <div className="flex justify-between">
                <span>Adesão (uma vez)</span><span>{money(valorAdesao)}</span>
              </div>
              <hr className="my-2" />
              <p className="text-xs text-[var(--c-muted)]">
                Dependentes e valores adicionais são definidos no cadastro.
              </p>
            </div>
            <div className="mt-4">
              <CTAButton className="w-full h-11" onClick={handleContinuar} title="Prosseguir para cadastro">
                Continuar cadastro
              </CTAButton>
            </div>
            {/* Selo de confiança */}
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--c-muted)]">
              <BadgeCheck size={14}/> Pagamento seguro • Dados protegidos
            </div>
          </aside>
        </div>
      </div>

      {/* Dock inferior (mobile) — sem colidir com outros CTAs */}
      <div
        className="fixed inset-x-0 bottom-0 z-[50] border-t bg-[var(--c-surface)] md:hidden"
        style={{
          borderColor: 'var(--c-border)',
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -12px 30px rgba(0,0,0,.12)'
        }}
        role="region"
        aria-label="Resumo rápido e ação"
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

      {/* JSON-LD básico para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: plano?.nome || 'Plano',
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              price: Number(baseMensal || 0).toFixed(2),
              availability: 'https://schema.org/InStock'
            }
          })
        }}
      />

      <Toast show={toast.show} message={toast.message} />
    </section>
  )
}
