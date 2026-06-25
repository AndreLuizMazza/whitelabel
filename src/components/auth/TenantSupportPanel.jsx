import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import useTenant from '@/store/tenant'
import {
  buildWaHref,
  resolveGlobalFallback,
  resolveTenantPhone,
} from '@/lib/whats'

function onlyDigits(v = '') {
  return String(v).replace(/\D+/g, '')
}

function formatEndereco(end) {
  if (!end) return ''
  const linha1 = [end.logradouro, end.numero].filter(Boolean).join(', ')
  const linha2 = [end.bairro, end.cidade && end.uf ? `${end.cidade} - ${end.uf}` : end.cidade || end.uf]
    .filter(Boolean)
    .join(' • ')
  return [linha1, linha2].filter(Boolean).join(' — ')
}

/**
 * Painel de contatos públicos do tenant — WhatsApp, telefone, e-mail, endereço.
 * Degrada graciosamente quando dados não estão cadastrados.
 */
export default function TenantSupportPanel({
  title = 'Fale conosco',
  subtitle = 'Preferir falar com alguém? Nossa equipe atende por WhatsApp e telefone.',
  whatsappMessage,
  showFiliaisLink = true,
  compact = false,
  className = '',
}) {
  const empresa = useTenant((s) => s.empresa)
  const brandName = empresa?.nomeFantasia || empresa?.nome || 'nossa empresa'

  const telefone = resolveTenantPhone(empresa) || resolveGlobalFallback()
  const email = empresa?.contato?.email || ''
  const endereco = formatEndereco(empresa?.endereco)
  const telDigits = onlyDigits(telefone)

  const waHref = useMemo(() => {
    return buildWaHref({
      number: telefone,
      message:
        whatsappMessage ||
        `Olá! Preciso de ajuda para acessar minha conta na ${brandName}.`,
    })
  }, [telefone, whatsappMessage, brandName])

  const hasContacts = Boolean(waHref || telDigits || email)

  if (!hasContacts && !showFiliaisLink) {
    return (
      <div
        className={`rounded-2xl border px-4 py-4 text-sm leading-relaxed ${className}`}
        style={{
          borderColor: 'var(--c-border)',
          background: 'var(--surface)',
          color: 'var(--text-muted)',
        }}
      >
        <p>
          Canais de atendimento ainda não estão disponíveis aqui. Tente recuperar sua senha ou
          fale com a empresa pelos canais que você já conhece.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{
        borderColor: 'var(--c-border)',
        background: 'var(--surface)',
      }}
    >
      <div
        className={`px-4 ${compact ? 'py-3' : 'py-4'}`}
        style={{
          borderBottom: hasContacts ? '1px solid var(--c-border)' : undefined,
        }}
      >
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
        {subtitle && !compact && (
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {hasContacts && (
        <div className="divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] transition-colors hover:opacity-90"
              style={{
                background: 'color-mix(in srgb, #25D366 6%, var(--surface))',
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: '#25D366', color: '#fff' }}
              >
                <MessageCircle size={18} aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-[var(--text)]">WhatsApp</span>
                {telefone && (
                  <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {telefone}
                  </span>
                )}
              </span>
            </a>
          )}

          {telDigits && (
            <a
              href={`tel:${telDigits}`}
              className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--nav-hover-bg, color-mix(in srgb, var(--primary) 8%, var(--surface)))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: 'var(--c-border)',
                  color: 'var(--primary)',
                }}
              >
                <Phone size={18} aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">Telefone</span>
                <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {telefone}
                </span>
              </span>
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--nav-hover-bg, color-mix(in srgb, var(--primary) 8%, var(--surface)))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: 'var(--c-border)',
                  color: 'var(--primary)',
                }}
              >
                <Mail size={18} aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">E-mail</span>
                <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {email}
                </span>
              </span>
            </a>
          )}

          {endereco && (
            <div className="flex items-start gap-3 px-4 py-3.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border mt-0.5"
                style={{
                  borderColor: 'var(--c-border)',
                  color: 'var(--primary)',
                }}
              >
                <MapPin size={18} aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-[var(--text)]">Endereço</span>
                <span className="block text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {endereco}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {showFiliaisLink && (
        <div
          className="px-4 py-3 text-center text-xs"
          style={{
            borderTop: '1px solid var(--c-border)',
            color: 'var(--text-muted)',
          }}
        >
          <Link
            to="/filiais"
            className="font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Ver unidades e filiais
          </Link>
        </div>
      )}
    </div>
  )
}
