/**
 * Paridade: resolveContractAssetUrl aplica ?v={assetsRevision} em paths CDN relativos.
 */
import { resolveContractAssetUrl } from "../src/lib/branding/tenantContract.js";
import {
  appendAssetsRevisionQuery,
  isRelativeCdnAssetInput,
} from "../src/lib/branding/urls.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const tenant = {
  assetsBaseUrl: "https://whitelabel.progem.com.br/arquivos/438/",
  assetsRevision: 5,
  brand: { logo: "logo.png" },
};

const logoUrl = resolveContractAssetUrl(tenant, "logo.png");
assert(logoUrl.includes("logo.png"), "deve conter path canônico");
assert(logoUrl.includes("v=5"), `esperado v=5, got ${logoUrl}`);

const abs = resolveContractAssetUrl(
  tenant,
  "https://funerariapopular.awis.com.br/assets/hero.png"
);
assert(!abs.includes("v=5"), "URL absoluta não deve receber ?v=");

const zeroRev = resolveContractAssetUrl(
  { ...tenant, assetsRevision: 0 },
  "logo.png"
);
assert(!zeroRev.includes("v="), "revision 0 não adiciona query");

assert(isRelativeCdnAssetInput("logo.png", tenant.assetsBaseUrl), "logo.png é CDN relativo");
assert(!isRelativeCdnAssetInput("https://x/y.png", tenant.assetsBaseUrl), "abs não é CDN relativo");

assert(
  appendAssetsRevisionQuery("https://cdn/logo.png", 3).includes("v=3"),
  "appendAssetsRevisionQuery"
);

const tenantWithHero = {
  assetsBaseUrl: "https://whitelabel.progem.com.br/arquivos/128/",
  assetsRevision: 9,
  heroSlides: [{ image: "planos.png" }],
  content: { about: { photo: "hero-sobre.jpg" } },
};

const heroSlideUrl = resolveContractAssetUrl(tenantWithHero, "planos.png");
assert(heroSlideUrl.includes("planos.png"), "hero slide path");
assert(heroSlideUrl.includes("v=9"), `hero slide esperado v=9, got ${heroSlideUrl}`);

function normalizePathUnderSobre(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  const noLeading = s.replace(/^\/+/, "");
  if (noLeading.startsWith("sobre/")) return noLeading;
  return `sobre/${noLeading}`;
}

function resolveAboutMediaUrlTest(t, raw) {
  const path = normalizePathUnderSobre(raw);
  return resolveContractAssetUrl(t, path);
}

const aboutPhoto = resolveAboutMediaUrlTest(tenantWithHero, "hero-sobre.jpg");
assert(aboutPhoto.includes("sobre/hero-sobre.jpg"), "about photo path sobre/");
assert(aboutPhoto.includes("v=9"), `about photo esperado v=9, got ${aboutPhoto}`);

console.log("[ok] branding revision query parity tests passed");
