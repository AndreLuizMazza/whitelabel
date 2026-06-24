function b64urlToJson(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  const json = atob(b64 + pad)
  return JSON.parse(json)
}

export function decodeJwt(token) {
  try {
    const parts = String(token ?? '').split('.')
    if (parts.length < 2) return null
    return b64urlToJson(parts[1])
  } catch {
    return null
  }
}

/** Considera expirado se faltar menos de skewSec para o vencimento. */
export function isExpired(payload, skewSec = 0) {
  if (!payload?.exp) return false
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now + skewSec
}

export function tokenExpirySkewSec() {
  const raw = import.meta.env.VITE_TOKEN_EXPIRY_SKEW_SEC
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 60
}
