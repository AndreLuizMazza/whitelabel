// src/layouts/GlobalShell.jsx
import { NavLink, useLocation, Link } from "react-router-dom"
import {
  Home,
  Layers,
  Package,
  Gift,
  HeartHandshake,
  Building2,
  FileText,
  Phone,
  UserSquare2,
  UsersRound,
  Receipt,
  IdCard,
  Settings,
  HelpCircle,
} from "lucide-react"

import useAuth from "@/store/auth"
import useTenant from "@/store/tenant"
import { filterMainMenuLinksForTenant } from "@/lib/tenantModules"
import ThemeToggle from "@/components/ThemeToggle"
import HeaderNotificationsBell from "@/components/HeaderNotificationsBell"
import { getProdutosMenuTo } from "@/lib/produtoUtils"

/**
 * MENU PRINCIPAL – PÚBLICO
 * Referência única para Navbar, sidebar e mobile drawer.
 *
 * Organização premium (BigTech):
 * - Essencial: Home, Planos, Produtos, Benefícios, Memorial
 * - Serviços: 2ª Via, Contatos
 * - Suporte: Ajuda
 */
export const MAIN_MENU_LINKS = [
  // Essencial
  {
    key: "home",
    to: "/",
    label: "Home",
    icon: Home,
    exact: true,
  },
  {
    key: "planos",
    to: "/planos",
    label: "Planos",
    icon: Layers,
  },
  {
    key: "produtos",
    to: "/produtos",
    label: "Produtos",
    icon: Package,
  },
  {
    key: "beneficios",
    to: "/beneficios",
    label: "Clube de Benefícios",
    icon: Gift,
  },
  {
    key: "memorial",
    to: "/memorial",
    label: "Memorial",
    icon: HeartHandshake,
  },
  {
    key: "sobre-nos",
    to: "/sobre-nos",
    label: "Sobre nós",
    icon: Building2,
  },

  // Serviços
  {
    key: "segunda-via",
    to: "/contratos",
    label: "2ª Via",
    icon: FileText,
  },
  {
    key: "contatos",
    to: "/filiais",
    label: "Contatos",
    icon: Phone,
  },

  // Suporte
  {
    key: "ajuda",
    to: "/#faq",
    label: "Ajuda",
    icon: HelpCircle,
  },
]

/**
 * MENU – ÁREA DO ASSOCIADO (logado)
 */
export const PRIVATE_MENU_LINKS = [
  {
    key: "area",
    to: "/area",
    label: "Área do Associado",
    icon: UserSquare2,
  },
  {
    key: "dependentes",
    to: "/area/dependentes",
    label: "Dependentes",
    icon: UsersRound,
  },
  {
    key: "pagamentos",
    to: "/area/pagamentos",
    label: "Pagamentos",
    icon: Receipt,
  },
  {
    key: "carteirinha",
    to: "/carteirinha",
    label: "Carteirinha",
    icon: IdCard,
  },
  {
    key: "perfil",
    to: "/perfil",
    label: "Meu Perfil",
    icon: Settings,
  },
]

const MENU_ESSENTIAL_KEYS = ["home", "planos", "produtos", "beneficios", "memorial", "sobre-nos"]
const MENU_SERVICOS_KEYS = ["segunda-via", "contatos"]
const MENU_SUPORTE_KEYS = ["ajuda"]

export default function GlobalShell({ children }) {
  const location = useLocation()

  const { isAuthenticated } = useAuth((s) => ({
    isAuthenticated: s.isAuthenticated,
  }))
  const tenant = useTenant((s) => s.empresa)

  const brandName = tenant?.nomeFantasia || tenant?.nome || "Sua Marca Aqui"

  const mainFiltered = filterMainMenuLinksForTenant(MAIN_MENU_LINKS, tenant)
  const pickGroup = (keys) =>
    keys.map((k) => mainFiltered.find((item) => item.key === k)).filter(Boolean)

  // Agrupamento por chave (sem slice por índice — seguro após filtro dinâmico)
  const menuPublicGrouped = [
    ...pickGroup(MENU_ESSENTIAL_KEYS),
    { divider: true },
    ...pickGroup(MENU_SERVICOS_KEYS),
    { divider: true },
    ...pickGroup(MENU_SUPORTE_KEYS),
  ]

  const fullMenu = isAuthenticated()
    ? [...menuPublicGrouped, { divider: true }, ...PRIVATE_MENU_LINKS]
    : menuPublicGrouped

  const baseItemClass =
    "group flex items-center gap-3 px-4 py-2.5 mx-3 rounded-2xl text-sm font-medium transition-colors"

  const inactiveClass =
    "text-[var(--text)]/80 hover:bg-black/4 hover:text-[var(--text)] dark:hover:bg-white/5"

  const activeClass =
    "bg-[var(--nav-active-bg,var(--primary)/10)] text-[var(--primary)]"

  const iconContainerBase =
    "flex h-8 w-8 items-center justify-center rounded-xl border text-[var(--primary)] transition-colors"

  const iconContainerInactive =
    "border-[color-mix(in_srgb,var(--primary)_14%,transparent)] group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)]/5"

  const iconContainerActive =
    "border-[color-mix(in_srgb,var(--primary)_40%,transparent)] bg-[var(--primary)]/8"

  const isHashActive = (item) => {
    if (!item.to.startsWith("/#")) return false
    return location.pathname === "/" && location.hash === "#faq"
  }

  // Mesmo comportamento da logo do Navbar
  function handleBrandClick(e) {
    if (location.pathname === "/") {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface)] relative">
      {/* ===========================
           SIDEBAR (Desktop)
      ============================ */}
      <aside
        className="
          hidden md:flex flex-col
          w-64 shrink-0 border-r
          bg-[var(--surface)]/92 backdrop-blur-xl
          border-[var(--c-border)]
          sticky top-0 h-screen
        "
      >
        {/* Cabeçalho do tenant – cartão premium clicável (Home) */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--c-border)]">
          <Link
            to="/"
            onClick={handleBrandClick}
            className="block rounded-2xl px-4 py-3 transition hover:shadow-sm"
            style={{
              background:
                "color-mix(in srgb, var(--primary) 6%, var(--surface) 94%)",
            }}
            aria-label="Ir para a página inicial"
          >
            <p
              className="text-[11px] uppercase tracking-[0.2em] mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Atendimento por
            </p>
            <p className="text-sm font-semibold leading-snug break-words">
              {brandName}
            </p>
          </Link>
        </div>

        {/* CTA (não logado) – SEMPRE visível no desktop */}
        {!isAuthenticated() && (
          <div className="px-4 pt-3 pb-2">
            <Link
              to="/planos"
              className="block text-center rounded-2xl px-4 py-3 font-semibold transition shadow-sm hover:shadow"
              style={{ background: "var(--primary)", color: "#fff" }}
              aria-label="Fazer adesão"
            >
              Fazer adesão
            </Link>

            <Link
              to="/login"
              className="mt-2 block text-center rounded-2xl px-4 py-2.5 text-sm font-medium border transition hover:bg-black/4 dark:hover:bg-white/5"
              style={{ borderColor: "var(--c-border)", color: "var(--text)" }}
              aria-label="Entrar"
            >
              Entrar
            </Link>
          </div>
        )}

        {/* Menu principal + privado */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {fullMenu.map((item, i) =>
            item.divider ? (
              <div
                key={"div-" + i}
                className="my-3 mx-4 border-t border-dashed border-[var(--c-border)]"
              />
            ) : item.to.startsWith("/#") ? (
              // Ajuda – âncora na Home
              <a
                key={item.key}
                href={item.to}
                className={
                  baseItemClass +
                  " " +
                  (isHashActive(item) ? activeClass : inactiveClass)
                }
              >
                <span
                  className={
                    iconContainerBase +
                    " " +
                    (isHashActive(item)
                      ? iconContainerActive
                      : iconContainerInactive)
                  }
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </a>
            ) : (
              <NavLink
                key={item.key}
                to={
                  item.key === "produtos"
                    ? getProdutosMenuTo(location.pathname, location.search)
                    : item.to
                }
                end={item.exact || item.key === "produtos"}
                className={({ isActive }) =>
                  baseItemClass + " " + (isActive ? activeClass : inactiveClass)
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Barra de realce à esquerda */}
                    <span
                      className={`h-7 w-0.5 rounded-full mr-1 transition-colors ${
                        isActive
                          ? "bg-[var(--primary)]"
                          : "bg-transparent group-hover:bg-[var(--primary)]/40"
                      }`}
                    />
                    <span
                      className={
                        iconContainerBase +
                        " " +
                        (isActive ? iconContainerActive : iconContainerInactive)
                      }
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* Rodapé do sidebar – cartão de controles */}
        <div className="px-4 pb-4 pt-3 border-t border-[var(--c-border)]">
          <div
            className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{
              background:
                "color-mix(in srgb, var(--surface) 88%, var(--primary) 12%)",
            }}
          >
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] mb-1">
                Preferências
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Notificações e tema do site
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated() && <HeaderNotificationsBell />}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* ===========================
           CONTEÚDO
      ============================ */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
