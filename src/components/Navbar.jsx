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

// Iniciais do tenant (ex.: "Funerária Patense" -> "FP")
function getTenantInitials(empresa) {
  const nome =
    empresa?.nomeFantasia || empresa?.nome || empresa?.razaoSocial || 'T'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'T'
  const first = parts[0][0]
  const last = parts[parts.length - 1][0]
  return `${(first || 'T').toUpperCase()}${(last || '').toUpperCase()}`
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

  const tenantInitials = useMemo(
    () => getTenantInitials(empresa),
    [empresa]
  )

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

  // Fecha menu de perfil ao clicar fora (desktop)
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

  // Esconde o StickyContactDock quando o drawer mobile estiver aberto
  useEffect(() => {
    const root = document.documentElement
    if (mobileOpen) {
      root.setAttribute('data-mobile-drawer-open', 'true')
    } else {
      root.removeAttribute('data-mobile-drawer-open')
    }
    return () => {
      root.removeAttribute('data-mobile-drawer-open')
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

  // Clique na logo: se já estiver na Home, rola para o topo
  function handleLogoClick(e) {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header className="w-full border-b bg-[var(--surface)] sticky top-0 z-40 shadow-sm">
      <div className="container-max flex items-center justify-between flex-nowrap py-3 gap-3 sm:gap-4">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center h-10 md:h-12 lg:h-14 flex-shrink-0 max-w-[55%]"
          aria-label={nomeEmpresa}
        >
          <img
            src={logoUrl}
            alt={nomeEmpresa}
            className="h-10 md:h-12 lg:h-14 w-auto max-w-full object-contain"
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* Navegação desktop */}
        <div className="hidden md:flex flex-1 justify-center min-w-0">
          <nav className="flex flex-wrap items-center justify-center gap-x-1 lg:gap-x-2 gap-y-1 text-[13px] lg:text-sm">
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
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLogged && (
            <div className="flex items-center gap-1">
              {/* sineta já vem como botão; apenas alinhamento ao avatar */}
              <HeaderNotificationsBell />
            </div>
          )}

          {/* Theme toggle apenas na navbar em md+; no mobile vai para o drawer */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {isLogged ? (
            <div className="relative" ref={profileMenuRef}>
              {/* Avatar DESKTOP: abre menu de perfil */}
              <button
                type="button"
                onClick={() => setShowProfileMenu((v) => !v)}
                className="hidden md:inline-flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-full border text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] transition-colors"
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
                    className="h-9 w-9 rounded-full object-cover"
                    style={{
                      border:
                        '1px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                    }}
                    onError={() => setAvatarErro(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {avatarInitial}
                  </span>
                )}

                <span className="hidden lg:inline max-w-[140px] truncate">
                  {nomeExibicao || 'Minha conta'}
                </span>
              </button>

              {/* Avatar MOBILE: vira botão do menu lateral */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden inline-flex items-center justify-center rounded-full border h-9 w-9 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                aria-label="Abrir menu"
              >
                {avatarUrl && !avatarErro ? (
                  <img
                    src={avatarUrl}
                    alt={nomeExibicao || 'Perfil'}
                    className="h-9 w-9 rounded-full object-cover"
                    onError={() => setAvatarErro(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {avatarInitial}
                  </span>
                )}
              </button>

              {/* Menu de perfil (apenas desktop) */}
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
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg:white/5"
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
            <>
              {/* CTA Entrar – com ícone mais amigável e rótulo sempre visível */}
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
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </Link>

              {/* Menu para visitante em mobile */}
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
            </>
          )}
        </div>
      </div>

      {/* Menu mobile como drawer lateral (direita -> esquerda) */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[1200] md:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay sobre tudo (inclui StickyContactDock) */}
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />

          {/* Drawer */}
          <div
            className="absolute inset-y-0 right-0 w-80 max-w-[85%] bg-[var(--surface)] flex flex-col shadow-2xl rounded-l-2xl overflow-hidden z-[1201]"
            data-bottom-avoid="true"
          >
            {/* HEADER PREMIUM */}
            <div
              className="flex items-center gap-4 px-5 py-5 border-b"
              style={{ borderColor: 'var(--c-border)' }}
            >
              {/* Avatar grande */}
              <div
                className="h-14 w-14 rounded-full overflow-hidden border"
                style={{ borderColor: 'var(--c-border)' }}
              >
                {isLogged && avatarUrl && !avatarErro ? (
                  <img
                    src={avatarUrl}
                    alt={nomeExibicao || 'Perfil'}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarErro(true)}
                  />
                ) : (
                  <span
                    className="inline-flex h-full w-full items-center justify-center text-lg font-semibold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {isLogged ? avatarInitial : tenantInitials}
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                {/* Nome do tenant */}
                <p
                  className="text-sm font-semibold leading-tight truncate"
                  style={{ color: 'var(--primary)' }}
                >
                  {empresa?.nomeFantasia || 'Minha Funerária'}
                </p>

                {/* Usuário ou call-to-action */}
                <p
                  className="text-xs truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isLogged
                    ? nomeExibicao || 'Associado'
                    : 'Entre para acessar sua conta'}
                </p>
              </div>

              {/* Botão fechar */}
              <button
                className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CTA Entrar para visitantes */}
            {!isLogged && (
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: 'var(--c-border)' }}
              >
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                  }}
                >
                  <UserSquare2 className="h-5 w-5" />
                  <span>Entrar na área do associado</span>
                </Link>
              </div>
            )}

            {/* SEÇÃO: Conta (somente se logado) */}
            {isLogged && (
              <nav className="py-3 text-sm">
                <Link
                  to="/area"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg mx-3"
                >
                  <UserSquare2 className="h-5 w-5" />
                  <span>Área do Associado</span>
                </Link>

                <Link
                  to="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg mx-3"
                >
                  <User className="h-5 w-5" />
                  <span>Meu Perfil</span>
                </Link>
              </nav>
            )}

            {/* DIVISOR */}
            <div
              className="h-px mx-5 my-2"
              style={{ background: 'var(--c-border)' }}
            />

            {/* SEÇÃO: Navegação principal */}
            <nav className="flex-1 overflow-y-auto text-sm py-2">
              {[
                { to: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
                {
                  to: '/planos',
                  label: 'Planos',
                  icon: <Layers className="h-5 w-5" />,
                },
                {
                  to: '/memorial',
                  label: 'Memorial',
                  icon: <HeartHandshake className="h-5 w-5" />,
                },
                {
                  to: '/filiais',
                  label: 'Unidades',
                  icon: <MapPin className="h-5 w-5" />,
                },
                {
                  to: '/beneficios',
                  label: 'Clube de Benefícios',
                  icon: <Gift className="h-5 w-5" />,
                },
                {
                  to: '/contratos',
                  label: '2° Via',
                  icon: <FileText className="h-5 w-5" />,
                },
              ].map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3 mx-3 rounded-lg ${
                      isActive
                        ? 'bg-[var(--nav-active-bg)] text-[var(--primary)] font-semibold'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {icon}
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* SEÇÃO: Aparência (ThemeToggle) */}
            <div
              className="border-t px-5 py-3 md:hidden"
              style={{ borderColor: 'var(--c-border)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">Aparência</span>
                <ThemeToggle />
              </div>
            </div>

            {/* BOTÃO SAIR – sempre visível acima do StickyContactDock */}
            {isLogged && (
              <div
                className="border-t px-5 py-4"
                style={{ borderColor: 'var(--c-border)' }}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 text-[var(--danger, #b91c1c)]"
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                >
                  <LogOut className="h-5 w-5" />
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
