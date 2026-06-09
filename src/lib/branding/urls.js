// Shared URL helpers for tenant assets (browser + Node theme-build via originOverride).

function cleanUrlInput(v) {
  let s = String(v || "").trim();
  if (!s) return "";
  s = s.replace(/^"+/, "").replace(/"+$/, "");
  s = s.replace(/^'+/, "").replace(/'+$/, "");
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  return s.trim();
}

function normalizeBase(base) {
  const b = cleanUrlInput(base);
  if (!b) return "";
  return b.endsWith("/") ? b : b + "/";
}

/**
 * @param {string} [originOverride] - e.g. theme-build / SSR
 */
export function resolveAssetUrl(input, base, originOverride) {
  const raw = cleanUrlInput(input);
  if (!raw) return "";

  if (/^(https?:)?\/\//i.test(raw)) return raw;
  if (/^(data|blob):/i.test(raw)) return raw;

  const origin =
    originOverride ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost");

  try {
    if (raw.startsWith("/")) {
      return new URL(raw, origin).toString();
    }

    const b = normalizeBase(base);
    if (b) return new URL(raw, b).toString();

    return new URL("/" + raw.replace(/^\/+/, ""), origin).toString();
  } catch {
    if (raw.startsWith("/")) return raw;
    const b = normalizeBase(base);
    return b ? b + raw.replace(/^\/+/, "") : "/" + raw.replace(/^\/+/, "");
  }
}

export function safeUrl(u) {
  const s0 = cleanUrlInput(u);
  if (!s0) return "";
  return s0.replace(/ /g, "%20");
}

/** Path relativo resolvido via assetsBaseUrl (CDN tenant), não URL absoluta nem path do site. */
export function isRelativeCdnAssetInput(raw, base) {
  const r = cleanUrlInput(raw);
  if (!r) return false;
  if (/^(https?:)?\/\//i.test(r)) return false;
  if (/^(data|blob):/i.test(r)) return false;
  if (r.startsWith("/")) return false;
  return Boolean(normalizeBase(base));
}

/** Cache bust controlado pelo manifest (assetsRevision). */
export function appendAssetsRevisionQuery(url, revision) {
  const rev = Number(revision);
  if (!url || !Number.isFinite(rev) || rev <= 0) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("v", String(rev));
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${encodeURIComponent(String(rev))}`;
  }
}
