// src/layouts/AuthLayout.jsx
import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import useTenant from '@/store/tenant'
import { useTenantLogoUrl } from '@/lib/tenantLogoRuntime'
import ThemeToggle from '@/components/ThemeToggle.jsx'

export default function AuthLayout() {
  const tenant = useTenant((s) => s.empresa)
  const logoUrl = useTenantLogoUrl()
  const brandName = tenant?.nomeFantasia || tenant?.nome || 'Plataforma'

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
      {/* Header minimal */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-[var(--c-border)]"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Voltar ao site
        </Link>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Tenant brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={brandName}
              className="h-10 w-auto object-contain"
            />
          )}
          <p
            className="text-sm font-medium text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {brandName}
          </p>
        </div>

        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
