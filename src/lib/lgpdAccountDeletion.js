// src/lib/lgpdAccountDeletion.js
// Solicitação de encerramento de conta via e-mail (LGPD art. 18, VI) — somente frontend.

import { getTenantContract } from '@/lib/tenantContent'
import { displayCPF } from '@/lib/cpf'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatRequestDate(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

function buildRequestId(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `LGPD-${stamp}-${rand}`
}

/** E-mail institucional do tenant para solicitações de privacidade/LGPD. */
export function resolvePrivacyContactEmail(empresa) {
  const contract = getTenantContract()
  const candidates = [
    empresa?.contato?.email,
    empresa?.contato?.emailPrivacidade,
    empresa?.email,
    contract?.support?.email,
    contract?.contact?.email,
  ]

  for (const raw of candidates) {
    const email = String(raw || '').trim()
    if (EMAIL_RE.test(email)) return email
  }
  return ''
}

export function buildAccountDeletionMailBody({
  empresa,
  user = {},
  requestId,
  requestedAt,
} = {}) {
  const contract = getTenantContract()
  const tenantName =
    empresa?.nomeFantasia ||
    empresa?.razaoSocial ||
    contract?.brand?.shortName ||
    contract?.brand?.name ||
    'Prestador de serviços'
  const tenantLegal =
    empresa?.razaoSocial || contract?.brand?.legalName || tenantName
  const nome = String(user?.nome || '').trim() || '[informar nome completo]'
  const email = String(user?.email || '').trim() || '[informar e-mail cadastrado]'
  const cpfRaw = user?.cpf || ''
  const cpf = cpfRaw ? displayCPF(cpfRaw) : '[informar CPF]'
  const id = requestId || buildRequestId(requestedAt)
  const when = formatRequestDate(requestedAt)
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : contract?.routing?.primaryDomain || ''

  return [
    'Prezados,',
    '',
    'Solicito o encerramento da minha conta de associado no aplicativo e a eliminação dos meus dados pessoais, nos termos do art. 18, VI, da Lei nº 13.709/2018 (LGPD).',
    '',
    '--- Dados para identificação ---',
    `Protocolo da solicitação: ${id}`,
    `Nome: ${nome}`,
    `E-mail cadastrado: ${email}`,
    `CPF: ${cpf}`,
    `Prestador/unidade: ${tenantLegal}`,
    `Canal de origem: ${origin}`,
    `Data e hora da solicitação: ${when}`,
    '',
    'Entendo que alguns dados poderão ser mantidos pelo prazo legal necessário ao cumprimento de obrigações legais, regulatórias ou exercício regular de direitos, conforme a Política de Privacidade vigente.',
    '',
    'Solicito confirmação de recebimento desta mensagem e informação sobre o prazo estimado para conclusão do atendimento.',
    '',
    'Atenciosamente,',
    nome,
  ].join('\r\n')
}

export function buildAccountDeletionMailto({
  empresa,
  user = {},
  requestId,
  requestedAt = new Date(),
} = {}) {
  const to = resolvePrivacyContactEmail(empresa)
  if (!to) {
    return { ok: false, reason: 'no_email', to: '' }
  }

  const id = requestId || buildRequestId(requestedAt)
  const subject = `Solicitação de encerramento de conta — LGPD (${id})`
  const body = buildAccountDeletionMailBody({
    empresa,
    user,
    requestId: id,
    requestedAt,
  })

  const params = new URLSearchParams()
  params.set('subject', subject)
  params.set('body', body)

  const href = `mailto:${to}?${params.toString()}`

  if (href.length > 1800) {
    return { ok: false, reason: 'href_too_long', to }
  }

  return { ok: true, href, to, subject, body, requestId: id }
}

/** Abre o cliente de e-mail do usuário com a solicitação pré-preenchida. */
export function openAccountDeletionRequest({ empresa, user } = {}) {
  const result = buildAccountDeletionMailto({ empresa, user })
  if (!result.ok) return result

  try {
    window.location.assign(result.href)
  } catch {
    try {
      window.open(result.href, '_self')
    } catch {
      return { ...result, ok: false, reason: 'open_failed' }
    }
  }

  return result
}

export { buildRequestId, formatRequestDate }
