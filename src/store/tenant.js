// src/store/tenant.js
import { create } from 'zustand'
const fallbackPrimary = '#0EA5E9'

// aplica as vars do tenant no :root
// src/store/tenant.js (só troque esta função)
function applyTenantVars(empresa) {
  const choice = localStorage.getItem('ui_theme') || 'system';
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  const mode = choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
  const vars = mode === 'dark' && empresa?.varsDark ? { ...(empresa?.vars||{}), ...empresa.varsDark } : (empresa?.vars||{});
  const root = document.documentElement;
  try { Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, String(v))); } catch {}
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
