/* Gerado de D:\whitelabel-clean\config\tenants\riolife.json */
window.__TENANT__ = {"slug":"riolife","v":6,"vars":{"--primary":"#023059","--primary-dark":"#011C31","--primary-light":"#004A7C","--secondary":"#F2C811","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F7F7F7","--text":"#0B1220","--text-muted":"#4B5563","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#004A7C","--highlight":"#F2C811","--button-hover":"color-mix(in srgb, var(--primary) 20%, var(--secondary))","--sidebar-icon":"#023059","--sidebar-icon-muted":"#64748B","--sidebar-icon-active":"#F2C811","--sidebar-text":"#0B1220","--sidebar-text-muted":"#4B5563","--headline":"#023059"},"varsDark":{"--surface":"#020617","--surface-alt":"#0B1426","--text":"#F9FAFB","--text-muted":"#A5B4CF","--primary":"#0B63CE","--primary-dark":"#07489A","--primary-light":"#2D82E3","--secondary":"#F2C811","--nav-hover-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 35%, transparent)","--nav-active-color":"#DCE7FF","--highlight":"#F2C811","--button-hover":"color-mix(in srgb, var(--primary) 45%, var(--secondary))","--sidebar-icon":"#DCE7FF","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#F2C811","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#A5B4CF","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.24)"},"logo":"https://sandbox.progem.com.br/progem/api/downloads/empresa/392/arquivo?nome=383624b5-630b-45d3-b7aa-84c57cfe36f3_riolife.png","heroTitle":"Proteção e tranquilidade para sua família","heroSubtitle":"Planos completos de assistência familiar, benefícios exclusivos e atendimento humanizado.","heroImage":"https://seu-dominio-de-arquivos.com/rio-life/hero-familia-rio-life.jpg","heroSlides":[{"id":"familia","tag":"Assistência familiar & benefícios","title":"Proteção e tranquilidade para sua família","subtitle":"Planos completos para garantir segurança financeira e acolhimento em todos os momentos.","image":"https://seu-dominio-de-arquivos.com/rio-life/hero-familia-rio-life.jpg","primary":{"label":"Ver planos agora","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline-light"},"showValuePills":true},{"id":"memorial","tag":"Homenagens & lembranças","title":"Visite nosso Memorial Online","subtitle":"Um espaço para homenagens, lembranças e celebração da vida, com informações das cerimônias em um só lugar.","image":"https://seu-dominio-de-arquivos.com/rio-life/hero-memorial-rio-life.jpg","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"parceiros","tag":"Benefícios para sua empresa","title":"Seja nosso parceiro premium","subtitle":"Ofereça condições especiais aos associados e fortaleça sua marca com benefícios e indicações qualificadas.","image":"https://seu-dominio-de-arquivos.com/rio-life/hero-parceiros-rio-life.jpg","primary":{"label":"Quero ser parceiro(a)","to":"/beneficios","variant":"primary"},"secondary":{"label":"Falar com o time","to":"https://wa.me/?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20os%20planos%20da%20Rio%20Life.","variant":"outline-light"},"showValuePills":false}],"domain":"riolifeassistencia.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'riolife');
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