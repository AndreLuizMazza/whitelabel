import fs from "node:fs";
import path from "node:path";
import { normalizeTenantLogoFields } from "../src/lib/branding/tenantContract.js";

export function getBuildTenantSlugFromEnv() {
  return String(process.env.TENANT || process.env.npm_config_tenant || "")
    .trim()
    .toLowerCase();
}

/**
 * Mesma resolução de ficheiro que theme-build.mjs: slug.json ou default.json.
 * @param {string} [cwd]
 * @returns {import("../src/lib/branding/tenantContract.js").TenantContract | null}
 */
export function loadTenantPayloadSyncForBuild(cwd = process.cwd()) {
  const TENANT = getBuildTenantSlugFromEnv();
  if (!TENANT) return null;

  const tenantsDir = path.join(cwd, "config", "tenants");
  const cfgPath = path.join(tenantsDir, `${TENANT}.json`);
  const defaultCfg = path.join(tenantsDir, "default.json");

  let usedPath = cfgPath;
  if (!fs.existsSync(cfgPath)) {
    if (!fs.existsSync(defaultCfg)) return null;
    usedPath = defaultCfg;
  }

  const raw = fs.readFileSync(usedPath, "utf8");
  const cfg = JSON.parse(raw);
  if (!cfg?.vars || typeof cfg.vars !== "object") return null;

  return normalizeTenantLogoFields({ ...cfg, slug: cfg.slug || TENANT });
}
