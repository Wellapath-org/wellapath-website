/**
 * The data-source boundary for the admin panel.
 *
 * Every fact shown in /admin carries where it came from. There are four
 * states and no fifth, because the interesting question about an operational
 * number is not what it is but whether anyone actually measured it.
 *
 * The union below is the whole point. `unavailable` has no `value` field at
 * all, so a disabled subsystem cannot be given a number even by mistake — the
 * compiler rejects it rather than a reviewer having to catch it. That matters
 * because "0 crashes" and "crash reporting is off" are opposite facts, and a
 * launch decision made on the first while the second is true is a decision
 * made on evidence that does not exist.
 */

/** Why there is no value. Each renders as a word, never as a figure. */
export type Unavailable =
  /** Implemented, switched off in the build under review. */
  | 'disabled'
  /** No measurement of this exists anywhere yet. */
  | 'not-instrumented'
  /** Instrumented and running, but nothing has reported yet. */
  | 'awaiting-data'
  /** Nobody has checked, or a manual entry went stale. */
  | 'not-verified'

export const UNAVAILABLE_LABEL: Record<Unavailable, string> = {
  disabled: 'Disabled',
  'not-instrumented': 'Not instrumented',
  'awaiting-data': 'Awaiting data',
  'not-verified': 'Not verified',
}

export type FactState = 'live' | 'derived' | 'manual' | 'unavailable'

export type Fact =
  /** Measured against a live system during this request. */
  | {
      state: 'live'
      value: string
      source: string
      /** ISO 8601, UTC. Required: a live reading without a time is a guess. */
      observedAt: string
      note?: string
    }
  /** Computed from committed repository sources. Reproducible offline. */
  | {
      state: 'derived'
      value: string
      source: string
      note?: string
    }
  /** Somebody looked and typed it in. Only as good as who and when. */
  | {
      state: 'manual'
      value: string
      source: string
      observedBy: string
      /** ISO 8601 date or timestamp. */
      observedAt: string
      note?: string
    }
  /** No value exists. Note the absence of a `value` field. */
  | {
      state: 'unavailable'
      reason: Unavailable
      source: string
      note?: string
    }

/** A fact plus the label it is shown under. */
export type LabelledFact = Fact & { label: string }

/**
 * What to render. Never returns an empty string, a dash or a zero: an
 * unavailable fact returns its state word.
 */
export function factText(fact: Fact): string {
  return fact.state === 'unavailable' ? UNAVAILABLE_LABEL[fact.reason] : fact.value
}

/** True when a person supplied this rather than a system. */
export function isTestimony(fact: Fact): boolean {
  return fact.state === 'manual'
}

/**
 * How much of a panel a machine established, worst-fact-wins.
 *
 * A panel is only as trustworthy as its weakest fact, so one missing value
 * makes the whole panel incomplete however many live readings sit beside it.
 * `manual` stays separate from `derived` because the distinction a reader
 * needs is whether a system established this or a person typed it.
 */
export type PanelKind = 'live' | 'derived' | 'manual' | 'incomplete'

export const PANEL_KIND_LABEL: Record<PanelKind, string> = {
  live: 'Live',
  derived: 'Derived',
  manual: 'Manual',
  incomplete: 'Incomplete',
}

export function panelKind(facts: readonly Fact[]): PanelKind {
  if (facts.length === 0) return 'incomplete'
  if (facts.some((f) => f.state === 'unavailable' && f.reason === 'not-verified')) {
    return 'incomplete'
  }
  if (facts.some((f) => f.state === 'manual')) return 'manual'
  if (facts.some((f) => f.state === 'live')) return 'live'
  return 'derived'
}

/**
 * Manual facts expire. A sign-off from six weeks ago must not read as a
 * current one, so past the window it is restated as unverified with the
 * original observation kept in the note.
 */
export const FRESHNESS_WINDOW_DAYS = 14

export function aged(fact: Fact, now: Date, windowDays = FRESHNESS_WINDOW_DAYS): Fact {
  if (fact.state !== 'manual') return fact
  const observed = new Date(fact.observedAt)
  if (Number.isNaN(observed.getTime())) return fact
  const days = (now.getTime() - observed.getTime()) / 86_400_000
  if (days <= windowDays) return fact
  const on = fact.observedAt.slice(0, 10)
  return {
    state: 'unavailable',
    reason: 'not-verified',
    source: fact.source,
    note:
      `Last observed ${on} by ${fact.observedBy}` +
      (fact.note ? `. ${fact.note}` : '') +
      ` Past the ${windowDays}-day freshness window; observe again to restore it.`,
  }
}

/** Formats an ISO timestamp for display without pulling in a date library. */
export function observedLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toISOString().slice(0, 10)
  const time = d.toISOString().slice(11, 16)
  return `${date} ${time} UTC`
}
