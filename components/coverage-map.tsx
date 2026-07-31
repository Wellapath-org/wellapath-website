/**
 * The coverage map — plotted from the real facility coordinates.
 *
 * ── Why this replaced the radial burst ─────────────────────────────────────
 * The burst was Stripe's idea wearing our colours, and it read that way. This
 * is the opposite: it is a scatter of the ACTUAL latitude and longitude of the
 * facilities in `facilities.ng.v1.1.json`. The three clusters are Lagos, the
 * FCT and Kano, sitting where they really sit relative to one another. Nobody
 * can accuse us of copying a graphic that is literally our own dataset, and no
 * competitor can reproduce it without doing the same fieldwork.
 *
 * It is also the strongest possible version of §3's argument. "5,344 mapped
 * facilities" is a claim. This is the receipt: you can see the density of Lagos,
 * the sparseness of the FCT, and the hard fact that the rest of the country is
 * empty.
 *
 * ── Cost ───────────────────────────────────────────────────────────────────
 * Server component. Coordinates are projected at build time, sampled down to a
 * readable number of dots, and emitted as static SVG. Zero JavaScript ships for
 * the plotting. The scroll bloom is CSS; the cursor torch is the existing
 * pointer component writing two custom properties.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type Facility = {
  state: string
  latitude: number
  longitude: number
  emergency_capable: boolean
}

const W = 760
const H = 620
const PAD = 92

/** Equirectangular is exact enough across 6 degrees; nothing here is navigational. */
function project(lat: number, lng: number, b: Bounds) {
  const x = PAD + ((lng - b.lng0) / (b.lng1 - b.lng0)) * (W - PAD * 2)
  const y = H - PAD - ((lat - b.lat0) / (b.lat1 - b.lat0)) * (H - PAD * 2)
  return { x, y }
}

type Bounds = { lat0: number; lat1: number; lng0: number; lng1: number }

export function CoverageMap({ maxDots = 780 }: { maxDots?: number }) {
  const path = join(process.cwd(), 'content', 'artifacts', 'facilities.json')
  const all: Facility[] = JSON.parse(readFileSync(path, 'utf8')).facilities

  const lats = all.map((f) => f.latitude)
  const lngs = all.map((f) => f.longitude)
  const b: Bounds = {
    lat0: Math.min(...lats),
    lat1: Math.max(...lats),
    lng0: Math.min(...lngs),
    lng1: Math.max(...lngs),
  }

  // A uniform stride keeps each state's real share of the total, so the
  // picture stays honest about density even though it is not every record.
  const stride = Math.max(1, Math.ceil(all.length / maxDots))
  const dots = all
    .filter((_, i) => i % stride === 0)
    .map((f, i) => {
      const { x, y } = project(f.latitude, f.longitude, b)
      return { i, x, y, e: f.emergency_capable, state: f.state }
    })

  // Cluster centroids, plus a leader direction chosen per cluster so a label
  // never runs off the canvas — Kano sits top-right, so its label goes
  // down-left, while Lagos and the FCT point up-right into open space.
  const centres = ['Lagos', 'Kano', 'FCT'].map((name) => {
    const rows = all.filter((f) => f.state === name)
    const lat = rows.reduce((s, f) => s + f.latitude, 0) / rows.length
    const lng = rows.reduce((s, f) => s + f.longitude, 0) / rows.length
    const pt = project(lat, lng, b)
    const dx = pt.x > W * 0.55 ? -1 : 1
    const dy = pt.y < H * 0.45 ? 1 : -1
    return {
      name,
      count: rows.length,
      ...pt,
      lx: pt.x + dx * 86,
      ly: pt.y + dy * 62,
      anchor: dx === -1 ? ('end' as const) : ('start' as const),
    }
  })

  const emergency = all.filter((f) => f.emergency_capable).length

  return (
    <figure className="cov relative m-0">
      {/* The torch: a soft light that follows the cursor. Thematically it is
          "what is near me", which is the product. Sits under the dots. */}
      <div className="cov-torch pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="relative z-1 h-auto w-full"
        role="img"
        aria-label={`A scatter plot of ${all.length.toLocaleString('en-NG')} mapped health facilities, plotted at their real coordinates. Three dense clusters appear: Lagos in the south-west, the Federal Capital Territory in the centre, and Kano in the north. ${emergency} of the facilities are flagged emergency-capable and shown in red. The rest of Nigeria is empty.`}
      >
        <defs>
          <radialGradient id="cov-halo" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="120">
            <stop offset="0%" stopColor="#6b4eff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#6b4eff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft halo under each cluster, so density reads before the dots do. */}
        {centres.map((c) => (
          <circle
            key={`halo-${c.name}`}
            cx={c.x}
            cy={c.y}
            r={120}
            fill="url(#cov-halo)"
            transform={`translate(${c.x} ${c.y}) translate(${-c.x} ${-c.y})`}
          />
        ))}

        <g className="cov-dots">
          {dots.map((d) => (
            <circle
              key={d.i}
              cx={d.x}
              cy={d.y}
              r={d.e ? 2.6 : 1.7}
              fill={d.e ? 'var(--color-triage-crit)' : 'var(--color-accent)'}
              opacity={d.e ? 0.82 : 0.42}
              style={{ ['--d' as string]: `${(d.i % 40) * 0.9}%` }}
            />
          ))}
        </g>

        {/* Labels sit outside the clusters so they never cover data. */}
        {centres.map((c) => (
          <g key={c.name} className="cov-label">
            <line
              x1={c.x}
              y1={c.y}
              x2={c.lx}
              y2={c.ly}
              stroke="var(--color-ink)"
              strokeOpacity="0.26"
              strokeWidth="1"
            />
            <text
              x={c.lx}
              y={c.ly - 6}
              textAnchor={c.anchor}
              fontSize="15"
              fontWeight="700"
              fill="var(--color-ink)"
            >
              {c.name}
            </text>
            <text
              x={c.lx}
              y={c.ly + 12}
              textAnchor={c.anchor}
              fontSize="13"
              fill="var(--color-ink-mute)"
            >
              {c.count.toLocaleString('en-NG')} facilities
            </text>
          </g>
        ))}
      </svg>

      <figcaption className="text-small mt-6 text-ink-mute">
        Every dot is a real record from the shipped directory, at its real coordinates.{' '}
        <span className="text-triage-crit">Red</span> marks the {emergency} flagged
        emergency-capable. The empty space is the honest part.
      </figcaption>
    </figure>
  )
}
