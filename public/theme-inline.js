/* Gerado de D:\whitelabel-clean\config\tenants\safem.json */
window.__TENANT__ = {"slug":"safem","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/350/","vars":{"--primary":"#0A2E5C","--primary-dark":"#061F3E","--primary-light":"#1E4F8A","--secondary":"#F26A1B","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F3F6FA","--text":"#0B1220","--text-muted":"#556274","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#061F3E","--highlight":"#F59E0B","--button-hover":"color-mix(in srgb, var(--primary) 28%, #000000)","--sidebar-icon":"#061F3E","--sidebar-icon-muted":"#64748B","--sidebar-icon-active":"#F26A1B","--sidebar-text":"#0B1220","--sidebar-text-muted":"#556274","--headline":"#061F3E","--accent-warm":"#F26A1B"},"varsDark":{"--surface":"#0B1220","--surface-alt":"#0F1B2E","--text":"#F9FAFB","--text-muted":"#A5B4CF","--primary":"#1E4F8A","--primary-dark":"#0A2E5C","--primary-light":"#3B73B9","--secondary":"#F59E0B","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 32%, transparent)","--nav-active-color":"#F9FAFB","--highlight":"#F59E0B","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)","--sidebar-icon":"#F9FAFB","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#F59E0B","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#A5B4CF","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.22)","--accent-warm":"#F26A1B"},"logo":"safem.png","heroTitle":"Proteção e cuidado para toda a família","heroSubtitle":"Assistência familiar com estrutura, acolhimento e compromisso em todos os momentos.","heroImage":"https://seu-dominio-de-arquivos.com/safem/hero-safem.jpg","heroSlides":[{"id":"assistencia","tag":"Assistência Familiar","title":"Segurança, apoio e tranquilidade no dia a dia","subtitle":"Planos pensados para cuidar da sua família com responsabilidade e respeito.","image":"https://seu-dominio-de-arquivos.com/safem/hero-assistencia.jpg","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true},{"id":"servicos","tag":"Serviços & Estrutura","title":"Atendimento humanizado quando você mais precisa","subtitle":"Equipe preparada e serviços organizados para apoiar sua família com dignidade.","image":"https://seu-dominio-de-arquivos.com/safem/hero-servicos.jpg","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"memorial","tag":"Memorial Digital","title":"Lembranças que permanecem","subtitle":"Um espaço online para homenagens, mensagens e informações das cerimônias.","image":"https://seu-dominio-de-arquivos.com/safem/hero-memorial.jpg","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":false}],"domain":"safemassistencia.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'safem');
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