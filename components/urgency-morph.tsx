'use client'

/**
 * The same symptoms, two different answers — loading strategy.
 *
 * ── Why this wrapper exists ────────────────────────────────────────────────
 * Framer Motion is worth it for exactly one component on this site (see
 * `urgency-morph-motion.tsx` for what it does and why). It is NOT worth 69 KB
 * on every page load: that is 57% of a 120 KB budget the audience pays for in
 * mobile data, spent on one card most visitors will scroll past.
 *
 * The first attempt used `LazyMotion` with an async `features` import, which
 * looks like it defers the cost but does not: importing `domAnimation` from
 * `motion/react` pulls the whole module into the same chunk. Measured, that
 * took First Load JS from 113 KB to 182 KB.
 *
 * So the split is drawn here instead, and it is a real one:
 *
 *   1. The server renders `UrgencyStatic` — the complete, correct content, in
 *      the final state, with zero motion code. This is what a visitor with
 *      JavaScript disabled, or on a slow connection, sees and can read.
 *   2. After mount, the motion version is fetched as its own chunk and swapped
 *      in. It never touches First Load JS.
 *
 * The static twin is not a spinner or a skeleton. It is the same card, showing
 * the July case, which is the one that makes the point.
 */
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { UrgencyStatic } from './urgency-morph-static'

const Motion = dynamic(() => import('./urgency-morph-motion'), { ssr: false })

export function UrgencyMorph() {
  const [enhanced, setEnhanced] = useState(false)

  useEffect(() => {
    // Only upgrade when the browser can actually benefit. Saves the fetch
    // entirely on save-data connections, which is the audience §9 cares about.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) return
    setEnhanced(true)
  }, [])

  return enhanced ? <Motion /> : <UrgencyStatic />
}
