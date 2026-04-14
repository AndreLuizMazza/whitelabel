/**
 * Injeta <title> e metas OG/Twitter no index.html no build.
 * Crawlers (ex.: WhatsApp) leem HTML estático e não executam theme-inline.js.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveSeoDefaults,
  resolveShellTitle,
  SEO_DESCRIPTION_FALLBACK,
} from "./src/lib/branding/tenantContract.js";
import { resolveCanonicalSiteRootForOgUrl } from "./scripts/resolve-canonical-site-origin.mjs";
import { loadTenantPayloadSyncForBuild } from "./scripts/tenant-payload-for-build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function tenantIndexSeoPlugin() {
  return {
    name: "tenant-index-seo",
    transformIndexHtml(html) {
      const tenantPayload = loadTenantPayloadSyncForBuild(__dirname);
      if (!tenantPayload) {
        if (process.env.NODE_ENV === "production") {
          console.warn(
            "[tenant-index-seo] TENANT não definido no build: index.html fica sem metas OG (defina TENANT para build:tenant / Vercel)."
          );
        }
        return html;
      }

      const shellTitle = resolveShellTitle(tenantPayload, null);
      const { metaTitle, metaDescription, ogImage } = resolveSeoDefaults(tenantPayload, null);
      const desc = metaDescription || SEO_DESCRIPTION_FALLBACK;
      const ogUrl = resolveCanonicalSiteRootForOgUrl(tenantPayload);
      const twCard = ogImage ? "summary_large_image" : "summary";

      const metas = [
        `<meta name="description" content="${escapeHtmlAttr(desc)}" />`,
        `<meta property="og:title" content="${escapeHtmlAttr(metaTitle)}" />`,
        `<meta property="og:description" content="${escapeHtmlAttr(desc)}" />`,
        `<meta property="og:type" content="website" />`,
      ];
      if (ogImage) {
        metas.push(`<meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />`);
      }
      if (ogUrl) {
        metas.push(`<meta property="og:url" content="${escapeHtmlAttr(ogUrl)}" />`);
      }
      metas.push(`<meta name="twitter:card" content="${escapeHtmlAttr(twCard)}" />`);
      metas.push(`<meta name="twitter:title" content="${escapeHtmlAttr(metaTitle)}" />`);
      metas.push(`<meta name="twitter:description" content="${escapeHtmlAttr(desc)}" />`);
      if (ogImage) {
        metas.push(`<meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />`);
      }

      const metaBlock = metas.join("\n    ");
      const titleTag = `<title>${escapeHtmlAttr(shellTitle)}</title>`;

      const replaced = html.replace(
        /<title>[^<]*<\/title>(\s*)(<script\s+src=["']\/theme-inline\.js["']\s*><\/script>)/i,
        (_, ws, script) => `${titleTag}\n    ${metaBlock}${ws}${script}`
      );

      if (replaced === html) {
        console.warn(
          "[tenant-index-seo] Não injetado: ajuste o index.html (esperado <title>…</title> seguido de script theme-inline.js)."
        );
      }

      return replaced;
    },
  };
}
