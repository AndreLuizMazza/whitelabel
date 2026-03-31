/* Gerado de D:\whitelabel-local\web-progem-white-label\config\tenants\memorialanjos.json */
window.__TENANT__ = {"slug":"memorialanjos","v":3,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/memorialanjos/","vars":{"--primary":"#C8A35A","--primary-dark":"#A8843E","--primary-light":"#E2C078","--secondary":"#6B7280","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F8F6F2","--text":"#111827","--text-muted":"#6B7280","--c-border":"rgba(17,24,39,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-color":"#C8A35A","--highlight":"#C8A35A","--button-hover":"color-mix(in srgb, var(--primary) 25%, #000000)"},"varsDark":{"--surface":"#0B0B0C","--surface-alt":"#141416","--text":"#F9FAFB","--text-muted":"#D1D5DB","--c-border":"rgba(255,255,255,0.14)","--primary":"#E2C078","--primary-dark":"#C8A35A","--primary-light":"#F0D9A6","--secondary":"#9CA3AF","--nav-hover-bg":"color-mix(in srgb, var(--primary) 16%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 28%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#E2C078","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)"},"logo":"logo.png","heroTitle":"Cuidado, respeito e proteção para sua família","heroSubtitle":"Planos acessíveis, atendimento humanizado e benefícios pensados para oferecer tranquilidade em todos os momentos.","domain":"memorialanjos.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'memorialanjos');
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