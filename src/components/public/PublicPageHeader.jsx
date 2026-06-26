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
  className = 'mb-4 md:mb-5',
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
          <p className="public-kicker">{kicker}</p>
        ) : null}

        <TitleTag
          id={id}
          className={[
            kicker ? 'mt-1' : '',
            isCompact
              ? 'text-xl md:text-2xl font-black tracking-tight'
              : 'public-heading mt-1',
          ].join(' ')}
        >
          {title}
        </TitleTag>

        {description ? (
          <p
            className={[
              'public-lead',
              isCompact ? 'text-sm' : '',
              isCenter ? 'mx-auto' : '',
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
