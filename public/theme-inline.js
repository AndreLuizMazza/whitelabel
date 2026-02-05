/* Gerado de D:\whitelabel-clean\config\tenants\ervalia.json */
window.__TENANT__ = {"slug":"ervalia","v":2,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/182/","vars":{"--primary":"#2D318F","--primary-dark":"#1F246E","--primary-light":"#0AB7EE","--secondary":"#FDEF07","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F4F8FC","--text":"#0B1020","--text-muted":"#4B5563","--c-border":"rgba(13,16,32,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-color":"#1F246E","--highlight":"#FDEF07","--button-hover":"color-mix(in srgb, var(--primary) 22%, #000000)"},"varsDark":{"--surface":"#0B1020","--surface-alt":"#101A33","--text":"#F9FAFB","--text-muted":"#C0CAD6","--c-border":"rgba(255,255,255,0.18)","--primary":"#4CC3FF","--primary-dark":"#2D318F","--primary-light":"#8FD9F6","--secondary":"#FDEF07","--nav-hover-bg":"color-mix(in srgb, var(--primary) 16%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 28%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#FDEF07","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)"},"logo":"ervalia.png","heroTitle":"Tranquilidade e cuidado para a sua família","heroSubtitle":"Assistência completa, atendimento humanizado e suporte 24h — segurança e acolhimento em todos os momentos.","heroImage":"planos.png","heroSlides":[{"id":"planos","tag":"Planos em destaque","title":"Planos com acolhimento, segurança e respeito","subtitle":"Coberturas pensadas para proteger sua família com orientação e atendimento humanizado.","image":"planos.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Proteção completa"},{"icon":"Users","label":"Para a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"telemedicina","tag":"Telemedicina 24h","title":"Atendimento médico online, rápido e seguro","subtitle":"Consultas por telemedicina com praticidade, agilidade e orientação profissional sem sair de casa.","image":"telemedicina.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Clock","label":"24 horas"},{"icon":"Video","label":"Consulta online"},{"icon":"HeartPulse","label":"Orientação médica"}]},{"id":"beneficios","tag":"Clube de vantagens","title":"Economia real para usar todo mês","subtitle":"Vantagens e parcerias em serviços e comércios conveniados — benefícios que fazem diferença no orçamento.","image":"descontos.png","primary":{"label":"Ver benefícios","to":"/beneficios","variant":"primary"},"secondary":{"label":"Parceiros","to":"/beneficios","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Rede conveniada"},{"icon":"Wallet","label":"Economia mensal"}]},{"id":"memorial","tag":"Memorial Digital","title":"Informações e homenagens em um só lugar","subtitle":"Um espaço digital para mensagens, homenagens e detalhes de cerimônias com respeito e simplicidade.","image":"memorial.png","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]},{"id":"pet","tag":"Assistência Pet","title":"Cuidado e tranquilidade para seu pet","subtitle":"Planos de assistência pet com suporte, orientação e benefícios para o dia a dia.","image":"pet.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"PawPrint","label":"Apoio ao pet"},{"icon":"Heart","label":"Cuidado contínuo"},{"icon":"Smile","label":"Mais tranquilidade"}]}],"domain":"associado.paxervalia.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'ervalia');
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