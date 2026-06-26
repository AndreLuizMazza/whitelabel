// src/components/Navbar.jsx
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X, UserSquare2, User, LogOut } from 'lucide-react'

import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import ThemeToggle from './ThemeToggle.jsx'
import HeaderNotificationsBell from '@/components/HeaderNotificationsBell.jsx'
import { getAvatarBlobUrl } from '@/lib/profile'

import { getDesktopNavLinks, getGroupedPublicMenu } from '@/lib/publicMenu'
import { getTenantInitials } from '@/lib/tenantBranding'
import { useTenantLogoUrl } from '@/lib/tenantLogoRuntime'
import { getProdutosMenuTo } from '@/lib/produtoUtils'
import AppBuildInfo from '@/components/AppBuildInfo.jsx'

/* ===================== runtime (Capacitor) ===================== */
function isCapacitorRuntime() {
  if (typeof window === 'undefined') return false
  const cap = window.Capacitor
  if (!cap) return false
  if (typeof cap.isNativePlatform === 'function') return !!cap.isNativePlatform()
  if (typeof cap.getPlatform === 'function') return cap.getPlatform() !== 'web'
  return true
}

function getPortalRoot() {
  if (typeof document === 'undefined') return null
  return document.body
}

function MobileMenuTrigger({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-2 rounded-full h-10 px-3.5 border text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] transition-all active:scale-[0.98] shrink-0"
      style={{
        borderColor: open
          ? 'color-mix(in srgb, var(--primary) 55%, transparent)'
          : 'var(--c-border)',
        background: open
          ? 'color-mix(in srgb, var(--primary) 14%, var(--surface))'
          : 'var(--surface)',
        color: open ? 'var(--primary)' : 'var(--text)',
        boxShadow: open
          ? '0 0 0 1px color-mix(in srgb, var(--primary) 20%, transparent)'
          : '0 1px 2px rgba(15,23,42,.06)',
      }}
      aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
      aria-controls="mobile-menu"
      aria-expanded={open}
    >
      {open ? <X className="h-5 w-5" strokeWidth={2.25} /> : <Menu className="h-5 w-5" strokeWidth={2.25} />}
      <span>Menu</span>
    </button>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { isLoggedIn, user, logout } = useAuth((s) => ({
    isLoggedIn: s.isLoggedIn,
    user: s.user,
    logout: s.logout,
  }))
  const isLogged = isLoggedIn()
  const empresa = useTenant((s) => s.empresa)

  const nomeEmpresa = empresa?.nomeFantasia || empresa?.nome || 'Logo'
  const logoUrl = useTenantLogoUrl()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

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
    'relative px-3 py-2 flex items-center gap-2 whitespace-nowrap rounded-full text-[13px] xl:text-sm font-medium transition-all duration-200 ' +
    (isActive
      ? 'text-[var(--primary)] font-semibold bg-[var(--nav-active-bg)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_22%,transparent)]'
      : 'text-[var(--text)] hover:text-[var(--primary)] hover:bg-[var(--nav-hover-bg)]')

  const ActiveBar = ({ isActive }) =>
    isActive ? (
      <span
        className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-[var(--primary)]"
        aria-hidden="true"
      />
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

  const desktopNavLinks = useMemo(
    () =>
      getDesktopNavLinks(empresa, {
        hideKeys: inCapacitorApp ? HIDE_IN_CAPACITOR_KEYS : [],
      }),
    [empresa, inCapacitorApp, HIDE_IN_CAPACITOR_KEYS]
  )

  const fullMobileMenuBase = useMemo(
    () => getGroupedPublicMenu(empresa),
    [empresa]
  )

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

  const portalRoot = getPortalRoot()

  const mobileDrawer =
    mobileOpen && portalRoot
      ? createPortal(
          <div
            id="mobile-menu"
            className="fixed inset-0 z-[2000] lg:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="Menu de navegação"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[3px] transition-opacity"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            />

            <div
              className="absolute inset-y-0 right-0 w-[min(100vw-1rem,22rem)] max-w-[92vw] bg-[var(--surface)] flex flex-col shadow-2xl rounded-l-3xl overflow-hidden border-l"
              style={{
                borderColor: 'var(--c-border)',
                boxShadow: '0 24px 80px rgba(15,23,42,.28)',
              }}
              data-bottom-avoid="true"
            >
              <div
                className="flex items-center gap-4 px-5 py-5 border-b"
                style={{ borderColor: 'var(--c-border)' }}
              >
                <div
                  className={(elderMode ? 'h-20 w-20' : 'h-16 w-16') + ' rounded-full overflow-hidden border shrink-0'}
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
                      className={
                        (elderMode ? 'text-2xl' : 'text-xl') +
                        ' inline-flex h-full w-full items-center justify-center font-semibold'
                      }
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      {isLogged ? avatarInitial : tenantInitials}
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  {isLogged ? (
                    <>
                      <p
                        className={
                          'font-semibold leading-tight truncate ' + (elderMode ? 'text-lg' : 'text-base')
                        }
                      >
                        {nomeExibicao || 'Associado'}
                      </p>
                      <p
                        className={
                          'mt-1 truncate uppercase tracking-[0.18em] ' +
                          (elderMode ? 'text-[12px]' : 'text-[11px]')
                        }
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {empresa?.nomeFantasia || 'Minha Empresa'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        className="text-sm font-semibold leading-tight truncate"
                        style={{ color: 'var(--primary)' }}
                      >
                        {empresa?.nomeFantasia || 'Minha Empresa'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        Planos, benefícios e atendimento
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

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

              <nav className="flex-1 overflow-y-auto text-sm py-2" aria-label="Menu principal">
                {fullMobileMenu.map((item, i) =>
                  item.divider ? (
                    <div
                      key={'div-' + i}
                      className="my-3 mx-5 border-t border-dashed border-[var(--c-border)]"
                    />
                  ) : item.to.startsWith('/#') ? (
                    <a
                      key={item.key}
                      href={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3.5 mx-3 rounded-xl transition-colors ${
                        isHashActive(item)
                          ? 'bg-[var(--nav-active-bg)] text-[var(--primary)] font-semibold'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10'
                      }`}
                    >
                      <item.icon className="h-5 w-5 text-[var(--primary)] shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <NavLink
                      key={item.key}
                      to={
                        item.key === 'produtos'
                          ? getProdutosMenuTo(location.pathname, location.search)
                          : item.to
                      }
                      end={item.exact || item.key === 'produtos'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-5 py-3.5 mx-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-[var(--nav-active-bg)] text-[var(--primary)] font-semibold'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 text-[var(--primary)] shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                )}
              </nav>

              <div className="border-t px-5 py-3" style={{ borderColor: 'var(--c-border)' }}>
                <p
                  className="text-[11px] uppercase tracking-[0.16em] mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Aparência
                </p>

                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border"
                    style={{ borderColor: 'var(--c-border)' }}
                  >
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
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm border hover:bg-black/5 dark:hover:bg-white/5"
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

                <AppBuildInfo variant="compact" className="mt-3 px-3 text-[10px] tabular-nums opacity-70" />
              </div>

              {isLogged ? (
                <div className="border-t px-5 py-4" style={{ borderColor: 'var(--c-border)' }}>
                  <Link
                    to="/area"
                    onClick={() => setMobileOpen(false)}
                    className="mb-2 flex items-center gap-3 px-4 py-3 text-sm rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <UserSquare2 className="h-5 w-5 text-[var(--primary)]" />
                    <span>Área do associado</span>
                  </Link>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/5 text-[var(--danger, #b91c1c)]"
                    onClick={() => {
                      setMobileOpen(false)
                      void handleLogout()
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
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
            </div>
          </div>,
          portalRoot
        )
      : null

  return (
    <header
      ref={headerRef}
      data-app-navbar="true"
      className="w-full border-b bg-[var(--surface)]/95 backdrop-blur-md sticky top-0 z-40 shadow-sm"
    >
      <div className="container-max flex items-center justify-between flex-nowrap py-2.5 lg:py-3 gap-2 lg:gap-4">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center h-10 md:h-12 lg:h-14 flex-shrink-0 max-w-[55%]"
          aria-label={nomeEmpresa}
        >
          <img
            key={logoUrl}
            src={logoUrl}
            alt={nomeEmpresa}
            className="h-10 md:h-12 lg:h-14 w-auto max-w-full object-contain"
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* Navegação desktop — menu institucional completo */}
        <div className="hidden lg:flex flex-1 justify-center min-w-0 px-2">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-0.5 xl:gap-x-1 gap-y-1 text-[12px] xl:text-[13px]"
            aria-label="Navegação principal"
          >
            {desktopNavLinks.map((item) => {
              if (item.to.startsWith('/#')) {
                return (
                  <a
                    key={item.key}
                    href={item.to}
                    className={
                      linkClass({ isActive: isHashActive(item) }) +
                      ' px-2 xl:px-2.5 py-1.5'
                    }
                  >
                    <ActiveBar isActive={isHashActive(item)} />
                    <span>{item.label}</span>
                  </a>
                )
              }

              return (
                <NavLink
                  key={item.key}
                  to={
                    item.key === 'produtos'
                      ? getProdutosMenuTo(location.pathname, location.search)
                      : item.to
                  }
                  className={({ isActive }) =>
                    linkClass({ isActive }) + ' px-2 xl:px-2.5 py-1.5'
                  }
                  end={item.exact || item.key === 'produtos'}
                >
                  {({ isActive }) => (
                    <>
                      <ActiveBar isActive={isActive} />
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

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {!isLogged && (
            <>
              <Link
                to="/planos"
                className="lg:hidden inline-flex items-center justify-center h-10 px-3.5 rounded-full text-xs font-semibold shadow-sm shrink-0"
                style={{ background: 'var(--primary)', color: '#fff' }}
                aria-label="Fazer adesão"
              >
                Adesão
              </Link>

              <div className="hidden lg:flex items-center gap-2">
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
            </>
          )}

          {isLogged ? (
            <div className="relative" ref={profileMenuRef}>
              {/* Avatar desktop */}
              <button
                type="button"
                onClick={() => setShowProfileMenu((v) => !v)}
                className="hidden lg:inline-flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-full border text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] transition-colors"
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

              {/* Avatar mobile — atalho para área (menu separado) */}
              <Link
                to="/area"
                className="lg:hidden inline-flex items-center justify-center rounded-full border h-10 w-10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] shrink-0"
                aria-label="Área do associado"
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
              </Link>

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
                      void handleLogout()
                    }}
                    role="menuitem"
                  >
                    <LogOut size={14} />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <MobileMenuTrigger open={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
        </div>
      </div>

      {mobileDrawer}
    </header>
  )
}
