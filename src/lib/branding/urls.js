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
