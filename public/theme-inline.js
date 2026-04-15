/* Gerado de D:\whitelabel-local\web-progem-white-label\config\tenants\reieterno.json */
window.__TENANT__ = {"slug":"reieterno","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/395/","vars":{"--primary":"#1447B0","--primary-dark":"#0F2F78","--primary-light":"#3B82F6","--secondary":"#5B6474","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F4F8FF","--text":"#0F172A","--text-muted":"#667085","--c-border":"rgba(20,71,176,0.12)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 12%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-color":"#1447B0","--highlight":"#D9A91A","--button-hover":"color-mix(in srgb, var(--primary) 30%, #000000)"},"varsDark":{"--surface":"#090B10","--surface-alt":"#0F1522","--text":"#F8FAFC","--text-muted":"#CBD5E1","--c-border":"rgba(255,255,255,0.16)","--primary":"#3F86FF","--primary-dark":"#1447B0","--primary-light":"#74A9FF","--secondary":"#98A2B3","--nav-hover-bg":"color-mix(in srgb, var(--primary) 18%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 30%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#E3BC4A","--button-hover":"color-mix(in srgb, var(--primary) 40%, #000000)"},"brand":{"name":"Rei Eterno Assistencial","legalName":"Rei Eterno Assistencial","shortName":"Rei Eterno","logo":"logo.png","logoDark":"logo-dark.png","favicon":"icons/favicon.png","faviconSvg":"icons/favicon.svg","appleTouchIcon":"icons/apple-touch-icon.png","pwaIcon192":"icons/icon-192.png","pwaIcon512":"icons/icon-512.png","maskableIcon512":"icons/icon-maskable-512.png","ogImage":"icons/og-image.png","pushIcon":"icons/push-icon.png","pushBadge":"icons/push-badge.png"},"shell":{"title":"Rei Eterno","titleTemplate":"%s • Rei Eterno","themeColor":"#1447B0","backgroundColor":"#FFFFFF"},"seo":{"metaTitle":"Rei Eterno Assistencial","metaDescription":"Cuidado e proteção com excelência. Planos assistenciais com atendimento humanizado, oferecendo segurança e tranquilidade para você e sua família."},"pwa":{"name":"Rei Eterno Assistencial","shortName":"Rei Eterno","description":"Área do associado","display":"standalone","orientation":"portrait","startUrl":"/","scope":"/"},"routing":{"primaryDomain":"associado.funerariareieterno.com.br"},"logo":"logo.png","heroTitle":"Cuidado e proteção com excelência","heroSubtitle":"Planos assistenciais com atendimento humanizado, oferecendo segurança e tranquilidade para você e sua família.","domain":"associado.funerariareieterno.com.br","logoDark":"logo-dark.png"};

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
      docEl.setAttribute("data-tenant", t.slug || "reieterno");
      docEl.setAttribute("data-theme", choice);
      docEl.setAttribute("data-mode", mode);
      docEl.classList.remove("dark", "theme-dark", "theme-light");
      if (mode === "dark") { docEl.classList.add("dark", "theme-dark"); }
      else { docEl.classList.add("theme-light"); }
      docEl.setAttribute("data-theme-ready", "1");
    }

    var logoL = "https://whitelabel.progem.com.br/arquivos/395/logo.png";
    var logoD = "https://whitelabel.progem.com.br/arquivos/395/logo-dark.png";
    if (style) {
      if (logoL) style.setProperty("--tenant-logo-light", 'url("' + logoL + '")');
      if (logoD) style.setProperty("--tenant-logo-dark", 'url("' + logoD + '")');
      var effLogo = (mode === "dark") ? (logoD || logoL) : (logoL || logoD);
      if (effLogo) style.setProperty("--tenant-logo", 'url("' + effLogo + '")');
    }

    document.title = "Rei Eterno";

    var seoMetaTitle = "Rei Eterno Assistencial";
    var seoDesc = "Cuidado e proteção com excelência. Planos assistenciais com atendimento humanizado, oferecendo segurança e tranquilidade para você e sua família.";
    var seoOgImage = "https://whitelabel.progem.com.br/arquivos/395/icons/og-image.png";
    var seoOgUrl = "https://associado.funerariareieterno.com.br/";
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

    var fav = "https://whitelabel.progem.com.br/arquivos/395/icons/favicon.png";
    if (fav) upsertLink("icon", "tenant-favicon", fav);
    var fsvg = "https://whitelabel.progem.com.br/arquivos/395/icons/favicon.svg";
    if (fsvg) upsertLink("icon", "tenant-favicon-svg", fsvg, "image/svg+xml");
    var ap = "https://whitelabel.progem.com.br/arquivos/395/icons/apple-touch-icon.png";
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