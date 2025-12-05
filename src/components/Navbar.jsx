// src/components/Navbar.jsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState, useMemo, useRef } from 'react'
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
  User,
  LogOut,
} from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import ThemeToggle from './ThemeToggle.jsx'
import HeaderNotificationsBell from '@/components/HeaderNotificationsBell.jsx'
import { getAvatarBlobUrl } from '@/lib/profile'

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
  const { isAuthenticated, token, user, logout } = useAuth((s) => ({
    isAuthenticated: s.isAuthenticated,
    token: s.token,
    user: s.user,
    logout: s.logout,
  }))
  const empresa = useTenant((s) => s.empresa)

  const nomeEmpresa = empresa?.nomeFantasia || 'Logo'
  const logoUrl = resolveTenantLogoUrl()
  const isLogged = isAuthenticated() || !!token || !!user

  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  /* ===== Conta / Avatar ===== */
  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? '',
    [user]
  )

  const avatarInitial = useMemo(() => {
    const base = user?.nome || user?.email || 'U'
    return base.trim().charAt(0).toUpperCase()
  }, [user])

  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null)
  const [avatarErro, setAvatarErro] = useState(false)
  const lastObjUrlRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const fotoDeclarada = user?.fotoUrl || user?.photoURL || ''
  const avatarUrl = avatarErro ? '' : (avatarBlobUrl || fotoDeclarada || '')

  // Carrega avatar do BFF
  useEffect(() => {
    let active = true

    if (!isLogged) {
      if (lastObjUrlRef.current) {
        URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = null
      }
      setAvatarBlobUrl(null)
      setAvatarErro(false)
      return () => {}
    }

    async function loadAvatar() {
      try {
        const objUrl = await getAvatarBlobUrl()
        if (!active) {
          if (objUrl) URL.revokeObjectURL(objUrl)
          return
        }
        if (lastObjUrlRef.current) {
          URL.revokeObjectURL(lastObjUrlRef.current)
        }
        lastObjUrlRef.current = objUrl || null
        setAvatarBlobUrl(objUrl || null)
        setAvatarErro(false)
      } catch {
        setAvatarBlobUrl(null)
      }
    }

    loadAvatar()

    return () => {
      active = false
      if (lastObjUrlRef.current) {
        URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = null
      }
    }
  }, [isLogged, user?.id, user?.email])

  // Fecha menus ao trocar de rota
  useEffect(() => {
    setMobileOpen(false)
    setShowProfileMenu(false)
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

  // Fecha menu de perfil ao clicar fora
  useEffect(() => {
    if (!showProfileMenu) return
    const handler = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProfileMenu])

  const linkClass = ({ isActive }) =>
    'relative pl-4 pr-3 py-2 flex items-center gap-2 whitespace-nowrap rounded-md transition-colors duration-150 ' +
    (isActive
      ? 'text-[var(--nav-active-color)] font-semibold bg-[var(--nav-active-bg)]'
      : 'text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--nav-hover-bg)]')

  const ActiveBar = ({ isActive }) =>
    isActive ? (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded bg-[var(--primary)]" />
    ) : null

  // Clique na logo: se já estiver na Home, rola para o topo
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
          aria-label={nomeEmpresa}
        >
          <img
            src={logoUrl}
            alt={nomeEmpresa}
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
        </nav>

        {/* Ações à direita */}
        <div className="flex items-center gap-2">
          {isLogged && (
            <div className="flex items-center gap-1">
              <HeaderNotificationsBell />
            </div>
          )}

          <ThemeToggle />

          {/* Avatar / Conta sempre visível (mobile + desktop) quando logado */}
          {isLogged ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((v) => !v)}
                className="inline-flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-full border text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] transition-colors"
                style={{
                  borderColor: 'var(--c-border)',
                  background:
                    'color-mix(in srgb, var(--surface-elevated, var(--surface)) 90%, var(--primary) 10%)',
                }}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                aria-label={nomeExibicao || 'Conta do associado'}
              >
                {avatarUrl && !avatarErro ? (
                  <img
                    src={avatarUrl}
                    alt={nomeExibicao || 'Perfil'}
                    className="h-7 w-7 rounded-full object-cover"
                    style={{
                      border:
                        '1px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                    }}
                    onError={() => setAvatarErro(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {avatarInitial}
                  </span>
                )}

                <span className="hidden md:inline max-w-[140px] truncate">
                  {nomeExibicao || 'Minha conta'}
                </span>
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-xl overflow-hidden shadow-xl border z-[45]"
                  style={{
                    borderColor: 'var(--c-border-strong, var(--c-border))',
                    background: 'var(--surface-elevated, var(--surface))',
                    color: 'var(--text)',
                  }}
                  role="menu"
                >
                  {/* Cabeçalho da conta */}
                  <div
                    className="px-3 py-2 border-b"
                    style={{ borderColor: 'var(--c-border)' }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-[0.16em]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Minha conta
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {nomeExibicao || 'Associado'}
                    </p>
                  </div>

                  {/* Itens do menu */}
                  <Link
                    to="/area"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <UserSquare2 size={14} />
                    <span>Área do associado</span>
                  </Link>

                  <Link
                    to="/perfil"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <User size={14} />
                    <span>Meu perfil</span>
                  </Link>

                  <div
                    className="h-px mx-3"
                    style={{ background: 'var(--c-border)' }}
                  />

                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-[var(--danger, #b91c1c)]"
                    onClick={() => {
                      setShowProfileMenu(false)
                      logout()
                    }}
                    role="menuitem"
                  >
                    <LogOut size={14} />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Quando não logado, exibe CTA de entrada
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
              style={{
                borderColor: 'var(--primary)',
                background:
                  'color-mix(in srgb, var(--primary) 10%, var(--surface) 90%)',
                color: 'var(--primary)',
              }}
            >
              <UserSquare2 className="h-4 w-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}

          {/* Trigger do menu mobile (somente até md) */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
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
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--c-border)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isLogged && (
                  <div
                    className="inline-flex items-center justify-center rounded-full border h-8 w-8 overflow-hidden shrink-0"
                    style={{ borderColor: 'var(--c-border)' }}
                  >
                    {avatarUrl && !avatarErro ? (
                      <img
                        src={avatarUrl}
                        alt={nomeExibicao || 'Perfil'}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={() => setAvatarErro(true)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ background: 'var(--primary)', color: '#fff' }}
                      >
                        {avatarInitial}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold tracking-wide">
                    Menu
                  </span>
                  {isLogged && (
                    <span
                      className="text-[11px] truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {nomeExibicao || 'Associado'}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
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
            </nav>

            {/* Ações de conta no mobile: Área, Perfil, Sair */}
            {isLogged && (
              <div
                className="border-t px-4 py-3 space-y-1"
                style={{ borderColor: 'var(--c-border)' }}
              >
                <Link
                  to="/area"
                  className="flex items-center gap-2 text-sm py-1.5 hover:bg-black/5 rounded-lg px-2 dark:hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserSquare2 size={14} />
                  <span>Área do associado</span>
                </Link>

                <Link
                  to="/perfil"
                  className="flex items-center gap-2 text-sm py-1.5 hover:bg-black/5 rounded-lg px-2 dark:hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  <User size={14} />
                  <span>Meu perfil</span>
                </Link>

                <button
                  type="button"
                  className="w-full flex items-center gap-2 text-sm py-1.5 hover:bg-black/5 rounded-lg px-2 dark:hover:bg-white/5 text-[var(--danger, #b91c1c)]"
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                >
                  <LogOut size={14} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
