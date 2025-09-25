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

  const js = `
/* Gerado de config/tenants/${cfg.slug || TENANT}.json */
window.__TENANT__ = ${JSON.stringify(cfg)};

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
      docEl.setAttribute('data-tenant', t.slug || '${TENANT}');
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
`.trim();

  await writeFile(outPath, js, "utf8");
  console.log(`[tenant] Tema inline gerado para TENANT=${TENANT} -> public/theme-inline.js`);
} catch (err) {
  console.error("Erro ao gerar theme-inline.js:", err.message);
  process.exit(1);
}
