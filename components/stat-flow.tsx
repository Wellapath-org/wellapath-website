'use client'

/**
 * The receipts, counted in.
 *
 * §3 calls the exact figures the most valuable copy asset we have, so they are
 * the one place on the site where motion earns real attention rather than just
 * decorating. NumberFlow animates the digits themselves — an odometer roll, not
 * a `setInterval` counting up — which is the one effect here that CSS genuinely
 * cannot do.
 *
 * Progressive enhancement, in this order:
 *   1. The server renders the FINAL, correct figure as plain text. With
 *      JavaScript off or failed, the number is simply there and correct. This is
 *      not decoration over an empty element.
 *   2. On mount, if the viewer has not asked for reduced motion, the component
 *      swaps to NumberFlow starting from 0 and rolls to the real value once the
 *      figure scrolls into view.
 *   3. Under `prefers-reduced-motion`, it stays as plain text forever.
 *
 * The animation runs once. A number that re-animates every time it re-enters the
 * viewport is a toy, and these are clinical facts.
 */
import { useEffect, useRef, useState } from 'react'
import NumberFlow, { type Format } from '@number-flow/react'

export function StatFlow({ value, format }: { value: number; format?: Format }) {
  const [display, setDisplay] = useState<number | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const done = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return

    setDisplay(0)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return
        done.current = true
        setDisplay(value)
        io.disconnect()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value])

  // Server render and the reduced-motion path: the real figure, as text.
  if (display === null) {
    return (
      <span ref={ref} className="tnum">
        {value.toLocaleString('en-NG', format)}
      </span>
    )
  }

  return (
    <span ref={ref}>
      <NumberFlow
        value={display}
        format={format}
        locales="en-NG"
        transformTiming={{ duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        willChange
        aria-hidden={false}
      />
    </span>
  )
}
