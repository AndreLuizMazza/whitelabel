/**
 * Contrato formal de branding (tenant JSON embutido em window.__TENANT__).
 * Funções puras: sem store, sem localStorage como fonte primária.
 *
 * @see {BRAND_ICON_FIELD_KEYS} — chaves auditáveis de ícones em `brand`.
 * @see {BRAND_LOGO_FIELD_KEYS} — logos (light/dark) para UI e fallbacks.
 */
import { resolveAssetUrl, safeUrl } from "./urls.js";

/**
 * Ícones de marca no contrato (paths relativos a assetsBaseUrl ou absolutos).
 * Uso: shell <head>, manifest PWA, OG; pushIcon/pushBadge para payload FCM (não confundir com shell).
 * @typedef {{
 *   name?: string,
 *   legalName?: string,
 *   shortName?: string,
 *   logo?: string,
 *   logoLight?: string,
 *   logoDark?: string,
 *   favicon?: string,
 *   faviconSvg?: string,
 *   appleTouchIcon?: string,
 *   pwaIcon192?: string,
 *   pwaIcon512?: string,
 *   maskableIcon512?: string,
 *   ogImage?: string,
 *   pushIcon?: string,
 *   pushBadge?: string,
 * }} TenantBrandContract
 */

/** @typedef {{ slug?: string, v?: number, assetsBaseUrl?: string, cdnBaseUrl?: string, logo?: string, domain?: string, brand?: TenantBrandContract, shell?: object, seo?: object, pwa?: object, routing?: object, vars?: object, varsDark?: object }} TenantContract */

/** Chaves de ícone fixas em `brand` (auditoria / tooling). */
export const BRAND_ICON_FIELD_KEYS = [
  "favicon",
  "faviconSvg",
  "appleTouchIcon",
  "pwaIcon192",
  "pwaIcon512",
  "maskableIcon512",
  "ogImage",
  "pushIcon",
  "pushBadge",
];

/** Chaves de logo em `brand` (variantes light/dark). */
export const BRAND_LOGO_FIELD_KEYS = ["logo", "logoLight", "logoDark"];

/** Único fallback textual do shell quando não há slug nem marca (alinhado a index.html). */
export const SHELL_DOCUMENT_TITLE_FALLBACK = "Plataforma";

/**
 * Raster favicon final quando resolveFaviconUrl não encontra candidato no contrato.
 * Asset estático do app (não confundir com logo do tenant em CDN).
 */
export const SHELL_FAVICON_FALLBACK_PATH = "/img/logo.png";

export function formatSlugAsShellTitle(slug) {
  if (!slug) return "";
  const s = String(slug);
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

function brandOf(t) {
  return t?.brand && typeof t.brand === "object" ? t.brand : null;
}

/** Primeiro valor não vazio (após trim); ignora `brand.*` vazio para cair no legado na raiz. */
function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return undefined;
}

/**
 * Alinha `brand.logo` / `brand.logoDark` / `brand.logoLight` com os campos na raiz (`logo`, `logoDark`, `logoLight`).
 * - `brand.*` tem prioridade sobre a raiz quando existir valor não vazio.
 * - Tenants só com raiz (sem `brand`): espelha para `brand` para leitores que só usam `brand`.
 * Mutado in-place para o payload em `window.__TENANT__` (cópia no build).
 * Não chamar após merge de API que substitui `logo` por URL absoluta (ex.: pushEmpresaEverywhere).
 */
export function normalizeTenantLogoFields(t) {
  if (!t || typeof t !== "object") return t;
  const b0 = brandOf(t);
  const logo = firstNonEmpty(b0?.logo, t?.logo);
  const logoDark = firstNonEmpty(b0?.logoDark, t?.logoDark);
  const logoLight = firstNonEmpty(b0?.logoLight, t?.logoLight);

  t.brand = { ...(b0 || {}) };
  if (logo !== undefined) {
    t.brand.logo = logo;
    t.logo = logo;
  }
  if (logoDark !== undefined) {
    t.brand.logoDark = logoDark;
    t.logoDark = logoDark;
  }
  if (logoLight !== undefined) {
    t.brand.logoLight = logoLight;
    t.logoLight = logoLight;
  }
  return t;
}

function shellOf(t) {
  return t?.shell && typeof t.shell === "object" ? t.shell : null;
}

function seoOf(t) {
  return t?.seo && typeof t.seo === "object" ? t.seo : null;
}

function pwaOf(t) {
  return t?.pwa && typeof t.pwa === "object" ? t.pwa : null;
}

function routingOf(t) {
  return t?.routing && typeof t.routing === "object" ? t.routing : null;
}

export function assetsBaseFromContract(t) {
  return String(t?.assetsBaseUrl || t?.cdnBaseUrl || "").trim();
}

function legacyLogo(t) {
  return String(firstNonEmpty(brandOf(t)?.logo, t?.logo) || "").trim();
}

/**
 * Resolve um asset relativo/absoluto a partir do contrato.
 * @param {TenantContract} t
 * @param {string} raw
 * @param {string} [originOverride]
 */
export function resolveContractAssetUrl(t, raw, originOverride) {
  const base = assetsBaseFromContract(t);
  const r = String(raw || "").trim();
  if (!r) return "";
  return safeUrl(resolveAssetUrl(r, base, originOverride));
}

/**
 * Nome exibido da marca (prioridade contrato > runtime opcional).
 * shell.title → brand.name → brand.shortName → empresa.nomeFantasia → empresa.nome → slug → neutro
 */
export function resolveBrandDisplayName(t, empresa) {
  const sh = shellOf(t);
  const b = brandOf(t);
  const fromShell = String(sh?.title || "").trim();
  if (fromShell) return fromShell;
  const n1 = String(b?.name || "").trim();
  if (n1) return n1;
  const n2 = String(b?.shortName || "").trim();
  if (n2) return n2;
  const nf = String(empresa?.nomeFantasia || "").trim();
  if (nf) return nf;
  const n3 = String(empresa?.nome || "").trim();
  if (n3) return n3;
  const slug = formatSlugAsShellTitle(t?.slug);
  if (slug) return slug;
  return SHELL_DOCUMENT_TITLE_FALLBACK;
}

/**
 * Título do shell antes de secção (first paint / aba sem template de rota).
 */
export function resolveShellTitle(t, empresa) {
  return resolveBrandDisplayName(t, empresa);
}

/**
 * Template de título com placeholder %s = nome da secção.
 * Se vazio, o runtime usa "Secção • base".
 */
export function resolveTitleTemplate(t) {
  const sh = shellOf(t);
  const tpl = String(sh?.titleTemplate || "").trim();
  return tpl;
}

/**
 * @param {string} template - ex. "%s • Unilife"
 * @param {string} sectionLabel - ex. "Planos"
 * @param {string} base - nome da marca resolvido
 */
export function formatDocumentTitleFromTemplate(template, sectionLabel, base) {
  const sec = String(sectionLabel || "").trim();
  const b = String(base || "").trim() || SHELL_DOCUMENT_TITLE_FALLBACK;
  const tpl = String(template || "").trim();
  if (!tpl) {
    return sec ? `${sec} • ${b}` : b;
  }
  if (tpl.includes("%s")) {
    return tpl.replace(/%s/g, sec);
  }
  return tpl;
}

/**
 * Favicon raster (png/ico). Ordem: brand.favicon → brand.logo → logo legado
 */
export function resolveFaviconUrl(t, originOverride) {
  const b = brandOf(t);
  const candidates = [b?.favicon, b?.logo, t?.logo];
  for (const c of candidates) {
    const u = resolveContractAssetUrl(t, c, originOverride);
    if (u) return u;
  }
  return "";
}

/**
 * Favicon para <link rel="icon">: contrato (resolveFaviconUrl) e, se vazio, fallback explícito no app.
 */
export function resolveShellFaviconHref(t, originOverride) {
  const primary = resolveFaviconUrl(t, originOverride);
  if (primary) return primary;
  return resolveContractAssetUrl(t, SHELL_FAVICON_FALLBACK_PATH, originOverride);
}

/** SVG opcional (link separado) */
export function resolveFaviconSvgUrl(t, originOverride) {
  const b = brandOf(t);
  return resolveContractAssetUrl(t, b?.faviconSvg, originOverride);
}

export function resolveAppleTouchIconUrl(t, originOverride) {
  const b = brandOf(t);
  const candidates = [
    b?.appleTouchIcon,
    b?.pwaIcon192,
    b?.logo,
    t?.logo,
  ];
  for (const c of candidates) {
    const u = resolveContractAssetUrl(t, c, originOverride);
    if (u) return u;
  }
  return "";
}

export function resolvePwaIcons(t, originOverride) {
  const b = brandOf(t);
  const icon192 = resolveContractAssetUrl(
    t,
    b?.pwaIcon192 || b?.appleTouchIcon || b?.logo || t?.logo,
    originOverride
  );
  const icon512 = resolveContractAssetUrl(t, b?.pwaIcon512, originOverride);
  const maskable = resolveContractAssetUrl(t, b?.maskableIcon512, originOverride);
  return { icon192, icon512, maskable };
}

export function resolvePushIconUrl(t, originOverride) {
  const b = brandOf(t);
  const candidates = [b?.pushIcon, b?.pwaIcon192, b?.logo, t?.logo];
  for (const c of candidates) {
    const u = resolveContractAssetUrl(t, c, originOverride);
    if (u) return u;
  }
  return "";
}

export function resolvePushBadgeUrl(t, originOverride) {
  const b = brandOf(t);
  return resolveContractAssetUrl(t, b?.pushBadge, originOverride);
}

export function resolveOgImageUrl(t, originOverride) {
  const b = brandOf(t);
  const s = seoOf(t);
  const candidates = [b?.ogImage, s?.ogImage];
  for (const c of candidates) {
    const u = resolveContractAssetUrl(t, c, originOverride);
    if (u) return u;
  }
  return "";
}

/**
 * Logo de marca para UI (CSS / img src): modo claro ou escuro.
 * - light: brand.logoLight ?? brand.logo ?? t.logoLight ?? t.logo
 * - dark: brand.logoDark ?? brand.logo ?? t.logoDark ?? t.logo (legado sem `brand.logoDark`)
 */
export function resolveBrandLogoUrl(t, mode, originOverride) {
  const b = brandOf(t);
  const raw =
    mode === "dark"
      ? firstNonEmpty(b?.logoDark, t?.logoDark, b?.logo, t?.logo)
      : firstNonEmpty(b?.logoLight, t?.logoLight, b?.logo, t?.logo);
  return resolveContractAssetUrl(t, raw, originOverride);
}

/**
 * Snapshot auditável: todos os ícones + logos resolvidos (mesmas funções que shell / manifest / push).
 */
export function resolveAllBrandIconUrls(t, originOverride) {
  const pwa = resolvePwaIcons(t, originOverride);
  return {
    favicon: resolveFaviconUrl(t, originOverride),
    faviconSvg: resolveFaviconSvgUrl(t, originOverride),
    appleTouchIcon: resolveAppleTouchIconUrl(t, originOverride),
    pwaIcon192: pwa.icon192,
    pwaIcon512: pwa.icon512,
    maskableIcon512: pwa.maskable,
    ogImage: resolveOgImageUrl(t, originOverride),
    pushIcon: resolvePushIconUrl(t, originOverride),
    pushBadge: resolvePushBadgeUrl(t, originOverride),
    shellFavicon: resolveShellFaviconHref(t, originOverride),
    logoLight: resolveBrandLogoUrl(t, "light", originOverride),
    logoDark: resolveBrandLogoUrl(t, "dark", originOverride),
  };
}

export function resolvePrimaryDomain(t) {
  const r = routingOf(t);
  const d1 = String(r?.primaryDomain || "").trim();
  if (d1) return d1;
  return String(t?.domain || "").trim();
}

/**
 * @returns {{ themeColor: string, backgroundColor: string }}
 */
export function resolveShellThemeColors(t) {
  const sh = shellOf(t);
  const tc = String(sh?.themeColor || "").trim();
  const bg = String(sh?.backgroundColor || "").trim();
  const vars = t?.vars && typeof t.vars === "object" ? t.vars : {};
  return {
    themeColor: tc || String(vars["--primary"] || "").trim() || "",
    backgroundColor:
      bg || String(vars["--surface"] || "").trim() || "",
  };
}

/**
 * SEO base do contrato (sem baseline corporativa fixa).
 */
export function resolveSeoDefaults(t, empresa) {
  const s = seoOf(t);
  const baseName = resolveBrandDisplayName(t, empresa);
  const metaTitle = String(s?.metaTitle || "").trim() || baseName;
  const metaDescription = String(s?.metaDescription || "").trim();
  const ogImage = resolveOgImageUrl(t);
  return { metaTitle, metaDescription, ogImage };
}

/**
 * Manifest PWA (objeto antes de serializar).
 */
export function buildWebManifestPayload(t, originOverride) {
  const p = pwaOf(t);
  const b = brandOf(t);
  const { icon192, icon512, maskable } = resolvePwaIcons(t, originOverride);
  const name =
    String(p?.name || b?.name || resolveBrandDisplayName(t, null) || "").trim() ||
    formatSlugAsShellTitle(t?.slug) ||
    "App";
  const shortName = String(p?.shortName || b?.shortName || name).trim();
  const { themeColor, backgroundColor } = resolveShellThemeColors(t);

  const icons = [];
  if (icon192) {
    icons.push({
      src: icon192,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    });
  }
  if (icon512) {
    icons.push({
      src: icon512,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    });
  }
  if (maskable) {
    icons.push({
      src: maskable,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
  }

  return {
    name,
    short_name: shortName,
    description: String(p?.description || "").trim() || `${shortName}`,
    display: p?.display || "standalone",
    orientation: p?.orientation || "portrait",
    start_url: p?.startUrl || "/",
    scope: p?.scope || "/",
    theme_color: themeColor || "#ffffff",
    background_color: backgroundColor || "#ffffff",
    icons,
  };
}
