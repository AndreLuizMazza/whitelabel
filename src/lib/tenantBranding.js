// src/lib/tenantBranding.js
import useTenant from "@/store/tenant";

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

/* ===================== helpers novos (não quebram nada) ===================== */

function cleanUrlInput(v) {
  let s = String(v || "").trim();
  if (!s) return "";
  s = s.replace(/^"+/, "").replace(/"+$/, "");
  s = s.replace(/^'+/, "").replace(/'+$/, "");
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, ""); // zero-width
  return s.trim();
}

function normalizeBase(base) {
  const b = cleanUrlInput(base);
  if (!b) return "";
  return b.endsWith("/") ? b : b + "/";
}

/**
 * Resolve asset relativo usando assetsBaseUrl do tenant.
 * Exemplos:
 * - resolveAssetUrl("pet.png", "https://.../128/") -> "https://.../128/pet.png"
 * - resolveAssetUrl("https://x/y.png", base) -> mantém
 * - resolveAssetUrl("/img/a.png", base) -> absolute do site
 */
export function resolveAssetUrl(input, base) {
  const raw = cleanUrlInput(input);
  if (!raw) return "";

  if (/^(https?:)?\/\//i.test(raw)) return raw;
  if (/^(data|blob):/i.test(raw)) return raw;

  try {
    if (raw.startsWith("/")) {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost";
      return new URL(raw, origin).toString();
    }

    const b = normalizeBase(base);
    if (b) return new URL(raw, b).toString();

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
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

/**
 * Nome exibido do tenant (aba do navegador, shell), mesma precedência geral da logo.
 * Não cria fonte nova de verdade: usa campos já usados no app (nomeFantasia, nome, etc.).
 */
export function resolveTenantBrandName() {
  try {
    const st = useTenant.getState?.();
    const emp = st?.empresa || {};
    const fromStore =
      emp.nomeFantasia ||
      emp.nome ||
      emp.razaoSocial ||
      emp.brandName;
    if (fromStore) return String(fromStore).trim();
  } catch {}

  try {
    const inline = window.__TENANT__ || {};
    const raw =
      inline.nomeFantasia ||
      inline.nome ||
      inline.brandName ||
      inline.shellTitle ||
      inline.siteTitle;
    if (raw) return String(raw).trim();
  } catch {}

  try {
    const raw = localStorage.getItem("tenant_empresa");
    if (raw) {
      const parsed = JSON.parse(raw);
      const fromLs =
        parsed?.nomeFantasia ||
        parsed?.nome ||
        parsed?.razaoSocial ||
        parsed?.brandName;
      if (fromLs) return String(fromLs).trim();
    }
  } catch {}

  try {
    const inline = window.__TENANT__ || {};
    if (inline.slug) {
      const s = String(inline.slug);
      return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
    }
  } catch {}
  try {
    const raw = localStorage.getItem("tenant_empresa");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.slug) {
        const s = String(parsed.slug);
        return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
      }
    }
  } catch {}

  return "";
}

/**
 * Ícone do shell (favicon): favicon explícito do tenant, senão mesma origem da logo.
 */
export function resolveTenantFaviconUrl() {
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

    const raw =
      emp.faviconUrl ||
      tema.favicon ||
      tema.faviconUrl ||
      emp.urlLogo ||
      emp.logoUrl ||
      emp.logo ||
      tema.logo ||
      tema.logoUrl;

    const resolved = safeUrl(resolveAssetUrl(raw, assetsBase));
    if (resolved) return resolved;
  } catch {}

  return resolveTenantLogoUrl();
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

/**
 * Resolve a URL da logo do tenant, com vários fallbacks:
 * - store do tenant (empresa.logo / logoUrl / logo_path / urlLogo / tema.logo)
 * - window.__TENANT__
 * - localStorage('tenant_empresa')
 * - CSS var --tenant-logo
 * - /img/logo.png
 *
 * Compatível: mantém o comportamento antigo e só melhora a resolução
 * de tema.logo + assetsBaseUrl quando existir.
 */
export function resolveTenantLogoUrl() {
  // 1) Store do tenant (mais confiável)
  try {
    const st = useTenant.getState?.();
    const emp = st?.empresa || {};
    const tema = emp?.tema || {};

    const assetsBase =
      tema.assetsBaseUrl || tema.cdnBaseUrl || emp.assetsBaseUrl || emp.cdnBaseUrl || "";

    // (novos campos aceitos antes dos antigos)
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

    // mantém seu retorno antigo se vier pronto (caso algum campo já esteja absoluto)
    const fromStoreLegacy =
      emp?.logo || emp?.logoUrl || emp?.logo_path;
    if (fromStoreLegacy) return fromStoreLegacy;
  } catch {}

  // 2) Bootstrapping inline
  try {
    const inline = window.__TENANT__;
    // se vier assetsBaseUrl + logo relativo, resolve
    const base = inline?.assetsBaseUrl || inline?.cdnBaseUrl || "";
    const raw = inline?.logo || inline?.logoUrl || inline?.urlLogo;
    const resolved = safeUrl(resolveAssetUrl(raw, base));
    if (resolved) return resolved;

    if (inline?.logo) return inline.logo;
  } catch {}

  // 3) localStorage (último snapshot conhecido)
  try {
    const raw = localStorage.getItem("tenant_empresa");
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

  // 4) CSS var configurável
  const cssVar = cssVarUrlOrNull("--tenant-logo");
  if (cssVar) return cssVar;

  // 5) Fallback geral
  return "/img/logo.png";
}

/**
 * Iniciais do tenant (ex.: "Funerária Patense" -> "FP")
 */
export function getTenantInitials(empresa) {
  const nome =
    empresa?.nomeFantasia || empresa?.nome || empresa?.razaoSocial || "T";
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "T";
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${(first || "T").toUpperCase()}${(last || "").toUpperCase()}`;
}
