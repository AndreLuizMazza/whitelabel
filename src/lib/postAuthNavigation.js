export const POST_AUTH_DEFAULT = '/planos'
export const MEMBER_HOME = '/area'

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

/**
 * State de navegação quando o destino padrão é escolha de plano (onboarding).
 */
export function postAuthNavigateState(destination) {
  if (destination === POST_AUTH_DEFAULT) {
    return { onboarding: true }
  }
  return undefined
}
