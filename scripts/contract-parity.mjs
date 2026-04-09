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
assert(
  resolveBrandDisplayName(legacy, null).toLowerCase().includes("demo"),
  `legacy brand name from slug: ${resolveBrandDisplayName(legacy, null)}`
);

const rich = load("unilife.json");
assert(resolveBrandDisplayName(rich, null) === "Unilife", "unilife brand name");
const favRich = resolveFaviconUrl(rich);
assert(favRich.includes("logounilife"), `unilife favicon: ${favRich}`);
const colors = resolveShellThemeColors(rich);
assert(colors.themeColor === "#0477BF", `themeColor ${colors.themeColor}`);

console.log("contract-parity: OK");
