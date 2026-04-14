/* Gerado de D:\whitelabel-local\web-progem-white-label\config\tenants\funerariapopular.json */
window.__TENANT__ = {"slug":"funerariapopular","v":1,"assetsBaseUrl":"https://whitelabel.progem.com.br/arquivos/438/","vars":{"--primary":"#1E3A8A","--primary-dark":"#172554","--primary-light":"#3B5FCC","--secondary":"#6B7280","--on-primary":"#FFFFFF","--surface":"#FFFFFF","--surface-alt":"#F3F6FB","--text":"#0B1220","--text-muted":"#6B7280","--c-border":"rgba(17,24,39,0.10)","--nav-hover-bg":"color-mix(in srgb, var(--primary) 14%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 24%, transparent)","--nav-active-color":"#1E3A8A","--highlight":"#C9A227","--button-hover":"color-mix(in srgb, var(--primary) 32%, #000000)"},"varsDark":{"--surface":"#0A0A0B","--surface-alt":"#121214","--text":"#F9FAFB","--text-muted":"#D1D5DB","--c-border":"rgba(255,255,255,0.18)","--primary":"#4F6DFF","--primary-dark":"#1E3A8A","--primary-light":"#7C93FF","--secondary":"#9CA3AF","--nav-hover-bg":"color-mix(in srgb, var(--primary) 22%, transparent)","--nav-active-bg":"color-mix(in srgb, var(--primary) 36%, transparent)","--nav-active-color":"#FFFFFF","--highlight":"#F2D06B","--button-hover":"color-mix(in srgb, var(--primary) 42%, #000000)"},"brand":{"name":"Funerária Popular","legalName":"Funerária Popular","shortName":"Popular","logo":"logo.png","logoDark":"logo-dark.png","favicon":"icons/favicon.png","faviconSvg":"icons/favicon.svg","appleTouchIcon":"icons/apple-touch-icon.png","pwaIcon192":"icons/icon-192.png","pwaIcon512":"icons/icon-512.png","maskableIcon512":"icons/icon-maskable-512.png","ogImage":"icons/og-image.png","pushIcon":"icons/push-icon.png","pushBadge":"icons/push-badge.png"},"shell":{"title":"Funerária Popular","titleTemplate":"%s • Funerária Popular","themeColor":"#1E3A8A","backgroundColor":"#FFFFFF"},"seo":{"metaTitle":"Funerária Popular","metaDescription":"Proteção e cuidado para sua família. Planos acessíveis com atendimento humanizado e segurança para garantir tranquilidade em todos os momentos."},"pwa":{"name":"Funerária Popular","shortName":"Popular","description":"Área do associado","display":"standalone","orientation":"portrait","startUrl":"/","scope":"/"},"routing":{"primaryDomain":"planovidapopular.com.br"},"logo":"logo.png","heroTitle":"Proteção e cuidado para sua família","heroSubtitle":"Planos acessíveis com atendimento humanizado e segurança para garantir tranquilidade em todos os momentos.","domain":"planovidapopular.com.br","logoDark":"logo-dark.png"};

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
      docEl.setAttribute("data-tenant", t.slug || "funerariapopular");
      docEl.setAttribute("data-theme", choice);
      docEl.setAttribute("data-mode", mode);
      docEl.classList.remove("dark", "theme-dark", "theme-light");
      if (mode === "dark") { docEl.classList.add("dark", "theme-dark"); }
      else { docEl.classList.add("theme-light"); }
      docEl.setAttribute("data-theme-ready", "1");
    }

    var logoL = "https://whitelabel.progem.com.br/arquivos/438/logo.png";
    var logoD = "https://whitelabel.progem.com.br/arquivos/438/logo-dark.png";
    if (style) {
      if (logoL) style.setProperty("--tenant-logo-light", 'url("' + logoL + '")');
      if (logoD) style.setProperty("--tenant-logo-dark", 'url("' + logoD + '")');
      var effLogo = (mode === "dark") ? (logoD || logoL) : (logoL || logoD);
      if (effLogo) style.setProperty("--tenant-logo", 'url("' + effLogo + '")');
    }

    document.title = "Funerária Popular";
    var fav = "https://whitelabel.progem.com.br/arquivos/438/icons/favicon.png";
    if (fav) upsertLink("icon", "tenant-favicon", fav);
    var fsvg = "https://whitelabel.progem.com.br/arquivos/438/icons/favicon.svg";
    if (fsvg) upsertLink("icon", "tenant-favicon-svg", fsvg, "image/svg+xml");
    var ap = "https://whitelabel.progem.com.br/arquivos/438/icons/apple-touch-icon.png";
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