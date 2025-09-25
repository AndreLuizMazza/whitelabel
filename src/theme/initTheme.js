// src/theme/initTheme.js
const THEME_KEY = 'ui_theme';

function decideMode(choice) {
  if (choice === 'light' || choice === 'dark') return choice;
  const m = window.matchMedia?.('(prefers-color-scheme: dark)');
  return m?.matches ? 'dark' : 'light';
}

function applyThemeAttr(mode) {
  const html = document.documentElement;
  html.classList.remove('dark','theme-dark','theme-light');
  html.dataset.theme = mode;
  if (mode === 'dark') html.classList.add('dark','theme-dark'); else html.classList.add('theme-light');
  // meta theme-color
  const color = mode === 'dark' ? (getComputedStyle(html).getPropertyValue('--surface') || '#0b1220').trim() : (getComputedStyle(html).getPropertyValue('--surface') || '#ffffff').trim();
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta){ meta = document.createElement('meta'); meta.setAttribute('name','theme-color'); document.head.appendChild(meta); }
  meta.setAttribute('content', color || (mode==='dark' ? '#0b1220' : '#ffffff'));
}

function mergeVars(empresa, mode) {
  const light = empresa?.vars || {};
  const dark  = empresa?.varsDark || null;
  return (mode === 'dark' && dark) ? { ...light, ...dark } : light;
}

function applyVars(obj) {
  if (!obj) return;
  const root = document.documentElement;
  for (const [k,v] of Object.entries(obj)) {
    try { root.style.setProperty(k, String(v)); } catch {}
  }
}

export function resolveTheme(){
  try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; }
}

export function applyTheme(choice = resolveTheme()){
  const mode = decideMode(choice);
  applyThemeAttr(mode);

  // reaplica vars do tenant conforme o modo
  const empresa = window.__TENANT__ || (() => {
    try { return JSON.parse(localStorage.getItem('tenant_empresa') || 'null') } catch { return null }
  })();
  const chosen = mergeVars(empresa, mode);
  applyVars(chosen);

  // cache selecionado
  try { localStorage.setItem('tenant_vars', JSON.stringify(chosen)); } catch {}
  return mode;
}

// init on load + escuta SO
(function(){
  const mode = applyTheme(resolveTheme());
  const m = window.matchMedia?.('(prefers-color-scheme: dark)');
  m?.addEventListener?.('change', () => {
    if (resolveTheme() === 'system') applyTheme('system');
  });
})();
