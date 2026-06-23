// src/layouts/AuthLayout.jsx
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import useTenant from '@/store/tenant'
import { useTenantLogoUrl } from '@/lib/tenantLogoRuntime'
import ThemeToggle from '@/components/ThemeToggle.jsx'

const WIDE_AUTH_ROUTES = ['/criar-conta']

export default function AuthLayout() {
  const { pathname } = useLocation()
  const tenant = useTenant((s) => s.empresa)
  const logoUrl = useTenantLogoUrl()
  const brandName = tenant?.nomeFantasia || tenant?.nome || 'Plataforma'

  const isWide = WIDE_AUTH_ROUTES.includes(pathname)
  const contentMaxW = isWide ? 'max-w-5xl' : 'max-w-[420px]'
  const showDesktopBrand = !isWide

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--surface-alt, var(--surface))' }}
    >
      <header
        className="relative flex items-center justify-between px-4 py-3 border-b border-[var(--c-border)] bg-[var(--surface)]/95 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition min-h-[44px] min-w-[44px] -ml-2 pl-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
          <span className="hidden sm:inline">Voltar ao site</span>
        </Link>

        {logoUrl && (
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <img
              src={logoUrl}
              alt={brandName}
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          </div>
        )}

        <ThemeToggle />
      </header>

      <div
        className={`flex-1 flex flex-col items-center w-full mx-auto px-4 py-4 md:py-8 ${
          isWide ? 'justify-start' : 'justify-center'
        }`}
      >
        {showDesktopBrand && logoUrl && (
          <div className="hidden md:flex flex-col items-center gap-2 mb-8">
            <img
              src={logoUrl}
              alt={brandName}
              className="h-10 w-auto object-contain"
            />
            <p
              className="text-sm font-medium text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              {brandName}
            </p>
          </div>
        )}

        <div className={`w-full ${contentMaxW}`}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
