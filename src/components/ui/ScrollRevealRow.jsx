import HorizontalScrollRow from '@/components/ui/HorizontalScrollRow'

/**
 * Faixa horizontal com peek do próximo item (sem fade/sombra nas bordas).
 */
export default function ScrollRevealRow({
  children,
  className = '',
  rowClassName = '',
  'aria-label': ariaLabel,
  role,
  ...props
}) {
  return (
    <div className={['scroll-reveal scroll-reveal--peek', className].filter(Boolean).join(' ')}>
      <HorizontalScrollRow
        className={rowClassName}
        aria-label={ariaLabel}
        role={role}
        {...props}
      >
        {children}
      </HorizontalScrollRow>
    </div>
  )
}
