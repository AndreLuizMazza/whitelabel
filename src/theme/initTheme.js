// src/theme/initTheme.js
// - Aplica modo de tema (system/light/dark)
// - Aplica CSS vars do tenant assim que possível e re-aplica quando o store mudar

const THEME_KEY = 'ui_theme'; // 'system' | 'light' | 'dark'
const TENANT_VARS_KEY = 'tenant_vars';
const TENANT_EMPRESA_KEY = 'tenant_empresa';

// ---------- MODO (light/dark/system) ----------
function applyTheme(choice) {
  try {
    const html = document.documentElement;
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');

    html.classList.remove('dark', 'theme-dark', 'theme-light');

    if (choice === 'dark') {
      html.classList.add('dark', 'theme-dark');
    } else if (choice === 'light') {
      html.classList.add('theme-light');
    } else {
      // system
      if (mql?.matches) html.classList.add('dark', 'theme-dark');
    }
  } catch {}
}

(function initThemeMode() {
  let choice = 'system';
  try { choice = localStorage.getItem(THEME_KEY) || 'system'; } catch {}
  applyTheme(choice);

  // se o SO mudar e estiver em 'system', reflita a mudança
  try {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => {
      let current = 'system';
      try { current = localStorage.getItem(THEME_KEY) || 'system'; } catch {}
      if (current === 'system') applyTheme('system');
    };
    mql?.addEventListener?.('change', onChange);
  } catch {}
})();

// ---------- VARS DO TENANT ----------
function applyTenantVars(vars) {
  if (!vars || typeof vars !== 'object') return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    try { root.style.setProperty(k, String(v)); } catch {}
  }
}

// compara versão/slug para invalidar cache
function shouldReplaceCachedEmpresa(cached, incoming) {
  try {
    const cv = Number(cached?.v || 0);
    const iv = Number(incoming?.v || 0);
    return (!cached?.slug) || (cached?.slug !== incoming?.slug) || (iv > cv);
  } catch { return true; }
}

// 1) Aplica imediatamente se encontrar algo injetado (window.__TENANT__) ou cache
(function initTenantVars() {
  let applied = false;

  // a) preferir payload injetado pelo theme-inline.js
  const injected = window.__TENANT__ || null;
  if (injected?.vars) {
    try {
      const cached = JSON.parse(localStorage.getItem(TENANT_EMPRESA_KEY) || 'null');
      if (shouldReplaceCachedEmpresa(cached, injected)) {
        localStorage.setItem(TENANT_EMPRESA_KEY, JSON.stringify(injected));
        localStorage.setItem(TENANT_VARS_KEY, JSON.stringify(injected.vars));
      }
    } catch {}
    applyTenantVars(injected.vars);
    applied = true;
  }

  // b) fallback: empresa completa do cache
  if (!applied) {
    try {
      const savedEmpresa = JSON.parse(localStorage.getItem(TENANT_EMPRESA_KEY) || 'null');
      if (savedEmpresa?.vars) {
        applyTenantVars(savedEmpresa.vars);
        applied = true;
      }
    } catch {}
  }

  // c) fallback: só as vars salvas
  if (!applied) {
    try {
      const savedVars = JSON.parse(localStorage.getItem(TENANT_VARS_KEY) || 'null');
      if (savedVars && typeof savedVars === 'object') {
        applyTenantVars(savedVars);
        applied = true;
      }
    } catch {}
  }
})();

// 2) Se o store existir, escuta e re-aplica (sem depender do backend p/ cor)
import('@/store/tenant')
  .then(({ default: useTenant }) => {
    try {
      const state = useTenant.getState?.();
      if (state?.empresa?.vars) {
        try {
          const cached = JSON.parse(localStorage.getItem(TENANT_EMPRESA_KEY) || 'null');
          if (shouldReplaceCachedEmpresa(cached, state.empresa)) {
            localStorage.setItem(TENANT_EMPRESA_KEY, JSON.stringify(state.empresa));
            localStorage.setItem(TENANT_VARS_KEY, JSON.stringify(state.empresa.vars));
          }
        } catch {}
        applyTenantVars(state.empresa.vars);
      }

      useTenant.subscribe((s) => {
        if (s?.empresa?.vars) {
          try {
            const cached = JSON.parse(localStorage.getItem(TENANT_EMPRESA_KEY) || 'null');
            if (shouldReplaceCachedEmpresa(cached, s.empresa)) {
              localStorage.setItem(TENANT_EMPRESA_KEY, JSON.stringify(s.empresa));
              localStorage.setItem(TENANT_VARS_KEY, JSON.stringify(s.empresa.vars));
            }
          } catch {}
          applyTenantVars(s.empresa.vars);
        }
      });
    } catch {}
  })
  .catch(() => {
    // se não houver store, seguimos só com o inline/cache
  });

// 3) (Opcional) helper p/ debug no console
window.forceTenantVars = (vars) => applyTenantVars(vars);
