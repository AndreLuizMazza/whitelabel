// src/components/Navbar.jsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState, useMemo, useRef } from 'react'
import { Menu, X, UserSquare2, User, LogOut } from 'lucide-react'

import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import ThemeToggle from './ThemeToggle.jsx'
import HeaderNotificationsBell from '@/components/HeaderNotificationsBell.jsx'
import { getAvatarBlobUrl } from '@/lib/profile'

import { MAIN_MENU_LINKS, PRIVATE_MENU_LINKS } from '@/layouts/GlobalShell.jsx'
import { getTenantInitials, resolveTenantLogoUrl } from '@/lib/tenantBranding'

/* ===================== runtime (Capacitor) ===================== */
function isCapacitorRuntime() {
  if (typeof window === 'undefined') return false
  const cap = window.Capacitor
  if (!cap) return false
  if (typeof cap.isNativePlatform === 'function') return !!cap.isNativePlatform()
  if (typeof cap.getPlatform === 'function') return cap.getPlatform() !== 'web'
  return true
}

export default function Navbar() {
  const { isAuthenticated, token, user, logout } = useAuth((s) => ({
    isAuthenticated: s.isAuthenticated,
    token: s.token,
    user: s.user,
    logout: s.logout,
  }))
  const empresa = useTenant((s) => s.empresa)

  const nomeEmpresa = empresa?.nomeFantasia || empresa?.nome || 'Logo'
  const logoUrl = resolveTenantLogoUrl()
  const isLogged = isAuthenticated() || !!token || !!user

  const [mobileOpen, setMobileOpen] = useState(false)
  const [elderMode, setElderMode] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('elder_mode') === 'on'
    } catch {
      return false
    }
  })
  const location = useLocation()

  // Detecta se está dentro do app (Capacitor)
  const inCapacitorApp = useMemo(() => isCapacitorRuntime(), [])

  // Marca o <html> (opcional, mas útil para CSS)
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (inCapacitorApp) document.documentElement.dataset.embedded = 'capacitor'
    else delete document.documentElement.dataset.embedded
  }, [inCapacitorApp])

  /* ===== Conta / Avatar ===== */
  const nomeExibicao = useMemo(() => user?.nome ?? user?.email ?? '', [user])

  const avatarInitial = useMemo(() => {
    const base = user?.nome || user?.email || 'U'
    return base.trim().charAt(0).toUpperCase()
  }, [user])

  const tenantInitials = useMemo(() => getTenantInitials(empresa), [empresa])

  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null)
  const [avatarErro, setAvatarErro] = useState(false)
  const lastObjUrlRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const fotoDeclarada = user?.fotoUrl || user?.photoURL || ''
  const avatarUrl = avatarErro ? '' : (avatarBlobUrl || fotoDeclarada || '')

  // ===== Publica altura real da navbar em CSS var (para steppers sticky baterem certinho)
  const headerRef = useRef(null)
  useEffect(() => {
    if (!headerRef.current) return

    const apply = () => {
      const h = headerRef.current?.offsetHeight || 0
      document.documentElement.style.setProperty('--app-navbar-h', `${h}px`)
    }

    apply()

    let ro
    try {
      ro = new ResizeObserver(() => apply())
      ro.observe(headerRef.current)
    } catch {
      window.addEventListener('resize', apply)
    }

    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [])

  // Carrega avatar
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
        if (lastObjUrlRef.current) URL.revokeObjectURL(lastObjUrlRef.current)
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

  // Fecha menus ao trocar rota
  useEffect(() => {
    setMobileOpen(false)
    setShowProfileMenu(false)
  }, [location.pathname])

  // Bloqueia scroll com drawer aberto
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProfileMenu])

  // Flag para dock de contato
  useEffect(() => {
    const root = document.documentElement
    if (mobileOpen) root.setAttribute('data-mobile-drawer-open', 'true')
    else root.removeAttribute('data-mobile-drawer-open')
    return () => root.removeAttribute('data-mobile-drawer-open')
  }, [mobileOpen])

  // Modo idoso
  useEffect(() => {
    const root = document.documentElement
    if (elderMode) root.setAttribute('data-elder-mode', 'on')
    else root.removeAttribute('data-elder-mode')
    try {
      localStorage.setItem('elder_mode', elderMode ? 'on' : 'off')
    } catch {}
  }, [elderMode])

  const linkClass = ({ isActive }) =>
    'relative pl-4 pr-3 py-2 flex items-center gap-2 whitespace-nowrap rounded-md transition-colors duration-150 ' +
    (isActive
      ? 'text-[var(--nav-active-color)] font-semibold bg-[var(--nav-active-bg)]'
      : 'text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--nav-hover-bg)]')

  const ActiveBar = ({ isActive }) =>
    isActive ? (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded bg-[var(--primary)]" />
    ) : null

  function handleLogoClick(e) {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ✅ Keys que DEVEM sumir dentro do app (Capacitor)
  // No seu GlobalShell: 2ª via = "segunda-via", benefícios = "beneficios"
  const HIDE_IN_CAPACITOR_KEYS = useMemo(() => ['segunda-via', 'beneficios'], [])

  // Links exibidos no DESKTOP: apenas Planos, Benefícios, Memorial
  // (no Capacitor: remove Benefícios)
  const DESKTOP_MENU = MAIN_MENU_LINKS
    .filter((item) => ['planos', 'beneficios', 'memorial'].includes(item.key))
    .filter((item) => !(inCapacitorApp && item.key === 'beneficios'))

  // Menu completo usado no MOBILE (global)
  const fullMobileMenuBase = isLogged
    ? [...MAIN_MENU_LINKS, { divider: true }, ...PRIVATE_MENU_LINKS]
    : MAIN_MENU_LINKS

  // ✅ no Capacitor: remove 2ª via + benefícios (mantém divider)
  const fullMobileMenu = useMemo(() => {
    if (!inCapacitorApp) return fullMobileMenuBase
    return fullMobileMenuBase.filter(
      (item) => item?.divider || !HIDE_IN_CAPACITOR_KEYS.includes(item?.key)
    )
  }, [inCapacitorApp, fullMobileMenuBase, HIDE_IN_CAPACITOR_KEYS])

  const isHashActive = (item) => {
    if (!item.to.startsWith('/#')) return false
    return location.pathname === '/' && location.hash === item.to.replace('/', '')
  }

  return (
    <header
      ref={headerRef}
      data-app-navbar="true"
      className="w-full border-b bg-[var(--surface)] sticky top-0 z-40 shadow-sm"
    >
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

        {/* Navegação desktop – enxuta */}
        <div className="hidden md:flex flex-1 justify-center min-w-0">
          <nav className="flex flex-wrap items-center justify-center gap-x-1 lg:gap-x-2 gap-y-1 text-[13px] lg:text-sm">
            {DESKTOP_MENU.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.key} to={item.to} className={linkClass} end={item.exact}>
                  {({ isActive }) => (
                    <>
                      <ActiveBar isActive={isActive} />
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLogged && (
            <div className="flex items-center gap-1">
              <HeaderNotificationsBell />
            </div>
          )}

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {!isLogged && (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/planos"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow transition"
                style={{ background: 'var(--primary)', color: '#fff' }}
                aria-label="Fazer adesão"
              >
                Fazer adesão
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                style={{
                  borderColor: 'var(--c-border)',
                  background: 'color-mix(in srgb, var(--surface) 92%, var(--primary) 8%)',
                  color: 'var(--text)',
                }}
                aria-label="Entrar"
              >
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            </div>
          )}

          {isLogged ? (
            <div className="relative" ref={profileMenuRef}>
              {/* Avatar desktop */}
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
                    className="h-8 w-8 rounded-full object-cover"
                    style={{
                      border: '1px solid color-mix(in srgb, var(--primary) 60%, transparent)',
                    }}
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

                <span className="hidden lg:inline max-w-[160px] truncate">
                  {nomeExibicao || 'Minha conta'}
                </span>
              </button>

              {/* Avatar mobile -> abre drawer */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden inline-flex items-center justify-center rounded-full border h-10 w-10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                aria-label="Abrir menu"
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
              </button>

              {/* Menu de perfil desktop */}
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
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                      Minha conta
                    </p>
                    <p className="text-sm font-semibold truncate">{nomeExibicao || 'Associado'}</p>
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
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <User size={14} />
                    <span>Meu perfil</span>
                  </Link>

                  <div className="h-px mx-3" style={{ background: 'var(--c-border)' }} />

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
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
              aria-label="Abrir menu"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Drawer mobile – usa o mesmo menu global do GlobalShell */}
      {mobileOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-[1200] md:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />

          <div
            className="absolute inset-y-0 right-0 w-80 max-w-[85%] bg-[var(--surface)] flex flex-col shadow-2xl rounded-l-2xl overflow-hidden z-[1201]"
            data-bottom-avoid="true"
          >
            {/* HEADER PREMIUM */}
            <div className="flex items-center gap-4 px-5 py-5 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <div
                className={(elderMode ? 'h-20 w-20' : 'h-16 w-16') + ' rounded-full overflow-hidden border'}
                style={{ borderColor: 'var(--c-border)' }}
              >
                {isLogged && avatarUrl && !avatarErro ? (
                  <img src={avatarUrl} alt={nomeExibicao || 'Perfil'} className="h-full w-full object-cover" onError={() => setAvatarErro(true)} />
                ) : (
                  <span
                    className={(elderMode ? 'text-2xl' : 'text-xl') + ' inline-flex h-full w-full items-center justify-center font-semibold'}
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {isLogged ? avatarInitial : tenantInitials}
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                {isLogged ? (
                  <>
                    <p className={'font-semibold leading-tight truncate ' + (elderMode ? 'text-lg' : 'text-base')}>
                      {nomeExibicao || 'Associado'}
                    </p>
                    <p
                      className={'mt-1 truncate uppercase tracking-[0.18em] ' + (elderMode ? 'text-[12px]' : 'text-[11px]')}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {empresa?.nomeFantasia || 'Minha Empresa'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--primary)' }}>
                      {empresa?.nomeFantasia || 'Minha Empresa'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      Acesse planos e faça sua adesão
                    </p>
                  </>
                )}
              </div>

              <button
                className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CTA (não logado) – topo do drawer */}
            {!isLogged && (
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <Link
                  to="/planos"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-sm hover:shadow transition"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Fazer adesão
                </Link>

                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition"
                  style={{ borderColor: 'var(--c-border)', color: 'var(--text)' }}
                >
                  <UserSquare2 className="h-5 w-5" />
                  <span>Entrar</span>
                </Link>
              </div>
            )}

            {/* MENU GLOBAL (público + privado) */}
            <nav className="flex-1 overflow-y-auto text-sm py-2">
              {fullMobileMenu.map((item, i) =>
                item.divider ? (
                  <div key={'div-' + i} className="my-3 mx-5 border-t border-dashed border-[var(--c-border)]" />
                ) : item.to.startsWith('/#') ? (
                  <a
                    key={item.key}
                    href={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 mx-3 rounded-lg ${
                      isHashActive(item)
                        ? 'bg-[var(--nav-active-bg)] text-[var(--primary)] font-semibold'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-5 w-5 text-[var(--primary)]" />
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-3 mx-3 rounded-lg ${
                        isActive
                          ? 'bg-[var(--nav-active-bg)] text-[var(--primary)] font-semibold'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 text-[var(--primary)]" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              )}
            </nav>

            {/* Aparência (Tema + Modo idoso) */}
            <div className="border-t px-5 py-3 md:hidden" style={{ borderColor: 'var(--c-border)' }}>
              <p className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Aparência
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--c-border)' }}>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Tema</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Claro / Escuro automático
                    </span>
                  </div>
                  <ThemeToggle />
                </div>

                <button
                  type="button"
                  onClick={() => setElderMode((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm border hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--c-border)' }}
                  aria-pressed={elderMode}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Modo idoso</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Letras maiores e mais contraste
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: elderMode
                        ? 'color-mix(in srgb, var(--primary) 20%, var(--surface) 80%)'
                        : 'transparent',
                      color: elderMode ? 'var(--primary)' : 'var(--text-muted)',
                      border: elderMode
                        ? '1px solid color-mix(in srgb, var(--primary) 50%, transparent)'
                        : '1px solid transparent',
                    }}
                  >
                    {elderMode ? 'Ativado' : 'Desativado'}
                  </span>
                </button>
              </div>
            </div>

            {!isLogged && (
              <div
                className="border-t px-5 py-4"
                style={{
                  borderColor: 'var(--c-border)',
                  background: 'color-mix(in srgb, var(--surface) 92%, var(--primary) 8%)',
                }}
              >
                <Link
                  to="/planos"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center rounded-2xl px-4 py-3 font-semibold shadow-sm hover:shadow transition"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Fazer adesão
                </Link>
              </div>
            )}

            {isLogged && (
              <div className="border-t px-5 py-4" style={{ borderColor: 'var(--c-border)' }}>
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
