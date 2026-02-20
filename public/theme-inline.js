/* Gerado de D:\whitelabel-clean\config\tenants\unipax.json */
window.__TENANT__ = {"slug":"unifax","v":2,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/344/","vars":{"--primary":"#7A1C1C","--primary-dark":"#5E1414","--primary-light":"#A63A3A","--secondary":"#2F8F46","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F7F8FA","--text":"#0E1624","--text-muted":"#5B667A","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 8%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-color":"#5E1414","--highlight":"#2F8F46","--button-hover":"color-mix(in srgb, var(--primary) 24%, #000000)","--sidebar-icon":"#5E1414","--sidebar-icon-muted":"#8A94A6","--sidebar-icon-active":"#2F8F46","--sidebar-text":"#0E1624","--sidebar-text-muted":"#5B667A","--headline":"#5E1414"},"varsDark":{"--surface":"#0C111B","--surface-alt":"#121A29","--text":"#F9FAFB","--text-muted":"#AAB3C5","--primary":"#A63A3A","--primary-dark":"#7A1C1C","--primary-light":"#C95E5E","--secondary":"#3FAE63","--nav-hover-bg":"color-mix(in srgb, var(--primary) 16%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 28%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#3FAE63","--button-hover":"color-mix(in srgb, var(--primary) 32%, #000000)","--sidebar-icon":"#FFFFFF","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#3FAE63","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#AAB3C5","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.18)"},"logo":"unipax.png","heroTitle":"Proteção, cuidado e tranquilidade para sua família","heroSubtitle":"Um plano de assistência familiar pensado para apoiar você com respeito e responsabilidade.","heroImage":"https://seu-dominio-de-arquivos.com/unifax/hero-unifax-modern.jpg","heroSlides":[{"id":"planos","tag":"Planos em destaque","title":"Proteção e tranquilidade para sua família","subtitle":"Coberturas pensadas para proteger sua família com orientação e atendimento humanizado.","image":"planos.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Proteção completa"},{"icon":"Users","label":"Para a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"beneficios","tag":"Clube de vantagens","title":"Economia real para usar todo mês","subtitle":"Vantagens e parcerias em serviços e comércios conveniados — benefícios que fazem diferença no orçamento.","image":"descontos.png","primary":{"label":"Ver benefícios","to":"/beneficios","variant":"primary"},"secondary":{"label":"Parceiros","to":"/beneficios","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Rede conveniada"},{"icon":"Wallet","label":"Economia mensal"}]},{"id":"memorial","tag":"Memorial Digital","title":"Memorial e homenagens em um só lugar","subtitle":"Um espaço digital para mensagens, homenagens e detalhes de cerimônias com respeito e simplicidade.","image":"memorial.png","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]}],"domain":"unifaxassistencia.com.br"};

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