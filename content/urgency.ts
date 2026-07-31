/**
 * Urgency levels.
 *
 * The artifacts carry FOUR values for `urgency_default`:
 *   non_urgent 19 · urgent 15 · emergency 10 · self_care 6
 *
 * The guide's receipts (§3) and the app's result screen both show THREE.
 * The site therefore folds `self_care` into non-urgent for display, which keeps
 * the "3" receipt honest about what a user is actually shown.
 *
 * ── OPEN QUESTION ───────────────────────────────────────────────────────────
 * This mapping is an assumption. If `self_care` is meant to be a distinct fourth
 * state, the receipt, the app UI and the UrgencyBadge all change together — and
 * this is the one line that has to change. Do not scatter this conditional.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type ArtifactUrgency = 'self_care' | 'non_urgent' | 'urgent' | 'emergency'
export type DisplayUrgency = 'non_urgent' | 'urgent' | 'emergency'

export const URGENCY_MAP: Record<ArtifactUrgency, DisplayUrgency> = {
  self_care: 'non_urgent', // ← the assumption
  non_urgent: 'non_urgent',
  urgent: 'urgent',
  emergency: 'emergency',
}

export function toDisplayUrgency(u: string): DisplayUrgency {
  return URGENCY_MAP[u as ArtifactUrgency] ?? 'urgent'
}

/**
 * The exact strings from the app's result screen, with the two copy bugs that
 * WEBSITE_GUIDE §4.2 flags already fixed:
 *   - "doctor.Schedule"                 → missing space
 *   - "Seek medical care Immediately!"  → capitalised mid-sentence
 */
export const URGENCY_COPY: Record<
  DisplayUrgency,
  { label: string; headline: string; body: string; timeframe: string }
> = {
  non_urgent: {
    label: 'Non-urgent',
    headline: 'Home self-care may be enough.',
    body: 'If it gets worse, or lasts more than 3 days, see a clinic.',
    timeframe: 'Watch and wait',
  },
  urgent: {
    label: 'Urgent',
    headline: 'You should consult a doctor.',
    body: 'See a clinician today. If your symptoms get worse, go sooner.',
    timeframe: 'Within 24 hours',
  },
  emergency: {
    label: 'Emergency',
    headline: 'Seek medical care immediately.',
    body: 'Go to the nearest emergency-capable facility now.',
    timeframe: 'Now',
  },
}

/** Order matters — used for sorting and for filter UI. */
export const URGENCY_ORDER: DisplayUrgency[] = ['emergency', 'urgent', 'non_urgent']
