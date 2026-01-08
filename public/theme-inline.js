/* Gerado de D:\whitelabel-clean\config\tenants\dalia.json */
window.__TENANT__ = {"slug":"dalia","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/268/","vars":{"--primary":"#B8D080","--primary-dark":"#465620","--primary-light":"#CDDEA5","--secondary":"#95B844","--on-primary":"#0B1220","--surface":"#ffffff","--surface-alt":"#F4F8EC","--text":"#0B1220","--text-muted":"#556274","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#465620","--highlight":"#95B844","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)","--sidebar-icon":"#465620","--sidebar-icon-muted":"#64748B","--sidebar-icon-active":"#95B844","--sidebar-text":"#0B1220","--sidebar-text-muted":"#556274","--headline":"#465620"},"varsDark":{"--surface":"#0B1220","--surface-alt":"#111A2B","--text":"#F9FAFB","--text-muted":"#A5B4CF","--primary":"#B8D080","--primary-dark":"#95B844","--primary-light":"#CDDEA5","--secondary":"#95B844","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 32%, transparent)","--nav-active-color":"#F9FAFB","--highlight":"#CDDEA5","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)","--sidebar-icon":"#F9FAFB","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#B8D080","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#A5B4CF","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.22)"},"logo":"dalia-semfundo.png","heroTitle":"Acolhimento e cuidado em cada detalhe","heroSubtitle":"Assistência e estrutura completa com atendimento humanizado e respeito à sua família.","heroImage":"https://seu-dominio-de-arquivos.com/dalia/hero-dalia.jpg","heroSlides":[{"id":"assistencia","tag":"Assistência & Planos","title":"Proteção para sua família, com tranquilidade","subtitle":"Planos pensados para apoiar você com clareza, carinho e suporte em todos os momentos.","image":"https://seu-dominio-de-arquivos.com/dalia/hero-assistencia.jpg","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Cobertura completa"},{"icon":"Users","label":"Para toda a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"telemedicina","tag":"Telemedicina 24h","title":"Médico online, rápido e seguro onde você estiver","subtitle":"Consultas por telemedicina com praticidade, agilidade e orientação profissional sem sair de casa.","image":"telemedicina.png","primary":{"label":"Ver planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"Clock","label":"24 horas"},{"icon":"Video","label":"Consulta online"},{"icon":"HeartPulse","label":"Orientação médica"}]},{"id":"servicos","tag":"Estrutura & atendimento","title":"Cerimonial com dignidade e respeito","subtitle":"Equipe preparada e organização completa para oferecer segurança e acolhimento.","image":"https://seu-dominio-de-arquivos.com/dalia/hero-servicos.jpg","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Cobertura completa"},{"icon":"Users","label":"Para toda a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"memorial","tag":"Memorial online","title":"Homenagens e lembranças em um só lugar","subtitle":"Um espaço digital para mensagens, informações das cerimônias e memórias compartilhadas.","image":"https://seu-dominio-de-arquivos.com/dalia/hero-memorial.jpg","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]},{"id":"pet","tag":"Assistência Pet","title":"Cuidado, apoio e tranquilidade para seu pet","subtitle":"Planos de assistência pet para oferecer suporte, orientação e benefícios no cuidado com animais de estimação.","image":"pet.png","primary":{"label":"Ver lanos","to":"/planos","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"PawPrint","label":"Amigos de verdade"},{"icon":"Heart","label":"Cuidado contínuo"},{"icon":"Smile","label":"Mais tranquilidade"}]}],"domain":"daliacerimonial.com.br"};

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