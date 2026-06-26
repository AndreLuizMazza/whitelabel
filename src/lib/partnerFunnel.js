import {
  buildWaHref,
  resolveGlobalFallback,
  resolveTenantPhone,
  openWhatsAppUrl,
} from '@/lib/whats'

/** Mensagem padrão — B2B parcerias comerciais (WhatsApp do tenant). */
export const PARTNER_WA_MESSAGE =
  'Olá! Tenho interesse em ser parceiro premium e gostaria de mais informações.'

export const PARTNER_HOME_SECTION_ID = 'parceiros'
export const PARTNER_HOME_ANCHOR = '/#parceiros'

const WA_URL_RE = /^https?:\/\/(wa\.me|api\.whatsapp\.com)/i

export function isPartnerInscribePath(path) {
  return /\/parceiros\/inscrever/i.test(String(path || ''))
}

export function isPartnerWhatsAppUrl(url) {
  return WA_URL_RE.test(String(url || '').trim())
}

export function resolvePartnerWhatsAppHref(empresa, message = PARTNER_WA_MESSAGE) {
  const tel = resolveTenantPhone(empresa) || resolveGlobalFallback()
  return buildWaHref({ number: tel, message })
}

/** CTA primário B2B: WhatsApp do tenant ou âncora na seção da home. */
export function resolvePartnerPrimaryCta(
  empresa,
  { label = 'Quero ser parceiro(a)', variant = 'primary' } = {}
) {
  const wa = resolvePartnerWhatsAppHref(empresa)
  if (wa) return { label, to: wa, variant }
  return { label, to: PARTNER_HOME_ANCHOR, variant }
}

/**
 * Normaliza CTAs de slide hero / JSON tenant para o funil B2B unificado.
 * Mantém URLs wa.me explícitas configuradas por tenant.
 */
export function normalizePartnerSlidePrimary(primary, slideId, empresa) {
  const id = String(slideId || '')
  const to = primary?.to || ''

  if (id !== 'parceiros' && !isPartnerInscribePath(to)) {
    return primary || null
  }

  if (primary && isPartnerWhatsAppUrl(to)) {
    return primary
  }

  return resolvePartnerPrimaryCta(empresa, {
    label: primary?.label || 'Quero ser parceiro(a)',
    variant: primary?.variant || 'primary',
  })
}

export function openPartnerWhatsApp(empresa) {
  const href = resolvePartnerWhatsAppHref(empresa)
  if (href) {
    openWhatsAppUrl(href)
    return true
  }
  return false
}
