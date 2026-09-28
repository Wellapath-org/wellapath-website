/**
 * Presentation for the admin panel.
 *
 * Server components, no client JavaScript, built from the existing primitives
 * in components/ui.tsx. The one job these add beyond layout is a correctness
 * job: `FactRow` renders a fact's state word when there is no value, so an
 * unavailable measurement can never appear as a figure. The `Fact` union
 * already makes that unrepresentable in the data; this is the second guard,
 * at the point of display.
 */
import type { ReactNode } from 'react'

import { Card } from '@/components/ui'
import {
  PANEL_KIND_LABEL,
  factText,
  observedLabel,
  panelKind,
  type Fact,
  type LabelledFact,
  type PanelKind,
} from '@/content/admin/facts'

/* ── panel heading ──────────────────────────────────────────────────────── */

const KIND_CLASS: Record<PanelKind, string> = {
  live: 'text-triage-safe',
  derived: 'text-accent-ink',
  manual: 'text-triage-warn',
  incomplete: 'text-ink-mute',
}

export function PanelKindTag({ facts }: { facts: readonly Fact[] }) {
  const kind = panelKind(facts)
  return (
    <span
      className={`text-eyebrow rounded-xs border border-rule px-1.5 py-0.5 font-semibold ${KIND_CLASS[kind]}`}
    >
      {PANEL_KIND_LABEL[kind]}
    </span>
  )
}

/* ── one fact ───────────────────────────────────────────────────────────── */

/**
 * A value is set in ink; an absence is set in muted italics. The difference is
 * deliberate and not decorative: a reader skimming the page should be able to
 * see, without reading a word, which rows are measurements and which are gaps.
 */
export function FactRow({ fact }: { fact: LabelledFact }) {
  const missing = fact.state === 'unavailable'
  return (
    <div className="border-t border-rule py-3 first:border-t-0 first:pt-0">
      <div className="text-small flex flex-wrap items-center gap-2 text-ink-mute">
        {fact.label}
        {fact.state === 'manual' && (
          <span className="text-eyebrow rounded-xs bg-accent-wash px-1.5 py-0.5 font-semibold text-accent-ink">
            Manual
          </span>
        )}
      </div>
      <p
        className={
          missing
            ? 'text-body mt-0.5 font-medium text-ink-mute italic'
            : 'text-body mt-0.5 font-semibold text-ink'
        }
      >
        {factText(fact)}
      </p>
      <p className="text-small mt-1 text-ink-mute">
        {fact.state === 'manual' && (
          <>
            Observed by {fact.observedBy} on {fact.observedAt.slice(0, 10)}
            {' · '}
          </>
        )}
        {fact.state === 'live' && <>Measured {observedLabel(fact.observedAt)} · </>}
        {fact.source}
      </p>
      {fact.note && <p className="text-small mt-1.5 text-ink-soft">{fact.note}</p>}
    </div>
  )
}

/* ── a panel of facts ───────────────────────────────────────────────────── */

export function FactPanel({
  title,
  facts,
  children,
}: {
  title: string
  facts: readonly LabelledFact[]
  children?: ReactNode
}) {
  return (
    <Card className="p-6" edge="ring">
      <h2 className="text-h3 flex flex-wrap items-center gap-2.5 font-semibold text-ink">
        {title}
        <PanelKindTag facts={facts} />
      </h2>
      {children && <p className="text-small mt-2 text-ink-soft">{children}</p>}
      <div className="mt-4">
        {facts.map((fact) => (
          <FactRow key={fact.label} fact={fact} />
        ))}
      </div>
    </Card>
  )
}

/** Panels side by side, stacking to one column on a narrow screen. */
export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="mt-8 grid gap-5 md:grid-cols-2">{children}</div>
}

/* ── an inactive section ────────────────────────────────────────────────── */

/**
 * For Feedback and Support. Both exist in the mobile app's interface and both
 * are switched off, so the honest page is one that says so and offers nothing
 * to click, rather than an empty table implying data will arrive.
 */
export function InactiveSection({
  what,
  why,
  whenActive,
}: {
  what: string
  why: string
  whenActive: string
}) {
  return (
    <Card className="p-6" edge="ring">
      <p className="text-body font-semibold text-ink">{what} is not active.</p>
      <p className="text-body mt-2 text-ink-soft">{why}</p>
      <p className="text-small mt-4 text-ink-mute">{whenActive}</p>
    </Card>
  )
}

/* ── the reading key, shown once on the overview ────────────────────────── */

export function ReadingKey() {
  return (
    <Card className="mt-8 p-6" edge="ring" tone="sunk">
      <p className="text-small font-semibold text-ink">How to read this</p>
      <p className="text-small mt-2 text-ink-soft">
        Every value carries where it came from. <strong>Live</strong> means a system was measured
        just now. <strong>Derived</strong> means it reproduces from the repository.{' '}
        <strong>Manual</strong> means a person typed it in, and it shows their name and the date.{' '}
        <strong>Incomplete</strong> means at least one fact is one nobody has supplied. A panel is
        labelled by its weakest fact.
      </p>
      <p className="text-small mt-2 text-ink-soft">
        Where something is switched off or was never instrumented, this panel says so in words. It
        never shows a zero, because no crashes and no crash reporting are different facts and only
        one of them is good news.
      </p>
    </Card>
  )
}
