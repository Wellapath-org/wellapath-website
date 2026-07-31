'use client'

/**
 * Hero backdrop — loading strategy.
 *
 * The CSS aurora is rendered by the server and is always present. This wrapper
 * only fetches the WebGL version afterwards, and only when it is worth it:
 *
 *   - never on save-data connections
 *   - never under prefers-reduced-motion
 *   - never on a coarse pointer, where the cursor interaction cannot happen and
 *     the extra battery buys nothing
 *
 * The shader fades in over the CSS gradient, so if the fetch is slow, fails, or
 * WebGL is unavailable, the visitor simply keeps the CSS one and never sees a
 * gap. Nothing is revealed by the upgrade; it only gets better.
 */
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const GL = dynamic(() => import('./aurora-gl'), { ssr: false })

export function AuroraLayer() {
  const [gl, setGl] = useState(false)

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    setGl(true)
  }, [])

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      {gl && <GL />}
    </>
  )
}
