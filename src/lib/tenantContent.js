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

/** @param {unknown} t */
export function getHomeContent(t) {
  const c = t && typeof t === "object" ? t.content : null;
  const home = c && typeof c === "object" ? c.home : null;
  return home && typeof home === "object" ? home : null;
}

/**
 * Stats de confiança configuráveis no JSON do tenant (`content.home.trustStats`).
 * Retorna vazio se não houver dados reais — nunca inventar números.
 * @param {unknown} t
 * @returns {{ label: string, value: string, icon?: string }[]}
 */
export function getHomeTrustStats(t) {
  const home = getHomeContent(t);
  const raw = home?.trustStats;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = String(item.label || "").trim();
      const value = String(item.value || "").trim();
      if (!label || !value) return null;
      const icon = String(item.icon || "").trim();
      return icon ? { label, value, icon } : { label, value };
    })
    .filter(Boolean);
}

/**
 * Destaques de benefícios para a home (`content.home.benefits` ou fallback editorial).
 * @param {unknown} t
 * @returns {{ title: string, text: string, to?: string, icon?: string }[]}
 */
export function getHomeBenefitHighlights(t) {
  const home = getHomeContent(t);
  const raw = home?.benefits;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const title = String(item.title || "").trim();
        const text = String(item.text || item.description || "").trim();
        if (!title || !text) return null;
        const to = String(item.to || "").trim() || undefined;
        const icon = String(item.icon || "").trim() || undefined;
        return to ? { title, text, to, icon } : icon ? { title, text, icon } : { title, text };
      })
      .filter(Boolean);
  }

  const about = getAboutRaw(t);
  const diffs = normalizeAboutListItems(about?.differentials);
  if (diffs.length >= 2) {
    return diffs.slice(0, 4).map((d) => ({
      title: d.title || "Diferencial",
      text: d.text,
    }));
  }

  return [];
}

/**
 * Links das lojas de app na home (`content.home.apps`).
 * @param {unknown} t
 * @returns {{ android: string, ios: string, previewImage?: string }}
 */
export function getHomeAppStoreLinks(t) {
  const home = getHomeContent(t);
  const apps = home?.apps && typeof home.apps === "object" ? home.apps : null;
  if (!apps) return { android: "", ios: "" };

  const android = String(apps.androidStoreUrl || apps.androidUrl || "").trim();
  const ios = String(apps.iosStoreUrl || apps.iosUrl || "").trim();
  const previewImage = String(apps.previewImage || "").trim() || undefined;

  return { android, ios, previewImage };
}

/** Copy editorial para trust strip quando não há stats numéricos. */
export function getHomeEditorialTrustItems(t) {
  const about = getAboutRaw(t);
  const values = normalizeAboutListItems(about?.values);
  if (values.length >= 2) {
    return values.slice(0, 3).map((v) => ({
      title: v.title || "Valor",
      text: v.text || "",
    }));
  }
  return [
    { title: "Atendimento humanizado", text: "Equipe preparada para orientar você." },
    { title: "Transparência", text: "Informações claras sobre planos e canais." },
    { title: "Benefícios reais", text: "Parceiros e serviços que ampliam seu plano." },
  ];
}

const HERO_PILL_VALUE_ICONS = ["HeartHandshake", "ShieldCheck", "Users", "Star", "Globe"];

/**
 * Pills do hero quando o slide não define `valuePills`.
 * Prioridade: `content.home.heroPills` → `about.values` → null (fallback do componente).
 * @param {unknown} t
 * @returns {Array<{ icon: string, label: string }> | null}
 */
export function getHomeHeroValuePillsFallback(t) {
  const home = getHomeContent(t);
  const fromHome = home?.heroPills ?? home?.valuePills;
  if (Array.isArray(fromHome) && fromHome.length > 0) {
    return fromHome
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const label = String(p.label || p.title || "").trim();
        if (!label) return null;
        return {
          icon: String(p.icon || "ShieldCheck").trim() || "ShieldCheck",
          label,
        };
      })
      .filter(Boolean)
      .slice(0, 5);
  }

  const values = normalizeAboutListItems(getAboutRaw(t)?.values);
  if (values.length >= 2) {
    return values.slice(0, 4).map((v, i) => ({
      icon: HERO_PILL_VALUE_ICONS[i % HERO_PILL_VALUE_ICONS.length],
      label: v.title || String(v.text || "").split(/[.!]/)[0]?.trim() || "Valor",
    }));
  }

  return null;
}

/** Descrição institucional para footer. */
export function getFooterInstitutionalBlurb(t) {
  const about = getAboutRaw(t);
  const closing = String(about?.closing || "").trim();
  if (closing) {
    const first = closing.split(/\n+/)[0]?.trim();
    if (first) return first;
  }
  const seo = t && typeof t === "object" ? t.seo : null;
  const meta = String(seo?.metaDescription || "").trim();
  if (meta) return meta;
  return "";
}
