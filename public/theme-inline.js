/* Gerado de D:\whitelabel-clean\config\tenants\alianca.json */
window.__TENANT__ = {"slug":"alianca","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/281/","vars":{"--primary":"#0B4DB8","--primary-dark":"#083A8A","--primary-light":"#3C74D9","--secondary":"#F2C94C","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F5F7FB","--text":"#0B1220","--text-muted":"#556274","--c-border":"rgba(0,0,0,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#083A8A","--highlight":"#F2C94C","--button-hover":"color-mix(in srgb, var(--primary) 28%, #000000)","--sidebar-icon":"#083A8A","--sidebar-icon-muted":"#64748B","--sidebar-icon-active":"#F2C94C","--sidebar-text":"#0B1220","--sidebar-text-muted":"#556274","--headline":"#083A8A"},"varsDark":{"--surface":"#0B1220","--surface-alt":"#111A2B","--text":"#F9FAFB","--text-muted":"#A5B4CF","--primary":"#3C74D9","--primary-dark":"#0B4DB8","--primary-light":"#6A96EE","--secondary":"#F2C94C","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 32%, transparent)","--nav-active-color":"#F9FAFB","--highlight":"#F2C94C","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)","--sidebar-icon":"#F9FAFB","--sidebar-icon-muted":"#7C8CAB","--sidebar-icon-active":"#F2C94C","--sidebar-text":"#E5E7EB","--sidebar-text-muted":"#A5B4CF","--headline":"#FFFFFF","--c-border":"rgba(255,255,255,0.22)"},"logo":"alianca.png","heroTitle":"Benefícios que fazem a diferença no dia a dia","heroSubtitle":"Desde 2012, oferecendo economia, proteção e vantagens reais para você e sua família.","heroImage":"https://seu-dominio-de-arquivos.com/alianca/hero-alianca.jpg","heroSlides":[{"id":"familia","tag":"Assistência familiar & benefícios","title":"Proteção e tranquilidade para sua família","subtitle":"Planos completos para garantir segurança financeira e acolhimento em todos os momentos.","image":"https://patense.awis.com.br/assets/hero-familia-patense.jpg","primary":{"label":"Ver planos agora","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Cobertura completa"},{"icon":"Users","label":"Para toda a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"memorial","tag":"Homenagens & lembranças","title":"Memorial online","subtitle":"Registre homenagens, mensagens de carinho e acompanhe informações das cerimônias em um só lugar.","image":"https://patense.awis.com.br/assets/hero-memorial-patense.jpg","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]},{"id":"parceiros","tag":"Benefícios exclusivos para sua empresa","title":"Seja nosso parceiro","subtitle":"Ofereça vantagens para associados e fortaleça sua marca com indicações qualificadas.","image":"https://patense.awis.com.br/assets/hero-parceiros-patense.jpg","primary":{"label":"Quero ser parceiro(a)","to":"/beneficios","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Parceiros locais"},{"icon":"Wallet","label":"Economia mensal"}]}],"domain":"funerariaalianca.com.br"};

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
      docEl.setAttribute('data-tenant', t.slug || 'alianca');
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