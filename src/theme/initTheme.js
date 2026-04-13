// src/theme/initTheme.js
import { resolveShellThemeColors } from "@/lib/branding/tenantContract.js";
import { applyTenantBrandLogoCssVars } from "@/lib/tenantBranding.js";
import { setEffectiveThemeMode } from "@/lib/tenantLogoRuntime.js";
import {
  LS_TENANT_CONTRACT_KEY,
  LS_TENANT_EMPRESA_KEY,
} from "@/lib/tenantStorageKeys.js";

export const THEME_KEY = 'ui_theme'; // 'system' | 'light' | 'dark'

function decideMode(choice) {
  if (choice === 'light' || choice === 'dark') return choice;
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    return mql.matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function resolveTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; }
}

/** Lê dados do tenant já injetados via theme-inline.js (build por tenant) */
function getInlineTenant() {
  try { return (typeof window !== 'undefined' && window.__TENANT__) ? window.__TENANT__ : null; }
  catch { return null; }
}

/** Normaliza objeto empresa (API) para ter vars na raiz como o contrato. */
function normalizePaletteSource(t) {
  if (!t || typeof t !== "object") return null;
  if (t.vars && typeof t.vars === "object") return t;
  if (t.tema?.vars && typeof t.tema.vars === "object") {
    return {
      vars: t.tema.vars,
      varsDark:
        t.tema.varsDark && typeof t.tema.varsDark === "object"
          ? t.tema.varsDark
          : undefined,
    };
  }
  return null;
}

/**
 * Paleta em cache: snapshot do contrato (tenant_contract_cache) ou empresa API (tenant_empresa).
 */
function getCachedTenant() {
  try {
    const rawC = localStorage.getItem(LS_TENANT_CONTRACT_KEY);
    if (rawC) {
      const p = JSON.parse(rawC);
      const n = normalizePaletteSource(p);
      if (n) return n;
    }
    const rawE = localStorage.getItem(LS_TENANT_EMPRESA_KEY);
    if (!rawE) return null;
    const p = JSON.parse(rawE);
    return normalizePaletteSource(p);
  } catch {
    return null;
  }
}

/** Aplica variáveis CSS no :root */
function applyVars(varsObj) {
  if (!varsObj) return;
  const root = document.documentElement;
  Object.entries(varsObj).forEach(([k, v]) => {
    try { root.style.setProperty(k, String(v)); } catch {}
  });
}

/** Meta theme-color: contrato shell (JSON) tem precedência; senão --surface efetiva */
function setMetaThemeColor(mode) {
  const html = document.documentElement;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  const inline = getInlineTenant();
  const { themeColor } = inline ? resolveShellThemeColors(inline) : { themeColor: "" };
  if (themeColor) {
    meta.setAttribute("content", themeColor);
    return;
  }
  let color = "#ffffff";
  try {
    const cs = getComputedStyle(html);
    const v = cs.getPropertyValue("--surface") || "";
    color = (v && v.trim()) || (mode === "dark" ? "#0b1220" : "#ffffff");
  } catch {}
  meta.setAttribute("content", color);
}

/** Classes/atributos no <html> para o tema */
function applyThemeAttrs(choice, mode) {
  const html = document.documentElement;
  html.classList.remove('dark', 'theme-dark', 'theme-light');
  html.dataset.theme = choice;  // 'system' | 'light' | 'dark' (escolha do usuário)
  html.dataset.mode  = mode;    // 'light' | 'dark'           (modo efetivo)

  if (mode === 'dark') html.classList.add('dark', 'theme-dark');
  else html.classList.add('theme-light');
}

/** Aplica: classes + vars do tenant + meta-color, e persiste a escolha */
export function applyTheme(choice) {
  const mode = decideMode(choice);
  applyThemeAttrs(choice, mode);

  // 1) TENANT inline (se existir) — build por tenant
  try {
    const T = getInlineTenant();
    if (T) {
      const baseLight = T.vars || {};
      const baseDark  = T.varsDark || null;
      const chosen    = (mode === 'dark' && baseDark) ? baseDark : baseLight;
      if (chosen) applyVars(chosen);
    }
  } catch {}

  // 2) TENANT em cache/runtime — multi-tenant num único deploy
  try {
    const t = getCachedTenant();
    if (t) {
      const palette = (mode === 'dark' && t.varsDark) ? t.varsDark : (t.vars || null);
      if (palette) applyVars(palette);
    }
  } catch {}

  // 3) meta theme-color coerente com a superfície atual
  setMetaThemeColor(mode);

  // 3b) Logo do contrato: --tenant-logo-light/dark e --tenant-logo efetivo
  try {
    const T = getInlineTenant();
    if (T) {
      applyTenantBrandLogoCssVars(T);
    } else {
      const rawC = localStorage.getItem(LS_TENANT_CONTRACT_KEY);
      if (rawC) {
        const p = JSON.parse(rawC);
        if (p && typeof p === "object") applyTenantBrandLogoCssVars(p);
      }
    }
  } catch {}

  // 3c) Notifica React (<img> da logo) — alinhado ao modo efetivo do <html>
  setEffectiveThemeMode(mode);

  // 4) persistência
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {}

  return mode;
}

/** Bootstrap inicial + reação a mudanças do SO quando em 'system' */
(function bootstrapTheme(){
  const choice = resolveTheme();
  applyTheme(choice);

  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (resolveTheme() === 'system') applyTheme('system'); };
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
  } catch {}
})();
