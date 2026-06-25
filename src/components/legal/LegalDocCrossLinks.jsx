import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { LEGAL_DOCUMENTS } from '@/content/legal/legalMeta'

const DOC_ORDER = ['privacy', 'terms', 'cookies']

export default function LegalDocCrossLinks({ currentDocId, variant = 'public' }) {
  const items = DOC_ORDER.map((id) => LEGAL_DOCUMENTS[id]).filter(Boolean)

  return (
    <nav
      className="mt-8 pt-6 border-t"
      style={{ borderColor: 'var(--c-border)' }}
      aria-label="Outros documentos legais"
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3 px-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        Documentos relacionados
      </p>
      <ul className="rounded-[16px] overflow-hidden divide-y list-none p-0 m-0 border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--c-border)',
        }}
      >
        {items.map((doc) => {
          const isCurrent = doc.id === currentDocId
          const path = variant === 'member' ? doc.memberPath : doc.publicPath

          if (isCurrent) {
            return (
              <li key={doc.id}>
                <span
                  className="flex items-center justify-between gap-3 px-4 py-3.5 min-h-[52px]"
                  aria-current="page"
                >
                  <span className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                    {doc.title}
                  </span>
                  <span
                    className="text-[12px] font-medium shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Atual
                  </span>
                </span>
              </li>
            )
          }

          return (
            <li key={doc.id}>
              <Link
                to={path}
                className="flex items-center justify-between gap-3 px-4 py-3.5 min-h-[52px] transition active:opacity-70"
              >
                <span className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                  {doc.title}
                </span>
                <ChevronRight
                  size={17}
                  strokeWidth={2.5}
                  className="shrink-0 opacity-35"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
