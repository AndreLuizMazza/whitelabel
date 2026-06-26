import {
  Home,
  Layers,
  Package,
  Gift,
  HeartHandshake,
  Building2,
  FileText,
  Phone,
  HelpCircle,
  ExternalLink,
  ArrowUpRight,
  Globe,
  Link2,
  Video,
  HeartPulse,
  Stethoscope,
  Smartphone,
} from 'lucide-react'

import { filterMainMenuLinksForTenant } from '@/lib/tenantModules'
import { getHomeExternalLinkSections, getTenantContract } from '@/lib/tenantContent'

const MENU_ICON_MAP = {
  ExternalLink,
  ArrowUpRight,
  Globe,
  Link2,
  Video,
  HeartPulse,
  Stethoscope,
  Smartphone,
  Home,
  Layers,
  Package,
  Gift,
  HeartHandshake,
  Building2,
  FileText,
  Phone,
  HelpCircle,
}

/**
 * Menu principal — área pública (header horizontal + drawer mobile).
 * Referência única para Navbar e Footer institucional.
 */
export const MAIN_MENU_LINKS = [
  {
    key: 'home',
    to: '/',
    label: 'Início',
    icon: Home,
    exact: true,
  },
  {
    key: 'planos',
    to: '/planos',
    label: 'Planos',
    icon: Layers,
  },
  {
    key: 'produtos',
    to: '/produtos',
    label: 'Produtos',
    icon: Package,
  },
  {
    key: 'beneficios',
    to: '/beneficios',
    label: 'Benefícios',
    icon: Gift,
  },
  {
    key: 'memorial',
    to: '/memorial',
    label: 'Memorial',
    icon: HeartHandshake,
  },
  {
    key: 'sobre-nos',
    to: '/sobre-nos',
    label: 'Sobre',
    icon: Building2,
  },
  {
    key: 'segunda-via',
    to: '/contratos',
    label: '2ª Via',
    icon: FileText,
  },
  {
    key: 'contatos',
    to: '/filiais',
    label: 'Contatos',
    icon: Phone,
  },
  {
    key: 'ajuda',
    to: '/#faq',
    label: 'Ajuda',
    icon: HelpCircle,
  },
]

export const MENU_ESSENTIAL_KEYS = [
  'home',
  'planos',
  'produtos',
  'beneficios',
  'memorial',
  'sobre-nos',
]
export const MENU_SERVICOS_KEYS = ['segunda-via', 'contatos']
export const MENU_SUPORTE_KEYS = ['ajuda']

/** Nav desktop: descoberta institucional + serviços de autoatendimento e contato. */
export const DESKTOP_NAV_KEYS = [
  'planos',
  'produtos',
  'beneficios',
  'memorial',
  'sobre-nos',
  'segunda-via',
  'contatos',
]

/** @returns {import('@/lib/tenantContent').HomeExternalLinkSection[]} */
function getMenuExternalLinkSections() {
  return getHomeExternalLinkSections(getTenantContract()).filter((s) => s.showInMenu !== false)
}

/** @param {import('@/lib/tenantContent').HomeExternalLinkSection} section */
function mapExternalSectionToMenuItem(section) {
  return {
    key: `external-${section.id}`,
    to: section.href,
    label: section.menuLabel || section.ctaLabel || section.title,
    icon: MENU_ICON_MAP[section.icon] || ExternalLink,
    external: true,
    openInNewTab: section.openInNewTab !== false,
  }
}

/** @param {Record<string, unknown> | null | undefined} empresa */
export function getExternalPublicMenuLinks(_empresa) {
  return getMenuExternalLinkSections().map(mapExternalSectionToMenuItem)
}

/** @param {Record<string, unknown> | null | undefined} empresa */
export function getFilteredPublicMenu(empresa) {
  return filterMainMenuLinksForTenant(MAIN_MENU_LINKS, empresa)
}

/** Menu estático + links externos configurados no JSON do tenant. */
export function getFullPublicMenu(empresa) {
  return [...getFilteredPublicMenu(empresa), ...getExternalPublicMenuLinks(empresa)]
}

/** Menu agrupado com divisores (drawer mobile). */
export function getGroupedPublicMenu(empresa) {
  const mainFiltered = getFilteredPublicMenu(empresa)
  const externalLinks = getExternalPublicMenuLinks(empresa)
  const pickGroup = (keys) =>
    keys.map((k) => mainFiltered.find((item) => item.key === k)).filter(Boolean)

  const groups = [
    ...pickGroup(MENU_ESSENTIAL_KEYS),
    { divider: true },
    ...pickGroup(MENU_SERVICOS_KEYS),
  ]

  if (externalLinks.length > 0) {
    groups.push({ divider: true }, ...externalLinks)
  }

  groups.push({ divider: true }, ...pickGroup(MENU_SUPORTE_KEYS))

  return groups
}

/** Links para nav horizontal desktop — só rotas internas (externos ficam na action rail). */
export function getDesktopNavLinks(empresa, { hideKeys = [] } = {}) {
  return getFilteredPublicMenu(empresa).filter(
    (item) => DESKTOP_NAV_KEYS.includes(item.key) && !hideKeys.includes(item.key)
  )
}
