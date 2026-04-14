/**
 * Verifica dist/index.html após vite build: metas OG estáticas presentes.
 * Uso: TENANT=demo npm run build:tenant && TENANT=demo node scripts/index-html-seo-parity.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeTenantLogoFields,
  resolveSeoDefaults,
  resolveShellTitle,
  SEO_DESCRIPTION_FALLBACK,
} from "../src/lib/branding/tenantContract.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distIndex = resolve(root, "dist", "index.html");

const TENANT = (process.env.TENANT || process.env.npm_config_tenant || "demo").toLowerCase();
const cfgPath = resolve(root, "config", "tenants", `${TENANT}.json`);

/** Igual a vite-plugin-tenant-index-seo.mjs */
function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadTenantPayload() {
  const raw = readFileSync(cfgPath, "utf8");
  const cfg = JSON.parse(raw);
  return normalizeTenantLogoFields({ ...cfg, slug: cfg.slug || TENANT });
}

function main() {
  assert(existsSync(distIndex), `Falta ${distIndex} — rode npm run build:tenant com o mesmo TENANT`);
  assert(existsSync(cfgPath), `Falta ${cfgPath}`);

  const tenantPayload = loadTenantPayload();
  const shellTitle = resolveShellTitle(tenantPayload, null);
  const { metaTitle, metaDescription, ogImage } = resolveSeoDefaults(tenantPayload, null);
  const desc = metaDescription || SEO_DESCRIPTION_FALLBACK;

  const html = readFileSync(distIndex, "utf8");

  assert(html.includes("property=\"og:title\""), "dist/index.html sem og:title");
  assert(html.includes("property=\"og:description\""), "dist/index.html sem og:description");
  assert(html.includes("name=\"description\""), "dist/index.html sem meta description");
  if (ogImage) {
    assert(html.includes("property=\"og:image\""), "dist/index.html sem og:image");
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  assert(titleMatch, "sem tag title");
  assert(
    titleMatch[1] === escapeHtmlAttr(shellTitle),
    `title: got=${JSON.stringify(titleMatch[1])} exp=${JSON.stringify(escapeHtmlAttr(shellTitle))}`
  );
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  assert(ogTitleMatch, "og:title sem content");
  assert(
    ogTitleMatch[1] === escapeHtmlAttr(metaTitle),
    `og:title: got=${JSON.stringify(ogTitleMatch[1])} exp=${JSON.stringify(escapeHtmlAttr(metaTitle))}`
  );
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  assert(descMatch, "description sem content");
  assert(
    descMatch[1] === escapeHtmlAttr(desc),
    "meta description não coincide com contrato"
  );

  console.log(`index-html-seo-parity: OK (TENANT=${TENANT})`);
}

main();
