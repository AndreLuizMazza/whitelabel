import { useEffect, useMemo } from 'react'
import useTenant from '@/store/tenant'
import { applyStaticPageTitle } from '@/lib/shellBranding'
import { setPageSEO } from '@/lib/seo'
import LegalPageShell from '@/components/legal/LegalPageShell'
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
  const isPublic = variant === 'public'

  useEffect(() => {
    if (!isPublic) {
      setPageSEO({ title: `${title} | Perfil`, robots: 'noindex' })
      return
    }
    applyStaticPageTitle(title, empresa)
  }, [isPublic, title, empresa])

  if (!meta) {
    return (
      <div className="w-full max-w-3xl md:max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">Documento não encontrado</h1>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="w-full max-w-3xl md:max-w-4xl mx-auto px-4 pt-6 pb-10 md:pt-8">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Legal · LGPD
        </p>
        <h1 className="text-[28px] font-bold leading-tight mb-3" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
          Carregando informações da unidade…
        </p>
      </div>
    )
  }

  return (
    <LegalPageShell
      variant={variant}
      docId={docId}
      meta={meta}
      context={context}
      sections={sections}
      backTo={isPublic ? '/' : '/perfil'}
      backLabel={isPublic ? 'Início' : 'Perfil'}
      showCrossLinks={isPublic}
    />
  )
}
