// src/boot/tenant.js
import api from '@/lib/api'
import useTenant from '@/store/tenant'
import { applyTheme } from '@/lib/theme'

// Desembrulha formatos possíveis: JSON direto, {data: ...} ou string JSON
function unwrap(resp) {
  try {
    if (resp == null) return null
    if (typeof resp === 'string') {
      try { return JSON.parse(resp) } catch { return null }
    }
    if (typeof resp === 'object') {
      if ('data' in resp) {
        const v = resp.data
        if (typeof v === 'string') { try { return JSON.parse(v) } catch { return v } }
        return v
      }
      return resp
    }
    return null
  } catch { return null }
}

export async function bootstrapTenant() {
  try {
    // 1) token do cliente (ignora erro)
    await api.post('/auth/client-token').catch(() => {})
    useTenant.getState().setClientTokenReady(true)

    // 2) empresa logada
    let raw = null
    try { raw = await api.get('/api/v1/unidades/me') } catch {}
    const empresa = unwrap(raw)
    if (empresa) useTenant.getState().setEmpresa(empresa)

    // 3) APLICAÇÃO DE TEMA
    // ===========================================
    // Regras:
    // - Se existir um snapshot/inline (JSON do tenant) -> NÃO sobrescreve.
    // - Se VITE_DISABLE_BOOTSTRAP=1 -> NÃO sobrescreve.
    // - Só aplica cores do backend como fallback.
    const hasSnapshot =
      typeof localStorage !== 'undefined' &&
      !!localStorage.getItem('tenant_theme_snapshot')

    const hasInline =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme-ready') === '1'

    const disabledByEnv = String(import.meta?.env?.VITE_DISABLE_BOOTSTRAP ?? '') === '1'

    const shouldSkip = hasSnapshot || hasInline || disabledByEnv

    if (!shouldSkip && (empresa?.corPrincipal || empresa?.corSecundaria)) {
      applyTheme({
        primary: empresa?.corPrincipal,
        secondary: empresa?.corSecundaria,
      })
    }

    if (import.meta?.env?.DEV) {
      console.log('[tenant]', {
        id: empresa?.id,
        nome: empresa?.nomeFantasia,
        corBackend: empresa?.corPrincipal,
        hasSnapshot,
        hasInline,
        disabledByEnv,
        appliedFromBackend: !shouldSkip && (empresa?.corPrincipal || empresa?.corSecundaria) ? true : false,
      })
    }
  } catch (e) {
    console.error('[bootstrapTenant] erro inesperado:', e)
  }
}
