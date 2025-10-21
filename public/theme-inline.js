/* Gerado de D:\whitelabel-clean\config\tenants\rosapax.json */
window.__TENANT__ = {"slug":"rosapax","v":5,"vars":{"--primary":"#D643D9","--primary-dark":"#A456A6","--primary-light":"#EE05F2","--secondary":"#EE05F2","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F2F2F2","--text":"#0D0D0D","--text-muted":"rgba(13,13,13,0.65)","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#D643D9","--highlight":"#EE05F2","--button-hover":"color-mix(in srgb, var(--primary) 15%, var(--secondary))"},"varsDark":{"--surface":"#0D0D0D","--surface-alt":"#1A1A1A","--text":"#F2F2F2","--text-muted":"rgba(242,242,242,0.7)","--c-border":"rgba(255,255,255,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 35%, transparent)","--nav-active-color":"#EE05F2","--highlight":"#D643D9","--button-hover":"color-mix(in srgb, var(--primary) 25%, var(--secondary))"},"logo":"https://app.progem.com.br/progem/api/downloads/empresa/257/arquivo?nome=e7d5f6cf-0af2-4390-9cd3-d451089f1c28_rosapax.png","domain":"rosapax.com.br"};

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