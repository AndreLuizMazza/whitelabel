// scripts/theme-build.mjs
import { readFile, writeFile, access, mkdir, readdir } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/* ----------------------- Resolve TENANT ----------------------- */
const fromEnv = process.env.TENANT || process.env.npm_config_tenant;
const fromArg = (process.argv.find(a => a.startsWith("--tenant=")) || "").split("=")[1];
const rawTenant = (fromEnv || fromArg || "").trim();

if (!rawTenant) {
  console.error('Faltou informar TENANT. Use: TENANT="slug" npm run build  OU  npm run build --tenant=slug');
  process.exit(1);
}

// normaliza para evitar case mismatch com o nome do arquivo
const TENANT = rawTenant.toLowerCase();

/* ----------------------- Caminhos ----------------------------- */
const tenantsDir = resolve(process.cwd(), "config", "tenants");
const cfgPath    = resolve(tenantsDir, `${TENANT}.json`);
const defaultCfg = resolve(tenantsDir, "default.json");
const outPath    = resolve(process.cwd(), "public", "theme-inline.js");

/* ----------------------- Helpers ------------------------------ */
async function exists(path) {
  try { await access(path, FS.F_OK); return true; } catch { return false; }
}

async function listTenants() {
  try {
    const files = await readdir(tenantsDir);
    return files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(/\.json$/,""));
  } catch {
    return [];
  }
}

/* ----------------------- Build -------------------------------- */
(async () => {
  try {
    const hasTenant = await exists(cfgPath);
    const hasDefault = await exists(defaultCfg);

    let usedPath = cfgPath;
    if (!hasTenant) {
      if (hasDefault) {
        const available = (await listTenants()).join(", ");
        console.warn(`[theme] Tenant "${TENANT}" não encontrado em ${cfgPath}. Usando "default.json". Tenants disponíveis: ${available || "(nenhum)"}`);
        usedPath = defaultCfg;
      } else {
        const available = (await listTenants()).join(", ");
        console.error(`[theme] Arquivo do tenant "${TENANT}" não existe e não há "default.json".
Verifique se o nome do arquivo corresponde exatamente ao slug (case sensitive no Git).
Pasta: ${tenantsDir}
Disponíveis: ${available || "(nenhum)"}
Esperado: ${TENANT}.json`);
        process.exit(1);
      }
    } else {
      console.log(`[theme] Usando tenant: ${TENANT}`);
    }

    const raw = await readFile(usedPath, "utf8");
    const cfg = JSON.parse(raw);

    if (!cfg || typeof cfg !== "object") {
      throw new Error(`JSON inválido em ${usedPath}`);
    }
    if (!cfg.vars || typeof cfg.vars !== "object") {
      throw new Error(`Arquivo "${usedPath}" inválido: campo "vars" ausente ou não-objeto.`);
    }

    // Gera JS inline (mantive sua lógica)
    const js = `
/* Gerado de ${usedPath.replace(process.cwd()+"/","")} */
window.__TENANT__ = ${JSON.stringify({ ...cfg, slug: (cfg.slug || TENANT) })};

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

    // garante que a pasta public existe
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, js, "utf8");

    console.log(`[tenant] Tema inline gerado para TENANT=${TENANT} -> public/theme-inline.js`);
  } catch (err) {
    console.error("Erro ao gerar theme-inline.js:", err?.message || err);
    process.exit(1);
  }
})();
