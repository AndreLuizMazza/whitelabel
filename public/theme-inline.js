/* Gerado de D:\whitelabel-clean\config\tenants\nsa.json */
window.__TENANT__ = {"slug":"nsa","v":2,"vars":{"--primary":"#2C3E50","--primary-dark":"#1B2631","--primary-light":"#AAB7B8","--secondary":"#D4AF37","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F7F7F7","--text":"#1A1A1A","--text-muted":"rgba(26,26,26,0.65)","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#2C3E50","--highlight":"#F1C40F","--button-hover":"color-mix(in srgb, var(--primary) 15%, var(--secondary))"},"varsDark":{"--surface":"#0E0E0E","--surface-alt":"#1C1C1C","--text":"#F5F5F5","--text-muted":"rgba(245,245,245,0.7)","--c-border":"rgba(255,255,255,0.15)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 35%, transparent)","--nav-active-color":"#D4AF37","--highlight":"#F1C40F","--button-hover":"color-mix(in srgb, var(--primary) 25%, var(--secondary))"},"logo":"https://progem.s3.amazonaws.com/arquivos/Empresa%2042/9ceb4b3b-ed1f-4d74-a26b-9d6831eb7b61_logo-empresa-adbf8ee6-a298-4670-ac53-6ff67f79ddfe___nsa-removebg-preview.png","domain":"nsa.progem.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'nsa');
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