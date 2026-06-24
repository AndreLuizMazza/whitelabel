export const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))

export const fmtData = (s) => {
  if (!s) return '—'
  const txt = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(txt)) return txt
  const [Y, M, D] = txt.split('T')[0].split('-')
  return Y && M && D ? `${D}/${M}/${Y}` : txt
}

export const parseDate = (s) => {
  if (!s) return new Date(8640000000000000)
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split('/')
    return new Date(+yyyy, +mm - 1, +dd)
  }
  const [Y, M, D] = t.split('T')[0].split('-')
  return Y && M && D ? new Date(+Y, +M - 1, +D) : new Date(8640000000000000)
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function isSameDay(a, b) {
  const da = parseDate(a)
  const db = b instanceof Date ? b : parseDate(b)
  da.setHours(0, 0, 0, 0)
  db.setHours(0, 0, 0, 0)
  return da.getTime() === db.getTime()
}

export function isAtrasoPorData(dup) {
  const due = parseDate(dup?.dataVencimento)
  return due < startOfToday()
}

export function venceHojePorData(dup) {
  if (!dup?.dataVencimento) return false
  if (isAtrasoPorData(dup)) return false
  return isSameDay(dup.dataVencimento, startOfToday())
}

export function daysUntilDue(d) {
  try {
    const dt = parseDate(d)
    const now = new Date()
    return Math.ceil((dt - now) / (1000 * 60 * 60 * 24))
  } catch {
    return 99
  }
}

export function venceEmLabel(dup) {
  if (!dup?.dataVencimento) return 'Vence em'
  if (venceHojePorData(dup)) return 'Vence hoje'
  return isAtrasoPorData(dup) ? 'Venceu em' : 'Vence em'
}

export function parcelKey(dup, idx = 0) {
  return dup?.id ?? dup?.numero ?? dup?.numeroDuplicata ?? `${idx}-${dup?.dataVencimento}`
}

export function buildWhats(number, msg) {
  const digits = String(number || '').replace(/\D+/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null
}

export const paymentCardShadow =
  '0 1px 3px color-mix(in srgb, var(--text) 4%, transparent), 0 0 0 0.5px color-mix(in srgb, var(--text) 6%, transparent)'
