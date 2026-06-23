/**
 * Modo de tema efetivo (light | dark) observável pelo React.
 * Atualizado apenas por applyTheme() em initTheme.js — mesma fonte que classes no <html>.
 * Permite que <img src> da logo reaja ao toggle sem depender de rerender acidental.
 */
import { useMemo, useSyncExternalStore } from 'react'
import useTenant from '@/store/tenant'
import { resolveTenantLogoUrl } from '@/lib/tenantBranding'
import { subscribeBrandingRevision, getBrandingRevisionSnapshot } from '@/boot/brandingSync'

let effectiveMode = 'light'
const listeners = new Set()

/** @returns {'light'|'dark'} */
export function getEffectiveThemeMode() {
  return effectiveMode
}

export function subscribeEffectiveThemeMode(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

/**
 * @param {'light'|'dark'} mode
 */
export function setEffectiveThemeMode(mode) {
  if (mode !== 'light' && mode !== 'dark') return
  if (effectiveMode === mode) return
  effectiveMode = mode
  listeners.forEach((l) => l())
}

/**
 * URL da logo do tenant alinhada ao modo efetivo e ao contrato (resolveBrandLogoUrl).
 * Re-renderiza quando o tema muda (toggle / system) ou quando `empresa` no store muda.
 */
export function useTenantLogoUrl() {
  const empresa = useTenant((s) => s.empresa)
  const brandingRevision = useSyncExternalStore(
    subscribeBrandingRevision,
    getBrandingRevisionSnapshot,
    () => 0
  )
  const mode = useSyncExternalStore(
    subscribeEffectiveThemeMode,
    getEffectiveThemeMode,
    () => 'light'
  )
  return useMemo(
    () => resolveTenantLogoUrl(mode),
    [mode, empresa, brandingRevision]
  )
}

/**
 * Logo para superfícies coloridas (hero da área privada, fundos primary).
 * Usa sempre a variante "dark" do contrato — legível sobre gradiente primary.
 */
export function useTenantLogoOnPrimaryUrl() {
  const empresa = useTenant((s) => s.empresa)
  const brandingRevision = useSyncExternalStore(
    subscribeBrandingRevision,
    getBrandingRevisionSnapshot,
    () => 0
  )
  return useMemo(
    () => resolveTenantLogoUrl('dark'),
    [empresa, brandingRevision]
  )
}
