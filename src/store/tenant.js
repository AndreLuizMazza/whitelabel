// src/store/tenant.js
import { create } from 'zustand'
import api from '@/lib/api'

const fallbackPrimary = '#0EA5E9'

// aplica as vars do tenant no :root
function applyTenantVars(empresa) {
  const choice = localStorage.getItem('ui_theme') || 'system';
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  const mode = choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
  const vars = mode === 'dark' && empresa?.varsDark
    ? { ...(empresa?.vars || {}), ...empresa.varsDark }
    : (empresa?.vars || {});
  const root = document.documentElement;
  try {
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, String(v)));
  } catch {}
}

// Util: normaliza telefone para link do WhatsApp (apenas dígitos + DDI 55)
const toWaDigits = (num) => {
  let d = String(num || '').replace(/\D+/g, '')
  if (!d) return ''
  if (!d.startsWith('55')) d = '55' + d
  return d
}

let _bootstrapPromise = null

const useTenant = create((set, get) => ({
  empresa: null,
  clientTokenReady: false,
  primary: fallbackPrimary,
  secondary: null,
  loading: false,
  error: null,

  setEmpresa: (empresa) => {
    set({
      empresa,
      primary: empresa?.corPrincipal || empresa?.vars?.['--primary'] || fallbackPrimary,
      secondary: empresa?.corSecundaria || null,
    })
    applyTenantVars(empresa)
  },

  setClientTokenReady: (ok) => set({ clientTokenReady: !!ok }),

  // Busca /api/v1/unidades/me e aplica no estado + CSS vars
  async fetchEmpresa(force = false) {
    const { loading, empresa } = get()
    if (!force && (loading || empresa)) return empresa

    set({ loading: true, error: null })
    try {
      const { data } = await api.get('/api/v1/unidades/me', {
        __skipAuthRedirect: true,
      })
      set({
        empresa: data,
        primary: data?.corPrincipal || data?.vars?.['--primary'] || fallbackPrimary,
        secondary: data?.corSecundaria || null,
        loading: false,
        error: null,
      })
      applyTenantVars(data)
      return data
    } catch (err) {
      console.error('[tenant] fetchEmpresa error:', err)
      set({ loading: false, error: err })
      return null
    }
  },

  // Garante uma única chamada de bootstrap no ciclo de vida da app
  async initOnce() {
    if (_bootstrapPromise) return _bootstrapPromise
    _bootstrapPromise = get().fetchEmpresa(false)
    try {
      await _bootstrapPromise
    } finally {
      // mantém a promise para calls subsequentes reutilizarem
    }
    return get().empresa
  },

  // Helpers / selectors
  telefone() {
    return get()?.empresa?.contato?.telefone || ''
  },
  whatsappDigits() {
    const tel = get()?.empresa?.contato?.telefone
    return toWaDigits(tel)
  },
}))

export default useTenant
