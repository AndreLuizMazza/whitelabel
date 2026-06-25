// src/pages/PlanoDetalhe.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { applyEmDashDocumentTitle } from '@/lib/shellBranding'
import { pick, money, getMensal } from '@/lib/planUtils.js'
import useTenant from '@/store/tenant'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'
import useAuth from '@/store/auth'

const track = (..._args) => {}

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}
const isNum = (v) => Number.isFinite(toNum(v))

function SummaryRow({ label, value, hint, emphasize = false, divider = true }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 px-4 py-3.5"
      style={
        divider
          ? { borderBottom: '1px solid var(--separator, var(--c-border))' }
          : undefined
      }
    >
      <div className="min-w-0">
        <p className="text-[15px] text-[var(--text)]">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-[var(--c-muted)]">{hint}</p>
        ) : null}
      </div>
      <p
        className={`shrink-0 tabular-nums ${
          emphasize ? 'text-[22px] font-bold tracking-tight' : 'text-[15px] font-semibold'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default function PlanoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const empresa = useTenant((s) => s.empresa)

  const isAuthenticated = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )

  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchPlano(planId) {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/v1/planos/${planId}`, {
        transformRequest: [(d, headers) => {
          try {
            delete headers.Authorization
          } catch {}
          return d
        }],
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchPlano(id)
  }, [id])

  useEffect(() => {
    try {
      window.scrollTo(0, 0)
    } catch {}
  }, [])

  useEffect(() => {
    if (plano?.nome) applyEmDashDocumentTitle(plano.nome, 'Planos', empresa)
  }, [plano?.nome, empresa])

  const baseMensal = useMemo(() => getMensal(plano), [plano])
  const valorAdesao = toNum(pick(plano || {}, 'valorAdesao', 'valor_adesao') || 0)
  const numDepsIncl = toNum(pick(plano || {}, 'numeroDependentes', 'numero_dependentes') || 0)
  const valorIncrementalAnual = toNum(
    pick(plano || {}, 'valorIncremental', 'valor_incremental') || 0
  )
  const valorIncrementalMensal = useMemo(
    () => valorIncrementalAnual / 12,
    [valorIncrementalAnual]
  )

  const idadeMinTit = pick(plano || {}, 'idadeMinimaTitular', 'idade_minima_titular')
  const idadeMaxTit = pick(plano || {}, 'idadeMaximaTitular', 'idade_maxima_titular')
  const idadeMinDep = pick(plano || {}, 'idadeMinimaDependente', 'idade_minima_dependente')
  const idadeMaxDep = pick(plano || {}, 'idadeMaximaDependente', 'idade_maxima_dependente')

  const idadeMinTitN = toNum(idadeMinTit)
  const idadeMaxTitN = toNum(idadeMaxTit)
  const idadeMinDepN = toNum(idadeMinDep)
  const idadeMaxDepN = toNum(idadeMaxDep)

  const hasAgeDetails =
    isNum(idadeMinTitN) ||
    isNum(idadeMaxTitN) ||
    isNum(idadeMinDepN) ||
    isNum(idadeMaxDepN)

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
      cupom: '',
      planSnapshot,
      sig: null,
    }

    const params = new URLSearchParams({
      p: btoa(encodeURIComponent(JSON.stringify(payload))),
    })
    const target = `/cadastro?${params.toString()}`

    track('plano.continuar', { id, nome: planSnapshot.nome })

    if (!isAuthenticated) {
      navigate('/criar-conta', { state: { from: target, intent: 'lead' } })
    } else {
      navigate(target)
    }
  }

  const ctaLabel = isAuthenticated ? 'Continuar cadastro' : 'Criar conta e continuar'

  if (loading) {
    return (
      <section className="section bg-[var(--grouped-bg,var(--surface-alt))] md:bg-transparent">
        <div className="container-max max-w-lg space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-[var(--c-surface)]" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--c-surface)]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[var(--c-surface)]" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container-max max-w-lg">
          <p className="mb-3 font-medium" style={{ color: 'var(--primary)' }}>
            {error}
          </p>
          <CTAButton onClick={() => fetchPlano(id)}>Tentar de novo</CTAButton>
        </div>
      </section>
    )
  }

  if (!plano) return null

  return (
    <section className="section bg-[var(--grouped-bg,var(--surface-alt))] md:bg-transparent pb-[calc(108px+env(safe-area-inset-bottom))] md:pb-8">
      <div className="container-max max-w-lg">
        <button
          type="button"
          onClick={() => navigate('/planos')}
          className="mb-5 inline-flex items-center gap-0.5 text-[15px] font-medium text-[var(--primary)] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg -ml-1 px-1 py-0.5"
          aria-label="Voltar para planos"
        >
          <ChevronLeft size={20} aria-hidden />
          Planos
        </button>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--c-muted)]">
            Confirmar plano
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-[var(--text)]">
            {plano.nome}
          </h1>
          <p className="mt-1.5 text-[15px] text-[var(--c-muted)]">
            Revise os valores e avance para o cadastro.
          </p>
        </header>

        <div
          className="overflow-hidden rounded-2xl bg-[var(--surface,var(--c-surface))]"
          style={{ boxShadow: '0 1px 0 var(--separator, var(--c-border))' }}
        >
          <SummaryRow
            label="Mensalidade"
            value={`${money(baseMensal)}/mês`}
            emphasize
          />
          {isNum(valorAdesao) && valorAdesao > 0 ? (
            <SummaryRow
              label="Adesão"
              value={money(valorAdesao)}
              hint="Cobrança única na contratação"
            />
          ) : null}
          {isNum(numDepsIncl) ? (
            <SummaryRow
              label="Dependentes incluídos"
              value={String(numDepsIncl)}
              hint={
                isNum(valorIncrementalMensal) && valorIncrementalMensal > 0
                  ? `Extras: ${money(valorIncrementalMensal)}/mês cada`
                  : undefined
              }
            />
          ) : null}
          <div className="px-4 py-3">
            <p className="text-xs leading-relaxed text-[var(--c-muted)]">
              Dependentes adicionais e cupom são definidos nas próximas etapas.
            </p>
          </div>
        </div>

        {hasAgeDetails ? (
          <details className="mt-4 group">
            <summary className="cursor-pointer list-none rounded-xl px-1 py-2 text-[15px] font-medium text-[var(--primary)] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="group-open:opacity-70">Detalhes do plano</span>
            </summary>
            <div
              className="mt-1 overflow-hidden rounded-2xl bg-[var(--surface,var(--c-surface))]"
              style={{ boxShadow: '0 1px 0 var(--separator, var(--c-border))' }}
            >
              {(isNum(idadeMinTitN) || isNum(idadeMaxTitN)) ? (
                <SummaryRow
                  label="Idade do titular"
                  value={`${isNum(idadeMinTitN) ? idadeMinTitN : '—'}${
                    isNum(idadeMaxTitN) ? `–${idadeMaxTitN}` : '+'
                  } anos`}
                  divider={!!(isNum(idadeMinDepN) || isNum(idadeMaxDepN))}
                />
              ) : null}
              {(isNum(idadeMinDepN) || isNum(idadeMaxDepN)) ? (
                <SummaryRow
                  label="Idade dos dependentes"
                  value={`${isNum(idadeMinDepN) ? idadeMinDepN : '—'}${
                    isNum(idadeMaxDepN) ? `–${idadeMaxDepN}` : '+'
                  } anos`}
                  divider={false}
                />
              ) : null}
            </div>
          </details>
        ) : null}

        <div className="mt-8 hidden md:block">
          <CTAButton
            className="h-12 w-full rounded-xl text-base"
            onClick={handleContinuar}
            title="Prosseguir para cadastro"
          >
            {ctaLabel}
          </CTAButton>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--c-muted)]">
            <ShieldCheck size={14} aria-hidden />
            Pagamento seguro · Dados protegidos
          </p>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-[var(--surface,var(--c-surface))]/92 backdrop-blur-xl backdrop-saturate-150 md:hidden"
        style={{ borderColor: 'var(--separator, var(--c-border))' }}
        role="region"
        aria-label="Continuar contratação"
      >
        <div className="container-max max-w-lg px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <CTAButton
            className="h-12 w-full rounded-xl text-base shadow-sm"
            onClick={handleContinuar}
            title="Prosseguir para cadastro"
          >
            {ctaLabel}
          </CTAButton>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[var(--c-muted)]">
            <ShieldCheck size={12} aria-hidden />
            Pagamento seguro · Dados protegidos
          </p>
        </div>
      </div>

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
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />
    </section>
  )
}
