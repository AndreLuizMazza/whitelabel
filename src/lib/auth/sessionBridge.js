let onTokensRefreshed = null
let onSessionInvalid = null

export function registerSessionBridge(onRefresh, onInvalid) {
  onTokensRefreshed = onRefresh
  onSessionInvalid = onInvalid
}

export function notifyTokensRefreshed(accessToken, refreshToken) {
  onTokensRefreshed?.(accessToken, refreshToken)
}

export function notifySessionInvalid(reason = 'session_expired') {
  onSessionInvalid?.(reason)
}
