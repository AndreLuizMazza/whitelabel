/**
 * =============================================================================
 * SHELL BRANDING — TÍTULO DO DOCUMENTO (fonte operacional para React)
 * =============================================================================
 *
 * FONTE DE VERDADE (lógica pura):
 *   `src/lib/branding/tenantContract.js`
 *   - resolveBrandDisplayName, resolveShellTitle, resolveTitleTemplate,
 *     formatDocumentTitleFromTemplate
 *
 * ESTE MÓDULO (aplicação + rotas):
 *   - `applyShellOnlyDocumentTitle` — opcional; mesmo resolveShellTitle(t) que o build
 *     injeta em theme-inline (útil em testes ou fluxos sem Router).
 *
 * TÍTULO — use no App (todos via resolveBrandDisplayName / template do contrato):
 *   - `applyRouteDocumentTitle` — rotas com mapa pathname → secção
 *   - `applyStaticPageTitle` — páginas institucionais "Secção • marca"
 *   - `applyEmDashDocumentTitle` — detalhe "Nome — contexto" (planos, parceiros)
 * Exceções: `setPageSEO` em seo.js quando precisar de título+metas explícitos.
 *
 * ÍCONES <head> (favicon, svg, apple-touch):
 *   NÃO estão neste ficheiro. Implementação única: `applyTenantShellIconsFromContract`
 *   em `tenantBranding.js`, que chama apenas `resolveShellFaviconHref` / resolveFaviconSvgUrl /
 *   resolveAppleTouchIconUrl do contrato. TenantBootstrapper importa essa função diretamente.
 *
 * BUILD (first paint):
 *   `scripts/theme-build.mjs` chama as MESMAS funções do contrato e embute literais em
 *   `public/theme-inline.js`. Prova automatizada: `npm run test:shell-branding`.
 *
 * PWA / manifest:
 *   `buildWebManifestPayload` em tenantContract + `theme-build.mjs` → manifest.webmanifest.
 *
 * Push / FCM:
 *   `resolvePushIconUrl` / `resolvePushBadgeUrl` no contrato — uso em payload/SW, não no shell
 *   HTML; não expandir aqui até haver consumo real.
 *
 * ORDEM DE EXECUÇÃO NO BROWSER:
 *   1) theme-inline.js (vars, document.title shell-only, links, localStorage)
 *   2) initTheme.js
 *   3) TenantBootstrapper → applyTenantShellIconsFromContract (reaplica mesmos hrefs)
 *   4) App → applyRouteDocumentTitle (substitui title por rota; base = resolveBrandDisplayName)
 * =============================================================================
 */

import {
  resolveBrandDisplayName,
  resolveShellTitle,
  resolveTitleTemplate,
  formatDocumentTitleFromTemplate,
} from "@/lib/branding/tenantContract.js";

/** Título só shell (= resolveShellTitle); alinhado ao literal gerado em theme-inline.js. */
export function applyShellOnlyDocumentTitle(t, empresa = null) {
  if (typeof document === "undefined") return;
  document.title = resolveShellTitle(t, empresa);
}

/**
 * Único aplicador de título por rota no React. Base e template vêm exclusivamente do contrato.
 */
export function applyRouteDocumentTitle(pathname, empresa) {
  const t = typeof window !== "undefined" ? window.__TENANT__ : null;
  const base = resolveBrandDisplayName(t, empresa);
  const section = resolvePageTitle(pathname);
  const tpl = resolveTitleTemplate(t);
  document.title = formatDocumentTitleFromTemplate(tpl, section, base);
}

/**
 * Páginas legais/estáticas: "Secção • marca" (contrato + empresa via resolveBrandDisplayName).
 */
export function applyStaticPageTitle(pageLabel, empresa) {
  if (typeof document === "undefined") return;
  const t = typeof window !== "undefined" ? window.__TENANT__ : null;
  const base = resolveBrandDisplayName(t, empresa);
  const sec = String(pageLabel || "").trim();
  document.title = sec ? `${sec} • ${base}` : base;
}

/**
 * Detalhe com contexto: "Nome — Hub" (ex.: plano — Planos). Sem hub, cai em "Nome • marca".
 */
export function applyEmDashDocumentTitle(primaryLine, secondaryLine, empresa) {
  if (typeof document === "undefined") return;
  const t = typeof window !== "undefined" ? window.__TENANT__ : null;
  const base = resolveBrandDisplayName(t, empresa);
  const a = String(primaryLine || "").trim();
  const b = String(secondaryLine || "").trim();
  if (a && b) document.title = `${a} — ${b}`;
  else if (a) document.title = `${a} • ${base}`;
  else document.title = base;
}

/**
 * Mapa pathname → rótulo de secção para o placeholder %s do titleTemplate.
 * Fonte única usada por applyRouteDocumentTitle.
 */
export function resolvePageTitle(pathname = "/") {
  if (pathname === "/") return "Início";
  if (pathname === "/planos") return "Planos";
  if (pathname.startsWith("/planos/")) return "Detalhes do plano";
  if (pathname === "/beneficios") return "Clube de Benefícios";
  if (pathname.startsWith("/beneficios/")) return "Benefício";
  if (pathname === "/contratos") return "Contratos";
  if (pathname.endsWith("/pagamentos")) return "Pagamentos do contrato";
  if (pathname === "/login") return "Entrar";
  if (pathname === "/criar-conta") return "Criar conta";
  if (pathname === "/recuperar-senha") return "Recuperar senha";
  if (pathname === "/redefinir-senha") return "Verificar código";
  if (pathname === "/trocar-senha") return "Trocar senha";
  if (pathname === "/politica-cookies") return "Política de Cookies";
  if (pathname === "/politica-privacidade") return "Política de Privacidade";
  if (pathname === "/termos-uso") return "Termos de Uso";
  if (pathname === "/filiais") return "Unidades";
  if (pathname.startsWith("/verificar/")) return "Verificar carteirinha";
  if (pathname === "/memorial") return "Memorial";
  if (pathname.startsWith("/memorial/")) return "Homenagem";
  if (pathname === "/carteirinha/print") return "Impressão da carteirinha";
  if (pathname === "/servicos-digitais") return "Serviços digitais";
  if (pathname === "/carteirinha") return "Carteirinha digital";
  if (pathname === "/area") return "Área do associado";
  if (pathname === "/perfil") return "Perfil";
  if (pathname === "/area/dependentes") return "Dependentes";
  if (pathname === "/area/pagamentos") return "Histórico de pagamentos";
  if (pathname === "/cadastro") return "Contratação";
  if (pathname === "/confirmacao") return "Confirmação";
  return "";
}
