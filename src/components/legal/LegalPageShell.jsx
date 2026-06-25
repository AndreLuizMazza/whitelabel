import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import LegalDocumentView from '@/components/legal/LegalDocumentView'
import LegalDocCrossLinks from '@/components/legal/LegalDocCrossLinks'

function LegalBackNav({ to, label }) {
  return (
    <div className="mb-1">
      <Link
        to={to}
        className="inline-flex items-center gap-0.5 min-h-[44px] -ml-1 pl-1 pr-2 text-[17px] transition active:opacity-60 hover:opacity-80"
        style={{ color: 'var(--primary)' }}
      >
        <ChevronLeft size={22} strokeWidth={2.25} aria-hidden="true" />
        {label}
      </Link>
    </div>
  )
}

function LegalPageHeader({ title, tenantLabel, tenantDocument, version, updatedAtLabel, variant }) {
  const isPublic = variant === 'public'

  return (
    <header className="mb-5 md:mb-6">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Legal · LGPD
      </p>
      <h1
        className={
          isPublic
            ? 'text-[28px] md:text-[32px] font-bold leading-[1.1] tracking-tight'
            : 'text-[34px] font-bold leading-[1.08] tracking-tight md:text-[28px]'
        }
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h1>
      {tenantLabel ? (
        <p className="mt-2 text-[15px] leading-snug" style={{ color: 'var(--text-muted)' }}>
          {tenantLabel}
          {tenantDocument ? ` · CNPJ ${tenantDocument}` : ''}
        </p>
      ) : null}
      <p className="mt-2 text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text)' }}>Versão:</strong> {version}{' '}
        <span className="mx-1" aria-hidden="true">
          ·
        </span>{' '}
        <strong style={{ color: 'var(--text)' }}>Atualização:</strong> {updatedAtLabel}
      </p>
    </header>
  )
}

const SHELL_WIDTH = {
  public: 'w-full max-w-3xl md:max-w-4xl mx-auto',
  member: 'w-full max-w-6xl mx-auto',
}

const CARD_STYLE = {
  borderColor: 'var(--c-border)',
  boxShadow:
    '0 0.5px 0 color-mix(in srgb, var(--text) 8%, transparent), 0 1px 2px color-mix(in srgb, var(--text) 4%, transparent), 0 8px 24px color-mix(in srgb, var(--text) 4%, transparent)',
}

export default function LegalPageShell({
  variant = 'public',
  docId,
  meta,
  context,
  sections,
  backTo,
  backLabel,
  showCrossLinks = false,
}) {
  const isPublic = variant === 'public'
  const tenantLabel = context.TENANT_LEGAL_NAME || context.TENANT_NAME || ''
  const tenantDocument = context.TENANT_DOCUMENT || ''

  const resolvedBackTo = backTo || (isPublic ? '/' : '/perfil')
  const resolvedBackLabel = backLabel || (isPublic ? 'Início' : 'Perfil')

  const content = <LegalDocumentView sections={sections} context={context} />

  return (
    <div
      className={`${SHELL_WIDTH[variant] || SHELL_WIDTH.public} px-4 pt-6 pb-10 md:pt-8 md:pb-12`}
    >
      <LegalBackNav to={resolvedBackTo} label={resolvedBackLabel} />

      <LegalPageHeader
        title={meta.title}
        tenantLabel={tenantLabel}
        tenantDocument={tenantDocument}
        version={meta.version}
        updatedAtLabel={meta.updatedAtLabel}
        variant={variant}
      />

      {isPublic ? (
        <div
          className="rounded-[20px] border bg-[var(--surface)] p-5 md:p-8"
          style={CARD_STYLE}
        >
          {content}
        </div>
      ) : (
        content
      )}

      {showCrossLinks ? (
        <LegalDocCrossLinks currentDocId={docId} variant={variant} />
      ) : null}
    </div>
  )
}
