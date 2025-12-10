// src/lib/tenantBranding.js
import useTenant from "@/store/tenant"

// Logo vinda de CSS var (fallback final)
function cssVarUrlOrNull(name = "--tenant-logo") {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      ?.trim()
    const m = v.match(/^url\((['"]?)(.*?)\1\)$/i)
    return m?.[2] || null
  } catch {
    return null
  }
}

/**
 * Resolve a URL da logo do tenant, com vários fallbacks:
 * - store do tenant
 * - window.__TENANT__
 * - localStorage('tenant_empresa')
 * - CSS var --tenant-logo
 * - /img/logo.png
 */
export function resolveTenantLogoUrl() {
  // 1) Store do tenant (mais confiável)
  try {
    const st = useTenant.getState?.()
    const fromStore =
      st?.empresa?.logo || st?.empresa?.logoUrl || st?.empresa?.logo_path
    if (fromStore) return fromStore
  } catch {}

  // 2) Bootstrapping inline
  try {
    const inline = window.__TENANT__
    if (inline?.logo) return inline.logo
  } catch {}

  // 3) localStorage (último snapshot conhecido)
  try {
    const raw = localStorage.getItem("tenant_empresa")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.logo) return parsed.logo
    }
  } catch {}

  // 4) CSS var configurável
  const cssVar = cssVarUrlOrNull("--tenant-logo")
  if (cssVar) return cssVar

  // 5) Fallback geral
  return "/img/logo.png"
}

/**
 * Iniciais do tenant (ex.: "Funerária Patense" -> "FP")
 */
export function getTenantInitials(empresa) {
  const nome =
    empresa?.nomeFantasia || empresa?.nome || empresa?.razaoSocial || "T"
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "T"
  const first = parts[0][0]
  const last = parts[parts.length - 1][0]
  return `${(first || "T").toUpperCase()}${(last || "").toUpperCase()}`
}
