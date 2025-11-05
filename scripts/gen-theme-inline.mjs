// scripts/gen-theme-inline.mjs
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Ajuste aqui o tenant DEFAULT para dev/build
const TENANT_SLUG = process.env.TENANT || 'patense';

// Lê o JSON do tenant
const tenantPath = resolve(`config/tenants/${TENANT_SLUG}.json`);
const raw = readFileSync(tenantPath, 'utf8');
const tenant = JSON.parse(raw);

// Gera um arquivo inline que define window.__TENANT__ e aplica as vars o mais cedo possível
const out = `
// Gerado automaticamente a partir de config/tenants/${TENANT_SLUG}.json
window.__TENANT__ = ${JSON.stringify(tenant)};

(function () {
  try {
    var root = document.documentElement;
    var t = window.__TENANT__ || {};
    var vars = (t && t.vars) || null;

    if (vars && typeof vars === 'object') {
      for (var k in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, k)) {
          root.style.setProperty(k, String(vars[k]));
        }
      }
    }
    if (t.slug) root.setAttribute('data-tenant', t.slug);
    root.setAttribute('data-theme-ready', '1');

    // Snapshot leve no localStorage (usado por initTheme.js para comparar versões)
    try {
      localStorage.setItem('tenant_empresa', JSON.stringify(t));
      localStorage.setItem('tenant_vars', JSON.stringify(vars || {}));
    } catch {}
  } catch (e) {}
})();
`;

const dest = resolve('public/tenant-inline.js');
writeFileSync(dest, out, 'utf8');
console.log(`[tenant] Gerado ${dest} a partir de ${tenantPath}`);
