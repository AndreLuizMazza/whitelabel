// scripts/theme-build.mjs
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const fromEnv  = process.env.TENANT || process.env.npm_config_tenant;
const fromArg  = (process.argv.find(a => a.startsWith("--tenant=")) || "").split("=")[1];
const TENANT   = fromEnv || fromArg;

if (!TENANT) {
  console.error('Faltou informar TENANT. Use: TENANT="slug" npm run dev  OU  npm run dev --tenant=slug');
  process.exit(1);
}

const cfgPath = resolve(`config/tenants/${TENANT}.json`);
const outPath = resolve("public/theme-inline.js");

try {
  const raw = await readFile(cfgPath, "utf8");
  const cfg = JSON.parse(raw);
  const vars = cfg.vars || {};
  const logo = cfg.logo || null;
  const slug = cfg.slug || TENANT;

  // IMPORTANTÍSSIMO:
  // - expomos window.__TENANT__
  // - aplicamos vars no :root ANTES do React
  // - salvamos snapshot compatível com initTheme (tenant_empresa / tenant_vars)
  const js = `
/* Gerado automaticamente a partir de config/tenants/${slug}.json */
window.__TENANT__ = ${JSON.stringify(cfg)};

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

    if (${JSON.stringify(Boolean(logo))}) {
      style && style.setProperty('--tenant-logo', 'url("${logo}")');
    }

    if (docEl) {
      docEl.setAttribute('data-tenant', ${JSON.stringify(slug)});
      docEl.setAttribute('data-theme-ready', '1');
    }

    // cache compatível com initTheme anti-cache (v e slug contam!)
    try {
      localStorage.setItem('tenant_empresa', JSON.stringify(t));
      localStorage.setItem('tenant_vars', JSON.stringify(vars || {}));
    } catch (_) {}
  } catch (e) { try { console.warn('theme-inline failed', e); } catch(_){} }
})();
`.trim();

  await writeFile(outPath, js, "utf8");
  console.log(`[tenant] Tema inline gerado para TENANT=${TENANT} -> public/theme-inline.js`);
} catch (err) {
  console.error("Erro ao gerar theme-inline.js:", err.message);
  process.exit(1);
}
