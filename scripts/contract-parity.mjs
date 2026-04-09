/**
 * Paridade mínima: resolvedor (tenantContract) vs expectativas em fixtures JSON.
 * Rode: node scripts/contract-parity.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveFaviconUrl,
  resolveBrandDisplayName,
  resolveShellThemeColors,
  resolveBrandLogoUrl,
  resolveAllBrandIconUrls,
  BRAND_ICON_FIELD_KEYS,
} from "../src/lib/branding/tenantContract.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function load(name) {
  const p = resolve(root, "config", "tenants", name);
  return JSON.parse(readFileSync(p, "utf8"));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const legacy = load("demo.json");
const favLegacy = resolveFaviconUrl(legacy);
assert(
  favLegacy.includes("logodemo") || favLegacy.includes("128"),
  `legacy favicon: ${favLegacy}`
);
const legacyName = resolveBrandDisplayName(legacy, null);
assert(
  legacyName.length > 0 && legacy.slug === "demo",
  `legacy brand name / slug: ${legacyName} (slug=${legacy.slug})`
);

const rich = load("unilife.json");
assert(resolveBrandDisplayName(rich, null) === "Unilife", "unilife brand name");
const favRich = resolveFaviconUrl(rich);
assert(favRich.includes("logounilife"), `unilife favicon: ${favRich}`);
const colors = resolveShellThemeColors(rich);
assert(colors.themeColor === "#0477BF", `themeColor ${colors.themeColor}`);

const demoLogoLight = resolveBrandLogoUrl(legacy, "light");
const demoLogoDark = resolveBrandLogoUrl(legacy, "dark");
assert(
  demoLogoLight.length > 0 && demoLogoDark.length > 0,
  "demo logo light/dark URLs"
);
const snap = resolveAllBrandIconUrls(legacy);
assert(snap.favicon && snap.shellFavicon, "snapshot favicon");
assert(BRAND_ICON_FIELD_KEYS.length === 9, "BRAND_ICON_FIELD_KEYS");

console.log("contract-parity: OK");
