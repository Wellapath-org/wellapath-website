/**
 * Presentation for the admin panel.
 *
 * Server components, no client JavaScript. Two rules shape everything here.
 *
 * First: a fact without a value renders its state as a word. The `Fact` union
 * already makes a number unrepresentable for an unavailable measurement; this
 * is the second guard, at the point of display. "0 crashes" and "crash
 * reporting is off" are opposite facts and only one is good news.
 *
 * Second: provenance sits beside each fact as a small text label rather than
 * behind a legend somebody has to read first. Where a fact came from is part
 * of the fact.
 */
import type { ReactNode } from 'react'

import {
  UNAVAILABLE_LABEL,
  factText,
  observedLabel,
  type Fact,
  type LabelledFact,
} from '@/content/admin/facts'

/* ── provenance ─────────────────────────────────────────────────────────── */

const PROVENANCE: Record<Fact['state'], string> = {
  live: 'Measured',
  derived: 'From source',
  manual: 'Recorded',
  unavailable: 'No value',
}

/**
 * Deliberately not the triage palette. Those three colours mean clinical
 * urgency everywhere else on this site, and spending them on provenance would
 * leave them meaning nothing. Brand purple marks the one thing that was
 * actually measured; everything else is ink.
 */
const PROVENANCE_CLASS: Record<Fact['state'], string> = {
  live: 'text-accent-ink',
  derived: 'text-ink-mute',
  manual: 'text-ink-mute',
  unavailable: 'text-ink-mute',
}

export function Provenance({ fact }: { fact: Fact }) {
  return (
    <span className={`text-eyebrow font-semibold uppercase ${PROVENANCE_CLASS[fact.state]}`}>
      {PROVENANCE[fact.state]}
    </span>
  )
}

/* ── one fact ───────────────────────────────────────────────────────────── */

/**
 * A value is set in ink; an absence is set in muted italics with the reason
 * spelled out. The difference is visible without reading a word, and the word
 * is there for anyone who does.
 */
export function FactRow({ fact }: { fact: LabelledFact }) {
  const missing = fact.state === 'unavailable'
  return (
    <div className="border-t border-rule py-2.5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-small text-ink-soft">{fact.label}</span>
        <Provenance fact={fact} />
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
            {fact.observedBy}, {fact.observedAt.slice(0, 10)} &middot;{' '}
          </>
        )}
        {fact.state === 'live' && <>{observedLabel(fact.observedAt)} &middot; </>}
        {fact.source}
      </p>
      {fact.note && <p className="text-small mt-1.5 text-ink-soft">{fact.note}</p>}
    </div>
  )
}

/* ── a section of facts ─────────────────────────────────────────────────── */

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
    <section className="rounded-md border border-rule bg-ground p-5">
      <h2 className="text-body font-semibold text-ink">{title}</h2>
      {children && <p className="text-small mt-1 text-ink-soft">{children}</p>}
      <div className="mt-3">
        {facts.map((fact) => (
          <FactRow key={fact.label} fact={fact} />
        ))}
      </div>
    </section>
  )
}

export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="mt-5 grid items-start gap-4 md:grid-cols-2">{children}</div>
}

/* ── page header ────────────────────────────────────────────────────────── */

/**
 * Compact by design. This is an operations tool, so the title is a label and
 * not a headline, and the first screen belongs to the data.
 */
export function AdminHeader({
  title,
  summary,
  observed,
}: {
  title: string
  summary: string
  observed?: string
}) {
  return (
    <header className="border-b border-rule pb-4">
      <p className="text-eyebrow font-semibold text-ink-mute uppercase">Internal · Not indexed</p>
      <h1 className="text-h2 mt-1.5 font-semibold text-ink">{title}</h1>
      <p className="text-body mt-1 max-w-[70ch] text-ink-soft">{summary}</p>
      {observed && <p className="text-small mt-2 text-ink-mute">{observed}</p>}
    </header>
  )
}

/* ── status summary ─────────────────────────────────────────────────────── */

export type SummaryItem = {
  label: string
  /** Already-formatted text. Never a bare number for something unmeasured. */
  value: string
  state: Fact['state']
  /** Optional qualifier, one short line. */
  hint?: string
}

/**
 * The handful of things worth knowing before anything else. Not a row of
 * decorative tiles: one bordered strip, hairline-divided, values in a
 * consistent weight so the eye can run down them.
 */
export function StatusSummary({ items }: { items: readonly SummaryItem[] }) {
  return (
    <section
      aria-label="Current status"
      className="mt-5 grid rounded-md border border-rule bg-ground sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="border-b border-rule p-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(2n)]:border-l sm:[&:nth-child(2n)]:border-rule lg:[&:nth-last-child(-n+3)]:border-b-0 lg:[&:not(:nth-child(3n+1))]:border-l lg:[&:not(:nth-child(3n+1))]:border-rule"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-small text-ink-soft">{item.label}</span>
            <span
              className={`text-eyebrow font-semibold uppercase ${PROVENANCE_CLASS[item.state]}`}
            >
              {PROVENANCE[item.state]}
            </span>
          </div>
          <p
            className={
              item.state === 'unavailable'
                ? 'text-body mt-1 font-medium text-ink-mute italic'
                : 'text-body mt-1 font-semibold text-ink'
            }
          >
            {item.value}
          </p>
          {item.hint && <p className="text-small mt-1 text-ink-mute">{item.hint}</p>}
        </div>
      ))}
    </section>
  )
}

/* ── scrollable table affordance ────────────────────────────────────────── */

/**
 * Tables wider than a phone scroll sideways. Without a stated affordance a
 * clipped column reads as a broken layout rather than a scrollable one, so the
 * hint is text, shown only where the scrolling actually happens.
 */
export function ScrollableTable({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="mt-3">
      <p className="text-small mb-1.5 text-ink-mute lg:hidden">
        {label} scrolls sideways on a narrow screen.
      </p>
      <div className="w-full min-w-0 overflow-x-auto">{children}</div>
    </div>
  )
}

/* ── inactive sections ──────────────────────────────────────────────────── */

/**
 * For Feedback, Support and anything else switched off. Three questions, in
 * the order someone actually asks them: what is the state, why is there no
 * data, and what has to happen first.
 */
export function InactiveSection({
  what,
  why,
  before,
}: {
  what: string
  why: string
  before: string
}) {
  return (
    <section className="rounded-md border border-rule bg-ground p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="text-body font-semibold text-ink">{what}</h2>
        <span className="text-eyebrow font-semibold text-ink-mute uppercase">
          {UNAVAILABLE_LABEL.disabled}
        </span>
      </div>
      <dl className="mt-3">
        <div className="py-2.5">
          <dt className="text-eyebrow text-ink-mute uppercase">Current state</dt>
          <dd className="text-body mt-0.5 text-ink">Not active. Nothing is collected.</dd>
        </div>
        <div className="border-t border-rule py-2.5">
          <dt className="text-eyebrow text-ink-mute uppercase">Why there is no data</dt>
          <dd className="text-body mt-0.5 text-ink-soft">{why}</dd>
        </div>
        <div className="border-t border-rule py-2.5">
          <dt className="text-eyebrow text-ink-mute uppercase">Before this becomes active</dt>
          <dd className="text-body mt-0.5 text-ink-soft">{before}</dd>
        </div>
      </dl>
    </section>
  )
}

/* ── the explanation, collapsed ─────────────────────────────────────────── */

/**
 * Useful, but not worth a third of the first viewport. A native disclosure,
 * so it costs nothing and needs no JavaScript.
 */
export function StatusKey() {
  return (
    <details className="mt-5 rounded-md border border-rule bg-ground">
      <summary className="text-small flex min-h-12 cursor-pointer list-none items-center px-4 font-medium text-ink-soft">
        How dashboard statuses work
        <span aria-hidden="true" className="ml-2">
          ▾
        </span>
      </summary>
      <div className="border-t border-rule px-4 py-3">
        <dl className="text-small grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink">Measured</dt>
            <dd className="text-ink-soft">A system was read just now, with the time shown.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">From source</dt>
            <dd className="text-ink-soft">Computed from the repository. Reproducible offline.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Recorded</dt>
            <dd className="text-ink-soft">
              A person observed it. Shows who and when, and expires after 14 days.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">No value</dt>
            <dd className="text-ink-soft">
              Disabled, not instrumented, awaiting data or not verified. Never shown as a number.
            </dd>
          </div>
        </dl>
        <p className="text-small mt-3 text-ink-soft">
          Where something is switched off or was never instrumented, this panel says so in words.
          It never shows a zero, because no crashes and no crash reporting are different facts and
          only one of them is good news.
        </p>
      </div>
    </details>
  )
}
