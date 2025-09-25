// src/theme/initTheme.js (corrigido definitivo)
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

/** Lê dados do tenant já injetados pelo theme-inline.js (ou cache local). */
function getTenant() {
  // prioridade para o objeto já presente (mais atual)
  if (typeof window !== 'undefined' && window.__TENANT__) return window.__TENANT__;
  try {
    const raw = localStorage.getItem('tenant_empresa');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** Aplica variáveis CSS (palette) no :root */
export function applyVars(varsObj) {
  if (!varsObj) return;
  const root = document.documentElement;
  Object.entries(varsObj).forEach(([k, v]) => {
    try { root.style.setProperty(k, String(v)); } catch {}
  });
}

/** Meta theme-color (status bar no mobile) */
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
    // usa a superfície vigente (já considerando vars aplicadas) para ficar coerente
    const v = cs.getPropertyValue('--surface') || '';
    color = (v && v.trim()) || (mode === 'dark' ? '#0b1220' : '#ffffff');
  } catch {}
  meta.setAttribute('content', color);
}

/** Classes/atributos no <html> */
function applyThemeAttrs(choice, mode) {
  const html = document.documentElement;
  html.classList.remove('dark', 'theme-dark', 'theme-light');
  html.dataset.theme = choice;  // 'system' | 'light' | 'dark' (escolha)
  html.dataset.mode  = mode;    // 'light' | 'dark'           (efetivo)

  if (mode === 'dark') html.classList.add('dark', 'theme-dark');
  else html.classList.add('theme-light');
}

/** Aplica: classes + variáveis do tenant + meta color, e persiste a escolha */
export function applyTheme(choice) {
  const mode = decideMode(choice);

  // 1) aplica classes/atributos
  applyThemeAttrs(choice, mode);

  // 2) aplica as variáveis do tenant para o modo correto
  try {
    const t = getTenant();
    const palette = (mode === 'dark' && t.varsDark) ? t.varsDark : (t.vars || null);
    if (palette) applyVars(palette);
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
    // addEventListener em navegadores recentes; fallback para addListener
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
  } catch {}
})();
