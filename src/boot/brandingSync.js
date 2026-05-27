/**
 * Sincronização runtime do manifest de branding (API pública → window.__TENANT__).
 */
import api from '@/lib/api'
import {
  applyBrandingManifest,
  getCachedAssetsRevision,
} from '@/lib/tenantBranding'
import { LS_TENANT_ASSETS_REVISION_KEY, LS_TENANT_BRANDING_ETAG_KEY, LS_TENANT_BRANDING_UPDATED_AT_KEY } from '@/lib/tenantStorageKeys'

const listeners = new Set()
let started = false
let pollTimer = null

/** Intervalo de polling enquanto a aba está visível (upload no console → whitelabel sem hard refresh). */
const BRANDING_POLL_MS = 45_000

export function subscribeBrandingRevision(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function getBrandingRevisionSnapshot() {
  return getCachedAssetsRevision()
}

function notifyBrandingRevision() {
  listeners.forEach((l) => {
    try {
      l()
    } catch {}
  })
}

function readStoredEtag() {
  try {
    return localStorage.getItem(LS_TENANT_BRANDING_ETAG_KEY) || ''
  } catch {
    return ''
  }
}

function writeStoredEtag(value) {
  try {
    if (value) localStorage.setItem(LS_TENANT_BRANDING_ETAG_KEY, value)
  } catch {}
}

function readStoredBrandingUpdatedAt() {
  try {
    return localStorage.getItem(LS_TENANT_BRANDING_UPDATED_AT_KEY) || ''
  } catch {
    return ''
  }
}

function writeStoredBrandingUpdatedAt(value) {
  try {
    if (value) localStorage.setItem(LS_TENANT_BRANDING_UPDATED_AT_KEY, value)
  } catch {}
}

function parseUpdatedAtMs(value) {
  if (!value) return 0
  const ms = Date.parse(String(value))
  return Number.isFinite(ms) ? ms : 0
}

/**
 * Quando a API está atrás do build (seed não rodou), um upload ainda gera updatedAt novo.
 * Nesse caso forçamos bump local de revision para bustar cache sem downgrade.
 */
function resolveManifestForApply(manifest, localRev) {
  const remoteRev = Number(manifest.assetsRevision ?? manifest.v ?? 0)
  const remoteUpdatedMs = parseUpdatedAtMs(manifest.updatedAt)
  const lastAppliedMs = parseUpdatedAtMs(readStoredBrandingUpdatedAt())

  if (remoteUpdatedMs > lastAppliedMs && remoteRev <= localRev) {
    const nextRev = Math.max(localRev + 1, remoteRev + 1)
    return {
      ...manifest,
      assetsRevision: nextRev,
      v: nextRev,
    }
  }

  return manifest
}

/**
 * Busca manifest público e aplica se revision for mais recente que o cache local.
 * @returns {Promise<boolean>} true se aplicou atualização
 */
export async function syncBrandingFromApi({ force = false } = {}) {
  if (typeof window === 'undefined') return false

  try {
    const headers = {}
    const etag = readStoredEtag()
    if (etag && !force) {
      headers['If-None-Match'] = etag
    }

    const res = await api.get('/api/v1/public/branding', {
      headers,
      validateStatus: (status) => status === 200 || status === 304 || status === 404,
    })

    if (res?.status === 304) {
      return false
    }

    if (res?.status === 404) {
      return false
    }

    const manifest = res?.data
    if (!manifest || typeof manifest !== 'object') {
      return false
    }

    const remoteRev = Number(manifest.assetsRevision ?? manifest.v ?? 0)
    const localRev = getCachedAssetsRevision()
    const responseEtag = res?.headers?.etag || res?.headers?.ETag
    if (responseEtag) {
      writeStoredEtag(String(responseEtag))
    }

    // API sem seed: build local já tem revision/paths — não sobrescrever a cada poll.
    if (!force && remoteRev === 0 && localRev > 0) {
      const remoteUpdatedMs = parseUpdatedAtMs(manifest.updatedAt)
      const lastAppliedMs = parseUpdatedAtMs(readStoredBrandingUpdatedAt())
      if (remoteUpdatedMs <= lastAppliedMs) {
        return false
      }
    }

    // Nunca aplicar manifest com revision menor que o build/cache local (seed desalinhado).
    if (!force && remoteRev > 0 && remoteRev < localRev) {
      const remoteUpdatedMs = parseUpdatedAtMs(manifest.updatedAt)
      const lastAppliedMs = parseUpdatedAtMs(readStoredBrandingUpdatedAt())
      if (remoteUpdatedMs <= lastAppliedMs) {
        return false
      }
    }

    // Mesma revision: conteúdo só muda se a API incrementou assetsRevision no upload.
    if (!force && remoteRev > 0 && remoteRev === localRev) {
      const remoteUpdatedMs = parseUpdatedAtMs(manifest.updatedAt)
      const lastAppliedMs = parseUpdatedAtMs(readStoredBrandingUpdatedAt())
      if (remoteUpdatedMs <= lastAppliedMs) {
        return false
      }
    }

    const manifestToApply = resolveManifestForApply(manifest, localRev)
    const applied = applyBrandingManifest(manifestToApply)
    if (applied) {
      writeStoredBrandingUpdatedAt(String(manifestToApply.updatedAt || manifest.updatedAt || new Date().toISOString()))
      notifyBrandingRevision()
    }
    return applied
  } catch (e) {
    if (import.meta?.env?.DEV) {
      console.warn('[brandingSync] falha ao sincronizar manifest', e)
    }
    return false
  }
}

/**
 * Inicia sync inicial + revalidação ao focar a aba.
 */
export function startBrandingSync() {
  if (started || typeof window === 'undefined') return
  started = true

  syncBrandingFromApi().catch(() => {})

  // Re-sync rápido após bootstrap (upload recente no console).
  window.setTimeout(() => syncBrandingFromApi().catch(() => {}), 3_000)
  window.setTimeout(() => syncBrandingFromApi().catch(() => {}), 12_000)

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      syncBrandingFromApi().catch(() => {})
    }
  }

  document.addEventListener('visibilitychange', onVisible)

  if (!pollTimer) {
    pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncBrandingFromApi().catch(() => {})
      }
    }, BRANDING_POLL_MS)
  }
}

/**
 * Limpa cache de branding quando slug do tenant muda (multi-tenant / deploy).
 */
export function invalidateBrandingCacheIfSlugMismatch(slug) {
  if (!slug || typeof window === 'undefined') return

  try {
    const raw = localStorage.getItem('tenant_contract_cache')
    if (!raw) return
    const parsed = JSON.parse(raw)
    const cachedSlug = String(parsed?.slug || '').trim()
    if (cachedSlug && cachedSlug !== String(slug).trim()) {
      localStorage.removeItem('tenant_contract_cache')
      localStorage.removeItem(LS_TENANT_ASSETS_REVISION_KEY)
      localStorage.removeItem(LS_TENANT_BRANDING_ETAG_KEY)
      localStorage.removeItem(LS_TENANT_BRANDING_UPDATED_AT_KEY)
    }
  } catch {}
}

export { notifyBrandingRevision }
