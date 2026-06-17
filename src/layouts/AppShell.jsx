// src/layouts/AppShell.jsx
import { NavLink } from 'react-router-dom'
import {
  UserSquare2,
  UsersRound,
  Receipt,
  IdCard,
  Settings,
  LogOut,
} from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { useTenantLogoUrl } from '@/lib/tenantLogoRuntime'
import HeaderNotificationsBell from '@/components/HeaderNotificationsBell.jsx'
import ThemeToggle from '@/components/ThemeToggle.jsx'

const MENU = [
  { to: '/area', label: 'Início', shortLabel: 'Início', icon: UserSquare2 },
  { to: '/area/dependentes', label: 'Dependentes', shortLabel: 'Deps', icon: UsersRound },
  { to: '/area/pagamentos', label: 'Pagamentos', shortLabel: 'Pagos', icon: Receipt },
  { to: '/carteirinha', label: 'Carteirinha', shortLabel: 'Cartão', icon: IdCard },
  { to: '/perfil', label: 'Perfil', shortLabel: 'Perfil', icon: Settings },
]

function NavItem({ item, compact = false }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/area'}
      className={({ isActive }) =>
        compact
          ? `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-muted)]'
            }`
          : `group flex items-center gap-3 px-6 py-3 text-sm font-medium transition rounded-lg mx-3 mb-1 ${
              isActive
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text)]'
            }`
      }
    >
      {({ isActive }) =>
        compact ? (
          <>
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.shortLabel}</span>
          </>
        ) : (
          <>
            <span className="text-[var(--primary)] group-hover:scale-110 transition">
              <Icon size={20} />
            </span>
            <span>{item.label}</span>
          </>
        )
      }
    </NavLink>
  )
}

export default function AppShell({ children }) {
  const logout = useAuth((s) => s.logout)
  const tenant = useTenant((s) => s.empresa)
  const logoUrl = useTenantLogoUrl()

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      {/* Sidebar — desktop only */}
      <aside
        className="
          hidden md:flex flex-col
          w-64 shrink-0 border-r
          bg-[var(--surface)]/80 backdrop-blur-xl
          border-[var(--c-border)]
          sticky top-0 h-screen
        "
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--c-border)]">
          <img
            src={logoUrl}
            className="h-9 w-auto object-contain"
            alt={tenant?.nomeFantasia || 'Empresa'}
          />
          <div>
            <p className="font-semibold text-sm leading-tight">
              {tenant?.nomeFantasia || 'Minha Empresa'}
            </p>
            <span
              className="text-[11px] uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Conta do associado
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {MENU.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-[var(--c-border)] p-4">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/5 min-h-[44px]"
            style={{ color: 'var(--danger, #dc2626)' }}
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header
          className="
            md:hidden sticky top-0 z-30
            flex items-center justify-between
            px-4 py-3 border-b border-[var(--c-border)]
            bg-[var(--surface)]/90 backdrop-blur-xl
          "
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <img src={logoUrl} className="h-8 w-auto object-contain" alt="Logo" />
          <div className="flex items-center gap-2">
            <HeaderNotificationsBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Content — extra bottom padding for mobile tab bar */}
        <main className="flex-1 px-4 md:px-10 py-4 md:py-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Bottom tab bar — mobile only */}
        <nav
          className="
            md:hidden fixed bottom-0 inset-x-0 z-40
            flex items-stretch
            border-t border-[var(--c-border)]
            bg-[var(--surface)]/95 backdrop-blur-xl
          "
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Navegação principal"
        >
          {MENU.map((item) => (
            <NavItem key={item.to} item={item} compact />
          ))}
        </nav>
      </div>
    </div>
  )
}
