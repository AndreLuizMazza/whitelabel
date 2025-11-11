// src/theme/initTheme.js

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

/** Lê dados do tenant em cache (bootstrap do backend) */
function getCachedTenant() {
  try {
    const raw = localStorage.getItem('tenant_empresa');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Aplica variáveis CSS no :root */
function applyVars(varsObj) {
  if (!varsObj) return;
  const root = document.documentElement;
  Object.entries(varsObj).forEach(([k, v]) => {
    try { root.style.setProperty(k, String(v)); } catch {}
  });
}

/** Meta theme-color (status bar em mobile) com base em --surface corrente */
function setMetaThemeColor(mode) {
  const html = document.documentElement;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name','theme-color');
    document.head.appendChild(meta);
  }
  let color = '#ffffff';
  try {
    const cs = getComputedStyle(html);
    const v = cs.getPropertyValue('--surface') || '';
    color = (v && v.trim()) || (mode === 'dark' ? '#0b1220' : '#ffffff');
  } catch {}
  meta.setAttribute('content', color);
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
