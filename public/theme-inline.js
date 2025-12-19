/* Gerado de D:\whitelabel-clean\config\tenants\vysalife.json */
window.__TENANT__ = {"slug":"vysalife","v":1,"vars":{"--primary":"#1F7A4A","--primary-dark":"#155C38","--primary-light":"#4FA37A","--secondary":"#1E4FB8","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F3F6F9","--text":"#0B1220","--text-muted":"#556274","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#155C38","--highlight":"#1E4FB8","--button-hover":"color-mix(in srgb, var(--primary) 28%, #000000)","--sidebar-icon":"#155C38","--sidebar-icon-muted":"#64748B","--sidebar-icon-active":"#1E4FB8","--sidebar-text":"#0B1220","--sidebar-text-muted":"#556274","--headline":"#155C38"},"varsDark":{"--surface":"#0B1220","--surface-alt":"#111A2B","--text":"#F9FAFB","--text-muted":"#A5B4CF","--primary":"#4FA37A","--primary-dark":"#1F7A4A","--primary-light":"#7BC4A0","--secondary":"#4F7DDE","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 32%, transparent)","--nav-active-color":"#F9FAFB","--highlight":"#7BC4A0","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)","--sidebar-icon":"#F9FAFB","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#4FA37A","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#A5B4CF","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.22)"},"logo":"https://sandbox.progem.com.br/progem/api/downloads/empresa/320/arquivo?nome=4d86314a-470e-4128-80cb-30c0f4003a3c_logosemfundo.png","heroTitle":"Cuidar hoje é planejar o amanhã","heroSubtitle":"Assistência planejada com responsabilidade, acolhimento e compromisso com a sua família.","heroImage":"https://seu-dominio-de-arquivos.com/vysalife/hero-vysalife.jpg","heroSlides":[{"id":"planos","tag":"Assistência Planejada","title":"Proteção completa em todas as fases da vida","subtitle":"Planos acessíveis, transparentes e pensados para garantir tranquilidade e segurança.","image":"https://seu-dominio-de-arquivos.com/vysalife/hero-planos.jpg","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline-light"},"showValuePills":true},{"id":"servicos","tag":"Estrutura & cuidado","title":"Atendimento humanizado com estrutura completa","subtitle":"Equipe preparada e serviços organizados para apoiar sua família quando mais importa.","image":"https://seu-dominio-de-arquivos.com/vysalife/hero-servicos.jpg","primary":{"label":"Produtos e serviços","to":"/servicos","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"memorial","tag":"Memorial Digital","title":"Histórias que permanecem vivas","subtitle":"Um espaço online para homenagens, informações das cerimônias e lembranças compartilhadas.","image":"https://seu-dominio-de-arquivos.com/vysalife/hero-memorial.jpg","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":{"label":"Atendimento via WhatsApp","to":"https://wa.me/?text=Olá! Gostaria de saber mais sobre os planos da Vysa Life.","variant":"outline-light"},"showValuePills":false}],"domain":"vysalife.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'vysalife');
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