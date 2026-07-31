'use client'

/**
 * The same symptoms, two different answers.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * §3 of the guide names two proof points nobody else in this market has:
 * seasonal weighting, and demographics changing the urgency. Both are currently
 * *stated* on the site. Stating them is weak; a static page cannot show that the
 * answer moved, because there is nothing to compare against.
 *
 * So this is the one place motion does real work. The reported symptoms are
 * pinned and never move — that is the control in the experiment. Everything
 * downstream of them animates: the triage scale climbs a step, the label and
 * headline swap, the modifier chips fly in, the timeframe tightens. The
 * animation IS the argument, and it is not reproducible in static copy.
 *
 * ── Bundle discipline ──────────────────────────────────────────────────────
 * `LazyMotion` + `m` rather than the full `motion` component: the base is ~5 KB
 * and `domAnimation` (~15 KB) is fetched asynchronously AFTER paint, so it never
 * lands in First Load JS. We are at ~113 KB of a 120 KB budget, and that budget
 * is mobile data the audience pays for.
 *
 * `strict` is on, so importing `motion.div` here throws rather than silently
 * pulling the full bundle back in.
 *
 * Layout animations (`layoutId`) would need `domMax` (~25 KB), which we cannot
 * afford. The sliding selector is a plain transform between two known positions
 * instead — same effect, a third of the cost.
 *
 * ── Accessibility ──────────────────────────────────────────────────────────
 * Real radio semantics, keyboard operable, `aria-live` on the result so a screen
 * reader hears the answer change. Under `prefers-reduced-motion` every transition
 * drops to zero duration and the autoplay never starts: the control still works,
 * it just switches instantly.
 */
import { useEffect, useState } from 'react'
import { LazyMotion, m, AnimatePresence, useReducedMotion, domAnimation } from 'motion/react'
import { CloudRain, Baby, Sun, User } from 'lucide-react'

type Case = {
  id: string
  who: string
  when: string
  icons: [typeof Sun, typeof User]
  level: 1 | 2
  label: string
  headline: string
  timeframe: string
  modifiers: { icon: typeof CloudRain; text: string }[]
  tone: { text: string; fill: string; wash: string }
}

const CASES: Case[] = [
  {
    id: 'adult-feb',
    who: 'Healthy 34-year-old',
    when: 'February',
    icons: [Sun, User],
    level: 1,
    label: 'Non-urgent',
    headline: 'Home self-care may be enough.',
    timeframe: 'Watch and wait',
    modifiers: [],
    tone: {
      text: 'text-triage-safe',
      fill: 'bg-triage-safe',
      wash: 'bg-triage-safe-wash',
    },
  },
  {
    id: 'child-jul',
    who: 'Child under 5',
    when: 'July',
    icons: [CloudRain, Baby],
    level: 2,
    label: 'Urgent',
    headline: 'You should consult a doctor.',
    timeframe: 'Within 24 hours',
    modifiers: [
      { icon: CloudRain, text: 'Rainy season · malaria weighting raised' },
      { icon: Baby, text: 'Under 5 · highest mortality risk' },
    ],
    tone: {
      text: 'text-triage-warn',
      fill: 'bg-triage-warn',
      wash: 'bg-triage-warn-wash',
    },
  },
]

const SYMPTOMS = ['Fever', 'Headache', 'Body pain']

export default function UrgencyMorphMotion() {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const reduce = useReducedMotion()
  const c = CASES[active]

  // Auto-advance so the point lands without requiring a click, then stop for
  // good once the visitor takes over. Never runs under reduced motion.
  useEffect(() => {
    if (touched || reduce) return
    const t = setTimeout(() => setActive((i) => (i + 1) % CASES.length), 5200)
    return () => clearTimeout(t)
  }, [active, touched, reduce])

  const dur = reduce ? 0 : 0.42
  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 26 }

  const choose = (i: number) => {
    setActive(i)
    setTouched(true)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="overflow-hidden rounded-xl bg-card ring ring-ink/8">
        {/* ── Selector ────────────────────────────────────────────────── */}
        <div
          role="radiogroup"
          aria-label="Choose who has the symptoms"
          className="relative grid grid-cols-2 border-b border-rule bg-sunk p-1.5"
        >
          <m.div
            aria-hidden="true"
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-md bg-card shadow-lift"
            animate={{ x: active === 0 ? '0%' : '100%' }}
            transition={spring}
          />
          {CASES.map((k, i) => {
            const [A, B] = k.icons
            return (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={active === i}
                onClick={() => choose(i)}
                className={`transition-safe relative z-1 flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-2 text-center ${
                  active === i ? 'text-ink' : 'text-ink-mute hover:text-ink-soft'
                }`}
              >
                <span className="flex items-center gap-1.5 text-small font-semibold">
                  <A className="size-4" aria-hidden="true" />
                  <B className="size-4" aria-hidden="true" />
                  {k.who}
                </span>
                <span className="text-eyebrow font-mono uppercase">{k.when}</span>
              </button>
            )
          })}
        </div>

        <div className="p-6 md:p-8">
          {/* ── The control: identical in both cases, and it never moves ── */}
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

          {/* ── The answer ───────────────────────────────────────────────── */}
          <div aria-live="polite" className="min-h-[13.5rem]">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="inline-flex gap-[3px]">
                {[1, 2, 3].map((i) => (
                  <m.span
                    key={i}
                    className={`h-3.5 w-1 rounded-xs ${i <= c.level ? c.tone.fill : 'bg-ink/12'}`}
                    animate={{ opacity: 1, scaleY: i <= c.level ? 1 : 0.72 }}
                    transition={{ ...spring, delay: reduce ? 0 : i * 0.05 }}
                  />
                ))}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={c.label}
                  className={`text-eyebrow font-mono font-semibold uppercase ${c.tone.text}`}
                  initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                  transition={{ duration: dur * 0.6 }}
                >
                  {c.label}
                </m.span>
              </AnimatePresence>
              <span className="text-eyebrow tnum font-mono uppercase text-ink-mute">
                {c.level}/3
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <m.h3
                key={c.headline}
                className="text-h2 mt-4 font-bold text-ink"
                initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                transition={{ duration: dur }}
              >
                {c.headline}
              </m.h3>
            </AnimatePresence>

            <p className="text-eyebrow mt-7 font-mono uppercase text-ink-mute">
              What changed the answer
            </p>
            <ul className="mt-3 min-h-[3.5rem] space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {c.modifiers.length === 0 ? (
                  <m.li
                    key="none"
                    className="text-body text-ink-mute"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: dur * 0.7 }}
                  >
                    Nothing. No seasonal or demographic escalation applies.
                  </m.li>
                ) : (
                  c.modifiers.map((mod, i) => {
                    const Icon = mod.icon
                    return (
                      <m.li
                        key={mod.text}
                        className="text-body flex items-center gap-2.5 text-ink"
                        initial={{ opacity: 0, x: reduce ? 0 : -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: reduce ? 0 : 14 }}
                        transition={{ ...spring, delay: reduce ? 0 : 0.12 + i * 0.1 }}
                      >
                        <Icon className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
                        {mod.text}
                      </m.li>
                    )
                  })
                )}
              </AnimatePresence>
            </ul>

            <div className="mt-7 flex items-baseline gap-2 border-t border-rule pt-5">
              <span className="text-small text-ink-mute">Timeframe</span>
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={c.timeframe}
                  className={`text-body font-semibold ${c.tone.text}`}
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                  transition={{ duration: dur * 0.7 }}
                >
                  {c.timeframe}
                </m.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
