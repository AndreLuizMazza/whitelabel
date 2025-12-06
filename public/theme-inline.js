/* Gerado de D:\whitelabel-clean\config\tenants\demo.json */
window.__TENANT__ = {"slug":"demo","v":4,"vars":{"--primary":"#5B3DF8","--primary-dark":"#3A2AB5","--primary-light":"#A594F9","--secondary":"#00C6AE","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F8F8F8","--text":"#1A1A1A","--text-muted":"rgba(26,26,26,0.65)","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#5B3DF8","--highlight":"#00C6AE","--button-hover":"color-mix(in srgb, var(--primary) 15%, var(--secondary))"},"varsDark":{"--surface":"#0D0D0D","--surface-alt":"#1A1A1A","--text":"#F2F2F2","--text-muted":"rgba(242,242,242,0.7)","--c-border":"rgba(255,255,255,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 35%, transparent)","--nav-active-color":"#A594F9","--highlight":"#5B3DF8","--button-hover":"color-mix(in srgb, var(--primary) 25%, var(--secondary))"},"logo":"https://app.progem.com.br/progem/api/downloads/empresa/128/arquivo?nome=8e7a72fd-f502-416a-97e7-1a10a8beaeb6_Design_sem_nome_3.png","heroTitle":"Proteção e tranquilidade para sua família","heroSubtitle":"Planos de assistência familiar, com benefícios exclusivos e atendimento humanizado.","heroImage":"https://app.progem.com.br/progem/api/downloads/empresa/128/arquivo?nome=8e7a72fd-f502-416a-97e7-1a10a8beaeb6_Design_sem_nome_3.png","heroSlides":[{"id":"familia","tag":"Assistência familiar & benefícios","title":"Proteção e tranquilidade para sua família","subtitle":"Planos completos para garantir segurança financeira e acolhimento em todos os momentos.","image":"https://patense.awis.com.br/assets/hero-familia-patense.jpg","primary":{"label":"Ver planos agora","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline-light"},"showValuePills":true},{"id":"memorial","tag":"Homenagens & lembranças","title":"Memorial Online da Funerária Patense","subtitle":"Registre homenagens, mensagens de carinho e acompanhe informações das cerimônias em um só lugar.","image":"https://patense.awis.com.br/assets/hero-memorial-patense.jpg","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":false},{"id":"parceiros","tag":"Benefícios exclusivos para sua empresa","title":"Seja um parceiro da Funerária Patense","subtitle":"Ofereça vantagens para associados e fortaleça sua marca com indicações qualificadas.","image":"https://patense.awis.com.br/assets/hero-parceiros-patense.jpg","primary":{"label":"Quero ser parceiro(a)","to":"/parceiros/inscrever","variant":"primary"},"secondary":{"label":"Falar com o time","to":"https://wa.me/5546XXXXXXXX?text=Ol%C3%A1!%20Quero%20ser%20parceiro%20da%20Funer%C3%A1ria%20Patense.","variant":"outline-light"},"showValuePills":false}],"domain":"demo.progem.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'demo');
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