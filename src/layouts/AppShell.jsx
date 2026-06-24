// src/layouts/AppShell.jsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  House,
  UsersRound,
  Receipt,
  IdCard,
  CircleUserRound,
  LogOut,
} from 'lucide-react'
import useAuth from '@/store/auth'
import useTenant from '@/store/tenant'
import { useTenantLogoUrl } from '@/lib/tenantLogoRuntime'
import HeaderNotificationsBell from '@/components/HeaderNotificationsBell.jsx'
import ThemeToggle from '@/components/ThemeToggle.jsx'

const MENU = [
  { to: '/area', label: 'Início', shortLabel: 'Início', icon: House },
  { to: '/area/dependentes', label: 'Dependentes', shortLabel: 'Deps', icon: UsersRound },
  {
    to: '/carteirinha',
    label: 'Carteirinha',
    shortLabel: 'Cartão',
    icon: IdCard,
    center: true,
  },
  { to: '/area/pagamentos', label: 'Pagamentos', shortLabel: 'Pagos', icon: Receipt },
  { to: '/perfil', label: 'Perfil', shortLabel: 'Perfil', icon: CircleUserRound },
]

function NavItem({ item, compact = false }) {
  const Icon = item.icon

  if (compact && item.center) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `flex flex-col items-center justify-end flex-1 min-w-0 -mt-3 pb-0.5 ${
            isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-full transition-transform active:scale-[0.96]"
              style={{
                background: 'var(--primary)',
                color: 'var(--on-primary, #fff)',
                boxShadow: isActive
                  ? '0 6px 20px color-mix(in srgb, var(--primary) 38%, transparent), 0 0 0 2.5px var(--surface)'
                  : '0 4px 16px color-mix(in srgb, var(--primary) 28%, transparent), 0 0 0 2.5px var(--surface)',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
            </span>
            <span className="text-[10px] font-semibold mt-1 leading-none tracking-tight">
              {item.shortLabel}
            </span>
          </>
        )}
      </NavLink>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/area'}
      className={({ isActive }) =>
        compact
          ? `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[49px] py-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-muted)] opacity-90'
            }`
          : `group flex items-center gap-3 px-6 py-3 text-[15px] font-normal transition rounded-[10px] mx-3 mb-0.5 ${
              isActive
                ? 'bg-[var(--nav-active-bg)] text-[var(--primary)] font-medium'
                : 'hover:bg-[var(--nav-hover-bg)] text-[var(--text)]'
            }`
      }
    >
      {({ isActive }) =>
        compact ? (
          <>
            <Icon size={21} strokeWidth={isActive ? 2.15 : 1.65} />
            <span className="leading-none tracking-tight">{item.shortLabel}</span>
          </>
        ) : (
          <>
            <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
            <span>{item.label}</span>
          </>
        )
      }
    </NavLink>
  )
}

export default function AppShell({ children }) {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const tenant = useTenant((s) => s.empresa)
  const logoUrl = useTenantLogoUrl()
  const location = useLocation()
  const isDashboardHome = location.pathname === '/area'

  return (
    <div className="member-ios flex min-h-screen bg-[var(--grouped-bg,var(--surface-alt))] md:bg-[var(--surface)]">
      <aside
        className="
          hidden md:flex flex-col
          w-64 shrink-0 border-r
          bg-[var(--surface)]/90 backdrop-blur-xl
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
            <p className="font-semibold text-[15px] leading-tight">
              {tenant?.nomeFantasia || 'Minha Empresa'}
            </p>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Conta do associado
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {MENU.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-[var(--c-border)] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Aparência
            </span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                await logout()
                navigate('/login', { replace: true })
              })()
            }}
            className="flex items-center gap-3 px-4 py-2 w-full text-[15px] rounded-[10px] hover:bg-[var(--nav-hover-bg)] min-h-[44px]"
            style={{ color: "var(--danger, #dc2626)" }}
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {!isDashboardHome && (
          <header
            className="
              md:hidden sticky top-0 z-30
              flex items-center justify-between
              px-4 min-h-[44px] py-2
              border-b
              bg-[var(--grouped-bg,var(--surface-alt))]/82 backdrop-blur-xl backdrop-saturate-150
            "
            style={{
              paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
              borderColor: 'var(--separator, var(--c-border))',
            }}
          >
            <img src={logoUrl} className="h-7 w-auto object-contain max-w-[120px]" alt="Logo" />
            <div className="flex items-center gap-1">
              <HeaderNotificationsBell />
              <ThemeToggle />
            </div>
          </header>
        )}

        <main
          className={`flex-1 md:px-10 md:py-8 md:pb-8 ${
            isDashboardHome
              ? 'px-0 py-0 pb-[calc(62px+env(safe-area-inset-bottom)+8px)] bg-[var(--grouped-bg,var(--surface-alt))]'
              : 'px-4 py-3 pb-[calc(62px+env(safe-area-inset-bottom)+8px)]'
          }`}
        >
          {children}
        </main>

        <nav
          className="
            md:hidden fixed bottom-0 inset-x-0 z-40
            flex items-end
            border-t
            bg-[var(--surface)]/88 backdrop-blur-2xl backdrop-saturate-150
            min-h-[50px]
          "
          style={{
            paddingBottom: 'max(2px, env(safe-area-inset-bottom))',
            borderColor: 'var(--separator, var(--c-border))',
            boxShadow: '0 -0.5px 0 color-mix(in srgb, var(--text) 8%, transparent)',
          }}
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
