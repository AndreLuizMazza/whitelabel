import { forwardRef, useRef, useCallback } from 'react'

/**
 * Faixa horizontal com rolagem funcional no desktop (wheel + arrastar) e mobile (touch).
 */
const HorizontalScrollRow = forwardRef(function HorizontalScrollRow(
  {
    className = '',
    children,
    'aria-label': ariaLabel,
    role,
    ...props
  },
  ref
) {
  const innerRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })

  const setRef = useCallback(
    (node) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  const onWheel = useCallback((e) => {
    const el = innerRef.current
    if (!el || el.scrollWidth <= el.clientWidth + 1) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    e.preventDefault()
    el.scrollLeft += e.deltaY
  }, [])

  const onPointerDown = useCallback((e) => {
    const el = innerRef.current
    if (!el || e.button !== 0) return
    const target = e.target
    if (target instanceof Element && target.closest('a, button, input, textarea, select, label')) return

    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    }
    el.setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    const el = innerRef.current
    const drag = dragRef.current
    if (!el || !drag.active) return
    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > 3) drag.moved = true
    el.scrollLeft = drag.scrollLeft - dx
  }, [])

  const endDrag = useCallback((e) => {
    const el = innerRef.current
    const drag = dragRef.current
    if (!el || !drag.active) return
    drag.active = false
    try {
      el.releasePointerCapture?.(e.pointerId)
    } catch {}
  }, [])

  const onClickCapture = useCallback((e) => {
    if (dragRef.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current.moved = false
    }
  }, [])

  return (
    <div
      ref={setRef}
      className={`horizontal-scroll-row ${className}`.trim()}
      aria-label={ariaLabel}
      role={role}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      {...props}
    >
      {children}
    </div>
  )
})

export default HorizontalScrollRow
