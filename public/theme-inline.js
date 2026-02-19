/* Gerado de D:\whitelabel-clean\config\tenants\raio.json */
window.__TENANT__ = {"slug":"raio","v":2,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/289/","vars":{"--primary":"#0B0B0B","--primary-dark":"#000000","--primary-light":"#1A1A1A","--secondary":"#F2B705","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F4F4F4","--text":"#0F172A","--text-muted":"#475569","--c-border":"rgba(15,23,42,0.12)","--nav-hover-bg":"rgba(242,183,5,0.10)","--nav-active-bg":"rgba(242,183,5,0.20)","--nav-active-color":"#C99500","--highlight":"#F2B705","--button-hover":"color-mix(in srgb, var(--secondary) 40%, #000000)"},"varsDark":{"--surface":"#0B0B0B","--surface-alt":"#141414","--text":"#F8FAFC","--text-muted":"#D1D5DB","--c-border":"rgba(255,255,255,0.12)","--primary":"#F2B705","--primary-dark":"#C99500","--primary-light":"#FFD24A","--secondary":"#F2B705","--nav-hover-bg":"rgba(242,183,5,0.15)","--nav-active-bg":"rgba(242,183,5,0.28)","--nav-active-color":"#FFFFFF","--highlight":"#F2B705","--button-hover":"color-mix(in srgb, var(--secondary) 35%, #000000)"},"logo":"raio.png","heroTitle":"Respeito, acolhimento e dignidade em todos os momentos","heroSubtitle":"Atendimento humanizado e suporte completo para oferecer tranquilidade à sua família.","domain":"funerariaraiodesol.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'raio');
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