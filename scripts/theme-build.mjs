// scripts/theme-build.mjs
import { readFile, writeFile, access, mkdir, readdir } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWebManifestPayload } from "../src/lib/branding/tenantContract.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ----------------------- Resolve TENANT ----------------------- */
const fromEnv = process.env.TENANT || process.env.npm_config_tenant;
const fromArg = (process.argv.find((a) => a.startsWith("--tenant=")) || "").split("=")[1];
const rawTenant = (fromEnv || fromArg || "").trim();

if (!rawTenant) {
  console.error('Faltou informar TENANT. Use: TENANT="slug" npm run build  OU  npm run build --tenant=slug');
  process.exit(1);
}

const TENANT = rawTenant.toLowerCase();

const tenantsDir = resolve(process.cwd(), "config", "tenants");
const cfgPath = resolve(tenantsDir, `${TENANT}.json`);
const defaultCfg = resolve(tenantsDir, "default.json");
const outPath = resolve(process.cwd(), "public", "theme-inline.js");
const manifestPath = resolve(process.cwd(), "public", "manifest.webmanifest");

async function exists(path) {
  try {
    await access(path, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listTenants() {
  try {
    const files = await readdir(tenantsDir);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

(async () => {
  try {
    const hasTenant = await exists(cfgPath);
    const hasDefault = await exists(defaultCfg);

    let usedPath = cfgPath;
    if (!hasTenant) {
      if (hasDefault) {
        const available = (await listTenants()).join(", ");
        console.warn(
          `[theme] Tenant "${TENANT}" não encontrado em ${cfgPath}. Usando "default.json". Tenants disponíveis: ${available || "(nenhum)"}`
        );
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

    const tenantPayload = { ...cfg, slug: cfg.slug || TENANT };

    // IIFE espelha a precedência em src/lib/branding/tenantContract.js (shell sem API).
    const js = `
/* Gerado de ${usedPath.replace(process.cwd() + "/", "")} */
window.__TENANT__ = ${JSON.stringify(tenantPayload)};

(function(){
  try {
    function shellTitleFromSlug(slug) {
      if (!slug) return "";
      var s = String(slug);
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }
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
    function resolveAssetUrlInline(raw, base) {
      var r = cleanUrlInput(raw);
      if (!r) return "";
      if (/^(https?:)?\\/\\//i.test(r)) return r;
      if (/^(data|blob):/i.test(r)) return r;
      try {
        if (r.indexOf("/") === 0) {
          var origin = window.location && window.location.origin ? window.location.origin : "http://localhost";
          return new URL(r, origin).toString();
        }
        var b = normalizeBase(base);
        if (b) return new URL(r.replace(/^\\/+/, ""), b).toString();
        origin = window.location && window.location.origin ? window.location.origin : "http://localhost";
        return new URL("/" + r.replace(/^\\/+/, ""), origin).toString();
      } catch (e) {
        if (r.indexOf("/") === 0) return r;
        b = normalizeBase(base);
        return b ? b + r.replace(/^\\/+/, "") : "/" + r.replace(/^\\/+/, "");
      }
    }
    function safeUrlInline(u) {
      var s0 = cleanUrlInput(u);
      if (!s0) return "";
      return s0.replace(/ /g, "%20");
    }
    function shellDocumentTitle(t) {
      var sh = t.shell || {};
      var b = t.brand || {};
      var a = String(sh.title || "").trim();
      if (a) return a;
      var n1 = String(b.name || "").trim();
      if (n1) return n1;
      var n2 = String(b.shortName || "").trim();
      if (n2) return n2;
      var slug = shellTitleFromSlug(t.slug);
      if (slug) return slug;
      return "Plataforma";
    }
    function shellFaviconHref(t) {
      var base = (t.assetsBaseUrl || t.cdnBaseUrl || "").trim();
      var b = t.brand || {};
      var candidates = [b.favicon, b.logo, t.logo];
      for (var i = 0; i < candidates.length; i++) {
        var r = String(candidates[i] || "").trim();
        if (!r) continue;
        var u = safeUrlInline(resolveAssetUrlInline(r, base));
        if (u) return u;
      }
      return "";
    }
    function shellFaviconSvgHref(t) {
      var b = t.brand || {};
      var raw = String(b.faviconSvg || "").trim();
      if (!raw) return "";
      var base = (t.assetsBaseUrl || t.cdnBaseUrl || "").trim();
      return safeUrlInline(resolveAssetUrlInline(raw, base));
    }
    function shellAppleTouchHref(t) {
      var base = (t.assetsBaseUrl || t.cdnBaseUrl || "").trim();
      var b = t.brand || {};
      var candidates = [b.appleTouchIcon, b.pwaIcon192, b.logo, t.logo];
      for (var j = 0; j < candidates.length; j++) {
        var r2 = String(candidates[j] || "").trim();
        if (!r2) continue;
        var u2 = safeUrlInline(resolveAssetUrlInline(r2, base));
        if (u2) return u2;
      }
      return "";
    }
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
      docEl.setAttribute("data-tenant", t.slug || "${TENANT}");
      docEl.setAttribute("data-theme", mode);
      docEl.setAttribute("data-theme-ready", "1");
    }

    document.title = shellDocumentTitle(t);
    var fav = shellFaviconHref(t);
    if (fav) upsertLink("icon", "tenant-favicon", fav);
    var fsvg = shellFaviconSvgHref(t);
    if (fsvg) upsertLink("icon", "tenant-favicon-svg", fsvg, "image/svg+xml");
    var ap = shellAppleTouchHref(t);
    if (ap) upsertLink("apple-touch-icon", "tenant-apple-touch-icon", ap);
    upsertManifestLink();

    var sh = t.shell || {};
    var vars = t.vars || {};
    var themeC = String(sh.themeColor || vars["--primary"] || "").trim();
    var bgC = String(sh.backgroundColor || vars["--surface"] || "").trim();
    if (themeC) upsertMetaName("theme-color", themeC);
    if (bgC) upsertMetaName("msapplication-TileColor", themeC);

    try {
      localStorage.setItem("tenant_empresa", JSON.stringify(t));
      localStorage.setItem("tenant_vars", JSON.stringify(chosen || {}));
    } catch(_){}
  } catch (e) { try { console.warn("theme-inline failed", e); } catch(_){} }
})();
`.trim();

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, js, "utf8");

    const manifest = buildWebManifestPayload(tenantPayload);
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    console.log(`[tenant] Tema inline gerado para TENANT=${TENANT} -> public/theme-inline.js`);
    console.log(`[tenant] manifest -> public/manifest.webmanifest`);
  } catch (err) {
    console.error("Erro ao gerar theme-inline.js:", err?.message || err);
    process.exit(1);
  }
})();
