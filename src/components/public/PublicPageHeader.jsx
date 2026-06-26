/**
 * Header institucional padronizado para páginas públicas secundárias.
 * Alinhado ao padrão das seções da Home (kicker + título + descrição).
 */
export default function PublicPageHeader({
  kicker,
  title,
  description,
  align = 'left',
  size = 'default',
  actions = null,
  className = 'mb-6 md:mb-8',
  id,
  titleAs: TitleTag = 'h1',
}) {
  const isCenter = align === 'center'
  const isCompact = size === 'compact'

  return (
    <header
      className={[
        className,
        isCenter ? 'text-center' : 'text-left',
        actions ? 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={isCenter ? 'max-w-2xl mx-auto' : 'max-w-3xl'}>
        {kicker ? (
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            {kicker}
          </p>
        ) : null}

        <TitleTag
          id={id}
          className={[
            kicker ? 'mt-1' : '',
            isCompact
              ? 'text-xl md:text-2xl font-black tracking-tight'
              : 'text-2xl md:text-3xl font-black tracking-tight',
          ].join(' ')}
        >
          {title}
        </TitleTag>

        {description ? (
          <p
            className={[
              'mt-2 leading-relaxed text-[var(--text-muted)]',
              isCompact ? 'text-sm' : 'text-sm md:text-base',
              isCenter ? 'mx-auto' : 'max-w-2xl',
            ].join(' ')}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
