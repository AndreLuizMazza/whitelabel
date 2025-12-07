// src/layouts/AppShell.jsx
import { NavLink } from "react-router-dom"
import {
  UserSquare2,
  UsersRound,
  Receipt,
  IdCard,
  Settings,
  LogOut,
  Bell,
} from "lucide-react"
import useAuth from "@/store/auth"
import useTenant from "@/store/tenant"
import HeaderNotificationsBell from "@/components/HeaderNotificationsBell.jsx"
import ThemeToggle from "@/components/ThemeToggle.jsx"

export default function AppShell({ children }) {
  const { user, logout } = useAuth((s) => ({
    user: s.user,
    logout: s.logout,
  }))

  const tenant = useTenant((s) => s.empresa)

  const menu = [
    { to: "/area", label: "Área do Associado", icon: <UserSquare2 size={20} /> },
    { to: "/area/dependentes", label: "Dependentes", icon: <UsersRound size={20} /> },
    { to: "/area/pagamentos", label: "Pagamentos", icon: <Receipt size={20} /> },
    { to: "/carteirinha", label: "Carteirinha", icon: <IdCard size={20} /> },
    { to: "/perfil", label: "Meu Perfil", icon: <Settings size={20} /> },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">

      {/** ===========================
           SIDEBAR – desktop only
      ================================= */}
      <aside
        className="
          hidden md:flex flex-col
          w-64 shrink-0 border-r
          bg-[var(--surface)]/80 backdrop-blur-xl
          border-[var(--c-border)]
        "
      >
        {/* logo + nome */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--c-border)]">
          <img
            src={tenant?.logo || tenant?.logoUrl || "/img/logo.png"}
            className="h-9 w-auto object-contain"
            alt={tenant?.nomeFantasia || "Empresa"}
          />
          <div>
            <p className="font-semibold text-sm leading-tight">
              {tenant?.nomeFantasia || "Minha Empresa"}
            </p>
            <span
              className="text-[11px] uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Conta do associado
            </span>
          </div>
        </div>

        {/* MAIN NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                  group flex items-center gap-3 px-6 py-3 text-sm font-medium
                  transition rounded-lg mx-3 mb-1
                  ${isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "hover:bg-black/5 dark:hover:bg-white/5"}
                `
              }
            >
              <span className="text-[var(--primary)] group-hover:scale-110 transition">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* FOOTER DO SIDEBAR */}
        <div className="border-t border-[var(--c-border)] p-4">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm rounded-lg 
                       hover:bg-black/5 dark:hover:bg-white/5 text-[var(--danger)]"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/** ===========================
           TOPO – sempre visível
      ================================= */}
      <header
        className="
          sticky top-0 z-30
          w-full md:hidden flex items-center justify-between
          px-4 py-3 border-b border-[var(--c-border)]
          bg-[var(--surface)]/90 backdrop-blur-xl
        "
      >
        <img
          src={tenant?.logo || "/img/logo.png"}
          className="h-8"
          alt="Logo"
        />

        <div className="flex items-center gap-3">
          <HeaderNotificationsBell />
          <ThemeToggle />
        </div>
      </header>

      {/** ===========================
           CONTENT AREA
      ================================= */}
      <main className="flex-1 px-4 md:px-10 py-6 md:py-10">
        {children}
      </main>
    </div>
  )
}
