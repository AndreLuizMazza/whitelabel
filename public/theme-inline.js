/* Gerado de D:\whitelabel-clean\config\tenants\amorim.json */
window.__TENANT__ = {"slug":"amorim","v":2,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/91/","vars":{"--primary":"#0C4B2C","--primary-dark":"#0A3A22","--primary-light":"#18643D","--secondary":"#A77746","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F5F5F5","--text":"#1A1A1A","--text-muted":"#6B6B6B","--c-border":"rgba(0,0,0,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#18643D","--highlight":"#A77746","--button-hover":"color-mix(in srgb, var(--primary) 15%, var(--secondary))","--sidebar-icon":"#0C4B2C","--sidebar-icon-muted":"#7C7C7C","--sidebar-icon-active":"#A77746","--sidebar-text":"#1A1A1A","--sidebar-text-muted":"#6B6B6B","--headline":"#0C4B2C"},"varsDark":{"--surface":"#121212","--surface-alt":"#1E1E1E","--text":"#E8E8E8","--text-muted":"#A0A0A0","--primary":"#18643D","--primary-dark":"#124B2D","--primary-light":"#2A7A51","--secondary":"#A77746","--nav-hover-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 35%, transparent)","--nav-active-color":"#F0F0F0","--highlight":"#A77746","--button-hover":"color-mix(in srgb, var(--primary) 40%, var(--secondary))","--sidebar-icon":"#E8E8E8","--sidebar-icon-muted":"#7A7A7A","--sidebar-icon-active":"#A77746","--sidebar-text":"#E8E8E8","--sidebar-text-muted":"#A0A0A0","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.24)"},"logo":"logoamorim.png","heroTitle":"Cuidado que honra histórias de vida","heroSubtitle":"Serviços funerários e planos de assistência com respeito, apoio e acolhimento.","heroImage":"https://seu-dominio-de-arquivos.com/amorim/hero-familia-amorim.jpg","heroSlides":[{"id":"assistencia","tag":"Assistência & Planos","title":"Proteção e apoio em todos os momentos","subtitle":"Planos personalizados com amparo, transparência e serviço humanizado.","image":"https://seu-dominio-de-arquivos.com/amorim/hero-assistencia-amorim.jpg","primary":{"label":"Ver planos agora","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true},{"id":"servicos","tag":"Serviços completos","title":"Cuidados funerários com dignidade","subtitle":"Atendimento especializado e estrutura completa para todo o ciclo de cuidado.","image":"https://seu-dominio-de-arquivos.com/amorim/hero-servicos-amorim.jpg","primary":{"label":"Nossos Planos","to":"/planos","variant":"primary"},"secondary":null,"showValuePills":true},{"id":"memorial","tag":"Memoriais & lembranças","title":"Espaços para homenagens e memórias","subtitle":"Memorial online e locais de despedida com acolhimento e respeito.","image":"https://seu-dominio-de-arquivos.com/amorim/hero-memorial-amorim.jpg","primary":{"label":"Visitar Memorial","to":"/memorial","variant":"primary"},"showValuePills":true}],"domain":"amorimfilho.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'amorim');
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