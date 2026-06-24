import { useEffect, useMemo } from 'react'
import useTenant from '@/store/tenant'
import { applyStaticPageTitle } from '@/lib/shellBranding'
import { setPageSEO } from '@/lib/seo'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
} from '@/components/member/MemberDashboardUI'
import LegalDocumentView from '@/components/legal/LegalDocumentView'
import {
  buildLegalContext,
  getLegalDocumentMeta,
  getLegalSections,
} from '@/content/legal'

export default function LegalDocumentPage({ docId, variant = 'public' }) {
  const empresa = useTenant((s) => s.empresa)
  const meta = getLegalDocumentMeta(docId)
  const sections = getLegalSections(docId)

  const context = useMemo(
    () => (meta ? buildLegalContext(empresa, meta) : {}),
    [empresa, meta]
  )

  const title = meta?.title || 'Documento legal'
  const tenantLabel = context.TENANT_LEGAL_NAME || context.TENANT_NAME || 'Nossa Empresa'

  useEffect(() => {
    if (variant === 'member') {
      setPageSEO({ title: `${title} | Perfil`, robots: 'noindex' })
      return
    }
    applyStaticPageTitle(title, empresa)
  }, [variant, title, empresa])

  if (!meta) {
    return (
      <div className="container-max py-10">
        <h1 className="text-2xl font-semibold">Documento não encontrado</h1>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className={variant === 'public' ? 'container-max py-10' : 'w-full max-w-6xl mx-auto'}>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted-foreground">Carregando informações da unidade…</p>
      </div>
    )
  }

  const versionLine = (
    <p
      className="text-[13px] mb-4 leading-snug"
      style={{ color: 'var(--text-muted)' }}
    >
      <strong>Versão:</strong> {meta.version}{' '}
      <span className="mx-1" aria-hidden="true">
        ·
      </span>{' '}
      <strong>Atualização:</strong> {meta.updatedAtLabel}
    </p>
  )

  const docHeader = (
    <header className="mb-5">
      <h1
        className={
          variant === 'public'
            ? 'text-2xl font-semibold mb-2'
            : 'text-[22px] font-semibold mb-1 leading-tight'
        }
        style={{ color: 'var(--text)' }}
      >
        {title} – {tenantLabel}
        {context.TENANT_DOCUMENT ? ` (CNPJ: ${context.TENANT_DOCUMENT})` : ''}
      </h1>
      {versionLine}
    </header>
  )

  if (variant === 'member') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <MemberSubpageNav to="/perfil" label="Perfil" />
        <MemberSubpageHeader title={title} />
        {docHeader}
        <LegalDocumentView sections={sections} context={context} variant="member" />
      </div>
    )
  }

  return (
    <>
      {docHeader}
      <LegalDocumentView sections={sections} context={context} variant="public" />
    </>
  )
}
