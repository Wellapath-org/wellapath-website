'use client'

/**
 * Pointer-driven effects.
 *
 * Deliberately hand-rolled rather than pulled from a library. The whole thing is
 * two pointer listeners writing CSS custom properties; the smallest library that
 * does it costs more bytes than the feature, and we have ~13 KB of headroom in a
 * 120 KB budget that the audience pays for in mobile data.
 *
 * Everything scroll-driven lives in CSS (`animation-timeline`), which is what
 * Stripe does and which runs off the main thread. JavaScript is only used here
 * for what CSS genuinely cannot observe: the pointer.
 *
 * Guards, all of them load-bearing:
 *   - `pointer: fine` only. Never fires on touch, where there is no cursor to
 *     follow and the listener would cost battery for nothing.
 *   - `prefers-reduced-motion` respected.
 *   - Renders its children unchanged if the effect never initialises, so the
 *     content is complete with JavaScript disabled.
 */
import { useEffect, useRef, type ReactNode } from 'react'

export function Spotlight({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const move = (e: PointerEvent) => {
      if (frame) return // one write per frame, never per event
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    const enter = () => el.style.setProperty('--spot', '1')
    const leave = () => {
      el.style.setProperty('--spot', '0')
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    el.addEventListener('pointermove', move, { passive: true })
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className={`spotlight ${className}`}>
      {children}
    </div>
  )
}
