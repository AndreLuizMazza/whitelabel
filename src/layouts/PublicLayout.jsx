// src/layouts/PublicLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar.jsx'
import Footer from '@/components/Footer.jsx'
import CookieBanner from '@/components/CookieBanner.jsx'
import StickyContactDock from '@/components/StickyContactDock.jsx'
import GlobalShell from '@/layouts/GlobalShell.jsx'

function useHideContactDock(pathname) {
  return (
    pathname === '/cadastro' ||
    pathname === '/confirmacao' ||
    pathname === '/memorial' ||
    pathname.startsWith('/memorial/') ||
    pathname === '/produtos' ||
    pathname.startsWith('/produtos/') ||
    (pathname.startsWith('/planos/') && pathname !== '/planos')
  )
}

function useHideFooter(pathname) {
  return (
    pathname === '/cadastro' ||
    pathname === '/confirmacao' ||
    pathname.startsWith('/planos/') ||
    pathname.startsWith('/produtos/')
  )
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  const hideContactDock = useHideContactDock(pathname)
  const hideFooter = useHideFooter(pathname)

  return (
    <GlobalShell>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <CookieBanner />
      {!hideFooter && <Footer />}
      {!hideContactDock && (
        <StickyContactDock
          position="bottom-left"
          extraAction={{
            label: 'Planos',
            href: '/planos',
            ariaLabel: 'Abrir simulador de planos',
            badge: 'Novo',
          }}
          avoidSelector="[data-cookie-banner], [data-bottom-avoid]"
          reserveSpace
          compactNearFooter
          hideOnKeyboard
          autoHideOnScroll
        />
      )}
    </GlobalShell>
  )
}
