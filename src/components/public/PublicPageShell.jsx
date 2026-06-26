const WIDTH_CLASS = {
  default: '',
  narrow: 'max-w-5xl',
  wide: 'max-w-7xl',
}

/**
 * Shell padrão: section + container-max para páginas públicas secundárias.
 */
export default function PublicPageShell({
  children,
  maxWidth = 'default',
  className = '',
  sectionClassName = 'section',
}) {
  const widthClass = WIDTH_CLASS[maxWidth] || ''

  return (
    <section className={[sectionClassName, className].filter(Boolean).join(' ')}>
      <div className={['container-max', widthClass].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  )
}
