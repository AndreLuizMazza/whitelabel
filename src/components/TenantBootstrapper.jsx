// src/components/TenantBootstrapper.jsx
import { useEffect, useRef } from 'react'
import { bootstrapTenant } from '@/boot/tenant'

function pickTenantSlugFromAny(result) {
  // 1) retorno direto do bootstrap
  const candidates = [
    result?.slug,
    result?.tenant?.slug,
    result?.empresa?.slug,
    result?.empresa?.tenantSlug,
  ].filter(Boolean)
  if (candidates[0]) return String(candidates[0])

  // 2) se o bootstrap gravar algo no window
  const w = window
  const fromWindow =
    w?.__TENANT__?.slug ||
    w?.__TENANT__?.tenant?.slug ||
    w?.tenant?.slug
  if (fromWindow) return String(fromWindow)

  // 3) se você já usa localStorage em algum lugar
  try {
    const ls =
      localStorage.getItem('TENANT_SLUG') ||
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('tenant')
    if (ls) return String(ls)
  } catch {}

  // 4) último recurso: subdomínio (ex.: riolife.seudominio.com)
  try {
    const host = window?.location?.hostname || ''
    const parts = host.split('.').filter(Boolean)
    if (parts.length >= 3) {
      const sub = parts[0]
      if (sub && sub !== 'www') return String(sub)
    }
  } catch {}

  return ''
}

function applyTenantSlug(slug) {
  if (!slug) return false
  const s = String(slug).trim()
  if (!s) return false

  // ✅ alimenta o nalapide.js automaticamente
  document.documentElement.dataset.tenantSlug = s

  // ✅ fallback para libs que leem localStorage
  try {
    localStorage.setItem('TENANT_SLUG', s)
  } catch {}

  return true
}

export default function TenantBootstrapper() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        // bootstrapTenant pode ser sync ou async — tratamos os dois
        const r = await Promise.resolve(bootstrapTenant())

        const slug = pickTenantSlugFromAny(r)

        const ok = applyTenantSlug(slug)

        // log leve em DEV (não polui produção)
        if (import.meta.env.DEV) {
          console.log(
            '[TenantBootstrapper] tenantSlug=',
            document.documentElement.dataset.tenantSlug || '(vazio)',
            '| ok=',
            ok
          )
        }
      } catch (e) {
        console.error('[TenantBootstrapper] bootstrapTenant falhou:', e)
      }
    })()
  }, [])

  return null
}
