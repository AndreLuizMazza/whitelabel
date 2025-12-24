/* Gerado de D:\whitelabel-clean\config\tenants\unipax.json */
window.__TENANT__ = {"slug":"unifax","v":2,"vars":{"--primary":"#7A1C1C","--primary-dark":"#5E1414","--primary-light":"#A63A3A","--secondary":"#2F8F46","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F7F8FA","--text":"#0E1624","--text-muted":"#5B667A","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 8%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-color":"#5E1414","--highlight":"#2F8F46","--button-hover":"color-mix(in srgb, var(--primary) 24%, #000000)","--sidebar-icon":"#5E1414","--sidebar-icon-muted":"#8A94A6","--sidebar-icon-active":"#2F8F46","--sidebar-text":"#0E1624","--sidebar-text-muted":"#5B667A","--headline":"#5E1414"},"varsDark":{"--surface":"#0C111B","--surface-alt":"#121A29","--text":"#F9FAFB","--text-muted":"#AAB3C5","--primary":"#A63A3A","--primary-dark":"#7A1C1C","--primary-light":"#C95E5E","--secondary":"#3FAE63","--nav-hover-bg":"color-mix(in srgb, var(--primary) 16%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 28%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#3FAE63","--button-hover":"color-mix(in srgb, var(--primary) 32%, #000000)","--sidebar-icon":"#FFFFFF","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#3FAE63","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#AAB3C5","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.18)"},"logo":"https://app.progem.com.br/progem/api/downloads/empresa/344/arquivo?nome=d7f0c90b-6132-4a73-aa41-4708dd87284a_arquivo_6.png","heroTitle":"Proteção, cuidado e tranquilidade para sua família","heroSubtitle":"Um plano de assistência familiar pensado para apoiar você com respeito e responsabilidade.","heroImage":"https://seu-dominio-de-arquivos.com/unifax/hero-unifax-modern.jpg","heroSlides":[{"id":"planos","tag":"Plano Familiar","title":"Cuidar da família é estar presente","subtitle":"Assistência completa, acessível e preparada para os momentos mais importantes.","image":"https://seu-dominio-de-arquivos.com/unifax/hero-planos-modern.jpg","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline-light"},"showValuePills":true},{"id":"servicos","tag":"Estrutura & Atendimento","title":"Atendimento humano, simples e organizado","subtitle":"Equipe preparada para orientar e acolher sua família com dignidade.","image":"https://seu-dominio-de-arquivos.com/unifax/hero-servicos-modern.jpg","primary":{"label":"Ver serviços","to":"/servicos","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"memorial","tag":"Memorial Digital","title":"Memórias preservadas com respeito","subtitle":"Um espaço digital para homenagens, mensagens e informações importantes.","image":"https://seu-dominio-de-arquivos.com/unifax/hero-memorial-modern.jpg","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":{"label":"Falar no WhatsApp","to":"https://wa.me/?text=Olá! Gostaria de informações sobre os planos da UNIFAX.","variant":"outline-light"},"showValuePills":false}],"domain":"unifaxassistencia.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'unipax');
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