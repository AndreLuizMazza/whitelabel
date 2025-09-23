// src/pages/PlanoDetalhe.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import {
  pick,
  money,
  encontrarFaixaPorIdade,
  isIsento,
  getMensal,
} from '@/lib/planUtils.js'
import { Sparkles, CheckCircle2, ShieldCheck, Clock3 } from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'

/* ========= Placeholder refinado ========= */
const PH_LIGHT =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M24 4l16 9v11c0 11-7 20-16 20S8 35 8 24V13l16-9z"
    stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 24l6 6 10-10"
    stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`)
const PH_DARK =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M24 4l16 9v11c0 11-7 20-16 20S8 35 8 24V13l16-9z"
    stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 24l6 6 10-10"
    stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`)

/* ========= Benefícios (estáticos por enquanto) ========= */
const BENEFICIOS_EXEMPLO = [
  { icon: '🕊️', title: 'Cobertura funeral completa', desc: 'Assistência em todas as etapas, incluindo preparação, cerimônia e sepultamento.' },
  { icon: '🚑', title: 'Translado 24h', desc: 'Remoção e transporte do corpo em todo o território nacional.' },
  { icon: '📄', title: 'Documentação inclusa', desc: 'Apoio em registro de óbito, certidões e demais burocracias.' },
  { icon: '👨‍👩‍👧', title: 'Assistência familiar', desc: 'Cobertura estendida ao cônjuge, filhos e dependentes cadastrados.' },
  { icon: '📞', title: 'Atendimento 24 horas', desc: 'Central de suporte sempre disponível para emergências.' },
  { icon: '💳', title: 'Pagamento seguro', desc: 'Processamento de pagamentos com segurança e sem fidelidade.' },
]

/* ---------- Toast simples ---------- */
function Toast({ show, message }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="pointer-events-auto rounded-full px-4 py-2 text-sm shadow-lg border"
        style={{
          background: 'var(--c-surface)',
          borderColor: 'var(--c-border)',
          color: 'var(--c-text)',
        }}
      >
        {message}
      </div>
    </div>
  )
}

/* ---------- Linha de dependente ---------- */
function DepRow({
  value,
  index,
  parentescos,
  onChange,
  onRemove,
  faixaDep,
  isento,
}) {
  const step = (delta) => {
    const next = Math.max(0, Math.min(120, Number(value.idade || 0) + delta))
    onChange(index, { idade: next })
  }
  const valorFaixa = isento ? 0 : Number(faixaDep?.valor || 0)

  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 grid place-items-center rounded-xl"
            style={{
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: 'var(--on-primary, #fff)',
              border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            }}
            aria-hidden
          >
            👪
          </div>

          <div className="grid w-full gap-2 md:grid-cols-[180px,1fr,auto]">
            <label className="sr-only" htmlFor={`parentesco-${index}`}>Parentesco</label>
            <select
              id={`parentesco-${index}`}
              className="input h-10"
              value={value.parentesco}
              onChange={(e) => onChange(index, { parentesco: e.target.value })}
            >
              {parentescos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Stepper de idade */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                className="rounded-full h-10 w-10 grid place-items-center border border-[var(--c-border)] hover:bg-[var(--c-surface-alt)]"
                aria-label="Diminuir idade"
              >−</button>
              <label className="sr-only" htmlFor={`idade-${index}`}>Idade</label>
              <input
                id={`idade-${index}`}
                className="input h-10 w-24 text-center"
                type="number"
                min="0"
                max="120"
                value={value.idade}
                onChange={(e) => onChange(index, { idade: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => step(+1)}
                className="rounded-full h-10 w-10 grid place-items-center border border-[var(--c-border)] hover:bg-[var(--c-surface-alt)]"
                aria-label="Aumentar idade"
              >+</button>
            </div>

            {/* Valor (faixa) */}
            <div className="flex items-center justify-end gap-2">
              {isento ? (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
                    color: 'var(--on-primary, #fff)',
                    border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                  }}
                  title="Isento pelas regras do plano"
                >
                  Isento
                </span>
              ) : null}
              <span className="rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-[var(--c-border)]">
                {money(valorFaixa)}
              </span>
            </div>
          </div>
        </div>

        <CTAButton
          variant="ghost"
          className="shrink-0"
          onClick={() => onRemove(index)}
          aria-label={`Remover dependente ${index + 1}`}
        >
          Remover
        </CTAButton>
      </div>

      {faixaDep ? (
        <p className="mt-2 text-xs text-[var(--c-muted)]">
          Faixa <b>{faixaDep.idadeMinima ?? faixaDep.idade_minima}–{faixaDep.idadeMaxima ?? faixaDep.idade_maxima}</b>
        </p>
      ) : null}
    </div>
  )
}

export default function PlanoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  // estado base
  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // simulador
  const [idadeTitular, setIdadeTitular] = useState(30)
  const [dependentes, setDependentes] = useState([])

  const simRef = useRef(null)
  const resumoRef = useRef(null)
  const addLockRef = useRef(false)

  // cupom (lê da URL se existir)
  const [cupom, setCupom] = useState(() => {
    try {
      const qs = new URLSearchParams(window.location.search)
      return qs.get('cupom') || qs.get('coupon') || ''
    } catch {
      return ''
    }
  })

  // toasts
  const [toast, setToast] = useState({ show: false, message: '' })
  const triggerToast = (message) => {
    setToast({ show: true, message })
    window.clearTimeout(triggerToast._t)
    triggerToast._t = window.setTimeout(() => setToast({ show: false, message: '' }), 1800)
  }

  // ===== tema e imagem =====
  const [isDark, setIsDark] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef(null)

  // detecta tema
  useEffect(() => {
    const update = () => {
      try {
        const byClass = document.documentElement.classList?.contains('dark')
        const byMedia = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
        setIsDark(Boolean(byClass || byMedia))
      } catch {}
    }
    update()
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onChange = () => update()
    try { mql?.addEventListener('change', onChange) } catch { mql?.addListener?.(onChange) }
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      try { mql?.removeEventListener('change', onChange) } catch { mql?.removeListener?.(onChange) }
      mo.disconnect()
    }
  }, [])

  // busca do plano
  async function fetchPlano(planId) {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/v1/planos/${planId}`, {
        transformRequest: [(d, headers) => { try { delete headers.Authorization } catch {}; return d }],
      })
      setPlano(data)
    } catch {
      try {
        const { data } = await api.get(`/api/v1/planos/${planId}`, { headers: { Authorization: '' } })
        setPlano(data)
      } catch (err) {
        console.error(err)
        setError(`Falha ao carregar o plano (id: ${planId}).`)
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (id) fetchPlano(id) }, [id])

  // define imagem
  useEffect(() => {
    const foto = pick(plano || {}, 'foto')
    const placeholder = isDark ? PH_DARK : PH_LIGHT
    const next = (foto && String(foto).trim()) || placeholder
    setImgSrc(next)
  }, [plano, isDark])

  // fade-in em cache-hit
  useEffect(() => {
    setImgLoaded(false)
    const idAnim = requestAnimationFrame(() => {
      const el = imgRef.current
      if (el && el.complete && el.naturalWidth > 0) setImgLoaded(true)
    })
    return () => cancelAnimationFrame(idAnim)
  }, [imgSrc])

  const handleImgError = () => {
    const ph = isDark ? PH_DARK : PH_LIGHT
    if (imgSrc !== ph) setImgSrc(ph)
    else setImgLoaded(true)
  }

  // --------- Cálculos base ----------
  const baseMensal = useMemo(() => getMensal(plano), [plano])
  const valorAdesao = Number(pick(plano || {}, 'valorAdesao', 'valor_adesao') || 0)
  const numDepsIncl = Number(pick(plano || {}, 'numeroDependentes', 'numero_dependentes') || 0)
  const valorIncrementalAnual = Number(pick(plano || {}, 'valorIncremental', 'valor_incremental') || 0)
  const valorIncrementalMensal = useMemo(() => valorIncrementalAnual / 12, [valorIncrementalAnual])
  const faixasDep = pick(plano || {}, 'faixasEtarias', 'faixas_etarias') || []
  const faixasTit = pick(plano || {}, 'faixasEtariasTitular', 'faixas_etarias_titular') || []
  const isencoes = pick(plano || {}, 'isencoes') || []
  const unidadeCarencia = pick(plano || {}, 'unidadeCarencia', 'unidade_carencia') || 'DIAS'
  const periodoCarencia = pick(plano || {}, 'periodoCarencia', 'periodo_carencia') || 0
  const parentescosAll = pick(plano || {}, 'parentescos') || ['CONJUGE', 'FILHO', 'PAI', 'MAE']
  const parentescos = Array.isArray(parentescosAll)
    ? parentescosAll.filter((p) => String(p).toUpperCase() !== 'TITULAR')
    : ['FILHO']

  const faixaTit = useMemo(() => encontrarFaixaPorIdade(faixasTit, idadeTitular), [faixasTit, idadeTitular])
  const custoTitularFaixa = Number(faixaTit?.valor || 0)
  const custoTitular = baseMensal + custoTitularFaixa

  const custosDependentes = useMemo(() => {
    return dependentes.map((d) => {
      const faixa = encontrarFaixaPorIdade(faixasDep, Number(d.idade || 0))
      const isento = isIsento(isencoes, Number(d.idade || 0), d.parentesco)
      const valorFaixa = isento ? 0 : Number(faixa?.valor || 0)
      return { ...d, valorFaixa, isento, faixa }
    })
  }, [dependentes, faixasDep, isencoes])

  const somaFaixasDep = useMemo(
    () => custosDependentes.reduce((acc, d) => acc + d.valorFaixa, 0),
    [custosDependentes]
  )

  const extrasCount = Math.max(0, dependentes.length - Number(numDepsIncl))
  const custoIncrementalExtras = extrasCount * valorIncrementalMensal
  const totalMensal = custoTitular + somaFaixasDep + custoIncrementalExtras
  const totalAnual = totalMensal * 12

  // ===== Actions =====
  function addDependente() {
    if (addLockRef.current) return
    addLockRef.current = true
    setDependentes((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, parentesco: parentescos[0] || 'FILHO', idade: 0 },
    ])
    triggerToast('Dependente adicionado')
    setTimeout(() => (addLockRef.current = false), 200)
  }
  function updDependente(i, patch) {
    setDependentes((prev) => {
      const copy = prev.slice()
      copy[i] = { ...copy[i], ...patch }
      return copy
    })
  }
  function delDependente(i) {
    setDependentes((prev) => {
      const copy = prev.slice()
      copy.splice(i, 1)
      triggerToast('Dependente removido')
      return copy
    })
  }

  const simRefScroll = () => simRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const resumoRefScroll = () => resumoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  /** CTA → Checkout + tracking (add_to_cart) */
  const handleContratar = () => {
    const cents = Math.round(Number(totalMensal || 0) * 100)
    try {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'add_to_cart',
        currency: 'BRL',
        value: Number(totalMensal || 0),
        value_cents: cents,
        coupon: cupom || undefined,
        items: [
          {
            item_id: String(id),
            item_name: pick(plano || {}, 'nome') || '',
            price: Number(totalMensal || 0),
            price_cents: cents,
            quantity: 1,
            dependentes_informados: dependentes.length,
          },
        ],
      })
    } catch {}
    const params = new URLSearchParams({
      plano: String(id),
      total_mensal: String(cents), // centavos
      deps: String(dependentes.length),
    })
    if (cupom) params.set('cupom', cupom.trim())
    navigate(`/checkout?${params.toString()}`)
  }

  // ===== Renders =====
  if (loading) {
    return (
      <section className="section">
        <div className="container-max space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-[var(--c-surface)]" />
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <div className="h-72 rounded-2xl animate-pulse bg-[var(--c-surface)]" />
            <div className="space-y-4">
              <div className="h-7 w-3/4 rounded animate-pulse bg-[var(--c-surface)]" />
              <div className="h-5 w-2/3 rounded animate-pulse bg-[var(--c-surface)]" />
              <div className="h-24 rounded animate-pulse bg-[var(--c-surface)]" />
            </div>
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

  return (
    <section className="section">
      <div className="container-max">
        {/* voltar */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)] focus:outline-none"
          >
            ← Voltar
          </button>
        </div>

        {/* HERO */}
        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div className="rounded-2xl bg-[var(--c-surface)]">
            <div className="h-72 w-full p-4 flex items-center justify-center">
              <img
                ref={imgRef}
                src={imgSrc || (isDark ? PH_DARK : PH_LIGHT)}
                alt={plano.nome}
                className={`max-h-full max-w-full object-contain transition-opacity duration-300 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={handleImgError}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold tracking-tight">{plano.nome}</h1>

            <p className="mt-2 text-lg">
              {money(baseMensal)} <span className="text-sm">/mês (base)</span>
            </p>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div><span>Dependentes incluídos: </span><strong>{numDepsIncl}</strong></div>
              <div><span>+ por dependente: </span><strong>{money(valorIncrementalMensal)}</strong></div>
              <div><span>Carência: </span><strong>{periodoCarencia} {unidadeCarencia}</strong></div>
            </div>

            {/* CTA topo */}
            <div
              className="mt-6 rounded-2xl p-4"
              style={{
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="rounded-full p-2 text-white"
                  style={{ background: 'color-mix(in srgb, var(--primary) 90%, black)' }}
                  aria-hidden
                >
                  <Sparkles size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Simule o plano em segundos</p>
                  <p className="text-sm">Informe a idade do titular e adicione dependentes para ver o valor exato.</p>
                </div>
                <CTAButton onClick={() => simRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Simular agora
                </CTAButton>
              </div>

              <ul className="mt-3 flex flex-wrap gap-4 text-xs">
                <li className="inline-flex items-center gap-1"><ShieldCheck size={14} /> Sem fidelidade</li>
                <li className="inline-flex items-center gap-1"><Clock3 size={14} /> Ativação rápida</li>
                <li className="inline-flex items-center gap-1"><CheckCircle2 size={14} /> Pagamento seguro</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========= Benefícios estáticos ========= */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Benefícios inclusos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFICIOS_EXEMPLO.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4"
              >
                <div className="text-xl" aria-hidden>{b.icon}</div>
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-[var(--c-text)]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- SIMULADOR ---------- */}
        <div ref={simRef} className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Simulador */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Simulador de contratação</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-3 py-1 text-xs ring-1 ring-[var(--c-border)]">Informados: <b>{dependentes.length}</b></span>
                <span className="rounded-full px-3 py-1 text-xs ring-1 ring-[var(--c-border)]">Incluídos: <b>{numDepsIncl}</b></span>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background:'color-mix(in srgb, var(--primary) 12%, transparent)',
                    border:'1px solid color-mix(in srgb, var(--primary) 20%, transparent)'
                  }}
                >
                  Excedentes: <b>{Math.max(0, dependentes.length - numDepsIncl)}</b>
                </span>
                <CTAButton onClick={addDependente} className="ml-1">Adicionar dependente</CTAButton>
              </div>
            </div>

            {/* Campos de topo */}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <label className="label">Idade do titular</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIdadeTitular((v) => Math.max(0, v - 1))}
                    className="rounded-full h-10 w-10 grid place-items-center border border-[var(--c-border)] hover:bg-[var(--c-surface-alt)]"
                    aria-label="Diminuir idade do titular"
                  >−</button>
                  <input
                    className="input h-10 w-24 text-center"
                    type="number"
                    min="0"
                    max="120"
                    value={idadeTitular}
                    onChange={(e) => setIdadeTitular(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => setIdadeTitular((v) => Math.min(120, v + 1))}
                    className="rounded-full h-10 w-10 grid place-items-center border border-[var(--c-border)] hover:bg-[var(--c-surface-alt)]"
                    aria-label="Aumentar idade do titular"
                  >+</button>
                </div>
                {faixaTit && (
                  <p className="mt-1 text-xs text-[var(--c-muted)]">
                    Faixa do titular: {faixaTit.idadeMinima ?? faixaTit.idade_minima}–{faixaTit.idadeMaxima ?? faixaTit.idade_maxima} • Adicional {money(faixaTit.valor)}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Adesão (uma vez)</label>
                <input className="input h-10" value={money(valorAdesao)} readOnly />
              </div>

              <div>
                <label className="label">Carência</label>
                <input className="input h-10" value={`${periodoCarencia} ${unidadeCarencia}`} readOnly />
              </div>
            </div>

            {/* Lista de dependentes */}
            <div className="mt-5 grid gap-3">
              {dependentes.length === 0 ? (
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                  }}
                >
                  Nenhum dependente adicionado. Clique em <b>“Adicionar dependente”</b>.
                </div>
              ) : null}

              {dependentes.map((d, i) => {
                const faixa = encontrarFaixaPorIdade(faixasDep, Number(d.idade || 0))
                const isento = isIsento(isencoes, Number(d.idade || 0), d.parentesco)
                return (
                  <DepRow
                    key={d.id || i}
                    value={d}
                    index={i}
                    parentescos={parentescos}
                    onChange={updDependente}
                    onRemove={delDependente}
                    faixaDep={faixa}
                    isento={isento}
                  />
                )
              })}
            </div>

            <p className="mt-3 text-xs text-[var(--c-muted)]">
              Excedentes são cobrados a <b>{money(valorIncrementalMensal)}</b> por mês cada.
            </p>
          </div>

          {/* Resumo */}
          <div ref={resumoRef} className="p-6 md:sticky md:top-24 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm" aria-live="polite">
              <div className="flex justify-between"><span>Base mensal</span><span>{money(baseMensal)}</span></div>
              <div className="flex justify-between"><span>Adicional do titular (faixa)</span><span>{money(custoTitularFaixa)}</span></div>
              <div className="flex justify-between"><span>Dependentes (faixas)</span><span>{money(somaFaixasDep)}</span></div>
              <div className="flex justify-between">
                <span>Excedentes ({Math.max(0, dependentes.length - numDepsIncl)}) × {money(valorIncrementalMensal)}</span>
                <span>{money(custoIncrementalExtras)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-base"><span>Total mensal</span><span>{money(totalMensal)}</span></div>
              <div className="flex justify-between"><span>Total anual</span><span>{money(totalAnual)}</span></div>
              <div className="flex justify-between"><span>Adesão (uma vez)</span><span>{money(valorAdesao)}</span></div>

              {/* Cupom (opcional) */}
              <div className="pt-2">
                <label className="label" htmlFor="cupom">Cupom (opcional)</label>
                <input
                  id="cupom"
                  className="input h-10"
                  placeholder="EX.: BEMVINDO10"
                  value={cupom}
                  onChange={(e) => setCupom(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <CTAButton className="mt-4 w-full" onClick={handleContratar}>
              Contratar
            </CTAButton>
            <p className="mt-2 text-center text-xs">Sem fidelidade • Ativação rápida • Atendimento humano</p>
          </div>
        </div>

        {/* FAQ (colapsável) */}
        <div className="mt-10 grid gap-3">
          <details className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            <summary className="cursor-pointer list-none font-semibold">Como funciona a carência?</summary>
            <p className="mt-2 text-sm text-[var(--c-text)]">
              A carência pode variar por plano. Veja o campo <b>Carência</b> acima e, em caso de dúvida,
              nossa equipe orienta você no momento da contratação.
            </p>
          </details>
          <details className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            <summary className="cursor-pointer list-none font-semibold">Quais coberturas estão incluídas?</summary>
            <p className="mt-2 text-sm text-[var(--c-text)]">
              As coberturas principais estão listadas em <b>Benefícios inclusos</b>. Em breve exibiremos aqui
              exatamente o que vier da sua operadora (API).
            </p>
          </details>
          <details className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            <summary className="cursor-pointer list-none font-semibold">Posso pedir reembolso?</summary>
            <p className="mt-2 text-sm text-[var(--c-text)]">
              Reembolsos dependem das regras de cada plano. Entre em contato com nosso suporte para orientações.
            </p>
          </details>
        </div>
      </div>

      {/* Mobile bottom bar (fundo sólido) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)] shadow-lg md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-7xl px-3 py-3 flex items-center gap-3">
          <button
            onClick={resumoRefScroll}
            className="flex-1 text-left"
            aria-label="Ir para resumo do valor"
          >
            <p className="text-xs text-[var(--c-muted)] leading-tight">Total mensal</p>
            <p className="text-lg font-extrabold leading-tight">{money(totalMensal)}</p>
          </button>
          <CTAButton className="min-w-[46%]" onClick={handleContratar}>
            Contratar
          </CTAButton>
        </div>
      </div>

      {/* Toasts */}
      <Toast show={toast.show} message={toast.message} />
    </section>
  )
}
