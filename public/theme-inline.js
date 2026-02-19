/* Gerado de D:\whitelabel-clean\config\tenants\santarosa.json */
window.__TENANT__ = {"slug":"santarosa","v":2,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/163/","vars":{"--primary":"#123F2B","--primary-dark":"#0F3524","--primary-light":"#1E5A3D","--secondary":"#E5E7EB","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F4F6F8","--text":"#0F172A","--text-muted":"#475569","--c-border":"rgba(15,23,42,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#123F2B","--highlight":"#1E5A3D","--button-hover":"color-mix(in srgb, var(--primary) 25%, #000000)"},"varsDark":{"--surface":"#0B1F16","--surface-alt":"#102A1D","--text":"#F8FAFC","--text-muted":"#CBD5E1","--c-border":"rgba(255,255,255,0.15)","--primary":"#1E5A3D","--primary-dark":"#123F2B","--primary-light":"#2F7A52","--secondary":"#F3F4F6","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 30%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#2F7A52","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)"},"logo":"santarosa.png","heroTitle":"Tradição, respeito e acolhimento para sua família","heroSubtitle":"Assistência completa com atendimento humanizado e suporte permanente em todos os momentos.","heroSlides":[{"id":"planos","tag":"Planos em destaque","title":"Proteção e tranquilidade para sua família","subtitle":"Coberturas pensadas para proteger sua família com orientação e atendimento humanizado.","image":"planos.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Proteção completa"},{"icon":"Users","label":"Para a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"beneficios","tag":"Clube de vantagens","title":"Economia real para usar todo mês","subtitle":"Vantagens e parcerias em serviços e comércios conveniados — benefícios que fazem diferença no orçamento.","image":"descontos.png","primary":{"label":"Ver benefícios","to":"/beneficios","variant":"primary"},"secondary":{"label":"Parceiros","to":"/beneficios","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Rede conveniada"},{"icon":"Wallet","label":"Economia mensal"}]},{"id":"memorial","tag":"Memorial Digital","title":"Memorial e homenagens em um só lugar","subtitle":"Um espaço digital para mensagens, homenagens e detalhes de cerimônias com respeito e simplicidade.","image":"memorial.png","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]}],"domain":"funerariaassis.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'santarosa');
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