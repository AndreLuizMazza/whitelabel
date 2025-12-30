/* Gerado de D:\whitelabel-clean\config\tenants\unilife.json */
window.__TENANT__ = {"slug":"unilife","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/92/","vars":{"--primary":"#0477BF","--primary-dark":"#035A91","--primary-light":"#05C7F2","--secondary":"#F23545","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F4F7FA","--text":"#0D0D0D","--text-muted":"#5F6B7A","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#0477BF","--highlight":"#F23545","--button-hover":"color-mix(in srgb, var(--primary) 28%, #000000)"},"varsDark":{"--surface":"#0D0D0D","--surface-alt":"#141414","--text":"#F9FAFB","--text-muted":"#B6C0CC","--c-border":"rgba(255,255,255,0.22)","--primary":"#048ABF","--primary-dark":"#0477BF","--primary-light":"#05C7F2","--secondary":"#F23545","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 32%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#F23545","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)"},"logo":"logounilife.png","heroTitle":"Assistência completa com confiança de verdade","heroSubtitle":"Planos, telemedicina 24h e clube de descontos — benefícios que cuidam da sua família no dia a dia.","heroImage":"planos.png","heroSlides":[{"id":"planos","tag":"Planos em destaque","title":"Planos que protegem — com acolhimento e segurança","subtitle":"Coberturas pensadas para oferecer tranquilidade, orientação e suporte com atendimento humanizado.","image":"planos.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Cobertura completa"},{"icon":"Users","label":"Para a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"telemedicina","tag":"Telemedicina 24h","title":"Médico online, rápido e seguro — onde você estiver","subtitle":"Consultas por telemedicina com praticidade, agilidade e orientação profissional sem sair de casa.","image":"telemedicina.png","primary":{"label":"Ativar telemedicina","to":"/planos","variant":"primary"},"secondary":{"label":"Como funciona","to":"/telemedicina","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Clock","label":"24 horas"},{"icon":"Video","label":"Consulta online"},{"icon":"HeartPulse","label":"Orientação médica"}]},{"id":"beneficios","tag":"Clube de descontos","title":"Descontos reais para usar todo mês","subtitle":"Vantagens e parcerias em saúde, serviços e comércios conveniados — economia que faz diferença no orçamento.","image":"descontos.png","primary":{"label":"Ver clube de descontos","to":"/beneficios","variant":"primary"},"secondary":{"label":"Parceiros","to":"/parceiros","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos de verdade"},{"icon":"Store","label":"Rede conveniada"},{"icon":"Wallet","label":"Economia mensal"}]},{"id":"memorial","tag":"Memorial Digital","title":"Homenagens e informações em um só lugar","subtitle":"Um espaço digital para mensagens, homenagens e detalhes das cerimônias com respeito e simplicidade.","image":"memorial.png","primary":{"label":"Acessar memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]},{"id":"pet","tag":"Assistência Pet","title":"Cuidado, apoio e tranquilidade para seu pet","subtitle":"Planos de assistência pet para oferecer suporte, orientação e benefícios no cuidado com animais de estimação.","image":"pet.png","primary":{"label":"Planos pet","to":"/planos?categoria=pet","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"PawPrint","label":"Amigos de verdade"},{"icon":"Heart","label":"Cuidado contínuo"},{"icon":"Smile","label":"Mais tranquilidade"}]}],"domain":"planounilifebrasil.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'unilife');
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