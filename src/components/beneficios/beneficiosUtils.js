export const CLUB_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgNDAwIDE2MCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmMWY1ZjkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSI4MCIgcj0iNDYiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSIyMDAiIHk9Ijg4IiB0ZXJ0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIsU2Vnb2UgVUksQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiM0NzU1NjkIj4lPC90ZXh0Pjwvc3ZnPg=='

export function fmtBeneficio(b) {
  if (Number(b?.porcentagem)) return `${Number(b.porcentagem).toLocaleString('pt-BR')}%`
  const v = Number(b?.valor || 0)
  return v > 0 ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
}

export function getEnderecoLinha(e = {}) {
  const partes = [
    e.logradouro,
    e.numero,
    e.bairro,
    e.cidade && e.uf ? `${e.cidade} - ${e.uf}` : e.cidade || e.uf,
    e.cep ? `CEP ${e.cep}` : '',
  ].filter(Boolean)
  return partes.join(', ')
}

export function mapsLink(endereco = {}) {
  if (endereco.latitude && endereco.longitude) {
    return `https://www.google.com/maps?q=${endereco.latitude},${endereco.longitude}`
  }
  const q = encodeURIComponent(getEnderecoLinha(endereco))
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

export function extractPlanoLinks(plano) {
  if (!plano || !Array.isArray(plano.links)) return []
  return plano.links.filter((l) => l && l.link && l.visivel !== false)
}

export function getHostFromLink(link) {
  if (!link) return ''
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Fisher-Yates — nova cópia em ordem aleatória (não muta o original). */
export function shuffleArray(list = []) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Reordena `list` pela ordem de `rankKeys` (itens ausentes vão ao final). */
export function orderByRankKeys(list, rankKeys, getKey) {
  const rank = new Map(rankKeys.map((k, i) => [k, i]))
  return [...list].sort((a, b) => {
    const ra = rank.get(getKey(a))
    const rb = rank.get(getKey(b))
    if (ra == null && rb == null) return 0
    if (ra == null) return 1
    if (rb == null) return -1
    return ra - rb
  })
}

/** Resposta paginada ou array bruto de parceiros. */
export function normalizeParceirosResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  return []
}

export function formatPartnerCity(endereco = {}) {
  const cidade = String(endereco?.cidade || '').trim()
  const uf = String(endereco?.uf || '').trim()
  if (cidade && uf) return `${cidade}-${uf}`
  return cidade || uf || ''
}

function isBeneficioPublicado(b) {
  return b && b.publicado !== false
}

/** Primeiro benefício publicado com valor ou percentual utilizável. */
export function pickPublicBenefitTeaser(beneficios) {
  const offers = extractPublicOffers(beneficios)
  return offers[0] || null
}

/** Todos os benefícios publicados mapeados para teaser seguro. */
export function extractPublicOffers(beneficios) {
  const list = Array.isArray(beneficios) ? beneficios.filter(isBeneficioPublicado) : []
  const offers = []

  for (const b of list) {
    const valorFmt = fmtBeneficio(b)
    const desc = String(b.descricao || '').trim()
    if (!desc && valorFmt === '—') continue

    const headline =
      desc && valorFmt !== '—' ? `${valorFmt} em ${desc.toLowerCase()}` : desc || valorFmt

    if (!headline || headline === '—') continue

    offers.push({
      id: b.id ?? `${desc}-${valorFmt}`,
      descricao: desc,
      valorFmt,
      headline,
    })
  }

  return offers
}

/** Mescla ofertas de todos os parceiros em sequência intercalada (round-robin). */
export function mergePartnerOffersInterleaved(partners = []) {
  const queues = partners
    .map((p) =>
      (p.offers || []).map((o) => ({
        ...o,
        partnerId: p.id,
        partnerNome: p.nome,
        logoUrl: p.logoUrl,
        capaUrl: p.capaUrl,
        cidadeUF: p.cidadeUF,
        offerKey: `${p.id}-${o.id}`,
      }))
    )
    .filter((q) => q.length > 0)

  if (!queues.length) return []

  const merged = []
  let hasMore = true
  while (hasMore) {
    hasMore = false
    for (const q of queues) {
      if (q.length > 0) {
        merged.push(q.shift())
        hasMore = true
      }
    }
  }

  return merged
}

function buildOfferHeadline(desc, valorFmt) {
  if (desc && valorFmt !== '—') return `${valorFmt} em ${desc.toLowerCase()}`
  return desc || valorFmt
}

/** Ofertas completas de um parceiro (área privada — todos os benefícios cadastrados). */
export function extractMemberOffers(beneficios) {
  const list = Array.isArray(beneficios) ? beneficios : []
  const offers = []

  for (const b of list) {
    const valorFmt = fmtBeneficio(b)
    const desc = String(b.descricao || '').trim()
    const headline = buildOfferHeadline(desc, valorFmt)
    if (!headline || headline === '—') continue

    offers.push({
      id: b.id ?? `${desc}-${valorFmt}`,
      descricao: desc,
      valorFmt,
      headline,
    })
  }

  return offers
}

/** Mescla ofertas de parceiros API (raw) para feed da área privada. */
export function mergeMemberOffersFromParceiros(parceiros = []) {
  const queues = parceiros
    .map((p) => {
      const logoUrl = safeImageUrl(p?.imagem)
      const capaUrl = safeImageUrl(p?.capa) || logoUrl
      const cidadeUF = formatPartnerCity(p?.endereco)
      return extractMemberOffers(p?.beneficios).map((o) => ({
        ...o,
        partnerId: p.id,
        partnerNome: p.nome,
        logoUrl,
        capaUrl,
        cidadeUF,
        offerKey: `${p.id}-${o.id}`,
      }))
    })
    .filter((q) => q.length > 0)

  if (!queues.length) return []

  const merged = []
  let hasMore = true
  while (hasMore) {
    hasMore = false
    for (const q of queues) {
      if (q.length > 0) {
        merged.push(q.shift())
        hasMore = true
      }
    }
  }

  return merged
}

export function safeImageUrl(url) {
  const s = String(url || '').trim()
  return s || null
}

/**
 * Shape mínimo para vitrine pública — sem contatos nem endereço completo.
 * @param {Record<string, unknown>} raw
 */
export function mapParceiroToPublicPreview(raw) {
  if (!raw?.id && raw?.id !== 0) return null
  const nome = String(raw.nome || '').trim()
  if (!nome) return null

  const logoUrl = safeImageUrl(raw.imagem)
  const capaUrl = safeImageUrl(raw.capa) || logoUrl
  const cidadeUF = formatPartnerCity(raw.endereco)
  const offers = extractPublicOffers(raw.beneficios)
  const teaser = offers[0] || null

  return {
    id: raw.id,
    nome,
    logoUrl,
    capaUrl,
    cidadeUF,
    teaser,
    offers,
  }
}

/** Ordena por nome, dedupe por id, descarta inválidos. */
export function buildPublicParceirosPreview(list) {
  const seen = new Set()
  const mapped = []

  for (const raw of normalizeParceirosResponse(list)) {
    const item = mapParceiroToPublicPreview(raw)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    mapped.push(item)
  }

  return mapped.sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  )
}

/** Até N parceiros com imagem + teaser para cards editoriais (prioriza capa). */
export function pickFeaturedParceirosPreview(partners, limit = 4) {
  const withTeaser = partners.filter((p) => p.teaser && (p.capaUrl || p.logoUrl))
  const withCapa = withTeaser.filter((p) => p.capaUrl && p.capaUrl !== p.logoUrl)
  const pool = withCapa.length >= limit ? withCapa : withTeaser
  return pool.slice(0, limit)
}

export function partnerInitials(nome) {
  const parts = String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Hash determinístico → paleta de fallback elegante por parceiro. */
export function partnerAccentFromName(nome) {
  const key = String(nome || '?').trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  const hue2 = (hue + 28 + (hash % 40)) % 360
  return {
    hue,
    gradient: `linear-gradient(135deg, hsl(${hue} 62% 52%) 0%, hsl(${hue2} 58% 42%) 100%)`,
    softBg: `linear-gradient(160deg, hsl(${hue} 45% 94%) 0%, hsl(${hue2} 40% 88%) 100%)`,
    initialsColor: `hsl(${hue} 55% 32%)`,
  }
}
