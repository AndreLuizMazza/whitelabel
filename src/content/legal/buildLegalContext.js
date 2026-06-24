import { formatEndereco } from '@/lib/format'
import { getTenantContract } from '@/lib/tenantContent'
import {
  AWIS_DOCUMENT,
  AWIS_LEGAL_NAME,
  PLATFORM_NAME,
} from '@/content/legal/legalMeta'
import { sanitizeLegalValue } from '@/content/legal/interpolate'

function resolveSiteUrl(empresa, contract) {
  const domain = contract?.routing?.primaryDomain
  if (domain) {
    const clean = String(domain).replace(/^https?:\/\//, '').replace(/\/+$/, '')
    return `https://${clean}`
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return empresa?.siteOficial || empresa?.dominio || ''
}

function resolveForo(empresa) {
  const cidade = empresa?.endereco?.cidade
  const uf = empresa?.endereco?.uf
  if (cidade && uf) return `${cidade}/${uf}`
  return 'Comarca da sede do prestador de serviços'
}

/** Monta contexto seguro para placeholders dos documentos legais. */
export function buildLegalContext(empresa, docMeta) {
  const contract = getTenantContract()
  const nomeFantasia = sanitizeLegalValue(
    empresa?.nomeFantasia || contract?.brand?.shortName || contract?.brand?.name || 'Nossa Empresa'
  )
  const razaoSocial = sanitizeLegalValue(
    empresa?.razaoSocial || contract?.brand?.legalName || nomeFantasia
  )
  const cnpj = sanitizeLegalValue(empresa?.cnpj || '[CNPJ não informado]')
  const email = sanitizeLegalValue(empresa?.contato?.email || '')
  const telefone = sanitizeLegalValue(empresa?.contato?.telefone || '')
  const endereco = sanitizeLegalValue(formatEndereco(empresa) || '')
  const cidade = sanitizeLegalValue(empresa?.endereco?.cidade || '')
  const estado = sanitizeLegalValue(empresa?.endereco?.uf || '')

  return {
    TENANT_NAME: nomeFantasia,
    TENANT_LEGAL_NAME: razaoSocial,
    TENANT_DOCUMENT: cnpj,
    TENANT_SITE_URL: sanitizeLegalValue(resolveSiteUrl(empresa, contract)),
    TENANT_SUPPORT_EMAIL: email || 'contato disponível nos canais oficiais do prestador',
    TENANT_SUPPORT_PHONE: telefone || 'telefone disponível nos canais oficiais do prestador',
    TENANT_ADDRESS: endereco,
    TENANT_CITY: cidade,
    TENANT_STATE: estado,
    TENANT_FORO: resolveForo(empresa),
    AWIS_LEGAL_NAME,
    AWIS_DOCUMENT,
    PLATFORM_NAME,
    DOCUMENT_VERSION: docMeta?.version || '',
    DOCUMENT_UPDATED_AT: docMeta?.updatedAtLabel || '',
  }
}
