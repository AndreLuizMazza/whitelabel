/* Gerado automaticamente a partir de config/tenants/patense.json */
window.__TENANT__ = {"slug":"patense","v":5,"vars":{"--primary":"#004C3F","--primary-dark":"#003B31","--on-primary":"#ffffff","--surface":"#ffffff","--surface-alt":"#f6f7fb","--text":"#0b1220","--text-muted":"#5f6b7a","--c-border":"rgba(0,0,0,0.08)"},"logo":"https://app.progem.com.br/progem/api/downloads/empresa/274/arquivo?nome=ea3aa504-e9fd-4f19-9021-eebd659ca841_Marca_Dagua_Logo_Funeraria_Patense.png","domain":"patense.com.br"};

(function(){
  try {
    var docEl = document.documentElement;
    var style = docEl && docEl.style ? docEl.style : null;
    var t = window.__TENANT__ || {};
    var vars = t.vars || {};

    if (style && vars) {
      for (var k in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, k)) {
          style.setProperty(k, String(vars[k]));
        }
      }
    }

    if (true) {
      style && style.setProperty('--tenant-logo', 'url("https://app.progem.com.br/progem/api/downloads/empresa/274/arquivo?nome=ea3aa504-e9fd-4f19-9021-eebd659ca841_Marca_Dagua_Logo_Funeraria_Patense.png")');
    }

    if (docEl) {
      docEl.setAttribute('data-tenant', "patense");
      docEl.setAttribute('data-theme-ready', '1');
    }

    // cache compatível com initTheme anti-cache (v e slug contam!)
    try {
      localStorage.setItem('tenant_empresa', JSON.stringify(t));
      localStorage.setItem('tenant_vars', JSON.stringify(vars || {}));
    } catch (_) {}
  } catch (e) { try { console.warn('theme-inline failed', e); } catch(_){} }
})();