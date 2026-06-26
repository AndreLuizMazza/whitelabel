const VARIANTS = {
  default: 'public-home-band--default',
  soft: 'public-home-band--soft',
  muted: 'public-home-band--muted',
  inset: 'public-home-band--inset',
  command: 'public-home-band--command',
}

/**
 * Faixa full-bleed da home com fundo alternado para ritmo visual entre seções.
 */
export default function PublicHomeBand({
  variant = 'default',
  children,
  className = '',
  id,
  compactTop = false,
}) {
  return (
    <div
      id={id}
      className={[
        'public-home-band',
        VARIANTS[variant] || VARIANTS.default,
        compactTop ? 'public-home-band--compact-top' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="container-max public-home-band__inner">{children}</div>
    </div>
  )
}
