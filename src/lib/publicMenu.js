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
} from 'lucide-react'

import { filterMainMenuLinksForTenant } from '@/lib/tenantModules'

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
    label: 'Contato',
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

/** @param {Record<string, unknown> | null | undefined} empresa */
export function getFilteredPublicMenu(empresa) {
  return filterMainMenuLinksForTenant(MAIN_MENU_LINKS, empresa)
}

/** Menu agrupado com divisores (drawer mobile). */
export function getGroupedPublicMenu(empresa) {
  const mainFiltered = getFilteredPublicMenu(empresa)
  const pickGroup = (keys) =>
    keys.map((k) => mainFiltered.find((item) => item.key === k)).filter(Boolean)

  return [
    ...pickGroup(MENU_ESSENTIAL_KEYS),
    { divider: true },
    ...pickGroup(MENU_SERVICOS_KEYS),
    { divider: true },
    ...pickGroup(MENU_SUPORTE_KEYS),
  ]
}

/** Links para nav horizontal desktop (sem Home — logo já leva à home). */
export function getDesktopNavLinks(empresa, { hideKeys = [] } = {}) {
  return getFilteredPublicMenu(empresa).filter(
    (item) => item.key !== 'home' && !hideKeys.includes(item.key)
  )
}
