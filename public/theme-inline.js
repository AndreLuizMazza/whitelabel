/* Gerado de D:\whitelabel-local\web-progem-white-label\config\tenants\demo.json */
window.__TENANT__ = {"slug":"demo","v":7,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/128/","brand":{"name":"São Bento Assistêncial","legalName":"São Bento ","shortName":"São Bento ","logo":"logodemo.png","logoDark":"logodemo-dark.png","favicon":"icons/favicon.png","faviconSvg":"icons/favicon.svg","appleTouchIcon":"icons/apple-touch-icon.png","pwaIcon192":"icons/icon-192.png","pwaIcon512":"icons/icon-512.png","maskableIcon512":"icons/icon-maskable-512.png","ogImage":"icons/og-image.png","pushIcon":"icons/push-icon.png","pushBadge":"icons/push-badge.png"},"shell":{"title":"São Bento ","titleTemplate":"%s • São Bento","themeColor":"#0B82FF","backgroundColor":"#ffffff"},"seo":{"metaTitle":"São Bento ","metaDescription":"Assistência familiar, assistência pet, telemedicina 24h, memorial online e clube de benefícios para quem quer cuidado e tranquilidade no dia a dia."},"pwa":{"name":"São Bento Assistêncial","shortName":"São Bento ","description":"Área do associado","display":"standalone","orientation":"portrait","startUrl":"/","scope":"/"},"routing":{"primaryDomain":"demo.progem.com.br"},"vars":{"--primary":"#0B82FF","--primary-dark":"#002868","--primary-light":"#73B9FF","--secondary":"#002868","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#F2F7FF","--text":"#0B1220","--text-muted":"rgba(11,18,32,0.66)","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#002868","--highlight":"#0B82FF","--button-hover":"color-mix(in srgb, var(--primary) 22%, #000000)"},"varsDark":{"--surface":"#070B14","--surface-alt":"#0D1630","--text":"#F8FAFF","--text-muted":"rgba(248,250,255,0.72)","--c-border":"rgba(255,255,255,0.14)","--primary":"#0B82FF","--primary-dark":"#002868","--primary-light":"#73B9FF","--secondary":"#73B9FF","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 34%, transparent)","--nav-active-color":"#F8FAFF","--highlight":"#73B9FF","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)"},"heroTitle":"Assistência pet para quem faz parte da sua família","heroSubtitle":"Planos de assistência para cães e gatos, com benefícios, orientação e cuidado nos momentos que mais importam.","heroImage":"pet.png","heroSlides":[{"id":"familia","tag":"Assistência familiar","title":"Proteção e tranquilidade para sua família","subtitle":"Planos completos de assistência familiar, com benefícios exclusivos e atendimento humanizado em todos os momentos.","image":"planos.png","primary":{"label":"Ver planos familiares","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Cobertura completa"},{"icon":"Users","label":"Para toda a família"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"beneficios","tag":"Clube de Benefícios","title":"Vantagens exclusivas para quem é associado","subtitle":"Descontos, parcerias e benefícios especiais em saúde, serviços e comércios conveniados, pensados para facilitar o dia a dia da sua família.","image":"descontos.png","primary":{"label":"Conhecer benefícios","to":"/beneficios","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Parceiros locais"},{"icon":"Wallet","label":"Economia mensal"}]},{"id":"telemedicina","tag":"Telemedicina 24h","title":"Atendimento médico online, onde você estiver","subtitle":"Consultas médicas por telemedicina, com praticidade, agilidade e orientação profissional sem sair de casa.","image":"telemedicina.png","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"Clock","label":"24 horas"},{"icon":"Video","label":"Consulta online"},{"icon":"HeartPulse","label":"Orientação médica"}]},{"id":"pet","tag":"Assistência Pet","title":"Cuidado, apoio e tranquilidade para seu pet","subtitle":"Planos de assistência pet pensados para oferecer suporte, orientação e benefícios no cuidado com animais de estimação.","image":"pet.png","primary":{"label":"Conhecer planos","to":"/planos?categoria=pet","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"PawPrint","label":"Amgos de verdade"},{"icon":"Heart","label":"Cuidado contínuo"},{"icon":"Smile","label":"Mais tranquilidade"}]},{"id":"memorial","tag":"Homenagens & lembranças","title":"Memorial online para homenagens","subtitle":"Um espaço digital para registrar mensagens, homenagens e acompanhar informações das cerimônias com respeito e simplicidade.","image":"memorial.png","primary":{"label":"Acessar Memorial","to":"/memorial","variant":"primary"},"secondary":null,"showValuePills":true,"valuePills":[{"icon":"BookHeart","label":"Homenagens"},{"icon":"MessageCircle","label":"Mensagens"},{"icon":"Globe","label":"Acesso online"}]}],"domain":"demo.progem.com.br","logo":"logodemo.png","logoDark":"logodemo-dark.png"};

(function(){
  try {
    function upsertLink(rel, id, href, type) {
      if (!href) return;
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement("link");
        el.id = id;
        el.rel = rel;
        if (type) el.type = type;
        document.head.appendChild(el);
      }
      el.href = href;
    }
    function upsertMetaName(name, content) {
      if (!content) return;
      var sel = 'meta[name="' + name + '"]';
      var el = document.head.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }
    function upsertManifestLink() {
      var el = document.getElementById("tenant-manifest");
      if (!el) {
        el = document.createElement("link");
        el.id = "tenant-manifest";
        el.rel = "manifest";
        document.head.appendChild(el);
      }
      el.href = "/manifest.webmanifest";
    }

    var docEl = document.documentElement;
    var style = docEl && docEl.style;
    var t = window.__TENANT__ || {};
    var light = t.vars || {};
    var dark  = t.varsDark || null;

    var choice = "system";
    try { choice = localStorage.getItem("ui_theme") || "system"; } catch(_){}
    var prefersDark = false;
    try { prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; } catch(_){}
    var mode = (choice === "system") ? (prefersDark ? "dark" : "light") : choice;

    var chosen = (mode === "dark" && dark) ? Object.assign({}, light, dark) : light;

    if (style && chosen) {
      for (var k in chosen) if (Object.prototype.hasOwnProperty.call(chosen, k)) {
        style.setProperty(k, String(chosen[k]));
      }
    }
    if (docEl){
      docEl.setAttribute("data-tenant", t.slug || "demo");
      docEl.setAttribute("data-theme", choice);
      docEl.setAttribute("data-mode", mode);
      docEl.classList.remove("dark", "theme-dark", "theme-light");
      if (mode === "dark") { docEl.classList.add("dark", "theme-dark"); }
      else { docEl.classList.add("theme-light"); }
      docEl.setAttribute("data-theme-ready", "1");
    }

    var logoL = "https://whitelabel.progem.com.br/arquivos/128/logodemo.png";
    var logoD = "https://whitelabel.progem.com.br/arquivos/128/logodemo-dark.png";
    if (style) {
      if (logoL) style.setProperty("--tenant-logo-light", 'url("' + logoL + '")');
      if (logoD) style.setProperty("--tenant-logo-dark", 'url("' + logoD + '")');
      var effLogo = (mode === "dark") ? (logoD || logoL) : (logoL || logoD);
      if (effLogo) style.setProperty("--tenant-logo", 'url("' + effLogo + '")');
    }

    document.title = "São Bento";
    var fav = "https://whitelabel.progem.com.br/arquivos/128/icons/favicon.png";
    if (fav) upsertLink("icon", "tenant-favicon", fav);
    var fsvg = "https://whitelabel.progem.com.br/arquivos/128/icons/favicon.svg";
    if (fsvg) upsertLink("icon", "tenant-favicon-svg", fsvg, "image/svg+xml");
    var ap = "https://whitelabel.progem.com.br/arquivos/128/icons/apple-touch-icon.png";
    if (ap) upsertLink("apple-touch-icon", "tenant-apple-touch-icon", ap);
    upsertManifestLink();

    var sh = t.shell || {};
    var vars = t.vars || {};
    var themeC = String(sh.themeColor || vars["--primary"] || "").trim();
    var bgC = String(sh.backgroundColor || vars["--surface"] || "").trim();
    if (themeC) upsertMetaName("theme-color", themeC);
    if (bgC) upsertMetaName("msapplication-TileColor", themeC);

    try {
      localStorage.setItem("tenant_contract_cache", JSON.stringify(t));
      localStorage.setItem("tenant_vars", JSON.stringify(chosen || {}));
    } catch(_){}
  } catch (e) { try { console.warn("theme-inline failed", e); } catch(_){} }
})();