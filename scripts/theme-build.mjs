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
    function cleanUrlInput(v) {
      var s = String(v || "").trim();
      if (!s) return "";
      s = s.replace(/^"+/, "").replace(/"+$/, "");
      s = s.replace(/^'+/, "").replace(/'+$/, "");
      s = s.replace(/[\\u200B-\\u200D\\uFEFF]/g, "");
      return s.trim();
    }
    function normalizeBase(base) {
      var b = cleanUrlInput(base);
      if (!b) return "";
      return b.charAt(b.length - 1) === "/" ? b : b + "/";
    }
    function resolveAssetUrl(input, base) {
      var raw = cleanUrlInput(input);
      if (!raw) return "";
      if (/^(https?:)?\\/\\//i.test(raw)) return raw;
      if (/^(data|blob):/i.test(raw)) return raw;
      try {
        if (raw.indexOf("/") === 0) {
          var origin = window.location && window.location.origin ? window.location.origin : "http://localhost";
          return new URL(raw, origin).toString();
        }
        var b = normalizeBase(base);
        if (b) return new URL(raw.replace(/^\\/+/, ""), b).toString();
        origin = window.location && window.location.origin ? window.location.origin : "http://localhost";
        return new URL("/" + raw.replace(/^\\/+/, ""), origin).toString();
      } catch (e) {
        if (raw.indexOf("/") === 0) return raw;
        b = normalizeBase(base);
        return b ? b + raw.replace(/^\\/+/, "") : "/" + raw.replace(/^\\/+/, "");
      }
    }
    function safeUrl(u) {
      var s = cleanUrlInput(u);
      if (!s) return "";
      return s.replace(/ /g, "%20");
    }
    function shellBrandName(x) {
      if (!x || typeof x !== "object") return "";
      var s = String(x.nomeFantasia || x.nome || x.brandName || x.shellTitle || x.siteTitle || x.razaoSocial || "").trim();
      if (s) return s;
      var slug = x.slug;
      if (slug) {
        var tt = String(slug);
        return tt ? tt.charAt(0).toUpperCase() + tt.slice(1).toLowerCase() : "";
      }
      return "";
    }
    function shellFaviconHref(merged, theme) {
      var base = normalizeBase(theme.assetsBaseUrl || theme.cdnBaseUrl || merged.assetsBaseUrl || merged.cdnBaseUrl || "");
      var raw = merged.faviconUrl || (merged.tema && merged.tema.favicon) || theme.favicon || merged.urlLogo || merged.logoUrl || theme.logo || merged.logo;
      return safeUrl(resolveAssetUrl(raw, base));
    }
    function upsertFavicon(href) {
      if (!href) return;
      var el = document.getElementById("tenant-favicon");
      if (!el) {
        el = document.createElement("link");
        el.id = "tenant-favicon";
        el.rel = "icon";
        document.head.appendChild(el);
      }
      el.href = href;
    }

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

    // cache: preserva identidade da API (mesmo slug) — sem nova fonte de verdade
    var toSave = t;
    try {
      var prevStr = localStorage.getItem('tenant_empresa');
      var prev = null;
      try { prev = prevStr ? JSON.parse(prevStr) : null; } catch(_){}
      if (prev && typeof prev === 'object' && String(prev.slug || '') === String(t.slug || '')) {
        var idKeys = ['id','nomeFantasia','nome','razaoSocial','cnpj','urlLogo'];
        toSave = Object.assign({}, t);
        for (var ii = 0; ii < idKeys.length; ii++) {
          var ik = idKeys[ii];
          var pv = prev[ik];
          var cv = toSave[ik];
          if ((cv == null || cv === '') && pv != null && pv !== '') toSave[ik] = pv;
        }
      }
      localStorage.setItem('tenant_empresa', JSON.stringify(toSave));
      localStorage.setItem('tenant_vars', JSON.stringify(chosen || {}));
    } catch(_){}

    var brand = shellBrandName(toSave);
    if (brand) document.title = brand;

    var fav = shellFaviconHref(toSave, t);
    if (fav) upsertFavicon(fav);

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
