import api from '@/lib/api'
import useAuth from '@/store/auth'

export const POST_AUTH_DEFAULT = '/planos'
export const MEMBER_HOME = '/area'
export const REGISTER_NO_CONTRACT = '/criar-conta/sem-contrato'

const onlyDigits = (s) => (s || '').toString().replace(/\D/g, '')

/**
 * Normaliza respostas paginadas/array da API de contratos.
 */
export function normalizeContratosResponse(input) {
  let v = input?.data ?? input
  if (typeof v === 'string') {
    const t = v.trim()
    if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
      try {
        v = JSON.parse(t)
      } catch {}
    }
  }
  if (Array.isArray(v)) return v
  if (Array.isArray(v?.content)) return v.content
  if (Array.isArray(v?.data)) return v.data
  if (Array.isArray(v?.rows)) return v.rows
  if (Array.isArray(v?.items)) return v.items
  return []
}

/**
 * Normaliza location.state.from (string ou objeto React Router) para path completo.
 */
export function parseAuthReturnUrl(rawFrom, fallback = POST_AUTH_DEFAULT) {
  if (typeof rawFrom === 'string' && rawFrom.trim()) {
    return rawFrom.trim()
  }
  if (rawFrom?.pathname) {
    return `${rawFrom.pathname}${rawFrom.search || ''}${rawFrom.hash || ''}`
  }
  return fallback
}

/** Rotas da área do associado (exigem contrato vinculado ao CPF). */
export function isMemberAreaPath(path) {
  if (!path || typeof path !== 'string') return false
  const base = path.split('?')[0].split('#')[0]
  if (base === MEMBER_HOME || base.startsWith('/area/')) return true
  if (base === '/perfil' || base.startsWith('/perfil/')) return true
  if (base === '/carteirinha' || base.startsWith('/carteirinha/')) return true
  return false
}

/**
 * Destinos que devem ser respeitados literalmente (deep links).
 * Rotas /area/* exigem contrato — tratadas em resolvePostAuthDestination.
 */
export function isDeepLinkDestination(path) {
  if (!path || typeof path !== 'string') return false
  const base = path.split('?')[0].split('#')[0]
  if (base === POST_AUTH_DEFAULT || base === MEMBER_HOME) return false
  if (isMemberAreaPath(path)) return false
  if (base.startsWith('/cadastro') || base.startsWith('/confirmacao')) return true
  if (base.startsWith('/contratos/')) return true
  return false
}

/**
 * CPF do usuário autenticado: auth store → GET /app/me.
 */
export async function fetchAuthenticatedCpf() {
  const user = useAuth.getState().user
  const fromStore = onlyDigits(user?.cpf || user?.documento)
  if (fromStore.length >= 11) return fromStore

  try {
    const { data } = await api.get('/api/v1/app/me')
    return onlyDigits(data?.cpf || data?.documento || '')
  } catch {
    return ''
  }
}

/**
 * Lista contratos por CPF. Retorna null em erro de rede/API.
 */
export async function fetchContratosForCpf(cpf) {
  const cpfSan = onlyDigits(cpf)
  if (cpfSan.length < 11) return []

  try {
    const resp = await api.get(`/api/v1/contratos/cpf/${encodeURIComponent(cpfSan)}`)
    return normalizeContratosResponse(resp)
  } catch {
    return null
  }
}

/**
 * Redirecionamento na entrada (/, /login) para usuário já autenticado.
 * Retorna null quando deve permanecer na rota atual (ex.: home pública sem contrato).
 */
export async function resolveAuthenticatedEntryDestination(pathname) {
  if (pathname !== '/' && pathname !== '/login') return null

  const cpf = await fetchAuthenticatedCpf()
  const contratos = cpf ? await fetchContratosForCpf(cpf) : []
  const hasContrato = Array.isArray(contratos) && contratos.length > 0

  if (pathname === '/') {
    if (hasContrato) {
      return { path: MEMBER_HOME, state: undefined }
    }
    return null
  }

  return resolvePostAuthDestination({ rawFrom: pathname })
}

/**
 * Resolve destino pós-login/cadastro com base em deep link ou contratos.
 */
export async function resolvePostAuthDestination({ rawFrom, intent } = {}) {
  const explicitPath = parseAuthReturnUrl(rawFrom, '')

  const cpf = await fetchAuthenticatedCpf()
  const contratos = cpf ? await fetchContratosForCpf(cpf) : []
  const hasContrato = Array.isArray(contratos) && contratos.length > 0

  if (explicitPath && isMemberAreaPath(explicitPath)) {
    if (hasContrato) {
      return { path: explicitPath, state: undefined }
    }
    // Sem contrato: não entra no app — continua fluxo abaixo
  } else if (explicitPath && isDeepLinkDestination(explicitPath)) {
    return { path: explicitPath, state: undefined }
  }

  if (contratos === null) {
    return { path: POST_AUTH_DEFAULT, state: { onboarding: true } }
  }

  if (hasContrato) {
    return { path: MEMBER_HOME, state: undefined }
  }

  if (intent === 'cliente') {
    return { path: REGISTER_NO_CONTRACT, state: undefined }
  }

  const state =
    intent === 'onboarding' || intent === 'lead' || !explicitPath
      ? { onboarding: true }
      : undefined

  return { path: POST_AUTH_DEFAULT, state }
}

/**
 * @deprecated Use resolvePostAuthDestination().state
 */
export function postAuthNavigateState(destination) {
  if (destination === POST_AUTH_DEFAULT) {
    return { onboarding: true }
  }
  return undefined
}
