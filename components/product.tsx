/**
 * The product, drawn — not screenshotted.
 *
 * Raw app screenshots sat badly in this layout: wrong aspect ratios, baked-in
 * status bars, a device frame fighting the page's own frame, and text rendered
 * at whatever size the capture happened to be. Stripe does not paste
 * screenshots either — its product cards are recreated UI.
 *
 * Rebuilding the screens as real markup buys: crisp at any size, correct in
 * both themes, ~0 KB instead of ~25 KB each, selectable and translatable text,
 * and — the reason that matters most here — the copy is the *corrected* copy.
 * The app's "medical evaluation.Schedule" bug (§4.2) is not reproduced, because
 * these strings come from `content/urgency.ts` rather than from a PNG.
 */
import { URGENCY_COPY, type DisplayUrgency } from '@/content/urgency'
import { DISCLAIMER } from '@/content/site'
import type { ReactNode } from 'react'

/* ── MockFrame ────────────────────────────────────────────────────────────
   Every recreated screen is announced as ONE image with a written description,
   never as a pile of fake interface text. Without this a screen-reader user
   hears "Head, Chest, Abdomen, Search, Point on the body…" as though it were
   operable content — which it is not; it is a picture of the app.

   It also means the 15px prose floor does not apply inside: this is an
   illustration rendered at device scale, not text anyone is asked to read.
   ───────────────────────────────────────────────────────────────────────── */

export function MockFrame({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div role="img" aria-label={label} className={className}>
      {children}
    </div>
  )
}

/* ── PhoneShell ───────────────────────────────────────────────────────────
   A device drawn in CSS. Floats on the aurora with a soft shadow.
   ───────────────────────────────────────────────────────────────────────── */

export function PhoneShell({
  children,
  className = '',
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div
      className={`relative rounded-[1.75rem] bg-card p-2 shadow-float ring ring-ink/8 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="overflow-hidden rounded-[1.45rem] bg-sunk">
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <span className="text-[11px] font-semibold text-ink">9:41</span>
          <span className="h-4 w-16 rounded-full bg-ink/85" aria-hidden="true" />
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-2 w-2 rounded-xs bg-ink/40" />
            <span className="h-2.5 w-2.5 rounded-xs bg-ink/60" />
            <span className="h-2.5 w-4 rounded-xs bg-ink/80" />
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── ResultCard ───────────────────────────────────────────────────────────
   The app's assessment result, rebuilt. Colour + text label, always (§10).
   ───────────────────────────────────────────────────────────────────────── */

const TRIAGE: Record<
  DisplayUrgency,
  { text: string; wash: string; band: string; border: string }
> = {
  non_urgent: {
    text: 'text-triage-safe',
    wash: 'bg-triage-safe-wash',
    band: 'from-triage-safe/20 via-triage-safe/10 to-transparent',
    border: 'border-triage-safe',
  },
  urgent: {
    text: 'text-triage-warn',
    wash: 'bg-triage-warn-wash',
    band: 'from-triage-warn/20 via-triage-warn/10 to-transparent',
    border: 'border-triage-warn',
  },
  emergency: {
    text: 'text-triage-crit',
    wash: 'bg-triage-crit-wash',
    band: 'from-triage-crit/20 via-triage-crit/10 to-transparent',
    border: 'border-triage-crit',
  },
}

const MATCH_WORDS = ['Low evidence', 'Fair evidence', 'Moderate match', 'Strong match'] as const

function MatchBar({ filled }: { filled: 1 | 2 | 3 | 4 }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="inline-flex gap-[3px]">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 w-3.5 rounded-xs ${i <= filled ? 'bg-accent' : 'bg-rule'}`}
          />
        ))}
      </span>
      <span className="text-[11px] font-medium text-ink-mute">{MATCH_WORDS[filled - 1]}</span>
    </span>
  )
}

export function ResultCard({
  urgency,
  conditions = [],
  compact = false,
}: {
  urgency: DisplayUrgency
  conditions?: { name: string; match: 1 | 2 | 3 | 4 }[]
  compact?: boolean
}) {
  const t = TRIAGE[urgency]
  const copy = URGENCY_COPY[urgency]

  return (
    <div className="bg-sunk pb-4">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[11px] rounded-sm bg-accent-wash px-2 py-1 font-medium text-accent-ink">
          Your assessment result
        </span>
        <span aria-hidden="true" className="text-ink-mute">
          ✕
        </span>
      </div>

      {/* Urgency band — decorative; the meaning is carried by the label below. */}
      <div className={`h-14 bg-linear-to-br ${t.band}`} aria-hidden="true" />

      <div className="mx-3 -mt-6 rounded-md bg-card p-4 ring ring-ink/8">
        <p className={`text-[11px] font-bold uppercase tracking-[0.09em] ${t.text}`}>
          {copy.label}
        </p>
        <h3 className="mt-1.5 text-[17px] font-bold leading-snug text-ink">{copy.headline}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{copy.body}</p>

        <div className="mt-4 space-y-2">
          <span
            className={`flex h-10 items-center justify-center rounded-sm text-[13px] font-semibold text-white ${
              urgency === 'emergency' ? 'bg-triage-crit' : 'bg-accent'
            }`}
          >
            {urgency === 'emergency' ? 'Call emergency: 112' : 'Find nearby care'}
          </span>
          <span className="flex h-10 items-center justify-center rounded-sm border border-rule bg-card text-[13px] font-semibold text-ink">
            {urgency === 'emergency' ? 'Find nearby care' : 'Call emergency'}
          </span>
        </div>
      </div>

      {!compact && conditions.length > 0 && (
        <div className="mt-4 px-3">
          <p className="mb-2 px-1 text-[13px] font-semibold text-ink">Possible conditions</p>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <div key={c.name} className="rounded-md bg-card p-3 ring ring-ink/8">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">
                    {i + 1}. {c.name}
                  </span>
                  <MatchBar filled={c.match} />
                </div>
                <p className={`mt-1 text-[11px] font-medium ${t.text}`}>{copy.timeframe}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-ink-mute">{DISCLAIMER}</p>
        </div>
      )}
    </div>
  )
}

/* ── SymptomPickerMock ──────────────────────────────────────────────────── */

export function SymptomPickerMock() {
  const rows = [
    { label: 'Cough', on: false },
    { label: 'Fast breathing', on: true },
    { label: 'Fever', on: false },
    { label: 'Weakness', on: true },
    { label: 'Chest pain', on: true },
    { label: 'Tightness in the chest', on: false },
  ]
  return (
    <div className="bg-card px-4 pb-5 pt-3">
      <p className="text-center text-[13px] font-bold text-ink">Chest symptoms</p>
      <div className="mt-3 flex h-9 items-center rounded-sm bg-sunk px-3 text-[12px] text-ink-mute">
        Search symptoms
      </div>
      <ul className="mt-1">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between border-b border-rule/70 py-2.5 text-[13px] text-ink"
          >
            {r.label}
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white ${
                r.on ? 'bg-accent' : 'border border-field-border'
              }`}
            >
              {r.on ? '✓' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── BodyAreaMock ───────────────────────────────────────────────────────── */

export function BodyAreaMock() {
  const areas = ['Head', 'Chest', 'Abdomen', 'Back', 'Skin', 'Legs']
  return (
    <div className="bg-card px-4 pb-5 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] rounded-full bg-accent px-2.5 py-1 font-medium text-white">
          Symptom assessment 15%
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-sunk">
        <div className="h-1 w-[15%] rounded-full bg-accent" />
      </div>
      <div className="mt-4 flex gap-5 border-b border-rule text-[13px]">
        <span className="border-b-2 border-accent pb-2 font-semibold text-accent-ink">Search</span>
        <span className="pb-2 text-ink-mute">Point on the body</span>
      </div>
      <ul className="mt-1">
        {areas.map((a) => (
          <li
            key={a}
            className="flex items-center justify-between border-b border-rule/70 py-2.5 text-[13px] text-ink"
          >
            {a}
            <span aria-hidden="true" className="text-ink-mute">
              ›
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── FacilityListMock ───────────────────────────────────────────────────── */

export function FacilityListMock() {
  const rows = [
    { name: 'Lagos State Mainland Hospital', area: 'Lagos Mainland', km: '0.3', er: true },
    { name: 'Maranatha Medical Center', area: 'Lagos Mainland', km: '0.5', er: false },
    { name: 'Trustee Hospital Specialist', area: 'Shomolu', km: '0.6', er: false },
  ]
  return (
    <div className="bg-sunk px-3 pb-5 pt-3">
      <div className="flex h-9 items-center rounded-full bg-card px-3 text-[12px] text-ink-soft shadow-lift">
        Lagos, Nigeria
      </div>
      <p className="mt-3 px-1 text-[11px] text-ink-mute">30 of 30 shown</p>
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="rounded-md bg-card p-3 ring ring-ink/8">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-semibold leading-snug text-ink">{r.name}</span>
              {r.er && (
                <span className="text-[9px] shrink-0 rounded-xs bg-triage-crit-wash px-1.5 py-0.5 font-bold uppercase tracking-wide text-triage-crit">
                  Emergency
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-ink-mute">{r.area}</p>
            <p className="mt-1 text-[11px] font-semibold text-accent-ink">{r.km} km away</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── SeverityMock ───────────────────────────────────────────────────────── */

export function SeverityMock() {
  return (
    <div className="bg-card px-4 pb-6 pt-3">
      <span className="text-[11px] rounded-full bg-accent px-2.5 py-1 font-medium text-white">
        Question 1 of 3
      </span>
      <p className="mt-4 text-[15px] font-bold leading-snug text-ink">
        How severe is the fast breathing?
      </p>
      <div className="mt-4 flex gap-1">
        {[
          'bg-triage-safe/70',
          'bg-triage-safe/40',
          'bg-triage-warn/35',
          'bg-triage-warn/65',
          'bg-triage-crit/60',
          'bg-rule',
          'bg-rule',
        ].map(
          (c, i) => (
            <span key={i} className={`h-8 flex-1 rounded-xs ${c}`} aria-hidden="true" />
          ),
        )}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-mute">
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
        <span>Unbearable</span>
      </div>
    </div>
  )
}
