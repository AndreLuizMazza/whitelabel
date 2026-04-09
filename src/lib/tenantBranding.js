// src/lib/tenantBranding.js
import useTenant from "@/store/tenant";
import { resolveAssetUrl, safeUrl } from "@/lib/branding/urls.js";
import {
  LS_TENANT_CONTRACT_KEY,
  LS_TENANT_EMPRESA_KEY,
} from "@/lib/tenantStorageKeys.js";
import {
  formatSlugAsShellTitle,
  resolveBrandLogoUrl,
  resolveShellFaviconHref,
  resolveFaviconSvgUrl,
  resolveAppleTouchIconUrl,
} from "@/lib/branding/tenantContract.js";

export { resolveAssetUrl, safeUrl } from "@/lib/branding/urls.js";
export {
  formatSlugAsShellTitle,
  resolveBrandDisplayName,
  resolveShellTitle,
  resolveTitleTemplate,
  formatDocumentTitleFromTemplate,
  SHELL_DOCUMENT_TITLE_FALLBACK,
  SHELL_FAVICON_FALLBACK_PATH,
  resolveFaviconUrl,
  resolveShellFaviconHref,
  resolveFaviconSvgUrl,
  resolveAppleTouchIconUrl,
  resolvePwaIcons,
  resolvePushIconUrl,
  resolvePushBadgeUrl,
  resolveOgImageUrl,
  resolvePrimaryDomain,
  resolveShellThemeColors,
  resolveSeoDefaults,
  buildWebManifestPayload,
  assetsBaseFromContract,
  resolveContractAssetUrl,
  resolveBrandLogoUrl,
  resolveAllBrandIconUrls,
  BRAND_ICON_FIELD_KEYS,
  BRAND_LOGO_FIELD_KEYS,
} from "@/lib/branding/tenantContract.js";

function currentThemeModeFromDom() {
  try {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Atualiza só `--tenant-logo` conforme modo atual (chamar após mudança light/dark).
 */
export function syncTenantLogoCssVarFromContract(t) {
  if (typeof document === "undefined" || !t) return;
  const u = resolveBrandLogoUrl(t, currentThemeModeFromDom());
  if (u) {
    document.documentElement.style.setProperty("--tenant-logo", `url("${u}")`);
  }
}

/**
 * Define --tenant-logo-light / --tenant-logo-dark / --tenant-logo a partir do contrato.
 */
export function applyTenantBrandLogoCssVars(t) {
  if (typeof document === "undefined" || !t) return;
  const root = document.documentElement;
  const light = resolveBrandLogoUrl(t, "light");
  const dark = resolveBrandLogoUrl(t, "dark");
  if (light) root.style.setProperty("--tenant-logo-light", `url("${light}")`);
  else root.style.removeProperty("--tenant-logo-light");
  if (dark) root.style.setProperty("--tenant-logo-dark", `url("${dark}")`);
  else root.style.removeProperty("--tenant-logo-dark");
  syncTenantLogoCssVarFromContract(t);
}

// Logo vinda de CSS var (fallback final)
function cssVarUrlOrNull(name = "--tenant-logo") {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      ?.trim();
    const m = v.match(/^url\((['"]?)(.*?)\1\)$/i);
    return m?.[2] || null;
  } catch {
    return null;
  }
}

/**
 * Favicon: contrato JSON (__TENANT__) primeiro; depois store (urlLogo / tema.logo).
 */
export function resolveTenantFaviconUrl() {
  try {
    const inline = typeof window !== "undefined" && window.__TENANT__;
    if (inline) {
      const u = resolveShellFaviconHref(inline);
      if (u) return u;
    }
  } catch {}

  try {
    const raw = localStorage.getItem(LS_TENANT_CONTRACT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const u = resolveShellFaviconHref(parsed);
        if (u) return u;
      }
    }
  } catch {}

  try {
    const st = useTenant.getState?.();
    const emp = st?.empresa || {};
    const tema = emp?.tema || {};
    const assetsBase =
      tema.assetsBaseUrl ||
      tema.cdnBaseUrl ||
      emp.assetsBaseUrl ||
      emp.cdnBaseUrl ||
      "";
    const raw = emp.urlLogo || tema.logo;
    if (raw) return safeUrl(resolveAssetUrl(raw, assetsBase));
  } catch {}

  return "";
}

/**
 * Aplica <link rel="icon"> tenant-aware (reconciliação runtime / bootstrap).
 */
export function applyTenantFaviconHref(href) {
  const u = safeUrl(href);
  if (typeof document === "undefined" || !u) return;

  let link = document.getElementById("tenant-favicon");
  if (!link) {
    link = document.createElement("link");
    link.id = "tenant-favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = u;
}

export function applyTenantFaviconSvgHref(href) {
  const u = safeUrl(href);
  if (typeof document === "undefined" || !u) return;
  let link = document.getElementById("tenant-favicon-svg");
  if (!link) {
    link = document.createElement("link");
    link.id = "tenant-favicon-svg";
    link.rel = "icon";
    link.type = "image/svg+xml";
    document.head.appendChild(link);
  }
  link.href = u;
}

export function applyAppleTouchIconHref(href) {
  const u = safeUrl(href);
  if (typeof document === "undefined" || !u) return;
  let link = document.getElementById("tenant-apple-touch-icon");
  if (!link) {
    link = document.createElement("link");
    link.id = "tenant-apple-touch-icon";
    link.rel = "apple-touch-icon";
    document.head.appendChild(link);
  }
  link.href = u;
}

/**
 * Único ponto que aplica <link rel="icon"> / svg / apple-touch a partir do contrato.
 * URLs: exclusivamente resolveShellFaviconHref, resolveFaviconSvgUrl, resolveAppleTouchIconUrl
 * (tenantContract). theme-build.mjs pré-calcula os mesmos valores para first paint.
 */
export function applyTenantShellIconsFromContract() {
  try {
    const t = typeof window !== "undefined" && window.__TENANT__;
    if (!t) return;

    const fav = resolveShellFaviconHref(t);
    if (fav) applyTenantFaviconHref(fav);

    const svg = resolveFaviconSvgUrl(t);
    if (svg) applyTenantFaviconSvgHref(svg);

    const apple = resolveAppleTouchIconUrl(t);
    if (apple) applyAppleTouchIconHref(apple);
  } catch {}
}

/**
 * Resolve a URL da logo do tenant, com vários fallbacks:
 * - store do tenant (empresa.logo / logoUrl / logo_path / urlLogo / tema.logo)
 * - window.__TENANT__
 * - localStorage tenant_contract_cache (contrato)
 * - localStorage tenant_empresa (API)
 * - CSS var --tenant-logo
 * - /img/logo.png
 */
export function resolveTenantLogoUrl() {
  try {
    const inline = typeof window !== "undefined" && window.__TENANT__;
    if (inline) {
      const u = resolveBrandLogoUrl(inline, currentThemeModeFromDom());
      if (u) return u;
    }
  } catch {}

  try {
    const rawC = localStorage.getItem(LS_TENANT_CONTRACT_KEY);
    if (rawC) {
      const parsed = JSON.parse(rawC);
      if (parsed && typeof parsed === "object") {
        const u = resolveBrandLogoUrl(parsed, currentThemeModeFromDom());
        if (u) return u;
      }
    }
  } catch {}

  try {
    const st = useTenant.getState?.();
    const emp = st?.empresa || {};
    const tema = emp?.tema || {};

    const assetsBase =
      tema.assetsBaseUrl || tema.cdnBaseUrl || emp.assetsBaseUrl || emp.cdnBaseUrl || "";

    const rawFromStore =
      emp.urlLogo ||
      emp.logoUrl ||
      emp.logo ||
      emp.logo_path ||
      tema.logo ||
      tema.logoUrl ||
      tema.urlLogo;

    const resolved = safeUrl(resolveAssetUrl(rawFromStore, assetsBase));
    if (resolved) return resolved;

    const fromStoreLegacy = emp?.logo || emp?.logoUrl || emp?.logo_path;
    if (fromStoreLegacy) return fromStoreLegacy;
  } catch {}

  try {
    const raw = localStorage.getItem(LS_TENANT_EMPRESA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base =
        parsed?.tema?.assetsBaseUrl ||
        parsed?.tema?.cdnBaseUrl ||
        parsed?.assetsBaseUrl ||
        parsed?.cdnBaseUrl ||
        "";

      const rawLogo =
        parsed?.urlLogo ||
        parsed?.logoUrl ||
        parsed?.logo ||
        parsed?.tema?.logo ||
        parsed?.tema?.logoUrl;

      const resolved = safeUrl(resolveAssetUrl(rawLogo, base));
      if (resolved) return resolved;

      if (parsed?.logo) return parsed.logo;
    }
  } catch {}

  const cssVar = cssVarUrlOrNull("--tenant-logo");
  if (cssVar) return cssVar;

  return "/img/logo.png";
}

export function getTenantInitials(empresa) {
  const nome =
    empresa?.nomeFantasia || empresa?.nome || empresa?.razaoSocial || "T";
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "T";
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${(first || "T").toUpperCase()}${(last || "").toUpperCase()}`;
}
