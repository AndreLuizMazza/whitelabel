/* Gerado de config/tenants/rosapax.json */
window.__TENANT__ = {"slug":"rosapax","v":1,"vars":{"--primary":"#E91E63","--primary-dark":"#C2185B","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#f9f9fb","--text":"#1a1a1a","--text-muted":"#6b6b6b","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#E91E63"},"varsDark":{"--surface":"#0b0b0f","--surface-alt":"#111318","--text":"#f1f1f1","--text-muted":"#b3b3b3","--c-border":"rgba(255,255,255,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 36%, transparent)","--nav-active-color":"#ffffff"},"logo":"https://progem.s3.amazonaws.com/arquivos/Empresa%20257/a95b8b98-7be8-4862-952e-aba35329c9e0_logoofic.png","domain":"rosapax.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'rosapax');
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