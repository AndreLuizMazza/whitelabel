// src/store/tenant.js
import { create } from 'zustand'
const fallbackPrimary = '#0EA5E9'

// aplica as vars do tenant no :root
function applyTenantVars(empresa) {
  const vars = empresa?.vars || {}
  const root = document.documentElement
  try {
    Object.entries(vars).forEach(([k, v]) => {
      if (k && v != null) root.style.setProperty(k, String(v))
    })
  } catch {}
}

const useTenant = create((set) => ({
  empresa: null,
  clientTokenReady: false,
  primary: fallbackPrimary,
  secondary: null,

  setEmpresa: (empresa) => {
    // grava no estado
    set({
      empresa,
      primary: empresa?.corPrincipal || empresa?.vars?.['--primary'] || fallbackPrimary,
      secondary: empresa?.corSecundaria || null,
    })
    // aplica no :root
    applyTenantVars(empresa)
  },

  setClientTokenReady: (ok) => set({ clientTokenReady: !!ok }),
}))

export default useTenant
