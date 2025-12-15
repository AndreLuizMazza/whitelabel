/* Gerado de D:\whitelabel-clean\config\tenants\dalia.json */
window.__TENANT__ = {"slug":"dalia","v":1,"vars":{"--primary":"#B8D080","--primary-dark":"#465620","--primary-light":"#CDDEA5","--secondary":"#95B844","--on-primary":"#0B1220","--surface":"#ffffff","--surface-alt":"#F4F8EC","--text":"#0B1220","--text-muted":"#556274","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#465620","--highlight":"#95B844","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)","--sidebar-icon":"#465620","--sidebar-icon-muted":"#64748B","--sidebar-icon-active":"#95B844","--sidebar-text":"#0B1220","--sidebar-text-muted":"#556274","--headline":"#465620"},"varsDark":{"--surface":"#0B1220","--surface-alt":"#111A2B","--text":"#F9FAFB","--text-muted":"#A5B4CF","--primary":"#B8D080","--primary-dark":"#95B844","--primary-light":"#CDDEA5","--secondary":"#95B844","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 32%, transparent)","--nav-active-color":"#F9FAFB","--highlight":"#CDDEA5","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)","--sidebar-icon":"#F9FAFB","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#B8D080","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#A5B4CF","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.22)"},"logo":"https://sandbox.progem.com.br/progem/api/downloads/empresa/268/arquivo?nome=1c7e3e82-d1b7-421f-9e91-3253d2a87f6e_Captura_de_tela_2024-05-25_152332.png","heroTitle":"Acolhimento e cuidado em cada detalhe","heroSubtitle":"Assistência e estrutura completa com atendimento humanizado e respeito à sua família.","heroImage":"https://seu-dominio-de-arquivos.com/dalia/hero-dalia.jpg","heroSlides":[{"id":"assistencia","tag":"Assistência & Planos","title":"Proteção para sua família, com tranquilidade","subtitle":"Planos pensados para apoiar você com clareza, carinho e suporte em todos os momentos.","image":"https://seu-dominio-de-arquivos.com/dalia/hero-assistencia.jpg","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline-light"},"showValuePills":true},{"id":"servicos","tag":"Estrutura & atendimento","title":"Cerimonial com dignidade e respeito","subtitle":"Equipe preparada e organização completa para oferecer segurança e acolhimento.","image":"https://seu-dominio-de-arquivos.com/dalia/hero-servicos.jpg","primary":{"label":"Produtos e serviços","to":"/servicos","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"memorial","tag":"Memorial online","title":"Homenagens e lembranças em um só lugar","subtitle":"Um espaço digital para mensagens, informações das cerimônias e memórias compartilhadas.","image":"https://seu-dominio-de-arquivos.com/dalia/hero-memorial.jpg","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":{"label":"Falar no WhatsApp","to":"https://wa.me/?text=Olá! Quero saber mais sobre os planos da Dália Cerimonial.","variant":"outline-light"},"showValuePills":false}],"domain":"daliacerimonial.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'dalia');
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