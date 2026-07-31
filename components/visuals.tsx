/**
 * Generative SVG visuals.
 *
 * The radial burst that used to live here was removed: it was Stripe's shape
 * wearing our colours, and it read that way. `components/coverage-map.tsx`
 * replaced it with a scatter of our real facility coordinates, which is a
 * graphic nobody else can reproduce without doing the same fieldwork.
 *
 * Server components. No JavaScript ships for either: the geometry is generated
 * at build time and the motion is CSS scroll-driven, so they cost 0 KB against
 * a budget with ~9 KB of headroom.
 *
 * Determinism matters here. Positions come from a seeded generator rather than
 * Math.random, so server and client markup match exactly and React never
 * complains about a hydration mismatch.
 */

/** Mulberry32 — small, fast, deterministic. Same seed, same picture, always. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── FlowRibbon ─────────────────────────────────────────────────────────────
   Many near-parallel curves that pinch in the middle and splay at both ends,
   the way a fibre bundle does. Sits in the one dark section.

   Drift is a slow, bounded transform on the whole group — no per-path
   animation, so it stays cheap on a low-end GPU.
   ───────────────────────────────────────────────────────────────────────── */

export function FlowRibbon({ lines = 44, className = '' }: { lines?: number; className?: string }) {
  const rnd = seeded(75)
  const W = 1200
  const H = 420

  const paths = Array.from({ length: lines }, (_, i) => {
    const t = i / (lines - 1)
    const spread = 128
    const y0 = H * 0.62 + (t - 0.5) * spread * 1.5
    const y3 = H * 0.38 + (t - 0.5) * spread * 2.1
    const pinch = H * 0.5 + (t - 0.5) * 14 // the waist, where they converge
    const wob = (rnd() - 0.5) * 18
    return {
      i,
      d: `M -60 ${y0 + wob} C ${W * 0.3} ${y0 - 40}, ${W * 0.42} ${pinch}, ${W * 0.56} ${pinch} C ${W * 0.74} ${pinch}, ${W * 0.86} ${y3}, ${W + 60} ${y3 + wob}`,
    }
  })

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`ribbon pointer-events-none h-full w-full ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="ribbon-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0a8d8" stopOpacity="0.05" />
          <stop offset="22%" stopColor="#f0a8d8" stopOpacity="0.5" />
          <stop offset="48%" stopColor="#c3b2ff" stopOpacity="0.85" />
          <stop offset="72%" stopColor="#8f6dff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6b4eff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g className="ribbon-drift">
        {paths.map((p) => (
          <path key={p.i} d={p.d} fill="none" stroke="url(#ribbon-stroke)" strokeWidth="0.9" />
        ))}
      </g>
    </svg>
  )
}
