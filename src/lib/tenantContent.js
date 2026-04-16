/**
 * Conteúdo editorial do tenant (`content.*` no JSON embutido em window.__TENANT__).
 * Separado de tenantContract.js (branding).
 */
import {
  resolveContractAssetUrl,
  resolveOgImageUrl,
  SEO_DESCRIPTION_FALLBACK,
} from "@/lib/branding/tenantContract.js";

/** @returns {import("@/lib/branding/tenantContract.js").TenantContract | null} */
export function getTenantContract() {
  try {
    const t = typeof window !== "undefined" && window.__TENANT__;
    return t && typeof t === "object" ? t : null;
  } catch {
    return null;
  }
}

/** @param {unknown} t */
export function getAboutRaw(t) {
  const c = t && typeof t === "object" ? t.content : null;
  const about = c && typeof c === "object" ? c.about : null;
  return about && typeof about === "object" ? about : null;
}

/**
 * Caminhos relativos da página Sobre resolvem sob a pasta `sobre/` no bucket do tenant.
 */
export function normalizePathUnderSobre(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  const noLeading = s.replace(/^\/+/, "");
  if (noLeading.startsWith("sobre/")) return noLeading;
  return `sobre/${noLeading}`;
}

/** @param {unknown} t @param {string} raw */
export function resolveAboutMediaUrl(t, raw) {
  const path = normalizePathUnderSobre(raw);
  if (!path) return "";
  return resolveContractAssetUrl(t, path);
}

/** @typedef {{ title?: string, text: string }} AboutListItem */

/** @typedef {{ src: string, caption?: string }} AboutGalleryItem */

/** @param {unknown} raw @param {unknown} t */
export function normalizeAboutGallery(raw, t) {
  if (!Array.isArray(raw) || !t) return [];
  /** @type {AboutGalleryItem[]} */
  const out = [];
  for (const entry of raw) {
    let imageRaw = "";
    let caption = "";
    if (typeof entry === "string") {
      imageRaw = entry;
    } else if (entry && typeof entry === "object") {
      imageRaw = String(entry.image || "").trim();
      caption = String(entry.caption || "").trim();
    }
    if (!imageRaw) continue;
    const src = resolveAboutMediaUrl(t, imageRaw);
    if (!src) continue;
    out.push(caption ? { src, caption } : { src });
  }
  return out;
}

/** @param {unknown} raw @returns {AboutListItem[]} */
export function normalizeAboutListItems(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const text = entry.trim();
      if (text) out.push({ text });
      continue;
    }
    if (entry && typeof entry === "object") {
      const title = String(entry.title || "").trim() || undefined;
      const text = String(entry.text || "").trim();
      if (text) out.push(title ? { title, text } : { text });
    }
  }
  return out;
}

/** @param {Record<string, unknown> | null} about */
export function hasAboutDisplayableContent(about) {
  if (!about) return false;
  const title = String(about.title || "").trim();
  if (!title) return false;
  const desc = String(about.description || "").trim();
  const mission = String(about.mission || "").trim();
  const vision = String(about.vision || "").trim();
  const closing = String(about.closing || "").trim();
  const values = normalizeAboutListItems(about.values);
  const differentials = normalizeAboutListItems(about.differentials);
  return !!(
    desc ||
    mission ||
    vision ||
    closing ||
    values.length ||
    differentials.length
  );
}

/**
 * Opt-in estrito: `enabled === true` e conteúdo mínimo.
 * @param {unknown} t
 */
export function isAboutPageVisible(t) {
  const about = getAboutRaw(t);
  if (!about) return false;
  if (about.enabled !== true) return false;
  return hasAboutDisplayableContent(about);
}

/** @param {string} text @param {number} max */
export function excerptPlainText(text, max = 155) {
  const s = String(text || "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${head.trim()}…`;
}

/**
 * @typedef {{
 *   title: string,
 *   description: string,
 *   mission: string,
 *   vision: string,
 *   closing: string,
 *   values: AboutListItem[],
 *   differentials: AboutListItem[],
 *   photoUrl: string,
 *   gallery: AboutGalleryItem[],
 *   galleryTitle: string | null,
 *   pageTitleForSeo: string,
 *   metaDescription: string,
 *   ogImageUrl: string,
 * }} AboutPageDTO
 */

/**
 * @param {unknown} t
 * @returns {AboutPageDTO | null}
 */
export function normalizeAboutPage(t) {
  if (!isAboutPageVisible(t)) return null;
  const about = getAboutRaw(t);
  if (!about) return null;

  const seo =
    about.seo && typeof about.seo === "object" ? about.seo : null;
  const metaTitle = String(seo?.metaTitle || "").trim();
  const metaDescriptionRaw = String(seo?.metaDescription || "").trim();
  const ogImageRaw = String(seo?.ogImage || "").trim();

  const title = String(about.title || "").trim();
  const description = String(about.description || "").trim();
  const mission = String(about.mission || "").trim();
  const vision = String(about.vision || "").trim();
  const closing = String(about.closing || "").trim();
  const photoRaw = String(about.photo || "").trim();

  const photoUrl = photoRaw ? resolveAboutMediaUrl(t, photoRaw) : "";
  const ogFromSeo = ogImageRaw ? resolveAboutMediaUrl(t, ogImageRaw) : "";
  const ogImageUrl = ogFromSeo || photoUrl || resolveOgImageUrl(t) || "";

  const pageTitleForSeo = metaTitle || title;
  const metaDescription =
    metaDescriptionRaw ||
    excerptPlainText(description) ||
    SEO_DESCRIPTION_FALLBACK;

  const gallery = normalizeAboutGallery(about.gallery, t);
  const galleryTitleRaw = String(about.galleryTitle || "").trim();

  return {
    title,
    description,
    mission,
    vision,
    closing,
    values: normalizeAboutListItems(about.values),
    differentials: normalizeAboutListItems(about.differentials),
    photoUrl,
    gallery,
    galleryTitle: gallery.length ? galleryTitleRaw || null : null,
    pageTitleForSeo,
    metaDescription,
    ogImageUrl,
  };
}
