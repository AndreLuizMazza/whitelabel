/* Gerado de C:\Users\PROGEM XAVIER\Desktop\web-progem-white-label\config\tenants\descobrimento.json */
window.__TENANT__ = {"slug":"descobrimento","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/302/","brand":{"name":"Pax do Descobrimento","legalName":"Pax do Descobrimento","shortName":"Pax do Descobrimento","logo":"logo.png","logoDark":"logo-dark.png","favicon":"icons/favicon.png","faviconSvg":"icons/favicon.svg","appleTouchIcon":"icons/apple-touch-icon.png","pwaIcon192":"icons/icon-192.png","pwaIcon512":"icons/icon-512.png","maskableIcon512":"icons/icon-maskable-512.png","ogImage":"icons/og-image.png","pushIcon":"icons/push-icon.png","pushBadge":"icons/push-badge.png"},"shell":{"title":"Pax do Descobrimento","titleTemplate":"%s • Pax do Descobrimento","themeColor":"#F47920","backgroundColor":"#ffffff"},"seo":{"metaTitle":"Pax do Descobrimento","metaDescription":"Assistência funeral e familiar com acolhimento, respeito e segurança para você e sua família nos momentos mais importantes."},"pwa":{"name":"Pax do Descobrimento","shortName":"Pax do Descobrimento","description":"Área do associado","display":"standalone","orientation":"portrait","startUrl":"/","scope":"/"},"routing":{"primaryDomain":"paxdodescobrimento.com.br"},"vars":{"--primary":"#F47920","--primary-dark":"#C75E12","--primary-light":"#FF9D2E","--secondary":"#4B5563","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#FFF7F2","--text":"#1F110B","--text-muted":"rgba(31,17,11,0.66)","--c-border":"rgba(0,0,0,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 20%, transparent)","--nav-active-color":"#C75E12","--highlight":"#F47920","--button-hover":"color-mix(in srgb, var(--primary) 22%, #000000)"},"varsDark":{"--surface":"#0C0907","--surface-alt":"#1A110D","--text":"#FDF9F7","--text-muted":"rgba(253,249,247,0.72)","--c-border":"rgba(255,255,255,0.14)","--primary":"#F47920","--primary-dark":"#C75E12","--primary-light":"#FF9D2E","--secondary":"#9CA3AF","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 34%, transparent)","--nav-active-color":"#FDF9F7","--highlight":"#FF9D2E","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)"},"heroTitle":"Cuidado e proteção para quem você ama","heroSubtitle":"Planos de assistência funeral com atendimento humanizado, oferecendo respeito, acolhimento e suporte completo em todos os momentos.","heroImage":"planos.jpg","heroSlides":[{"id":"familia","tag":"Assistência familiar","title":"Tranquilidade para sua família","subtitle":"Planos de assistência funeral com suporte 24h e benefícios exclusivos, garantindo amparo nos momentos mais difíceis.","image":"planos.jpg","primary":{"label":"Conhecer planos","to":"/planos","variant":"primary"},"secondary":{"label":"Área do associado","to":"/login","variant":"outline"},"showValuePills":true,"valuePills":[{"icon":"ShieldCheck","label":"Suporte total"},{"icon":"Users","label":"Familiar"},{"icon":"Clock","label":"Atendimento 24h"}]},{"id":"beneficios","tag":"Clube de Vantagens","title":"Mais benefícios para os associados","subtitle":"Acesso a uma rede de convênios com descontos em saúde, farmácias e serviços para cuidar do seu bem-estar hoje.","image":"descontos.jpg","primary":{"label":"Ver benefícios","to":"/beneficios","variant":"primary"},"showValuePills":true,"valuePills":[{"icon":"Percent","label":"Descontos reais"},{"icon":"Store","label":"Parceiros"},{"icon":"HeartPulse","label":"Saúde"}]}],"content":{"about":{"enabled":true,"photo":"sobre/sobre-nos.jpg","title":"Nossa História","description":"A Pax do Descobrimento nasceu com o compromisso de oferecer um atendimento digno e humanizado às famílias da nossa região.\n\nAcreditamos que prestar assistência é, acima de tudo, acolher e respeitar a história de cada pessoa, oferecendo suporte profissional com sensibilidade.","mission":"Proporcionar assistência funeral com excelência, ética e humanismo, garantindo tranquilidade às famílias.","vision":"Ser a principal referência em acolhimento e assistência familiar na região, inovando continuamente em nossos serviços.","values":[{"title":"Respeito","text":"Honrar a memória e o momento de cada família."},{"title":"Acolhimento","text":"Atendimento humanizado em todas as etapas."},"Ética e Transparência"],"differentials":[{"title":"Atendimento 24h","text":"Equipe preparada para suporte imediato a qualquer hora."},{"title":"Rede de Benefícios","text":"Vantagens em vida para todos os nossos associados."}],"closing":"Estamos ao seu lado quando você mais precisa. Conte com a Pax do Descobrimento para cuidar de tudo com respeito e dedicação.","galleryTitle":"Nossa Estrutura","gallery":[{"image":"sobre/sobre-nos2.jpg","caption":"Ambiente preparado para acolher sua família."}],"seo":{"metaTitle":"Sobre nós — Pax do Descobrimento","metaDescription":"Conheça a missão e os valores da Pax do Descobrimento. Excelência em assistência funeral e familiar.","ogImage":"sobre/og-image.png"}}},"domain":"paxdodescobrimento.com.br","logo":"logo.png","logoDark":"logo-dark.png"};

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
    function upsertMetaProperty(property, content) {
      if (!content) return;
      var sel = 'meta[property="' + property + '"]';
      var el = document.head.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
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
      docEl.setAttribute("data-tenant", t.slug || "descobrimento");
      docEl.setAttribute("data-theme", choice);
      docEl.setAttribute("data-mode", mode);
      docEl.classList.remove("dark", "theme-dark", "theme-light");
      if (mode === "dark") { docEl.classList.add("dark", "theme-dark"); }
      else { docEl.classList.add("theme-light"); }
      docEl.setAttribute("data-theme-ready", "1");
    }

    var logoL = "https://whitelabel.progem.com.br/arquivos/302/logo.png";
    var logoD = "https://whitelabel.progem.com.br/arquivos/302/logo-dark.png";
    if (style) {
      if (logoL) style.setProperty("--tenant-logo-light", 'url("' + logoL + '")');
      if (logoD) style.setProperty("--tenant-logo-dark", 'url("' + logoD + '")');
      var effLogo = (mode === "dark") ? (logoD || logoL) : (logoL || logoD);
      if (effLogo) style.setProperty("--tenant-logo", 'url("' + effLogo + '")');
    }

    document.title = "Pax do Descobrimento";

    var seoMetaTitle = "Pax do Descobrimento";
    var seoDesc = "Assistência funeral e familiar com acolhimento, respeito e segurança para você e sua família nos momentos mais importantes.";
    var seoOgImage = "https://whitelabel.progem.com.br/arquivos/302/icons/og-image.png";
    var seoOgUrl = "https://paxdodescobrimento.com.br/";
    var seoTwCard = seoOgImage ? "summary_large_image" : "summary";
    upsertMetaName("description", seoDesc);
    upsertMetaProperty("og:title", seoMetaTitle);
    upsertMetaProperty("og:description", seoDesc);
    if (seoOgImage) upsertMetaProperty("og:image", seoOgImage);
    upsertMetaProperty("og:type", "website");
    if (seoOgUrl) upsertMetaProperty("og:url", seoOgUrl);
    upsertMetaName("twitter:card", seoTwCard);
    upsertMetaName("twitter:title", seoMetaTitle);
    upsertMetaName("twitter:description", seoDesc);
    if (seoOgImage) upsertMetaName("twitter:image", seoOgImage);

    var fav = "https://whitelabel.progem.com.br/arquivos/302/icons/favicon.png";
    if (fav) upsertLink("icon", "tenant-favicon", fav);
    var fsvg = "https://whitelabel.progem.com.br/arquivos/302/icons/favicon.svg";
    if (fsvg) upsertLink("icon", "tenant-favicon-svg", fsvg, "image/svg+xml");
    var ap = "https://whitelabel.progem.com.br/arquivos/302/icons/apple-touch-icon.png";
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