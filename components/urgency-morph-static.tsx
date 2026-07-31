/**
 * The no-JavaScript twin of the urgency demo.
 *
 * Identical markup and styling to the animated version, frozen on the July case
 * — the one that makes the argument. No motion code, no state, no listeners.
 * This is what ships in the server HTML and what a visitor sees if JavaScript
 * is disabled, fails, or has not arrived yet.
 *
 * Kept deliberately in its own file so it can never accidentally import from
 * `motion/react` and drag 69 KB back into the initial bundle.
 */
import { CloudRain, Baby } from 'lucide-react'

const SYMPTOMS = ['Fever', 'Headache', 'Body pain']

export function UrgencyStatic() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring ring-ink/8">
      <div className="grid grid-cols-2 border-b border-rule bg-sunk p-1.5">
        <span className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-2 text-center text-ink-mute">
          <span className="text-small font-semibold">Healthy 34-year-old</span>
          <span className="text-eyebrow font-mono uppercase">February</span>
        </span>
        <span className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md bg-card px-3 py-2 text-center text-ink shadow-lift">
          <span className="text-small font-semibold">Child under 5</span>
          <span className="text-eyebrow font-mono uppercase">July</span>
        </span>
      </div>

      <div className="p-6 md:p-8">
        <p className="text-eyebrow font-mono uppercase text-ink-mute">Reported symptoms</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <li
              key={s}
              className="text-small rounded-full bg-sunk px-3 py-1 text-ink-soft inset-ring inset-ring-ink/10"
            >
              {s}
            </li>
          ))}
        </ul>
        <p className="text-small mt-3 text-ink-mute">
          Identical in both cases. Only the person and the month change.
        </p>

        <hr className="my-7 border-rule" />

        <div className="min-h-[13.5rem]">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="inline-flex gap-[3px]">
              <span className="h-3.5 w-1 rounded-xs bg-triage-warn" />
              <span className="h-3.5 w-1 rounded-xs bg-triage-warn" />
              <span className="h-3.5 w-1 rounded-xs bg-ink/12" />
            </span>
            <span className="text-eyebrow font-mono font-semibold uppercase text-triage-warn">
              Urgent
            </span>
            <span className="text-eyebrow tnum font-mono uppercase text-ink-mute">2/3</span>
          </div>

          <h3 className="text-h2 mt-4 font-bold text-ink">You should consult a doctor.</h3>

          <p className="text-eyebrow mt-7 font-mono uppercase text-ink-mute">
            What changed the answer
          </p>
          <ul className="mt-3 min-h-[3.5rem] space-y-2">
            <li className="text-body flex items-center gap-2.5 text-ink">
              <CloudRain className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
              Rainy season · malaria weighting raised
            </li>
            <li className="text-body flex items-center gap-2.5 text-ink">
              <Baby className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
              Under 5 · highest mortality risk
            </li>
          </ul>

          <div className="mt-7 flex items-baseline gap-2 border-t border-rule pt-5">
            <span className="text-small text-ink-mute">Timeframe</span>
            <span className="text-body font-semibold text-triage-warn">Within 24 hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
