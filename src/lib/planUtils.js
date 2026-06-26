// Utilidades de planos (normalização + helpers)

export function pick(obj = {}, ...keys) {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k]
  return undefined
}

export function money(n = 0) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Retorna o valor anual normalizado do plano */
export function getAnual(plano = {}) {
  // Nos dados do Progem, "valorUnitario" representa o valor ANUAL do plano
  return Number(pick(plano, 'valorUnitario', 'valor_anual', 'valorAnual')) || 0
}

/** Retorna o valor mensal normalizado do plano (anual / 12) */
export function getMensal(plano = {}) {
  return getAnual(plano) / 12
}

function isPlanFeaturedByMetadata(plano = {}) {
  return (
    plano.emDestaque === true ||
    plano.destaque === true ||
    plano.featured === true ||
    plano.maisVendido === true ||
    plano.maisEscolhido === true
  )
}

/**
 * Resolve o plano em destaque: metadata da API (quando existir) ou 2º mais caro.
 * @param {object[]} planos
 * @returns {string|number|null}
 */
export function pickFeaturedPlanId(planos = []) {
  if (!Array.isArray(planos) || planos.length === 0) return null

  const flagged = planos.find(isPlanFeaturedByMetadata)
  if (flagged?.id != null) return flagged.id

  if (planos.length < 2) return null

  const desc = [...planos]
    .map((p) => ({ id: p.id, precoMensal: getMensal(p) }))
    .sort((a, b) => (b.precoMensal || 0) - (a.precoMensal || 0))

  return desc[1]?.id ?? null
}

/** Anota planos com `bestSeller` para exibição do selo "Mais escolhido". */
export function markFeaturedPlans(planos = []) {
  const featuredId = pickFeaturedPlanId(planos)
  if (featuredId == null) return planos
  return planos.map((p) => ({ ...p, bestSeller: p.id === featuredId }))
}

/** Encontra a faixa por idade (array pode vir em camelCase ou snake_case) */
export function encontrarFaixaPorIdade(faixas = [], idade = 0) {
  const i = Number(idade || 0)
  return (faixas || []).find(f => {
    const min = Number(f.idadeMinima ?? f.idade_minima ?? 0)
    const max = Number(f.idadeMaxima ?? f.idade_maxima ?? 999)
    return i >= min && i <= max
  })
}

/** Verifica se é isento por idade/parentesco (conforme regra enviada) */
export function isIsento(isencoes = [], idade = 0, parentesco = '') {
  const i = Number(idade || 0)
  const p = String(parentesco || '').toUpperCase()
  return (isencoes || []).some(item => {
    const min = Number(item.idadeMinima ?? item.idade_minima ?? 0)
    const max = Number(item.idadeMaxima ?? item.idade_maxima ?? 999)
    const par = String(item.parentesco || '').toUpperCase()
    const okIdade = i >= min && i <= max
    const okPar = !par || par === p
    return okIdade && okPar
  })
}
