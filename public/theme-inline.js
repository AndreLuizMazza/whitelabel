/* Gerado de D:\whitelabel-local\web-progem-white-label\config\tenants\semeador.json */
window.__TENANT__ = {"slug":"semeador","v":2,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/437/","vars":{"--primary":"#15803D","--primary-dark":"#166534","--primary-light":"#22C55E","--secondary":"#6B7280","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F3F7F4","--text":"#111827","--text-muted":"#6B7280","--c-border":"rgba(17,24,39,0.08)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 10%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-color":"#15803D","--highlight":"#15803D","--button-hover":"color-mix(in srgb, var(--primary) 25%, #000000)"},"varsDark":{"--surface":"#0B0B0C","--surface-alt":"#141416","--text":"#F9FAFB","--text-muted":"#D1D5DB","--c-border":"rgba(255,255,255,0.14)","--primary":"#22C55E","--primary-dark":"#15803D","--primary-light":"#4ADE80","--secondary":"#9CA3AF","--nav-hover-bg":"color-mix(in srgb, var(--primary) 16%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 28%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#22C55E","--button-hover":"color-mix(in srgb, var(--primary) 35%, #000000)"},"brand":{"name":"Semeador Plano Familiar","legalName":"Semeador Plano Familiar","shortName":"Semeador","logo":"logo.png","logoDark":"logo-dark.png","favicon":"icons/favicon.png","faviconSvg":"icons/favicon.svg","appleTouchIcon":"icons/apple-touch-icon.png","pwaIcon192":"icons/icon-192.png","pwaIcon512":"icons/icon-512.png","maskableIcon512":"icons/icon-maskable-512.png","ogImage":"icons/og-image.png","pushIcon":"icons/push-icon.png","pushBadge":"icons/push-badge.png"},"shell":{"title":"Semeador","titleTemplate":"%s • Semeador","themeColor":"#15803D","backgroundColor":"#FFFFFF"},"seo":{"metaTitle":"Semeador Plano Familiar","metaDescription":"Cuidado e proteção para sua família. Planos familiares acessíveis com atendimento humanizado e suporte completo em todos os momentos."},"pwa":{"name":"Semeador Plano Familiar","shortName":"Semeador","description":"Área do associado","display":"standalone","orientation":"portrait","startUrl":"/","scope":"/"},"routing":{"primaryDomain":"planosemeador.com.br"},"logo":"logo.png","heroTitle":"Cuidado e proteção para sua família","heroSubtitle":"Planos familiares acessíveis com atendimento humanizado e suporte completo em todos os momentos.","domain":"planosemeador.com.br","logoDark":"logo-dark.png"};

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
      docEl.setAttribute("data-tenant", t.slug || "semeador");
      docEl.setAttribute("data-theme", choice);
      docEl.setAttribute("data-mode", mode);
      docEl.classList.remove("dark", "theme-dark", "theme-light");
      if (mode === "dark") { docEl.classList.add("dark", "theme-dark"); }
      else { docEl.classList.add("theme-light"); }
      docEl.setAttribute("data-theme-ready", "1");
    }

    var logoL = "https://whitelabel.progem.com.br/arquivos/437/logo.png";
    var logoD = "https://whitelabel.progem.com.br/arquivos/437/logo-dark.png";
    if (style) {
      if (logoL) style.setProperty("--tenant-logo-light", 'url("' + logoL + '")');
      if (logoD) style.setProperty("--tenant-logo-dark", 'url("' + logoD + '")');
      var effLogo = (mode === "dark") ? (logoD || logoL) : (logoL || logoD);
      if (effLogo) style.setProperty("--tenant-logo", 'url("' + effLogo + '")');
    }

    document.title = "Semeador";

    var seoMetaTitle = "Semeador Plano Familiar";
    var seoDesc = "Cuidado e proteção para sua família. Planos familiares acessíveis com atendimento humanizado e suporte completo em todos os momentos.";
    var seoOgImage = "https://whitelabel.progem.com.br/arquivos/437/icons/og-image.png";
    var seoOgUrl = "https://planosemeador.com.br/";
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

    var fav = "https://whitelabel.progem.com.br/arquivos/437/icons/favicon.png";
    if (fav) upsertLink("icon", "tenant-favicon", fav);
    var fsvg = "https://whitelabel.progem.com.br/arquivos/437/icons/favicon.svg";
    if (fsvg) upsertLink("icon", "tenant-favicon-svg", fsvg, "image/svg+xml");
    var ap = "https://whitelabel.progem.com.br/arquivos/437/icons/apple-touch-icon.png";
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