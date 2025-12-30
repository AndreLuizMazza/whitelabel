// src/components/TenantBootstrapper.jsx
import { useEffect, useRef } from 'react'
import { bootstrapTenant } from '@/boot/tenant'
import useTenant from '@/store/tenant'

/* ===================== slug ===================== */

function pickTenantSlugFromAny(result) {
  const candidates = [
    result?.slug,
    result?.tenant?.slug,
    result?.empresa?.slug,
    result?.empresa?.tenantSlug,
  ].filter(Boolean)
  if (candidates[0]) return String(candidates[0])

  const w = window
  const fromWindow =
    w?.__TENANT__?.slug ||
    w?.__TENANT__?.tenant?.slug ||
    w?.tenant?.slug
  if (fromWindow) return String(fromWindow)

  try {
    const ls =
      localStorage.getItem('TENANT_SLUG') ||
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('tenant')
    if (ls) return String(ls)
  } catch {}

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
  document.documentElement.dataset.tenantSlug = s
  try {
    localStorage.setItem('TENANT_SLUG', s)
  } catch {}
  return true
}

/* ===================== url/asset resolve (local) ===================== */

function normalizeBase(base) {
  const b = String(base || '').trim()
  if (!b) return ''
  return b.endsWith('/') ? b : b + '/'
}

function cleanUrlInput(v) {
  let s = String(v || '').trim()
  if (!s) return ''
  s = s.replace(/^"+/, '').replace(/"+$/, '')
  s = s.replace(/^'+/, '').replace(/'+$/, '')
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '')
  return s.trim()
}

function resolveAssetUrl(input, base) {
  const raw = cleanUrlInput(input)
  if (!raw) return ''
  if (/^(https?:)?\/\//i.test(raw)) return raw
  if (/^(data|blob):/i.test(raw)) return raw

  const b = normalizeBase(base)
  if (b) {
    try {
      return new URL(raw.replace(/^\/+/, ''), b).toString()
    } catch {
      return b + raw.replace(/^\/+/, '')
    }
  }

  // fallback local
  if (raw.startsWith('/')) return raw
  return '/' + raw.replace(/^\/+/, '')
}

function safeUrl(u) {
  const s = cleanUrlInput(u)
  if (!s) return ''
  return s.replace(/ /g, '%20')
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/* ===================== detectores ===================== */

// ✅ quando o JSON é “tema no root”
function looksLikeThemeJson(obj) {
  if (!obj || typeof obj !== 'object') return false
  const hasVars = obj.vars && typeof obj.vars === 'object'
  const hasDark = obj.varsDark && typeof obj.varsDark === 'object'
  const hasSlides = Array.isArray(obj.heroSlides)
  const hasAssetsBase = typeof obj.assetsBaseUrl === 'string'
  return Boolean(hasVars || hasDark || hasSlides || hasAssetsBase)
}

/* ===================== hidratação ===================== */

function readFromStore() {
  try {
    const st = useTenant.getState?.()
    if (st?.empresa && Object.keys(st.empresa).length) return st.empresa
  } catch {}
  return null
}

function readFromLocalStorageEmpresa() {
  try {
    const raw = localStorage.getItem('tenant_empresa')
    const parsed = raw ? safeJsonParse(raw) : null
    if (parsed && typeof parsed === 'object') return parsed
  } catch {}
  return null
}

function readFromLocalStorageTheme() {
  try {
    const raw =
      localStorage.getItem('tenant_theme') ||
      localStorage.getItem('tenant_tema') ||
      localStorage.getItem('TENANT_THEME')
    const parsed = raw ? safeJsonParse(raw) : null
    if (parsed && typeof parsed === 'object') return parsed
  } catch {}
  return null
}

function readFromWindow() {
  try {
    const w = window
    return w?.__TENANT__ || null
  } catch {}
  return null
}

function applyRootBranding({ logoUrl, assetsBaseUrl }) {
  try {
    if (logoUrl) {
      document.documentElement.style.setProperty('--tenant-logo', `url("${logoUrl}")`)
    }
    if (assetsBaseUrl) {
      document.documentElement.style.setProperty('--tenant-assets-base', String(assetsBaseUrl))
    }
  } catch {}
}

function pushEmpresaEverywhere(empresaNormalized, assetsBaseUrl, logoResolved) {
  // ✅ Zustand (forçado)
  try {
    if (typeof useTenant?.setState === 'function') {
      useTenant.setState({ empresa: empresaNormalized })
    } else {
      const st = useTenant.getState?.()
      if (st && typeof st.setEmpresa === 'function') st.setEmpresa(empresaNormalized)
    }
  } catch {}

  // window / localStorage para compat
  try {
    window.__TENANT__ = {
      ...(window.__TENANT__ || {}),
      slug: empresaNormalized.slug,
      empresa: empresaNormalized,
      tema: empresaNormalized.tema,
      assetsBaseUrl,
      logo: logoResolved || empresaNormalized.urlLogo,
    }
  } catch {}

  try {
    localStorage.setItem('tenant_empresa', JSON.stringify(empresaNormalized))
  } catch {}

  applyRootBranding({
    logoUrl: logoResolved || empresaNormalized.urlLogo,
    assetsBaseUrl,
  })
}

/* ===================== normalização ===================== */

function normalizeTenant(empresaRaw, temaRaw, slugFallback) {
  const empresa0 = empresaRaw || {}
  const tema0 = temaRaw || empresa0?.tema || {}

  const assetsBaseUrl =
    tema0?.assetsBaseUrl ||
    tema0?.assetsBase ||
    tema0?.cdnBaseUrl ||
    empresa0?.assetsBaseUrl ||
    empresa0?.cdnBaseUrl ||
    ''

  const resolve = (v) => safeUrl(resolveAssetUrl(v, assetsBaseUrl))

  const logoResolved = resolve(
    tema0?.logo ||
      tema0?.logoUrl ||
      tema0?.urlLogo ||
      empresa0?.urlLogo ||
      empresa0?.logoUrl ||
      empresa0?.logo ||
      empresa0?.logo_path
  )

  const heroImageResolved = resolve(tema0?.heroImage || empresa0?.heroImage)

  const heroSlidesRaw =
    (Array.isArray(tema0?.heroSlides) && tema0.heroSlides) ||
    (Array.isArray(empresa0?.heroSlides) && empresa0.heroSlides) ||
    []

  const heroSlidesResolved = heroSlidesRaw.map((s) => ({
    ...s,
    image: resolve(s?.image || s?.heroImage),
  }))

  const temaNormalized = {
    ...tema0,
    assetsBaseUrl,
    logo: logoResolved || tema0?.logo || '',
    heroImage: heroImageResolved || tema0?.heroImage || '',
    heroSlides: heroSlidesResolved,
  }

  const empresaNormalized = {
    ...empresa0,
    slug: empresa0?.slug || empresa0?.tenantSlug || slugFallback || '',
    assetsBaseUrl,
    tema: temaNormalized,

    // atalhos comuns
    urlLogo: logoResolved || empresa0?.urlLogo || empresa0?.logoUrl || empresa0?.logo || '',
    heroImage: heroImageResolved || empresa0?.heroImage || '',
    heroSlides: heroSlidesResolved,
  }

  return { empresaNormalized, assetsBaseUrl, logoResolved }
}

/* ===================== componente ===================== */

export default function TenantBootstrapper() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      let r = null
      try {
        r = await Promise.resolve(bootstrapTenant())
      } catch (e) {
        console.error('[TenantBootstrapper] bootstrapTenant falhou:', e)
      }

      const slug = pickTenantSlugFromAny(r)
      const ok = applyTenantSlug(slug)

      const maxTries = 25
      const delayMs = 60

      let applied = false

      for (let i = 0; i < maxTries; i++) {
        const stEmpresa = readFromStore()
        const win = readFromWindow()
        const lsEmpresa = readFromLocalStorageEmpresa()
        const lsTheme = readFromLocalStorageTheme()

        // ✅ tenta achar “tema no root” primeiro (se existir em qualquer fonte)
        const themeCandidate =
          (looksLikeThemeJson(r) && r) ||
          (looksLikeThemeJson(win) && win) ||
          (looksLikeThemeJson(lsTheme) && lsTheme) ||
          (looksLikeThemeJson(lsEmpresa) && lsEmpresa) ||
          null

        let empresaRaw = stEmpresa || (r?.empresa || r?.tenant?.empresa) || lsEmpresa || null
        let temaRaw = (empresaRaw?.tema && empresaRaw.tema) || lsTheme || null

        // ✅ se achou tema no root, injeta como tema
        if (themeCandidate) {
          temaRaw = themeCandidate

          // se não existe empresa, cria um “mínimo” só pra transportar o tema
          if (!empresaRaw || typeof empresaRaw !== 'object') {
            empresaRaw = { slug: themeCandidate.slug || slug, tema: themeCandidate }
          } else {
            empresaRaw = { ...empresaRaw, tema: themeCandidate }
          }
        }

        const hasSomething =
          (empresaRaw && Object.keys(empresaRaw).length > 0) ||
          (temaRaw && Object.keys(temaRaw).length > 0)

        if (hasSomething) {
          const { empresaNormalized, assetsBaseUrl, logoResolved } = normalizeTenant(
            empresaRaw,
            temaRaw,
            slug
          )

          const ready =
            Boolean(assetsBaseUrl) ||
            Boolean(empresaNormalized?.urlLogo) ||
            Boolean(empresaNormalized?.heroImage) ||
            (Array.isArray(empresaNormalized?.heroSlides) && empresaNormalized.heroSlides.length > 0)

          pushEmpresaEverywhere(empresaNormalized, assetsBaseUrl, logoResolved)

          if (ready) {
            applied = true
            if (import.meta.env.DEV) {
              console.log(
                '[TenantBootstrapper] APPLY OK | slug=',
                empresaNormalized.slug,
                '| assetsBaseUrl=',
                assetsBaseUrl || '(vazio)',
                '| logo=',
                empresaNormalized.urlLogo || '(sem)',
                '| heroImage=',
                empresaNormalized.heroImage || '(sem)',
                '| slide0=',
                empresaNormalized?.heroSlides?.[0]?.image || '(sem slides)'
              )
            }
            break
          }
        }

        await new Promise((res) => setTimeout(res, delayMs))
      }

      if (import.meta.env.DEV && !applied) {
        console.log(
          '[TenantBootstrapper] ok=',
          ok,
          '| slug=',
          slug || '(vazio)',
          '| sem tema/empresa útil após retry'
        )
      }
    })()
  }, [])

  return null
}
