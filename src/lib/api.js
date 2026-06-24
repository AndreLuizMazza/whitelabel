// src/lib/api.js
import axios from 'axios'
import { getDeviceId } from '@/store/authDevice'
import {
  isAuthRefreshUrl,
  refreshSessionTokens,
  shouldAttemptAuthRefresh,
} from '@/lib/auth/session'
import { notifySessionInvalid, notifyTokensRefreshed } from '@/lib/auth/sessionBridge'

let tokenProvider = null
export function setAuthTokenProvider(fn) {
  tokenProvider = fn
}

// Em prod, não prefixe nada: as rotas já começam com /api/...
const baseURL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_BFF_BASE || 'http://localhost:8787')

const api = axios.create({
  baseURL,
  timeout: 90000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((cfg) => {
  const token = tokenProvider?.()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  try {
    const dev = getDeviceId()
    if (dev) cfg.headers['X-Device-ID'] = dev
  } catch {}
  return cfg
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config
    const status = error?.response?.status
    if (!config || config._authRetried || isAuthRefreshUrl(config.url)) {
      return Promise.reject(error)
    }

    const hadBearer = Boolean(config.headers?.Authorization)
    let hasRefresh = false
    let refreshToken = null

    try {
      const { default: useAuth } = await import('@/store/auth')
      refreshToken = useAuth.getState().refreshToken
      hasRefresh = Boolean(String(refreshToken ?? '').trim())
    } catch {
      return Promise.reject(error)
    }

    if (!shouldAttemptAuthRefresh(status, hadBearer, hasRefresh)) {
      return Promise.reject(error)
    }

    try {
      const refreshed = await refreshSessionTokens({
        refreshToken,
        deviceId: getDeviceId(),
      })
      notifyTokensRefreshed(refreshed.accessToken, refreshed.refreshToken)

      config._authRetried = true
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${refreshed.accessToken}`
      return api.request(config)
    } catch {
      notifySessionInvalid('session_expired')
      return Promise.reject(error)
    }
  }
)

export default api
