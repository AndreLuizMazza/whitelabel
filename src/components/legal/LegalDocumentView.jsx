import { interpolateSection } from '@/content/legal/interpolate'

function SectionHeading({ level = 2, children }) {
  const Tag = level === 3 ? 'h3' : 'h2'
  const cls =
    level === 3
      ? 'text-base font-semibold mt-5 mb-2'
      : 'text-lg font-semibold mt-6 mb-2 first:mt-0'
  return (
    <Tag className={cls} style={{ color: 'var(--text)' }}>
      {children}
    </Tag>
  )
}

function Paragraphs({ paragraphs }) {
  return (
    <>
      {paragraphs.map((text, i) => (
        <p
          key={i}
          className="text-[15px] leading-relaxed mb-3 last:mb-0"
          style={{ color: 'var(--text)' }}
        >
          {text}
        </p>
      ))}
    </>
  )
}

function BulletList({ items }) {
  return (
    <ul
      className="list-disc pl-5 space-y-2 mb-4 text-[15px] leading-relaxed"
      style={{ color: 'var(--text)' }}
    >
      {items.map((item, i) => (
        <li key={i}>{typeof item === 'string' ? item : item.text || item.label}</li>
      ))}
    </ul>
  )
}

function CookieTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto mb-4 -mx-1 md:mx-0">
      <table className="w-full min-w-[520px] text-left text-[13px] border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-2 px-2 font-semibold align-bottom"
                style={{ color: 'var(--text)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--c-border)' }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="py-2 px-2 align-top"
                  style={{ color: 'var(--text-muted, var(--text))' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ContactBlock({ lines }) {
  return (
    <ul
      className="space-y-1.5 mb-4 text-[15px] leading-relaxed list-none pl-0"
      style={{ color: 'var(--text)' }}
    >
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  )
}

function renderSection(section, index) {
  switch (section.type) {
    case 'heading':
      return (
        <SectionHeading key={index} level={section.level}>
          {section.title}
        </SectionHeading>
      )
    case 'paragraphs':
      return (
        <div key={index}>
          <Paragraphs paragraphs={section.paragraphs} />
        </div>
      )
    case 'list':
      return <BulletList key={index} items={section.items} />
    case 'table':
      return <CookieTable key={index} headers={section.headers} rows={section.rows} />
    case 'contact':
      return <ContactBlock key={index} lines={section.lines} />
    default:
      return null
  }
}

/**
 * Renderer seguro: apenas texto interpolado (sem HTML de tenant).
 */
export default function LegalDocumentView({ sections = [], context = {} }) {
  const resolved = sections.map((s) => interpolateSection(s, context))

  return (
    <article className="pb-1" aria-label="Documento legal">
      {resolved.map((section, index) => renderSection(section, index))}
    </article>
  )
}
