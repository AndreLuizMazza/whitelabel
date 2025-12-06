/* Gerado de D:\whitelabel-clean\config\tenants\patense.json */
window.__TENANT__ = {"slug":"patense","v":9,"vars":{"--primary":"#004C3F","--primary-dark":"#003B31","--primary-light":"#2E7A68","--secondary":"#F2A900","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#f6f7fb","--text":"#0b1220","--text-muted":"#5f6b7a","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#004C3F","--highlight":"#F2A900","--button-hover":"color-mix(in srgb, var(--primary) 18%, var(--secondary))"},"varsDark":{"--surface":"#0b1220","--surface-alt":"#0f172a","--text":"#e5e7eb","--text-muted":"#94a3b8","--c-border":"rgba(255,255,255,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 36%, transparent)","--nav-active-color":"#ffffff","--highlight":"#F2A900","--button-hover":"color-mix(in srgb, var(--primary) 26%, var(--secondary))"},"logo":"https://app.progem.com.br/progem/api/downloads/empresa/274/arquivo?nome=ea3aa504-e9fd-4f19-9021-eebd659ca841_Marca_Dagua_Logo_Funeraria_Patense.png","heroTitle":"Proteção e tranquilidade para sua família","heroSubtitle":"Planos de assistência familiar da Funerária Patense, com benefícios exclusivos e atendimento humanizado.","heroImage":"https://patense.awis.com.br/assets/hero-familia-patense.jpg","heroSlides":[{"id":"familia","tag":"Assistência familiar & benefícios","title":"Proteção e tranquilidade para sua família","subtitle":"Planos completos para garantir segurança financeira e acolhimento em todos os momentos.","image":"https://patense.awis.com.br/assets/hero-familia-patense.jpg","primary":{"label":"Ver planos agora","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline-light"},"showValuePills":true},{"id":"memorial","tag":"Homenagens & lembranças","title":"Memorial Online da Funerária Patense","subtitle":"Registre homenagens, mensagens de carinho e acompanhe informações das cerimônias em um só lugar.","image":"https://patense.awis.com.br/assets/hero-memorial-patense.jpg","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"parceiros","tag":"Benefícios exclusivos para sua empresa","title":"Seja um parceiro da Funerária Patense","subtitle":"Ofereça vantagens para associados e fortaleça sua marca com indicações qualificadas.","image":"https://patense.awis.com.br/assets/hero-parceiros-patense.jpg","primary":{"label":"Quero ser parceiro(a)","to":"/beneficios","variant":"primary"},"secondary":{"label":"Falar com o time","to":"https://wa.me/5546991120012?text=Ol%C3%A1!%20Quero%20ser%20parceiro%20da%20Funer%C3%A1ria%20Patense.","variant":"outline-light"},"showValuePills":false}],"domain":"patense.com.br"};

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