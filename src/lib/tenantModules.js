/**
 * Flags de módulos do tenant (fonte: `empresa` de /api/v1/unidades/me).
 * `undefined` => habilitado (compatibilidade / zero regressão).
 * Somente `=== false` desabilita.
 */

/** @param {Record<string, unknown> | null | undefined} empresa */
export function isMemorialEnabled(empresa) {
  return empresa?.habilitaMemorial !== false
}

/** @param {Record<string, unknown> | null | undefined} empresa */
export function isBeneficiosEnabled(empresa) {
  return empresa?.habilitaBeneficios !== false
}

/**
 * Remove itens de menu cujo módulo está desligado (keys `beneficios` e `memorial`).
 * @param {readonly { key: string }[]} links
 * @param {Record<string, unknown> | null | undefined} empresa
 */
export function filterMainMenuLinksForTenant(links, empresa) {
  return links.filter((item) => {
    if (item.key === 'beneficios') return isBeneficiosEnabled(empresa)
    if (item.key === 'memorial') return isMemorialEnabled(empresa)
    return true
  })
}

/**
 * Hero slide com `primary.to` apontando para módulo desabilitado deve sumir da Home.
 * @param {{ primary?: { to?: string } }} slide
 * @param {Record<string, unknown> | null | undefined} empresa
 */
export function isSlideHiddenByModuleFlags(slide, empresa) {
  const to = slide?.primary?.to
  if (typeof to !== 'string') return false
  if (to === '/memorial' || to.startsWith('/memorial/')) return !isMemorialEnabled(empresa)
  if (to === '/beneficios' || to.startsWith('/beneficios/')) return !isBeneficiosEnabled(empresa)
  return false
}
