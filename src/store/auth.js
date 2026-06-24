import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { setAuthTokenProvider } from '@/lib/api'
import {
  getApiBaseUrl,
  hasSession,
  isAccessValid,
  needsAccessRefresh,
  refreshSessionTokens,
} from '@/lib/auth/session'
import { getDeviceId } from '@/store/authDevice'

function extractAccessToken(data) {
  return data?.token ?? data?.access_token ?? data?.jwt ?? null
}

function extractRefreshToken(data) {
  return data?.refresh_token ?? data?.refreshToken ?? null
}

const useAuth = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      sessionReady: false,
      isBootstrapping: false,

      /** Login no BFF (credenciais: e-mail/cpf + senha) */
      login: async (identificador, senha) => {
        const { data } = await api.post(
          '/api/v1/app/auth/login',
          { identificador, senha },
          { headers: { 'X-Device-ID': getDeviceId() } }
        )
        const token = extractAccessToken(data)
        const refreshToken = extractRefreshToken(data)
        set({
          user: data,
          token,
          refreshToken,
          sessionReady: true,
          isBootstrapping: false,
        })
        return data
      },

      setTokens: (token, refreshToken) => {
        set({ token, refreshToken })
      },

      setUser: (user) => set({ user }),

      /** Sessão válida enquanto refresh existir e access não expirado (ou bootstrap em curso). */
      isAuthenticated: () => {
        const { refreshToken, token, isBootstrapping } = get()
        if (!hasSession({ refreshToken })) return false
        if (isBootstrapping) return true
        return isAccessValid(token)
      },

      /** UI pública: usuário com sessão persistida (mesmo access expirado). */
      isLoggedIn: () => hasSession({ refreshToken: get().refreshToken }),

      /** Restaura access token na carga se refresh ainda for válido. */
      bootstrapSession: async () => {
        const state = get()
        if (!needsAccessRefresh(state)) {
          set({ sessionReady: true, isBootstrapping: false })
          return
        }

        set({ isBootstrapping: true, sessionReady: false })
        try {
          const refreshed = await refreshSessionTokens({
            refreshToken: state.refreshToken,
            deviceId: getDeviceId(),
          })
          set({
            token: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            isBootstrapping: false,
            sessionReady: true,
          })
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isBootstrapping: false,
            sessionReady: true,
          })
        }
      },

      /** Logout local + revogação best-effort no servidor. */
      logout: async ({ skipServer = false } = {}) => {
        const { token } = get()
        if (!skipServer && token && isAccessValid(token)) {
          try {
            const baseUrl = String(getApiBaseUrl()).replace(/\/+$/, '')
            const deviceId = getDeviceId()
            await fetch(`${baseUrl}/api/v1/app/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(deviceId ? { 'X-Device-ID': deviceId } : {}),
              },
              body: JSON.stringify({ deviceId: deviceId || undefined }),
            })
          } catch {
            // best-effort
          }
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          sessionReady: true,
          isBootstrapping: false,
        })
      },

      getToken: () => get().token,
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
      }),
    }
  )
)

/** Fornece o bearer do usuário ao axios automaticamente */
setAuthTokenProvider(() => {
  const { token } = useAuth.getState()
  return token || null
})

export { getDeviceId } from '@/store/authDevice'
export default useAuth
