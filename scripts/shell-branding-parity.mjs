/**
 * Prova de coerência: valores embutidos em public/theme-inline.js === tenantContract
 * aplicado ao mesmo JSON de tenant usado no build.
 *
 * Uso: TENANT=demo node scripts/shell-branding-parity.mjs
 * (rode `node scripts/theme-build.mjs` antes para o tenant correspondente.)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveShellTitle,
  resolveShellFaviconHref,
  resolveFaviconSvgUrl,
  resolveAppleTouchIconUrl,
  normalizeTenantLogoFields,
} from "../src/lib/branding/tenantContract.js";

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

function parseJsStringLiteral(line, kind) {
  const re =
    kind === "title"
      ? /document\.title\s*=\s*(.+);/
      : kind === "fav"
        ? /var fav = (.+);/
        : kind === "svg"
          ? /var fsvg = (.+);/
          : kind === "ap"
            ? /var ap = (.+);/
            : null;
  assert(re, `kind inválido: ${kind}`);
  const m = line.match(re);
  assert(m, `linha não encontrada: ${kind}`);
  return JSON.parse(m[1].trim());
}

function main() {
  assert(existsSync(cfgPath), `Falta ${cfgPath}`);
  assert(existsSync(inlinePath), `Falta ${inlinePath} — rode theme-build para TENANT=${TENANT}`);

  const tenantPayload = loadTenantPayload();

  const expected = {
    title: resolveShellTitle(tenantPayload, null),
    fav: resolveShellFaviconHref(tenantPayload),
    svg: resolveFaviconSvgUrl(tenantPayload),
    apple: resolveAppleTouchIconUrl(tenantPayload),
  };

  const inline = readFileSync(inlinePath, "utf8");

  const lines = inline.split(/\r?\n/);
  const titleLine = lines.find((l) => /document\.title\s*=/.test(l));
  const favLine = lines.find((l) => /var fav = /.test(l));
  const svgLine = lines.find((l) => /var fsvg = /.test(l));
  const apLine = lines.find((l) => /var ap = /.test(l));

  assert(titleLine, "document.title não encontrado em theme-inline.js");
  assert(favLine && svgLine && apLine, "variáveis fav/fsvg/ap não encontradas");

  const got = {
    title: parseJsStringLiteral(titleLine, "title"),
    fav: parseJsStringLiteral(favLine, "fav"),
    svg: parseJsStringLiteral(svgLine, "svg"),
    apple: parseJsStringLiteral(apLine, "ap"),
  };

  assert(got.title === expected.title, `title: got=${JSON.stringify(got.title)} exp=${JSON.stringify(expected.title)}`);
  assert(got.fav === expected.fav, `fav: got=${got.fav} exp=${expected.fav}`);
  assert(got.svg === expected.svg, `svg: got=${got.svg} exp=${expected.svg}`);
  assert(got.apple === expected.apple, `apple: got=${got.apple} exp=${expected.apple}`);

  console.log(`shell-branding-parity: OK (TENANT=${TENANT})`);
}

main();
