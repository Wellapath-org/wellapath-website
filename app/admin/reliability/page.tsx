import type { Metadata } from 'next'

import { Card, Eyebrow, Section, TwoTone } from '@/components/ui'
import { FactPanel } from '@/components/admin'
import type { LabelledFact } from '@/content/admin/facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reliability',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Crash diagnostics, kept separate from product analytics throughout.
 *
 * Different purpose, different data, different gates, different decision. The
 * two are never shown on one page and never summed, because a crash report and
 * a product event have nothing in common but the word "event".
 */
export default function ReliabilityPage() {
  const sentry: LabelledFact[] = [
    {
      label: 'Crash reporting',
      state: 'unavailable',
      reason: 'disabled',
      source: 'Mobile: lib/core/crash/crash_config.dart',
      note: 'Three independent conditions must all be satisfied at build time and none is set in any release build: the enable flag, a structurally valid key, and a separate production approval. The production approval is required because the bundled configuration declares production.',
    },
    {
      label: 'Reporting key in the build',
      state: 'unavailable',
      reason: 'disabled',
      source: 'Mobile: lib/core/crash/crash_config.dart',
      note: 'No key is committed anywhere. It can only arrive as a build-time define, and it is absent from configuration, from source and from the verified build artifacts.',
    },
    {
      label: 'Crash-free session rate',
      state: 'unavailable',
      reason: 'not-instrumented',
      source: 'Mobile: automatic session tracking is switched off',
      note: 'No such figure exists for any build. It cannot be produced until crash reporting is enabled and session tracking is separately approved. This is the row that would otherwise read 100 per cent and mean nothing.',
    },
    {
      label: 'Native crash capture',
      state: 'unavailable',
      reason: 'disabled',
      source: 'Mobile: lib/core/crash/sentry_crash_sink.dart',
      note: 'Native reports bypass the sanitiser that strips personal data, so native handling is off by design. Native failures would not be reported even once crash reporting is enabled.',
    },
    {
      label: 'Engineering verification',
      state: 'manual',
      value: 'Controlled tests passed on builds 212 and 214',
      observedBy: 'Engineering',
      observedAt: '2026-09-23',
      source: 'Mobile crash verification records',
      note: 'The full path was exercised with synthetic events on builds that were never distributed. Implementation is substantially complete; activation is a separate decision with its own checklist.',
    },
  ]

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Reliability."
          rest="Crash diagnostics for engineering. Not product analytics."
          className="mt-4"
        />
        <Card className="mt-8 p-6" edge="ring" tone="sunk">
          <p className="text-small text-ink-soft">
            This is engineering diagnostics: stack traces, sanitised, for finding faults. It is a
            different subsystem from Product Insights, with different data, separate switches and a
            separate approval. The two are deliberately never combined on one page.
          </p>
        </Card>
      </Section>

      <Section tone="sunk" space="tight">
        <div className="max-w-[720px]">
          <FactPanel title="Crash diagnostics" facts={sentry}>
            Disabled in the current build and every build so far.
          </FactPanel>
        </div>
      </Section>

      <Section tone="ground" space="tight">
        <Card className="p-6" edge="ring">
          <p className="text-body font-semibold text-ink">Why there are no numbers here.</p>
          <p className="text-body mt-2 text-ink-soft">
            Nothing is sending, so there is nothing to count. A zero in these rows would say the
            app is running cleanly, when what is true is that nobody is watching. Those are
            opposite facts, and only one of them is good news.
          </p>
          <p className="text-small mt-4 text-ink-mute">
            Activation requires a dedicated production key, production context tagging, updated
            store privacy declarations in the same release, cleanup of the older keys, and a final
            production diff. It is not a switch.
          </p>
        </Card>
      </Section>
    </>
  )
}
