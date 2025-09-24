// server/nalapide-proxy.js
import express from 'express'

const router = express.Router()

// Somente no servidor (nunca expose no front)
const API_BASE = (process.env.NALAPIDE_API_BASE || process.env.VITE_NALAPIDE_BASE || '').replace(/\/+$/, '')
const RAW_KEY  = process.env.NALAPIDE_API_KEY || process.env.VITE_NALAPIDE_API_KEY || ''

if (!API_BASE) console.warn('[NaLapide] NALAPIDE_API_BASE ausente. Configure no .env do BFF')
if (!RAW_KEY)  console.warn('[NaLapide] NALAPIDE_API_KEY ausente. Configure no .env do BFF')

const AUTH_HEADER = RAW_KEY.toLowerCase().startsWith('bearer ')
  ? { name: 'Authorization', value: RAW_KEY }     // exemplo: "Bearer xxx"
  : { name: 'x-api-key',     value: RAW_KEY }     // exemplo: "abc123"

// log de boot
console.log('[NaLapide BFF] base=', API_BASE || '(ausente)', '| header=', AUTH_HEADER.name)

function short(s, n = 60) {
  if (!s) return ''
  const str = String(s)
  return str.length > n ? str.slice(0, n) + '…' : str
}

async function forward(req, res, path) {
  try {
    if (!API_BASE) return res.status(500).json({ error: 'NALAPIDE_BASE_MISSING', message: 'Configure NALAPIDE_API_BASE no .env (BFF)' })
    if (!RAW_KEY)  return res.status(500).json({ error: 'NALAPIDE_KEY_MISSING',  message: 'Configure NALAPIDE_API_KEY no .env (BFF)' })

    // monta URL + query
    const urlObj = new URL(`${API_BASE}${path}`)
    const params = new URLSearchParams()

    for (const [k, v] of Object.entries(req.query || {})) {
      if (Array.isArray(v)) v.forEach(val => params.append(k, String(val)))
      else if (v != null) params.set(k, String(v))
    }

    // regra: listagem pública
    if (path === '/obitos' && !params.has('publico')) params.set('publico', 'true')

    urlObj.search = params.toString()
    const url = urlObj.toString()

    // multi-tenant opcional
    const tenant = req.headers['x-tenant-slug'] || req.query.tenant || req.body?.tenant

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      [AUTH_HEADER.name]: AUTH_HEADER.value,
      ...(tenant ? { 'x-tenant': tenant } : {})
    }

    const init = { method: req.method, headers }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = JSON.stringify(req.body || {})
    }

    console.log('[NaLapide BFF] →', req.method, url, '| tenant=', tenant || '-', `| ${AUTH_HEADER.name}=`, short(AUTH_HEADER.value, 24))

    const r = await fetch(url, init)
    const ct = r.headers.get('content-type') || 'application/json'
    const txt = await r.text()

    console.log('[NaLapide BFF] ←', r.status, ct)
    res.status(r.status).type(ct).send(txt)
  } catch (err) {
    console.error('[NaLapide BFF] ERRO:', err)
    res.status(500).json({ error: 'BFF_NALAPIDE_ERROR', message: String(err?.message || err) })
  }
}

/** Rotas BFF -> NaLápide */
router.get('/_proxy/health', (req, res) => {
  res.json({
    ok: true,
    base: API_BASE,
    authHeader: AUTH_HEADER.name,
    hasKey: Boolean(RAW_KEY)
  })
})

router.get('/memorial',                (req, res) => forward(req, res, '/obitos'))
router.get('/memorial/:slug',          (req, res) => forward(req, res, `/obitos/${encodeURIComponent(req.params.slug)}`))
router.post('/memorial/:id/reactions', (req, res) => forward(req, res, `/obitos/${encodeURIComponent(req.params.id)}/reacoes`))
router.post('/leads',                  (req, res) => forward(req, res, '/interacoes'))

export default router
