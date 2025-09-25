// src/pages/PlanoDetalhe.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { pick, money, getMensal } from '@/lib/planUtils.js'
import {
  Sparkles, CheckCircle2, Clock3,
  Minus, Plus as PlusIcon, MessageCircle
} from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'

/* ---------- Parentescos (fallback enum completo) ---------- */
const PARENTESCOS_ENUM = [
  ['CONJUGE','Cônjuge'], ['COMPANHEIRO','Companheiro(a)'], ['FILHO','Filho(a)'],
  ['PAI','Pai'], ['MAE','Mãe'], ['IRMAO','Irmã(o)'], ['AVO','Avô(ó)'], ['TITULAR','Titular'],
  ['RESPONSAVEL','Responsável'], ['TIO','Tio(a)'], ['SOBRINHO','Sobrinho(a)'], ['PRIMO','Primo(a)'],
  ['NETO','Neto(a)'], ['BISNETO','Bisneto(a)'], ['PADRASTO','Padrasto'], ['MADRASTRA','Madrasta'],
  ['AFILHADO','Afilhado(a)'], ['ENTEADA','Enteado(a)'], ['SOGRO','Sogro(a)'], ['GENRO','Genro'],
  ['NORA','Nora'], ['CUNHADO','Cunhado(a)'], ['BISAVO','Bisavô(ó)'], ['MADRINHA','Madrinha'],
  ['PADRINHO','Padrinho'], ['AMIGO','Amigo(a)'], ['AGREGADO','Agregado'], ['DEPENDENTE','Dependente'],
  ['COLABORADOR','Colaborador'], ['EX_CONJUGE','Ex Cônjuge'], ['EX_TITULAR','Ex Titular'], ['EX_RESPONSAVEL','Ex Responsável'],
]
const PARENTESCOS_OPTIONS = PARENTESCOS_ENUM.map(([value,label])=>({value,label}))
const parentescoLabel = (val) => PARENTESCOS_OPTIONS.find(o=>o.value===String(val))?.label || String(val)

/* ---------- WhatsApp helper ---------- */
const WHATS_NUMBER = (() => {
  try {
    const env = import.meta?.env?.VITE_WHATSAPP || window.__WHATSAPP__
    return env ? String(env).replace(/\D/g, '') : ''
  } catch { return '' }
})()
function openWhatsApp(message) {
  const text = encodeURIComponent(message || '')
  const url = WHATS_NUMBER ? `https://wa.me/${WHATS_NUMBER}?text=${text}` : `https://wa.me/?text=${text}`
  window.open(url, '_blank', 'noopener')
}

/* ---------- Toast ---------- */
function Toast({ show, message }) {
  return (
    <div className={`pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`} aria-live="polite" aria-atomic="true">
      <div className="pointer-events-auto rounded-full px-4 py-2 text-sm shadow-lg border" style={{background:'var(--c-surface)',borderColor:'var(--c-border)',color:'var(--c-text)'}}>
        {message}
      </div>
    </div>
  )
}

export default function PlanoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // simulador (minimalista)
  const [depsCount, setDepsCount] = useState(0)                // quantidade total
  const [depsParentescos, setDepsParentescos] = useState([])   // lista de parentescos ("" = não escolhido)

  const simRef = useRef(null)
  const resumoRef = useRef(null)

  const [cupom, setCupom] = useState(() => {
    try { const qs = new URLSearchParams(window.location.search); return qs.get('cupom') || qs.get('coupon') || '' } catch { return '' }
  })

  const [toast, setToast] = useState({ show: false, message: '' })
  const triggerToast = (message) => {
    setToast({ show: true, message })
    window.clearTimeout(triggerToast._t)
    triggerToast._t = window.setTimeout(() => setToast({ show: false, message: '' }), 1400)
  }

  // fetch
  async function fetchPlano(planId) {
    setLoading(true); setError('')
    try {
      const { data } = await api.get(`/api/v1/planos/${planId}`, { transformRequest: [(d, headers) => { try { delete headers.Authorization } catch {}; return d }] })
      setPlano(data)
    } catch {
      try {
        const { data } = await api.get(`/api/v1/planos/${planId}`, { headers: { Authorization: '' } })
        setPlano(data)
      } catch (err) {
        console.error(err); setError(`Falha ao carregar o plano (id: ${planId}).`)
      }
    } finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchPlano(id) }, [id])

  // preços
  const baseMensal = useMemo(() => getMensal(plano), [plano])
  const valorAdesao = Number(pick(plano || {}, 'valorAdesao', 'valor_adesao') || 0)
  const numDepsIncl = Number(pick(plano || {}, 'numeroDependentes', 'numero_dependentes') || 0)
  const valorIncrementalAnual = Number(pick(plano || {}, 'valorIncremental', 'valor_incremental') || 0)
  const valorIncrementalMensal = useMemo(() => valorIncrementalAnual / 12, [valorIncrementalAnual])

  // limites etários
  const idadeMinTit = pick(plano||{}, 'idadeMinimaTitular','idade_minima_titular')
  const idadeMaxTit = pick(plano||{}, 'idadeMaximaTitular','idade_maxima_titular')
  const idadeMinDep = pick(plano||{}, 'idadeMinimaDependente','idade_minima_dependente')
  const idadeMaxDep = pick(plano||{}, 'idadeMaximaDependente','idade_maxima_dependente')

  // parentescos (do plano > fallback)
  const parentescosAPI = pick(plano || {}, 'parentescos') || []
  const parentescosValues = (Array.isArray(parentescosAPI) && parentescosAPI.length)
    ? parentescosAPI.map(String)
    : PARENTESCOS_OPTIONS.map(o=>o.value)

  // sync parentescos com a contagem
  function syncParentescos(nextCount) {
    setDepsParentescos(prev => {
      const arr = prev.slice(0, nextCount)
      while (arr.length < nextCount) arr.push("") // vazio = não escolhido
      return arr
    })
  }

  // totais
  const excedentes = Math.max(0, depsCount - Number(numDepsIncl))
  const custoExcedentes = excedentes * valorIncrementalMensal
  const totalMensal = (baseMensal || 0) + custoExcedentes
  const totalAnual = totalMensal * 12

  const simRefScroll = () => simRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const resumoRefScroll = () => resumoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // CTA cadastro — envia somente qtd + parentescos escolhidos
  const handleContinuar = () => {
    const dependentesPayload = depsParentescos.map((p) => ({ parentesco: p || "" }))
    const payload = { plano: String(id), qtdDependentes: depsCount, dependentes: dependentesPayload, cupom: cupom || '' }
    const params = new URLSearchParams({ p: btoa(encodeURIComponent(JSON.stringify(payload))) })
    navigate(`/cadastro?${params.toString()}`)
  }

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

        {/* CABEÇALHO */}
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{plano.nome}</h1>
            <div className="inline-flex items-center gap-2 rounded-full px-5 h-12 border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]">
              <span className="text-sm">Base mensal</span>
              <span className="text-xl font-extrabold">{money(baseMensal)}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
              <span className="text-sm">Incluídos</span><strong>{numDepsIncl}</strong>
            </div>
            <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
              <span className="text-sm">+ por dependente</span><strong>{money(valorIncrementalMensal)}</strong>
            </div>

            {(Number.isFinite(idadeMinTit) || Number.isFinite(idadeMaxTit)) && (
              <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
                <span className="text-sm">Titular</span>
                <strong>
                  {Number.isFinite(idadeMinTit) ? `${idadeMinTit}` : '—'}
                  {Number.isFinite(idadeMaxTit) ? `–${idadeMaxTit}` : '+'} anos
                </strong>
              </div>
            )}

            {(Number.isFinite(idadeMinDep) || Number.isFinite(idadeMaxDep)) && (
              <div className="h-11 inline-flex items-center justify-between rounded-full border border-[var(--c-border)] px-4">
                <span className="text-sm">Dependentes</span>
                <strong>
                  {Number.isFinite(idadeMinDep) ? `${idadeMinDep}` : '—'}
                  {Number.isFinite(idadeMaxDep) ? `–${idadeMaxDep}` : '+'} anos
                </strong>
              </div>
            )}
          </div>

          {/* Banda informativa */}
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
                  Informe apenas a <b>quantidade de dependentes</b>. Se quiser, identifique o <b>parentesco</b> agora (opcional).
                  <br className="hidden md:block" />
                  <span>Limites etários são <b>validados no cadastro</b>.</span>
                </p>
              </div>

              <CTAButton
                onClick={() => simRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                aria-label="Ir para o simulador"
                className="h-11 w-full md:w-auto"
              >
                Ir para o simulador
              </CTAButton>
            </div>

            <ul className="mt-3 flex flex-wrap gap-4 text-xs">
              <li className="inline-flex items-center gap-1"><Clock3 size={14} /> Ativação rápida</li>
              <li className="inline-flex items-center gap-1"><CheckCircle2 size={14} /> Pagamento seguro</li>
            </ul>
          </div>
        </div>

        {/* ---------- SIMULADOR + RESUMO ---------- */}
        <div ref={simRef} className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Simulador */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Simulador</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {/* Stepper dependentes (único campo obrigatório do simulador) */}
              <div>
                <label className="label">Dependentes (qtde)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { const v = Math.max(0, depsCount - 1); setDepsCount(v); syncParentescos(v); triggerToast('Quantidade atualizada'); }}
                    className="rounded-full h-11 w-11 grid place-items-center border border-[var(--c-border)] hover:bg-[var(--c-surface-alt)]"
                    aria-label="Diminuir dependentes"
                    disabled={depsCount === 0}
                  >
                    <Minus size={16}/>
                  </button>
                  <input
                    className="input h-11 w-24 text-center"
                    type="number" min="0" max="99"
                    value={depsCount}
                    onChange={(e) => {
                      const target = Math.max(0, Number(e.target.value) || 0)
                      setDepsCount(target)
                      syncParentescos(target)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { const v = depsCount + 1; setDepsCount(v); syncParentescos(v); triggerToast('Quantidade atualizada'); }}
                    className="rounded-full h-11 w-11 grid place-items-center border border-[var(--c-border)] hover:bg-[var(--c-surface-alt)]"
                    aria-label="Aumentar dependentes"
                  >
                    <PlusIcon size={16}/>
                  </button>
                </div>
                <p className="mt-2 text-xs text-[var(--c-muted)]">
                  Incluídos no plano: <b>{numDepsIncl}</b>. Adicionais: <b>{Math.max(0, depsCount - numDepsIncl)}</b> × {money(valorIncrementalMensal)}
                </p>

                
              </div>
            </div>

            {/* Opcional: identificar parentescos */}
            <details className="mt-5 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
              <summary className="cursor-pointer list-none font-semibold">Identificar dependentes (opcional)</summary>
              <div className="mt-4 grid gap-3">
                {depsCount === 0 ? (
                  <div className="text-sm text-[var(--c-muted)]">Nenhum dependente informado.</div>
                ) : (
                  Array.from({ length: depsCount }).map((_, i) => (
                    <div key={i} className="grid gap-2 md:grid-cols-[1fr,260px]">
                      <div className="flex items-center text-sm text-[var(--c-muted)]">Dependente {i + 1}</div>
                      <select
                        className="input h-11"
                        value={depsParentescos[i] || ""}
                        onChange={(e) => {
                          const v = e.target.value
                          setDepsParentescos(prev => {
                            const copy = prev.slice()
                            copy[i] = v
                            return copy
                          })
                        }}
                      >
                        <option value="">Selecione…</option>
                        {(parentescosValues?.length ? parentescosValues : PARENTESCOS_OPTIONS.map(o=>o.value))
                          .map(v => (<option key={v} value={v}>{parentescoLabel(v)}</option>))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>

          {/* Resumo */}
          <aside ref={resumoRef} className="p-6 md:sticky md:top-24 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm" aria-live="polite">
              <div className="flex justify-between"><span>Base mensal</span><span>{money(baseMensal)}</span></div>
              <div className="flex justify-between">
                <span>Dependentes adicionais ({Math.max(0, depsCount - numDepsIncl)}) × {money(valorIncrementalMensal)}</span>
                <span>{money(Math.max(0, depsCount - numDepsIncl) * valorIncrementalMensal)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-base"><span>Total mensal</span><span>{money(totalMensal)}</span></div>
              <div className="flex justify-between"><span>Adesão (uma vez)</span><span>{money(valorAdesao)}</span></div>

              {/* Total anual opcional (pode habilitar se quiser) */}
              {/* <details className="mt-1 text-xs">
                <summary className="cursor-pointer">Ver total anual</summary>
                <div className="flex justify-between mt-1"><span>Total anual</span><span>{money(totalAnual)}</span></div>
              </details> */}

              <div className="pt-2">
                <label className="label" htmlFor="cupom">Cupom (opcional)</label>
                <input id="cupom" className="input h-11" placeholder="EX.: BEMVINDO10" value={cupom} onChange={(e) => setCupom(e.target.value)} autoComplete="off"/>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <CTAButton className="w-full h-11" onClick={handleContinuar} title="Prosseguir para cadastro">
                Continuar cadastro
              </CTAButton>
              {/* WhatsApp: somente no resumo */}
              <CTAButton
                variant="outline"
                className="w-full h-11 justify-center"
                onClick={() => openWhatsApp(`Olá! Tenho uma dúvida sobre o plano "${plano.nome}".`)}
              >
                <MessageCircle size={16} className="mr-2" />
                Tirar dúvida no WhatsApp
              </CTAButton>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar — sólida, com sombra marcada */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)] md:hidden"
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -12px 30px rgba(0,0,0,.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-3 py-3 flex items-center gap-3">
          <button onClick={resumoRefScroll} className="flex-1 text-left" aria-label="Ir para resumo do valor">
            <p className="text-xs text-[var(--c-muted)] leading-tight">Total mensal</p>
            <p className="text-xl font-extrabold leading-tight">{money(totalMensal)}</p>
          </button>
          <CTAButton className="min-w-[46%] h-12" onClick={handleContinuar}>
            Continuar
          </CTAButton>
        </div>
      </div>
      {/* espaçador para não cobrir o fim do conteúdo */}
      <div className="h-16 md:hidden" aria-hidden />

      <Toast show={toast.show} message={toast.message} />
    </section>
  )
}
