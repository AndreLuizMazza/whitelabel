// src/lib/nalapide.js
const devBff = (import.meta.env.VITE_BFF_BASE || 'http://localhost:8787') + '/nalapide'
const BASE = import.meta.env.PROD ? '/api/nalapide' : devBff

function qs(params = {}) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    u.set(k, String(v))
  })
  const s = u.toString()
  return s ? `?${s}` : ''
}

async function http(url, init) {
  const r = await fetch(url, { headers: { 'Accept': 'application/json' }, ...init })
  const ct = r.headers.get('content-type') || ''
  const body = ct.includes('application/json') ? await r.json() : await r.text()
  if (!r.ok) throw new Error(typeof body === 'string' ? body : (body?.message || 'Erro'))
  return body
}

export async function listMemorial({ q = '', page = 1, perPage = 12 } = {}) {
  return http(`${BASE}/memorial${qs({ q, page, perPage })}`)
}

export async function getMemorialById(idOrSlug) {
  return http(`${BASE}/memorial/${encodeURIComponent(idOrSlug)}`)
}

export async function sendMemorialReaction(id, payload) {
  return http(`${BASE}/memorial/${encodeURIComponent(id)}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  })
}

export async function createLead(payload) {
  return http(`${BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  })
}
