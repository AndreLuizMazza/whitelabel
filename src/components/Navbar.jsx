// src/components/Navbar.jsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import ThemeToggle from './ThemeToggle.jsx'
import MegaMenuPlanos from './menus/MegaMenuPlanos.jsx'
import { planosItems, planosCta } from '@/data/planosItems'

function cssVarUrlOrNull(name = '--tenant-logo') {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name)?.trim()
    if (!v) return null
    // espera algo como: url("https://...") ou url(https://...)
    const m = v.match(/^url\((['"]?)(.*?)\1\)$/i)
    return m?.[2] || null
  } catch { return null }
}

/** Resolve URL da logo (ordem de prioridade):
 *  1) store (empresa.logo / logoUrl / logo_path)
 *  2) window.__TENANT__.logo (inline)
 *  3) localStorage('tenant_empresa').logo
 *  4) CSS var --tenant-logo (extraída como URL)
 *  5) '/img/logo.png' (fallback)
 */
function resolveTenantLogoUrl() {
  try {
    const st = useTenant.getState?.()
    const fromStore = st?.empresa?.logo || st?.empresa?.logoUrl || st?.empresa?.logo_path
    if (fromStore) return fromStore
  } catch {}

  try {
    const inline = window.__TENANT__
    if (inline?.logo) return inline.logo
  } catch {}

  try {
    const raw = localStorage.getItem('tenant_empresa')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.logo) return parsed.logo
    }
  } catch {}

  const fromCssVar = cssVarUrlOrNull('--tenant-logo')
  return fromCssVar || '/img/logo.png'
}

export default function Navbar() {
  const { isAuthenticated, token, user } = useAuth(s => ({
    isAuthenticated: s.isAuthenticated,
    token: s.token,
    user: s.user,
  }))
  const empresa = useTenant(s => s.empresa)

  const nome = empresa?.nomeFantasia || 'Logo'
  const logoUrl = resolveTenantLogoUrl()
  const isLogged = isAuthenticated() || !!token || !!user
  const areaDest = isLogged ? '/area' : '/login'

  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const linkClass = ({ isActive }) =>
    'relative pl-4 pr-3 py-2 flex items-center whitespace-nowrap rounded-md transition-colors duration-150 ' +
    (isActive
      ? 'text-primary font-semibold bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]'
      : 'text-[var(--text)] hover:text-primary hover:bg-[var(--surface)]')

  const ActiveBar = ({ isActive }) =>
    isActive ? <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded bg-[var(--primary)]" /> : null

  return (
    <header className="w-full border-b bg-[var(--surface)] sticky top-0 z-40 shadow-sm">
      <div className="container-max flex items-center justify-between py-3 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center h-10 md:h-12 lg:h-14" aria-label={nome}>
          <img
            src={logoUrl}
            alt={nome}
            className="h-10 md:h-12 lg:h-14 w-auto max-w-[12rem] object-contain"
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <NavLink to="/" className={linkClass} end>
            {({ isActive }) => (<><ActiveBar isActive={isActive} /> Home</>)}
          </NavLink>

          <MegaMenuPlanos />

          <NavLink to="/beneficios" className={linkClass}>
            {({ isActive }) => (<><ActiveBar isActive={isActive} /> Clube de Benefícios</>)}
          </NavLink>

          <NavLink to="/memorial" className={linkClass}>
            {({ isActive }) => (<><ActiveBar isActive={isActive} /> Memorial</>)}
          </NavLink>

          <NavLink to="/filiais" className={linkClass}>
            {({ isActive }) => (<><ActiveBar isActive={isActive} /> Unidades</>)}
          </NavLink>

          <NavLink to="/contratos" className={linkClass}>
            {({ isActive }) => (<><ActiveBar isActive={isActive} /> 2° Via</>)}
          </NavLink>

          <NavLink to={areaDest} className={linkClass}>
            {({ isActive }) => (<><ActiveBar isActive={isActive} /> Área do associado</>)}
          </NavLink>

          <ThemeToggle className="ml-2 hidden md:inline-flex" />
        </nav>

        {/* Mobile trigger */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2"
          aria-label="Abrir menu"
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t bg-[var(--surface)]">
          <div className="container-max py-2 flex flex-col text-sm space-y-1">
            <NavLink to="/" className={linkClass} end>
              {({ isActive }) => (<><ActiveBar isActive={isActive} /> Home</>)}
            </NavLink>

            <details className="rounded-md">
              <summary className="cursor-pointer select-none px-4 py-2 text-[var(--text)] hover:bg-[var(--surface)] rounded-md whitespace-nowrap">
                Planos
              </summary>
              <div className="pl-2 pr-1 pb-2 space-y-1">
                {planosItems
                  .filter(it => (typeof it.predicate === 'function' ? it.predicate(empresa) : true))
                  .map(it => (
                    <Link
                      key={it.id}
                      to={it.to}
                      className="block px-4 py-2 rounded hover:bg-[var(--surface)] whitespace-nowrap"
                    >
                      {it.title}
                    </Link>
                  ))}
                <Link
                  to={planosCta.to}
                  className="block px-4 py-2 rounded hover:bg-[var(--surface)] text-primary whitespace-nowrap"
                >
                  {planosCta.label}
                </Link>
              </div>
            </details>

            <NavLink to="/beneficios" className={linkClass}>
              {({ isActive }) => (<><ActiveBar isActive={isActive} /> Clube de Benefícios</>)}
            </NavLink>

            <NavLink to="/memorial" className={linkClass}>
              {({ isActive }) => (<><ActiveBar isActive={isActive} /> Memorial</>)}
            </NavLink>

            <NavLink to="/filiais" className={linkClass}>
              {({ isActive }) => (<><ActiveBar isActive={isActive} /> Unidades</>)}
            </NavLink>

            <NavLink to="/contratos" className={linkClass}>
              {({ isActive }) => (<><ActiveBar isActive={isActive} /> 2° Via</>)}
            </NavLink>

            <NavLink to={areaDest} className={linkClass}>
              {({ isActive }) => (<><ActiveBar isActive={isActive} /> Área do associado</>)}
            </NavLink>

            <div className="border-t mt-2 pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
