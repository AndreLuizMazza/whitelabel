import { resolvePrimaryDomain } from "../src/lib/branding/tenantContract.js";

/** Origem canónica para og:url: env SITE_ORIGIN ou https:// + routing.primaryDomain|domain. */
export function resolveCanonicalSiteRootForOgUrl(t) {
  const fromEnv = String(process.env.SITE_ORIGIN || "").trim();
  if (fromEnv) {
    return `${fromEnv.replace(/\/+$/, "")}/`;
  }
  const raw = String(resolvePrimaryDomain(t) || "").trim();
  if (!raw) return "";
  const host = raw.replace(/^https?:\/\//i, "").split("/")[0].trim();
  if (!host) return "";
  return `https://${host.replace(/\/+$/, "")}/`;
}
