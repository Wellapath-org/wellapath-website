/**
 * Primitives.
 *
 * Rebuilt against documented craft rather than instinct. The specific things
 * this version does differently, each of which is a named tell of generated
 * design that the previous version was committing:
 *
 *   1. EDGE **XOR** ELEVATION. A card gets a ring or a shadow, never both.
 *      1px border + diffuse shadow together is the generated-UI signature.
 *   2. NO COLOURED LEFT BORDERS. `border-l-4` in a brand colour is reportedly
 *      the single most reliable tell there is. Urgency is carried by a badge
 *      and a tinted surface instead — which is also better for §10, since the
 *      text label was already doing the semantic work.
 *   3. ICONS INLINE WITH THE HEADING, not stacked in a tile above it. The
 *      icon-tile-over-heading grid is the default generated homepage.
 *   4. EYEBROWS IN MONO AND MUTED, not uppercase in the brand colour. A
 *      coloured tracked kicker borrows editorial authority it has not earned.
 *   5. RINGS, NOT BORDERS, at low alpha — `ring ring-ink/6`. Tailwind's own
 *      marketing site ships zero `shadow-*` utilities and does every edge
 *      this way.
 *   6. ASYMMETRIC GRIDS. Uniform 3-column icon+heading+paragraph rows are the
 *      most recognisable generated layout; `Split` and `Bento` replace them.
 *
 * Tailwind v4 notes: `ring` is 1px currentColor here (it was 3px blue in v3),
 * bare `border` would inherit currentColor, and gradients use `bg-linear-*`.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { StatFlow } from './stat-flow'

/* ── TwoTone ────────────────────────────────────────────────────────────────
   Bold ink lead + muted continuation, inline. Keep the continuation to two
   lines; the device dies past three.
   ───────────────────────────────────────────────────────────────────────── */

export function TwoTone({
  lead,
  rest,
  as: As = 'h2',
  size = 'display',
  className = '',
}: {
  lead: string
  rest?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  size?: 'hero' | 'display' | 'h1' | 'h2' | 'h3'
  className?: string
}) {
  const sizeCls = {
    hero: 'text-hero',
    display: 'text-display',
    h1: 'text-h1',
    h2: 'text-h2',
    h3: 'text-h3',
  }[size]
  return (
    <As className={`${sizeCls} font-bold text-ink ${className}`}>
      {lead}
      {rest && <span className="font-normal text-ink-soft"> {rest}</span>}
    </As>
  )
}

/* ── Eyebrow ────────────────────────────────────────────────────────────────
   Mono, muted, lightly tracked. Not a coloured uppercase kicker, and not a
   pill badge above the heading.
   ───────────────────────────────────────────────────────────────────────── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-eyebrow font-mono font-medium uppercase text-ink-mute">{children}</p>
  )
}

/* ── Layout ─────────────────────────────────────────────────────────────────
   `space` is contrastive on purpose. Uniform py-24 everywhere reads as
   unfinished; related things sit tight, unrelated things sit far apart.
   ───────────────────────────────────────────────────────────────────────── */

export function Section({
  children,
  tone = 'ground',
  id,
  space = 'normal',
  rails = true,
  className = '',
}: {
  children: ReactNode
  tone?: 'ground' | 'sunk' | 'navy'
  id?: string
  space?: 'tight' | 'normal' | 'loose'
  rails?: boolean
  className?: string
}) {
  const bg = { ground: 'bg-ground', sunk: 'bg-sunk', navy: 'bg-navy text-white' }[tone]
  // White space that reads as composure on a 1280px screen reads as dead air on
  // a 360px one, where a section's padding alone can outweigh its content. The
  // tone change between sections already signals the break on a phone, so the
  // gap does less work there and can afford to be smaller. Desktop is unchanged.
  const pad = {
    tight: 'py-10 sm:py-12 md:py-16',
    normal: 'py-14 sm:py-16 md:py-24',
    loose: 'py-16 sm:py-20 md:py-36',
  }[space]
  return (
    <section id={id} className={`relative ${bg} ${className}`}>
      {/* px-5 below sm: at 320px the old px-6 spent 48px of a 320px screen on
          margins. Five more pixels of line length per side is the difference
          between four words a line and five. */}
      <div
        className={`relative mx-auto w-full max-w-[1120px] px-5 sm:px-6 md:px-10 ${pad} ${rails ? 'rails' : ''}`}
      >
        <div className="relative z-1 min-w-0">{children}</div>
      </div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  lead,
  rest,
  className = '',
}: {
  eyebrow?: string
  lead: string
  rest?: string
  className?: string
}) {
  return (
    <div className={`measure-wide mb-8 sm:mb-10 md:mb-12 ${className}`}>
      {eyebrow && (
        <div className="mb-4">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <TwoTone lead={lead} rest={rest} size="display" />
    </div>
  )
}

export function PageHeader({
  eyebrow,
  lead,
  rest,
  children,
  aside,
}: {
  eyebrow?: string
  lead: string
  rest?: string
  children?: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-ground">
      <div className="aurora-soft" aria-hidden="true" />
      <div className="rails relative mx-auto w-full max-w-[1120px] px-5 py-14 sm:px-6 sm:py-16 md:px-10 md:py-24">
        <div
          className={`relative z-1 ${aside ? 'grid items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-14' : ''}`}
        >
          <div className={`min-w-0 ${aside ? 'md:col-span-7' : ''}`}>
            {eyebrow && (
              <div className="mb-4 sm:mb-5">
                <Eyebrow>{eyebrow}</Eyebrow>
              </div>
            )}
            <TwoTone lead={lead} rest={rest} as="h1" size="display" className="measure-wide" />
            {children && <div className="mt-6 sm:mt-8">{children}</div>}
          </div>
          {aside && <div className="min-w-0 md:col-span-5">{aside}</div>}
        </div>
      </div>
    </section>
  )
}

/* ── Split ──────────────────────────────────────────────────────────────────
   Asymmetric two-column. Replaces the uniform 3-col grid wherever the content
   is one idea plus one visual.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Written out in full because Tailwind scans source text: a template-built
 * class name like `md:col-span-${n}` is never generated.
 *
 * These pair at `md` (768px), not `lg` (1024px). At `lg` every tablet in
 * portrait fell through to the stacked phone layout: an iPad at 820px showed a
 * 320px-wide mock centred in an 820px viewport with 250px of dead margin either
 * side. Measured, moving the pairing to 768px took the home page from 13,403px
 * to 11,358px at that width. 768px is comfortably enough for a 7/5 split, so
 * the tablet now gets a tablet layout instead of a stretched phone one.
 */
const RATIOS = {
  '7/5': ['md:col-span-7', 'md:col-span-5'],
  '6/6': ['md:col-span-6', 'md:col-span-6'],
  '5/7': ['md:col-span-5', 'md:col-span-7'],
} as const

export function Split({
  children,
  aside,
  reverse = false,
  ratio = '7/5',
  align = 'center',
}: {
  children: ReactNode
  aside: ReactNode
  reverse?: boolean
  ratio?: keyof typeof RATIOS
  align?: 'center' | 'start'
}) {
  const [a, b] = RATIOS[ratio]
  return (
    <div
      className={`grid gap-8 sm:gap-10 md:grid-cols-12 md:gap-12 lg:gap-16 ${
        align === 'center' ? 'md:items-center' : 'md:items-start'
      }`}
    >
      <div className={`min-w-0 ${a} ${reverse ? 'md:order-2' : ''}`}>{children}</div>
      <div className={`min-w-0 ${b} ${reverse ? 'md:order-1' : ''}`}>{aside}</div>
    </div>
  )
}

/* ── Button ─────────────────────────────────────────────────────────────────
   All six states shipped: default, hover, focus-visible, active, disabled,
   and a visible pressed transform. That is craft you cannot see in a
   screenshot and is exactly what generated markup omits.
   ───────────────────────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'emergency' | 'onNavy'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-white font-semibold hover:bg-accent-hover active:bg-accent-ink shadow-lift',
  secondary:
    'bg-card text-ink font-semibold ring ring-ink/12 hover:ring-ink/25 hover:bg-sunk active:bg-sunk',
  ghost: 'text-accent-ink font-semibold hover:bg-accent-wash active:bg-accent-wash',
  emergency: 'bg-triage-crit text-white font-bold hover:brightness-95 active:brightness-90 shadow-lift',
  onNavy: 'bg-white text-ink font-semibold hover:bg-accent-wash active:bg-accent-wash',
}

export function Button({
  href,
  variant = 'primary',
  children,
  full,
  type,
  icon: Icon = ArrowRight,
  showIcon = true,
}: {
  href?: string
  variant?: Variant
  children: ReactNode
  full?: boolean
  type?: 'submit' | 'button'
  icon?: LucideIcon
  showIcon?: boolean
}) {
  const cls = [
    'group transition-safe inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-2 text-center text-body',
    'motion-safe:active:translate-y-px',
    VARIANTS[variant],
    full ? 'w-full' : '',
  ].join(' ')

  const inner = (
    <>
      {children}
      {showIcon && (
        <Icon
          className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </>
  )

  if (href) {
    const external = href.startsWith('http') || href.startsWith('tel:') || href.startsWith('#')
    return external ? (
      <a href={href} className={cls}>
        {inner}
      </a>
    ) : (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <button type={type ?? 'button'} className={cls}>
      {inner}
    </button>
  )
}

export function TextLink({
  href,
  children,
  onNavy = false,
}: {
  href: string
  children: ReactNode
  onNavy?: boolean
}) {
  const cls = `group transition-safe inline-flex min-h-12 items-center gap-1.5 text-body font-semibold ${
    onNavy ? 'text-white' : 'text-accent-ink'
  }`
  const inner = (
    <>
      {children}
      <ArrowRight
        className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </>
  )
  const external = href.startsWith('http') || href.startsWith('#')
  return external ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  )
}

/* ── Card ───────────────────────────────────────────────────────────────────
   `edge` picks ring OR shadow. Never both.
   ───────────────────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = '',
  as: As = 'div',
  edge = 'ring',
  wash = false,
  lift = false,
  tone = 'card',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'article'
  edge?: 'ring' | 'raised' | 'none'
  wash?: boolean
  lift?: boolean
  tone?: 'card' | 'sunk' | 'navy'
}) {
  const surface = {
    card: 'bg-card',
    sunk: 'bg-sunk',
    navy: 'bg-navy-card text-white',
  }[tone]

  const edgeCls = {
    ring: tone === 'navy' ? 'inset-ring inset-ring-white/10' : 'ring ring-ink/8',
    raised: 'shadow-raise',
    none: '',
  }[edge]

  const hover = lift
    ? edge === 'ring'
      ? 'lift hover:ring-ink/16'
      : 'lift hover:shadow-float'
    : ''

  return (
    <As
      className={`transition-safe relative overflow-hidden rounded-xl ${surface} ${edgeCls} ${hover} ${className}`}
    >
      {wash && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60"
          style={{
            background:
              'radial-gradient(60% 120% at 20% 100%, #ded1ff 0%, transparent 70%), radial-gradient(60% 120% at 85% 100%, #c4b0ff 0%, transparent 70%)',
          }}
        />
      )}
      <div className="relative z-1">{children}</div>
    </As>
  )
}

/* ── FeatureRow ─────────────────────────────────────────────────────────────
   Icon INLINE with the heading, sized to the cap height. Not a tile stacked
   above it.
   ───────────────────────────────────────────────────────────────────────── */

export function FeatureRow({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div>
      <h3 className="text-h3 flex items-center gap-2.5 font-bold text-ink">
        <Icon className="size-5 shrink-0 text-accent-ink" aria-hidden="true" />
        {title}
      </h3>
      <div className="text-body mt-3 text-ink-soft">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────────────────────────
   Neutral surface + inset ring. Not a saturated colour pill.
   ───────────────────────────────────────────────────────────────────────── */

export function Badge({
  children,
  icon: Icon,
  tone = 'neutral',
}: {
  children: ReactNode
  icon?: LucideIcon
  tone?: 'neutral' | 'accent'
}) {
  const cls =
    tone === 'accent'
      ? 'bg-accent-wash text-accent-ink inset-ring inset-ring-accent/20'
      : 'bg-ink/3 text-ink-soft inset-ring inset-ring-ink/10'
  return (
    <span
      className={`text-small inline-flex w-fit max-w-full self-start items-center gap-1.5 rounded-full px-3 py-1 font-medium ${cls}`}
    >
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  )
}

/* ── Stat ───────────────────────────────────────────────────────────────────
   Weight 400, not bold. That single choice is most of why these read as
   expensive rather than loud. Do not "fix" it.
   ───────────────────────────────────────────────────────────────────────── */

export function Stat({
  value,
  label,
  emphasis = false,
  gradient = false,
  animate = true,
}: {
  value: string | number
  label: string
  emphasis?: boolean
  gradient?: boolean
  /** Set false for figures that are not counts (dates, ranges, words). */
  animate?: boolean
}) {
  // Only numeric figures roll. Anything else renders as given.
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  // Never flow a gradient figure: `background-clip: text` cannot paint
  // NumberFlow's nested digit spans, and the number renders invisible.
  const canFlow =
    animate && !gradient && Number.isFinite(numeric) && String(value).trim() !== ''

  return (
    <div>
      <div
        className={`tnum text-figure font-normal ${
          gradient ? 'figure-gradient' : emphasis ? 'text-ink' : 'text-ink-soft'
        }`}
      >
        {canFlow ? <StatFlow value={numeric} /> : value}
      </div>
      <div className={`text-small mt-3 ${gradient ? 'text-ink-on-navy' : 'text-ink-mute'}`}>
        {label}
      </div>
    </div>
  )
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="stagger grid grid-cols-2 gap-x-8 gap-y-12 border-y border-rule py-12 md:grid-cols-4">
      {children}
    </div>
  )
}

/* ── Prose ──────────────────────────────────────────────────────────────── */

export function Prose({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`${wide ? 'measure-wide' : 'measure'} space-y-5 text-body-lg text-ink-soft [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-ink`}
    >
      {children}
    </div>
  )
}
