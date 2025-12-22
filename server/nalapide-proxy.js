// server/nalapide-proxy.js
import express from 'express'

const router = express.Router()

const DEFAULT_UA =
  process.env.NALAPIDE_BFF_UA ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function getNalapideConfig() {
  const base = (process.env.NALAPIDE_API_BASE || process.env.VITE_NALAPIDE_BASE || '').replace(
    /\/+$/,
    ''
  )
  const rawKey = process.env.NALAPIDE_API_KEY || process.env.VITE_NALAPIDE_API_KEY || ''

  let authHeader = { name: 'x-api-key', value: rawKey }
  if (rawKey && rawKey.toLowerCase().startsWith('bearer ')) {
    authHeader = { name: 'Authorization', value: rawKey }
  }

  return { base, rawKey, authHeader }
}

export function logNalapideBoot() {
  const { base, rawKey, authHeader } = getNalapideConfig()
  if (!base) console.warn('[NaLapide] NALAPIDE_API_BASE ausente. Configure no .env do BFF')
  if (!rawKey) console.warn('[NaLapide] NALAPIDE_API_KEY ausente. Configure no .env do BFF')
  console.log('[NaLapide BFF] base=', base || '(ausente)', '| header=', authHeader.name)
}

const isProd = process.env.NODE_ENV === 'production'

function short(s, n = 220) {
  if (!s) return ''
  const str = String(s)
  return str.length > n ? str.slice(0, n) + '…' : str
}

function getTenant(req) {
  return req.headers['x-tenant-slug'] || req.query.tenant || req.body?.tenant
}

function mustHaveTenant(req, res) {
  const tenant = getTenant(req)
  if (!tenant) {
    res.status(400).json({
      error: 'TENANT_REQUIRED',
      message: 'Informe o tenant via header x-tenant-slug (ou query/body).',
    })
    return false
  }
  return true
}

/**
 * API NaLápide é "schema estrito": qualquer campo extra quebra.
 * Vamos montar um body LIMPO e compatível.
 */
function mapTipo(uiTipo) {
  const t = String(uiTipo || '').toUpperCase()
  // Ajuste aqui conforme enum real do backend NaLápide
  const map = {
    MENSAGEM: 'mensagem_condolencia',
    LIVRO: 'livro_visitas',
    VELA: 'acender_vela',
    FLOR: 'enviar_flor',
  }
  return map[t] || 'mensagem_condolencia'
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '')
}

function isEmail(s) {
  const v = String(s || '').trim()
  return /.+@.+\..+/.test(v)
}

function normalizeCreateInteracaoStrict(obitoId, body) {
  const b = body || {}

  // dados básicos (nomes que o front usa hoje)
  const uiTipo = b.tipo
  const nome = String(b.nome || '').trim()
  const mensagem = String(b.mensagem || '').trim()
  const contato = String(b.contato || '').trim()

  // alguns clientes podem já enviar email/telefone separados
  const incomingEmail = String(b.email || '').trim()
  const incomingTelefone = String(b.telefone || '').trim()

  const email = incomingEmail || (isEmail(contato) ? contato : '')
  const telefone = incomingTelefone || (!email ? contato : '')

  const clean = {
    obito: { id: obitoId },
    tipo: mapTipo(uiTipo),
    nome,
    ...(email ? { email } : {}),
    ...(telefone ? { telefone: telefone } : {}),
    ...(mensagem ? { mensagem } : {}),
  }

  // limpa telefone (opcional, mas ajuda validação)
  if (clean.telefone) {
    const d = onlyDigits(clean.telefone)
    // mantém original se não parecer número; senão manda só dígitos (mais aceito)
    if (d.length >= 10) clean.telefone = d
  }

  return clean
}

async function forward(req, res, path) {
  try {
    const { base: API_BASE, rawKey: RAW_KEY, authHeader: AUTH_HEADER } = getNalapideConfig()

    if (!API_BASE) {
      return res.status(500).json({
        error: 'NALAPIDE_BASE_MISSING',
        message: 'Configure NALAPIDE_API_BASE no .env (BFF)',
      })
    }
    if (!RAW_KEY) {
      return res.status(500).json({
        error: 'NALAPIDE_KEY_MISSING',
        message: 'Configure NALAPIDE_API_KEY no .env (BFF)',
      })
    }

    const urlObj = new URL(`${API_BASE}${path}`)
    const params = new URLSearchParams()

    for (const [k, v] of Object.entries(req.query || {})) {
      if (Array.isArray(v)) v.forEach((val) => params.append(k, String(val)))
      else if (v != null) params.set(k, String(v))
    }

    if (path === '/obitos' && !params.has('publico')) params.set('publico', 'true')

    urlObj.search = params.toString()
    const url = urlObj.toString()

    const tenant = getTenant(req)

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': req.headers['user-agent'] || DEFAULT_UA,
      'Accept-Language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en;q=0.8',
      'x-from-bff': 'vercel',
      [AUTH_HEADER.name]: AUTH_HEADER.value,
      ...(tenant ? { 'x-tenant': tenant } : {}),
    }

    const init = { method: req.method, headers }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = JSON.stringify(req.body || {})
    }

    console.log('[NaLapide BFF] →', req.method, url, '| tenant=', tenant || '-')
    const r = await fetch(url, init)
    const ct = r.headers.get('content-type') || 'application/json'
    const txt = await r.text()

    if (!r.ok) {
      console.error('[NaLapide BFF] UPSTREAM ERROR', r.status, ct, '| body=', short(txt, 260))
      if (!isProd && r.status === 400) console.error('[NaLapide BFF] 400 body (FULL):', txt)
    }

    console.log('[NaLapide BFF] ←', r.status, ct)
    res.status(r.status).type(ct).send(txt)
  } catch (err) {
    console.error('[NaLapide BFF] ERRO:', err)
    res.status(500).json({ error: 'BFF_NALAPIDE_ERROR', message: String(err?.message || err) })
  }
}

/** Rotas BFF -> NaLápide */
router.get('/_proxy/health', (req, res) => {
  const { base, rawKey, authHeader } = getNalapideConfig()
  res.json({
    ok: Boolean(base && rawKey),
    base,
    authHeader: authHeader.name,
    hasKey: Boolean(rawKey),
  })
})

router.get('/memorial', (req, res) => forward(req, res, '/obitos'))
router.get('/memorial/:slug', (req, res) =>
  forward(req, res, `/obitos/${encodeURIComponent(req.params.slug)}`)
)

router.post('/memorial/:id/reactions', (req, res) => {
  if (!mustHaveTenant(req, res)) return
  return forward(req, res, `/obitos/${encodeURIComponent(req.params.id)}/reacoes`)
})

router.get('/memorial/:id/midias', (req, res) =>
  forward(req, res, `/obitos/${encodeURIComponent(req.params.id)}/midias`)
)

router.get('/memorial/:id/interacoes', (req, res) =>
  forward(req, res, `/interacoes/por-obito/${encodeURIComponent(req.params.id)}`)
)

router.post('/memorial/:id/interacoes', (req, res) => {
  if (!mustHaveTenant(req, res)) return
  req.body = normalizeCreateInteracaoStrict(req.params.id, req.body)
  return forward(req, res, `/interacoes`)
})

router.post('/leads', (req, res) => {
  if (!mustHaveTenant(req, res)) return
  return forward(req, res, '/interacoes')
})

router.get('/produtos', (req, res) => forward(req, res, `/produtos`))

export default router
