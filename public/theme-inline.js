/* Gerado de D:\whitelabel-local\web-progem-white-label\config\tenants\demo.json */
window.__TENANT__ = {"slug":"demo","v":6,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/128/","vars":{"--primary":"#0B82FF","--primary-dark":"#002868","--primary-light":"#73B9FF","--secondary":"#002868","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F2F7FF","--text":"#0B1220","--text-muted":"rgba(11,18,32,0.66)","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#002868","--highlight":"#0B82FF","--button-hover":"color-mix(in srgb, var(--primary) 22%, #000000)"},"varsDark":{"--surface":"#070B14","--surface-alt":"#0D1630","--text":"#F8FAFF","--text-muted":"rgba(248,250,255,0.72)","--c-border":"rgba(255,255,255,0.14)","--primary":"#0B82FF","--primary-dark":"#002868","--primary-light":"#73B9FF","--secondary":"#73B9FF","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 34%, transparent)","--nav-active-color":"#F8FAFF","--highlight":"#73B9FF","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)"},"logo":"logodemo.png","heroTitle":"Assistência pet para quem faz parte da sua família","heroSubtitle":"Planos de assistência para cães e gatos, com benefícios, orientação e cuidado nos momentos que mais importam.","heroImage":"pet.png","heroSlides":[{"id":"familia","tag":"Assistência familiar","title":"Proteção e tranquilidade para sua família","subtitle":"Planos completos de assistência familiar, com benefícios exclusivos e atendimento humanizado em todos os momentos.","image":"planos.png","primary":{"label":"Ver planos familiares","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Cobertura completa"},{"icon":"Users","label":"Para toda a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"beneficios","tag":"Clube de Benefícios","title":"Vantagens exclusivas para quem é associado","subtitle":"Descontos, parcerias e benefícios especiais em saúde, serviços e comércios conveniados, pensados para facilitar o dia a dia da sua família.","image":"descontos.png","primary":{"label":"Conhecer benefícios","to":"/beneficios","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Parceiros locais"},{"icon":"Wallet","label":"Economia mensal"}]},{"id":"telemedicina","tag":"Telemedicina 24h","title":"Atendimento médico online, onde você estiver","subtitle":"Consultas médicas por telemedicina, com praticidade, agilidade e orientação profissional sem sair de casa.","image":"telemedicina.png","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"Clock","label":"24 horas"},{"icon":"Video","label":"Consulta online"},{"icon":"HeartPulse","label":"Orientação médica"}]},{"id":"pet","tag":"Assistência Pet","title":"Cuidado, apoio e tranquilidade para seu pet","subtitle":"Planos de assistência pet pensados para oferecer suporte, orientação e benefícios no cuidado com animais de estimação.","image":"pet.png","primary":{"label":"Conhecer planos","to":"/planos?categoria=pet","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"PawPrint","label":"Amgos de verdade"},{"icon":"Heart","label":"Cuidado contínuo"},{"icon":"Smile","label":"Mais tranquilidade"}]},{"id":"memorial","tag":"Homenagens & lembranças","title":"Memorial online para homenagens","subtitle":"Um espaço digital para registrar mensagens, homenagens e acompanhar informações das cerimônias com respeito e simplicidade.","image":"memorial.png","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]}],"domain":"demo.progem.com.br"};

(function(){
  try {
    function cleanUrlInput(v) {
      var s = String(v || "").trim();
      if (!s) return "";
      s = s.replace(/^"+/, "").replace(/"+$/, "");
      s = s.replace(/^'+/, "").replace(/'+$/, "");
      s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
      return s.trim();
    }
    function normalizeBase(base) {
      var b = cleanUrlInput(base);
      if (!b) return "";
      return b.charAt(b.length - 1) === "/" ? b : b + "/";
    }
    function resolveAssetUrl(input, base) {
      var raw = cleanUrlInput(input);
      if (!raw) return "";
      if (/^(https?:)?\/\//i.test(raw)) return raw;
      if (/^(data|blob):/i.test(raw)) return raw;
      try {
        if (raw.indexOf("/") === 0) {
          var origin = window.location && window.location.origin ? window.location.origin : "http://localhost";
          return new URL(raw, origin).toString();
        }
        var b = normalizeBase(base);
        if (b) return new URL(raw.replace(/^\/+/, ""), b).toString();
        origin = window.location && window.location.origin ? window.location.origin : "http://localhost";
        return new URL("/" + raw.replace(/^\/+/, ""), origin).toString();
      } catch (e) {
        if (raw.indexOf("/") === 0) return raw;
        b = normalizeBase(base);
        return b ? b + raw.replace(/^\/+/, "") : "/" + raw.replace(/^\/+/, "");
      }
    }
    function safeUrl(u) {
      var s = cleanUrlInput(u);
      if (!s) return "";
      return s.replace(/ /g, "%20");
    }
    function shellBrandName(x) {
      if (!x || typeof x !== "object") return "";
      var s = String(x.nomeFantasia || x.nome || x.brandName || x.shellTitle || x.siteTitle || x.razaoSocial || "").trim();
      if (s) return s;
      var slug = x.slug;
      if (slug) {
        var tt = String(slug);
        return tt ? tt.charAt(0).toUpperCase() + tt.slice(1).toLowerCase() : "";
      }
      return "";
    }
    function shellFaviconHref(merged, theme) {
      var base = normalizeBase(theme.assetsBaseUrl || theme.cdnBaseUrl || merged.assetsBaseUrl || merged.cdnBaseUrl || "");
      var raw = merged.faviconUrl || (merged.tema && merged.tema.favicon) || theme.favicon || merged.urlLogo || merged.logoUrl || theme.logo || merged.logo;
      return safeUrl(resolveAssetUrl(raw, base));
    }
    function upsertFavicon(href) {
      if (!href) return;
      var el = document.getElementById("tenant-favicon");
      if (!el) {
        el = document.createElement("link");
        el.id = "tenant-favicon";
        el.rel = "icon";
        document.head.appendChild(el);
      }
      el.href = href;
    }

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

    // cache: preserva identidade da API (mesmo slug) — sem nova fonte de verdade
    var toSave = t;
    try {
      var prevStr = localStorage.getItem('tenant_empresa');
      var prev = null;
      try { prev = prevStr ? JSON.parse(prevStr) : null; } catch(_){}
      if (prev && typeof prev === 'object' && String(prev.slug || '') === String(t.slug || '')) {
        var idKeys = ['id','nomeFantasia','nome','razaoSocial','cnpj','urlLogo'];
        toSave = Object.assign({}, t);
        for (var ii = 0; ii < idKeys.length; ii++) {
          var ik = idKeys[ii];
          var pv = prev[ik];
          var cv = toSave[ik];
          if ((cv == null || cv === '') && pv != null && pv !== '') toSave[ik] = pv;
        }
      }
      localStorage.setItem('tenant_empresa', JSON.stringify(toSave));
      localStorage.setItem('tenant_vars', JSON.stringify(chosen || {}));
    } catch(_){}

    var brand = shellBrandName(toSave);
    if (brand) document.title = brand;

    var fav = shellFaviconHref(toSave, t);
    if (fav) upsertFavicon(fav);

  } catch (e) { try { console.warn('theme-inline failed', e); } catch(_){} }
})();