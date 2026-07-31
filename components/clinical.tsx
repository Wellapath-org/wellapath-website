/**
 * The clinical components.
 *
 * Restyled to the Stripe register; the safety contracts are unchanged, because
 * they are not aesthetic preferences:
 *
 *   - UrgencyBadge has no colour-only variant. The text label is not a prop.
 *   - DangerSigns contains no <details>, <button> or aria-expanded.
 *   - MatchStrength always renders its word label beside the bar.
 *   - The disclaimer is a design element, never fine print.
 *
 * The triage palette stays semantic. Gradients, washes and the aurora are
 * violet-only — no decorative red, amber or green anywhere on the site.
 */
import { URGENCY_COPY, type DisplayUrgency } from '@/content/urgency'
import { DISCLAIMER, EMERGENCY } from '@/content/site'
import type { RedFlagLabel } from '@/content/red-flag-labels'
import Link from 'next/link'
import { Button } from './ui'
import { TriangleAlert, Phone, Smartphone, Info } from 'lucide-react'

const TRIAGE: Record<
  DisplayUrgency,
  { text: string; wash: string; fill: string; level: 1 | 2 | 3 }
> = {
  non_urgent: {
    text: 'text-triage-safe',
    wash: 'bg-triage-safe-wash',
    fill: 'bg-triage-safe',
    level: 1,
  },
  urgent: {
    text: 'text-triage-warn',
    wash: 'bg-triage-warn-wash',
    fill: 'bg-triage-warn',
    level: 2,
  },
  emergency: {
    text: 'text-triage-crit',
    wash: 'bg-triage-crit-wash',
    fill: 'bg-triage-crit',
    level: 3,
  },
}

/* ── UrgencyBadge ────────────────────────────────────────────────────────────
   A three-step scale, not a badge.

   The previous version was a rounded pill with a coloured dot in it, which is
   the stock generated-UI badge and reads as one. This shows the same thing more
   usefully: three segments, filled to the level, plus the word and the position
   in the scale. It tells you there ARE three levels and which one this is —
   information the pill never carried — and it reuses the segmented motif the
   product already uses for match strength, so the two feel like one system.

   Colour PLUS text, always (§10). The word is not optional and not a prop. */

export function UrgencyBadge({ urgency }: { urgency: DisplayUrgency }) {
  const s = TRIAGE[urgency]
  return (
    <span className="inline-flex items-center gap-2.5">
      <span aria-hidden="true" className="inline-flex gap-[3px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3.5 w-1 rounded-xs ${i <= s.level ? s.fill : 'bg-ink/12'}`}
          />
        ))}
      </span>
      <span className={`text-eyebrow font-mono font-semibold uppercase ${s.text}`}>
        {URGENCY_COPY[urgency].label}
      </span>
      <span className="text-eyebrow tnum font-mono uppercase text-ink-mute">
        {s.level}/3
      </span>
    </span>
  )
}

/* No coloured left stripe. The urgency reads from the badge and the tinted
   header band, both of which carry the word as well as the hue (§10). */
export function UrgencyCard({ urgency }: { urgency: DisplayUrgency }) {
  const s = TRIAGE[urgency]
  const copy = URGENCY_COPY[urgency]
  return (
    <div className="overflow-hidden rounded-xl bg-card ring ring-ink/8">
      <div className={`${s.wash} px-6 py-3`}>
        <UrgencyBadge urgency={urgency} />
      </div>
      <div className="p-6">
        <h3 className="text-h3 font-bold text-ink">{copy.headline}</h3>
        <p className="text-body mt-2 text-ink-soft">{copy.body}</p>
        <p className="text-small mt-5 text-ink-mute">
          Timeframe: <span className={`font-semibold ${s.text}`}>{copy.timeframe}</span>
        </p>
      </div>
    </div>
  )
}

/* ── EmergencyCard ───────────────────────────────────────────────────────────
   §11 puts this on every page. The previous version was a tinted box with a
   heading and two buttons, which is the generic alert component and looked it.

   This is built around the one thing that matters: the number. 112 is set as a
   display figure in tabular numerals, the way a printed emergency notice sets
   it, with the instruction beside rather than beneath. The number is itself the
   tap target on a phone.

   Restraint still applies (§2: no red-everywhere). The red is a single hairline
   rule across the top and the numeral. Nothing flashes, nothing pulses.
   ───────────────────────────────────────────────────────────────────────── */

export function EmergencyCard({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <aside
      aria-labelledby="emergency-heading"
      className={`overflow-hidden rounded-xl bg-card ring ring-ink/8 ${className}`}
    >
      <div className="h-[3px] w-full bg-triage-crit" aria-hidden="true" />
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 md:p-8">
        <a
          href={`tel:${EMERGENCY.national}`}
          className="transition-safe group flex min-h-12 items-baseline gap-2 rounded-md py-1 sm:block"
          aria-label={`Call emergency services on ${EMERGENCY.national}`}
        >
          <span className="text-eyebrow block font-mono uppercase text-ink-mute">Call</span>
          <span className="tnum text-figure block font-normal leading-none text-triage-crit group-hover:underline">
            {EMERGENCY.national}
          </span>
        </a>

        <div className="min-w-0 sm:border-l sm:border-rule sm:pl-8">
          <h2 id="emergency-heading" className="text-h3 font-bold text-ink">
            In an emergency, do not use an app.
          </h2>
          <p className="text-body measure mt-2 text-ink-soft">
            Call {EMERGENCY.national} or go straight to the nearest emergency-capable facility. A
            phone call is faster than any assessment.
          </p>
          {!compact && (
            <p className="text-small mt-4 text-ink-mute">
              {EMERGENCY.note} Coverage of emergency-capable facilities:{' '}
              <Link href="/coverage" className="text-accent-ink underline underline-offset-2">
                Lagos, Kano and the FCT
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

/* ── DangerSigns ──────────────────────────────────────────────────────────
   The highest-stakes component on the site. Never collapsible — no <details>,
   no tabs, no "read more" (§8.1). Fully expanded, in the DOM, in source order,
   on first paint.
   ───────────────────────────────────────────────────────────────────────── */

export function DangerSigns({
  signs,
  conditionName,
}: {
  signs: (RedFlagLabel & { token: string })[]
  conditionName: string
}) {
  if (signs.length === 0) return null
  const unreviewed = signs.filter((s) => !s.reviewed).length

  return (
    <section
      aria-labelledby="danger-signs"
      className="overflow-hidden rounded-xl bg-card ring ring-triage-crit/25"
    >
      <div className="bg-triage-crit-wash px-6 py-4 md:px-8">
        <h2
          id="danger-signs"
          className="text-h2 flex items-center gap-3 font-bold text-triage-crit"
        >
          <TriangleAlert className="size-6 shrink-0" aria-hidden="true" />
          Danger signs: go now
        </h2>
      </div>
      <div className="p-6 md:p-8">
      <p className="text-body measure text-ink-soft">
        If any of these are present with {conditionName.toLowerCase()}, do not wait to see if it
        improves. Get to the nearest emergency-capable facility.
      </p>

      <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {signs.map((s) => (
          <li key={s.token} className="text-body flex gap-3 text-ink">
            <span
              aria-hidden="true"
              className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-triage-crit"
            />
            <span>
              {s.label}
              {!s.reviewed && (
                <span className="text-small ml-2 rounded-xs bg-triage-warn-wash px-1.5 py-0.5 font-semibold text-triage-warn">
                  draft, awaiting clinical review
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href={`tel:${EMERGENCY.national}`} variant="emergency" icon={Phone}>
          Call emergency: {EMERGENCY.national}
        </Button>
        <Button href="/#get-the-app" variant="secondary" icon={Smartphone}>
          Get the app to find care
        </Button>
      </div>

      {unreviewed > 0 && (
        <p className="text-small mt-6 border-t border-rule pt-4 text-ink-mute">
          <strong className="font-semibold text-ink">Note for the team:</strong> {unreviewed} of{' '}
          {signs.length} signs on this page are drafts awaiting clinical sign-off. This notice does
          not appear in a production build. The build fails instead.
        </p>
      )}
      </div>
    </section>
  )
}

/* ── MatchStrength ────────────────────────────────────────────────────────
   How the product talks about confidence without ever printing a percentage.
   The word label is mandatory: a bar alone invites being read as probability.
   ───────────────────────────────────────────────────────────────────────── */

const MATCH_LABELS = ['Low evidence', 'Fair evidence', 'Moderate match', 'Strong match'] as const

export function MatchStrength({ filled }: { filled: 1 | 2 | 3 | 4 }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden="true" className="inline-flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 w-6 rounded-xs ${i <= filled ? 'bg-accent' : 'bg-rule'}`} />
        ))}
      </span>
      <span className="text-body font-semibold text-ink">{MATCH_LABELS[filled - 1]}</span>
    </span>
  )
}

/* ── Disclaimer — a design element, not fine print (§1) ─────────────────── */

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`relative overflow-hidden rounded-xl bg-sunk p-6 ring ring-ink/8 ${className}`}
      aria-label="Important"
    >
      <p className="text-body measure flex gap-3 text-ink-soft">
        <Info className="mt-1 size-4.5 shrink-0 text-ink-mute" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-ink">Important.</strong> {DISCLAIMER}
        </span>
      </p>
    </aside>
  )
}

/* ── PrivacyDiagram ───────────────────────────────────────────────────────
   §6.2: one honest diagram outperforms three paragraphs of privacy prose.
   Real <text> nodes — selectable, indexable, survives 200% zoom.
   ───────────────────────────────────────────────────────────────────────── */

export function PrivacyDiagram() {
  return (
    <svg
      viewBox="0 0 420 280"
      className="draw h-auto w-full max-w-lg"
      role="img"
      aria-labelledby="pd-title pd-desc"
    >
      <title id="pd-title">How your symptom data stays on your phone</title>
      <desc id="pd-desc">
        The clinical rules are downloaded from WellaPath&apos;s server to your phone. The assessment
        runs entirely on the phone. Nothing you enter is sent back. There is no return arrow.
      </desc>

      <rect
        x="118"
        y="10"
        width="184"
        height="52"
        rx="10"
        fill="var(--color-sunk)"
        stroke="var(--color-rule)"
      />
      <text x="210" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-ink)">
        WellaPath server
      </text>
      <text x="210" y="52" textAnchor="middle" fontSize="11.5" fill="var(--color-ink-mute)">
        50 conditions · 75 rules
      </text>

      <line
        x1="210"
        y1="66"
        x2="210"
        y2="112"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        data-draw
        style={{ ['--len' as string]: 46 }}
      />
      <polygon points="210,122 204,110 216,110" fill="var(--color-accent)" data-fade />
      <text x="226" y="94" fontSize="11.5" fontWeight="600" fill="var(--color-accent-ink)">
        the clinical rules come down
      </text>

      <rect
        x="136"
        y="128"
        width="148"
        height="142"
        rx="16"
        fill="var(--color-card)"
        stroke="var(--color-ink)"
        strokeWidth="2"
        data-draw
        style={{ ['--len' as string]: 560 }}
      />
      <rect x="150" y="142" width="120" height="32" rx="6" fill="var(--color-accent-wash)" data-fade />
      <text x="210" y="163" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--color-accent-ink)">
        Your symptoms
      </text>
      <rect x="150" y="182" width="120" height="32" rx="6" fill="var(--color-sunk)" data-fade />
      <text x="210" y="203" textAnchor="middle" fontSize="11.5" fill="var(--color-ink)">
        Scoring engine
      </text>
      <rect x="150" y="222" width="120" height="32" rx="6" fill="var(--color-sunk)" data-fade />
      <text x="210" y="243" textAnchor="middle" fontSize="11.5" fill="var(--color-ink)">
        Your result
      </text>

      <text x="10" y="196" fontSize="12.5" fontWeight="700" fill="var(--color-ink)">
        Your phone
      </text>
      <text x="10" y="215" fontSize="11.5" fill="var(--color-ink-mute)">
        Everything
      </text>
      <text x="10" y="231" fontSize="11.5" fill="var(--color-ink-mute)">
        happens here
      </text>

      <text x="300" y="192" fontSize="11.5" fontWeight="700" fill="var(--color-triage-safe)">
        No arrow
      </text>
      <text x="300" y="209" fontSize="11.5" fontWeight="700" fill="var(--color-triage-safe)">
        goes back up.
      </text>
    </svg>
  )
}
