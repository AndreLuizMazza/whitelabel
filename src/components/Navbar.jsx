// src/components/Navbar.jsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Menu,
  X,
  Home,
  Layers,
  Gift,
  HeartHandshake,
  MapPin,
  FileText,
  UserSquare2,
} from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import ThemeToggle from './ThemeToggle.jsx'
import HeaderNotificationsBell from '@/components/HeaderNotificationsBell.jsx'

// Resolve logo do tenant
function cssVarUrlOrNull(name = '--tenant-logo') {
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

function resolveTenantLogoUrl() {
  try {
    const st = useTenant.getState?.()
    const fromStore =
      st?.empresa?.logo || st?.empresa?.logoUrl || st?.empresa?.logo_path
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

  return cssVarUrlOrNull('--tenant-logo') || '/img/logo.png'
}

export default function Navbar() {
  const { isAuthenticated, token, user } = useAuth((s) => ({
    isAuthenticated: s.isAuthenticated,
    token: s.token,
    user: s.user,
  }))
  const empresa = useTenant((s) => s.empresa)

  const nome = empresa?.nomeFantasia || 'Logo'
  const logoUrl = resolveTenantLogoUrl()
  const isLogged = isAuthenticated() || !!token || !!user
  const areaDest = isLogged ? '/area' : '/login'

  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Fecha o menu ao trocar de rota
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Bloqueia o scroll do body quando o drawer está aberto
  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  const linkClass = ({ isActive }) =>
    'relative pl-4 pr-3 py-2 flex items-center gap-2 whitespace-nowrap rounded-md transition-colors duration-150 ' +
    (isActive
      ? 'text-[var(--nav-active-color)] font-semibold bg-[var(--nav-active-bg)]'
      : 'text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--nav-hover-bg)]')

  const ActiveBar = ({ isActive }) =>
    isActive ? (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded bg-[var(--primary)]" />
    ) : null

  // Clique na logo: se já estiver na Home, apenas rola para o topo
  function handleLogoClick(e) {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header className="w-full border-b bg-[var(--surface)] sticky top-0 z-40 shadow-sm">
      <div className="container-max flex items-center justify-between py-3 gap-4">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center h-10 md:h-12 lg:h-14"
          aria-label={nome}
        >
          <img
            src={logoUrl}
            alt={nome}
            className="h-10 md:h-12 lg:h-14 w-auto max-w-[12rem] object-contain"
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <NavLink to="/" className={linkClass} end>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <Home className="h-4 w-4" />
                <span>Home</span>
              </>
            )}
          </NavLink>

          {/* MegaMenu removido — link simples para Planos */}
          <NavLink to="/planos" className={linkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <Layers className="h-4 w-4" />
                <span>Planos</span>
              </>
            )}
          </NavLink>

          <NavLink to="/beneficios" className={linkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <Gift className="h-4 w-4" />
                <span>Clube de Benefícios</span>
              </>
            )}
          </NavLink>

          <NavLink to="/memorial" className={linkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <HeartHandshake className="h-4 w-4" />
                <span>Memorial</span>
              </>
            )}
          </NavLink>

          <NavLink to="/filiais" className={linkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <MapPin className="h-4 w-4" />
                <span>Unidades</span>
              </>
            )}
          </NavLink>

          <NavLink to="/contratos" className={linkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <FileText className="h-4 w-4" />
                <span>2° Via</span>
              </>
            )}
          </NavLink>

          <NavLink to={areaDest} className={linkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                <UserSquare2 className="h-4 w-4" />
                <span>Área do associado</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* Ações à direita: sineta (apenas logado) + tema sempre visível + menu mobile */}
        <div className="flex items-center gap-2">
          {isLogged && <HeaderNotificationsBell />}
          <ThemeToggle />

          {/* Trigger do menu mobile (somente até md) */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2"
            aria-label="Abrir menu"
            aria-controls="mobile-menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile como drawer lateral (direita -> esquerda) */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 md:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay */}
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />

          {/* Drawer lateral */}
          <div className="absolute inset-y-0 right-0 w-72 max-w-[80%] bg-[var(--surface)] border-l shadow-xl flex flex-col">
            {/* Cabeçalho do drawer */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-xs font-semibold tracking-wide">
                Menu
              </span>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border px-2 py-1.5"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Links de navegação */}
            <nav className="flex-1 overflow-y-auto py-2 text-sm space-y-1">
              <NavLink to="/" className={linkClass} end>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/planos" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <Layers className="h-4 w-4" />
                    <span>Planos</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/memorial" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <HeartHandshake className="h-4 w-4" />
                    <span>Memorial</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/filiais" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <MapPin className="h-4 w-4" />
                    <span>Unidades</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/beneficios" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <Gift className="h-4 w-4" />
                    <span>Clube de Benefícios</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/contratos" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <FileText className="h-4 w-4" />
                    <span>2° Via</span>
                  </>
                )}
              </NavLink>

              <NavLink to={areaDest} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <UserSquare2 className="h-4 w-4" />
                    <span>Área do associado</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
