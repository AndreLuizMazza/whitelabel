/* Gerado de D:\whitelabel-clean\config\tenants\patense.json */
window.__TENANT__ = {"slug":"patense","v":7,"vars":{"--primary":"#004C3F","--primary-dark":"#003B31","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#f6f7fb","--text":"#0b1220","--text-muted":"#5f6b7a","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#004C3F"},"varsDark":{"--surface":"#0b1220","--surface-alt":"#0f172a","--text":"#e5e7eb","--text-muted":"#94a3b8","--c-border":"rgba(255,255,255,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 36%, transparent)","--nav-active-color":"#ffffff"},"logo":"https://app.progem.com.br/progem/api/downloads/empresa/274/arquivo?nome=ea3aa504-e9fd-4f19-9021-eebd659ca841_Marca_Dagua_Logo_Funeraria_Patense.png","domain":"patense.com.br"};

(function(){
  try {
    var docEl = document.documentElement;
    var style = docEl && docEl.style;
    var t = window.__TENANT__ || {};
    var light = t.vars || {};
    var dark  = t.varsDark || null;

    // detecta tema (system/light/dark)
    var choice = 'system';
    try { choice = localStorage.getItem('ui_theme') || 'system'; } catch(_){}
    var prefersDark = false;
    try { prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch(_){}
    var mode = (choice === 'system') ? (prefersDark ? 'dark' : 'light') : choice;

    // escolhe vars
    var chosen = (mode === 'dark' && dark) ? Object.assign({}, light, dark) : light;

    // aplica
    if (style && chosen) {
      for (var k in chosen) if (Object.prototype.hasOwnProperty.call(chosen, k)) {
        style.setProperty(k, String(chosen[k]));
      }
    }
    if (docEl){
      docEl.setAttribute('data-tenant', t.slug || 'patense');
      docEl.setAttribute('data-theme', mode);
      docEl.setAttribute('data-theme-ready', '1');
    }

    // cache
    try {
      localStorage.setItem('tenant_empresa', JSON.stringify(t));
      localStorage.setItem('tenant_vars', JSON.stringify(chosen || {}));
    } catch(_){}
  } catch (e) { try { console.warn('theme-inline failed', e); } catch(_){} }
})();