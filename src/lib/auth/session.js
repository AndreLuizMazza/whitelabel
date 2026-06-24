import { decodeJwt, isExpired, tokenExpirySkewSec } from '@/lib/auth/jwt'

const AUTH_REFRESH_PATH = '/api/v1/app/auth/refresh'

let refreshPromise = null

export function getApiBaseUrl() {
  return import.meta.env.PROD
    ? ''
    : (import.meta.env.VITE_BFF_BASE || 'http://localhost:8787')
}

export function hasSession({ refreshToken } = {}) {
  return Boolean(String(refreshToken ?? '').trim())
}

export function isAccessValid(accessToken) {
  const token = String(accessToken ?? '').trim()
  if (!token) return false
  return !isExpired(decodeJwt(token), tokenExpirySkewSec())
}

export function needsAccessRefresh({ token, refreshToken } = {}) {
  return hasSession({ refreshToken }) && !isAccessValid(token)
}

export function shouldAttemptAuthRefresh(status, hadBearer, hasRefresh) {
  if (!hadBearer || !hasRefresh) return false
  return status === 401 || status === 403
}

export function isAuthRefreshUrl(url) {
  const u = String(url ?? '')
  return u.includes('/auth/refresh')
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function doRefresh(refreshToken, deviceId) {
  const baseUrl = String(getApiBaseUrl()).replace(/\/+$/, '')
  const res = await fetch(`${baseUrl}${AUTH_REFRESH_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(deviceId ? { 'X-Device-ID': deviceId } : {}),
    },
    body: JSON.stringify({
      refreshToken,
      deviceId: deviceId || undefined,
    }),
  })

  const text = await res.text()
  const body = text ? safeJson(text) : null

  if (!res.ok) {
    const msg = (body && (body.message || body.error || body.title)) || `Erro HTTP ${res.status}`
    throw new Error(String(msg))
  }

  const accessToken = String(body?.access_token ?? body?.accessToken ?? '').trim()
  const newRefreshToken = String(body?.refresh_token ?? body?.refreshToken ?? refreshToken).trim()
  if (!accessToken) throw new Error('Refresh não retornou access token.')

  return { accessToken, refreshToken: newRefreshToken }
}

/** Renova tokens com deduplicação global (uma chamada por vez). */
export async function refreshSessionTokens({ refreshToken, deviceId } = {}) {
  const currentRefresh = String(refreshToken ?? '').trim()
  if (!currentRefresh) throw new Error('Refresh token ausente.')

  if (!refreshPromise) {
    refreshPromise = doRefresh(currentRefresh, deviceId).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}
