/**
 * Prova de coerência: literais SEO em public/theme-inline.js === tenantContract
 * com o mesmo JSON usado no build (empresa === null), alinhado a theme-build.mjs.
 *
 * Uso: TENANT=demo node scripts/seo-inline-parity.mjs
 * (rode `node scripts/theme-build.mjs` antes para o tenant correspondente.)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeTenantLogoFields,
  resolveSeoDefaults,
  SEO_DESCRIPTION_FALLBACK,
} from "../src/lib/branding/tenantContract.js";
import { resolveCanonicalSiteRootForOgUrl } from "./resolve-canonical-site-origin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const TENANT = (process.env.TENANT || process.env.npm_config_tenant || "demo").toLowerCase();
const cfgPath = resolve(root, "config", "tenants", `${TENANT}.json`);
const inlinePath = resolve(root, "public", "theme-inline.js");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadTenantPayload() {
  const raw = readFileSync(cfgPath, "utf8");
  const cfg = JSON.parse(raw);
  return normalizeTenantLogoFields({ ...cfg, slug: cfg.slug || TENANT });
}

function parseVarJson(inline, varName) {
  const lines = inline.split(/\r?\n/);
  const line = lines.find((l) => new RegExp(`^\\s*var ${varName}\\s*=`).test(l));
  assert(line, `variável ${varName} não encontrada em theme-inline.js`);
  const eq = line.indexOf("=");
  assert(eq !== -1, `${varName}: sem =`);
  const rhs = line
    .slice(eq + 1)
    .trim()
    .replace(/;?\s*$/, "");
  return JSON.parse(rhs);
}

function main() {
  assert(existsSync(cfgPath), `Falta ${cfgPath}`);
  assert(existsSync(inlinePath), `Falta ${inlinePath} — rode theme-build para TENANT=${TENANT}`);

  const tenantPayload = loadTenantPayload();
  const { metaTitle, metaDescription, ogImage } = resolveSeoDefaults(tenantPayload, null);
  const expectedDesc = metaDescription || SEO_DESCRIPTION_FALLBACK;
  const expectedOgUrl = resolveCanonicalSiteRootForOgUrl(tenantPayload);

  const inline = readFileSync(inlinePath, "utf8");

  const gotTitle = parseVarJson(inline, "seoMetaTitle");
  const gotDesc = parseVarJson(inline, "seoDesc");
  const gotOgImage = parseVarJson(inline, "seoOgImage");
  const gotOgUrl = parseVarJson(inline, "seoOgUrl");

  assert(gotTitle === metaTitle, `seoMetaTitle: got=${JSON.stringify(gotTitle)} exp=${JSON.stringify(metaTitle)}`);
  assert(gotDesc === expectedDesc, `seoDesc: got=${JSON.stringify(gotDesc)} exp=${JSON.stringify(expectedDesc)}`);
  assert(
    gotOgImage === (ogImage || ""),
    `seoOgImage: got=${JSON.stringify(gotOgImage)} exp=${JSON.stringify(ogImage || "")}`
  );
  assert(
    gotOgUrl === expectedOgUrl,
    `seoOgUrl: got=${JSON.stringify(gotOgUrl)} exp=${JSON.stringify(expectedOgUrl)}`
  );

  console.log(`seo-inline-parity: OK (TENANT=${TENANT})`);
}

main();
