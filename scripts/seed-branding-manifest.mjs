/**
 * Seed one-time: importa config/tenants/*.json → ApiClient.branding_manifest via API.
 *
 * Uso:
 *   AWIS_TOKEN="..." PROGEM_API_BASE="https://api.progem.com.br" node scripts/seed-branding-manifest.mjs
 *
 * Opcional:
 *   TENANT=funerariapopular  (só um slug)
 *   DRY_RUN=1                (não envia POST)
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tenantsDir = resolve(__dirname, '../config/tenants')

const API_BASE = (process.env.PROGEM_API_BASE || process.env.VITE_API_BASE_URL || 'http://localhost:8082')
  .replace(/\/+$/, '')
const AWIS_TOKEN = (process.env.AWIS_TOKEN || process.env.AWIS_ACCESS_TOKEN || '').trim()
const ONLY_TENANT = (process.env.TENANT || '').trim().toLowerCase()
const DRY_RUN = String(process.env.DRY_RUN || '') === '1'

if (!AWIS_TOKEN) {
  console.error('Defina AWIS_TOKEN (Bearer JWT de usuário AWIS no console).')
  process.exit(1)
}

async function listTenantFiles() {
  const files = await readdir(tenantsDir)
  return files
    .filter((f) => f.endsWith('.json') && f !== 'default.json')
    .map((f) => f.replace(/\.json$/, ''))
    .filter((slug) => (ONLY_TENANT ? slug === ONLY_TENANT : true))
}

async function fetchApiClients() {
  const res = await fetch(`${API_BASE}/api/v1/api-clients`, {
    headers: {
      Authorization: `Bearer ${AWIS_TOKEN}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Falha ao listar api-clients (${res.status}): ${text}`)
  }
  return res.json()
}

async function importManifest(apiClientId, tenantJson) {
  if (DRY_RUN) {
    console.log(`[dry-run] POST /api/v1/api-clients/${apiClientId}/branding/import`)
    return null
  }

  const res = await fetch(`${API_BASE}/api/v1/api-clients/${apiClientId}/branding/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AWIS_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(tenantJson),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Import falhou (${res.status}): ${text}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function pickClientId(clients, slug) {
  const s = String(slug || '').trim().toLowerCase()
  const hit = clients.find((c) => String(c.clientId || '').trim().toLowerCase() === s)
  return hit?.id ?? null
}

;(async () => {
  try {
    const slugs = await listTenantFiles()
    if (!slugs.length) {
      console.log('Nenhum tenant JSON encontrado para importar.')
      return
    }

    const clients = await fetchApiClients()
    if (!Array.isArray(clients)) {
      throw new Error('Resposta inesperada de /api/v1/api-clients')
    }

    let ok = 0
    let skip = 0
    let fail = 0

    for (const slug of slugs) {
      const apiClientId = pickClientId(clients, slug)
      if (!apiClientId) {
        console.warn(`[skip] ${slug}: ApiClient não encontrado (clientId=${slug})`)
        skip += 1
        continue
      }

      const raw = await readFile(resolve(tenantsDir, `${slug}.json`), 'utf8')
      const tenantJson = JSON.parse(raw)

      try {
        const manifest = await importManifest(apiClientId, tenantJson)
        const rev = manifest?.assetsRevision ?? manifest?.v ?? '?'
        console.log(`[ok] ${slug} → apiClientId=${apiClientId} (rev ${rev})`)
        ok += 1
      } catch (e) {
        console.error(`[fail] ${slug}:`, e?.message || e)
        fail += 1
      }
    }

    console.log(`\nConcluído: ok=${ok} skip=${skip} fail=${fail}${DRY_RUN ? ' (dry-run)' : ''}`)
    if (fail > 0) process.exit(1)
  } catch (e) {
    console.error('Erro fatal:', e?.message || e)
    process.exit(1)
  }
})()
