import type { Metadata } from 'next'

import { Card, Eyebrow, Section, TwoTone } from '@/components/ui'
import { FactPanel, PanelGrid } from '@/components/admin'
import { MANUAL_FACTS } from '@/content/admin/register'
import { aged, type LabelledFact } from '@/content/admin/facts'
import { MOBILE_BUILD_NOTE } from '@/content/admin/derived'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'App distribution',
  robots: { index: false, follow: false, nocache: true },
}

export default function DistributionPage() {
  const now = new Date()

  const android: LabelledFact[] = [
    {
      label: 'Version and build',
      state: 'manual',
      value: '0.3.0 (215)',
      observedBy: 'Engineering',
      observedAt: '2026-09-25',
      source: 'Mobile repository build registry',
      note: MOBILE_BUILD_NOTE,
    },
    {
      label: 'Artifact verification',
      state: 'manual',
      value: 'Signed and verified, not uploaded',
      observedBy: 'Engineering',
      observedAt: '2026-09-25',
      source: 'Mobile release record',
      note: 'Signature verified, certificate matches the established upload key, bundle validation passed. Upload is a separate console action.',
    },
    { label: 'Uploaded to internal testing', ...aged(MANUAL_FACTS.android215Uploaded, now) },
    { label: 'Internal testing availability', ...aged(MANUAL_FACTS.androidTesters, now) },
    { label: 'Previous build on the track', ...aged(MANUAL_FACTS.android211Live, now) },
    { label: 'App signing enrolment prompt', ...aged(MANUAL_FACTS.playAppSigningPrompt, now) },
  ]

  const ios: LabelledFact[] = [
    {
      label: 'Version and build',
      state: 'manual',
      value: '0.3.0 (215)',
      observedBy: 'Engineering',
      observedAt: '2026-09-25',
      source: 'Mobile repository build registry',
      note: MOBILE_BUILD_NOTE,
    },
    {
      label: 'Artifact verification',
      state: 'manual',
      value: 'Signed, verified and uploaded',
      observedBy: 'Engineering',
      observedAt: '2026-09-25',
      source: 'Mobile release record',
      note: 'Exported as internal-testing-only, which bars external testing and beta review for this build by construction rather than by policy.',
    },
    { label: 'Processing outcome', ...aged(MANUAL_FACTS.iosProcessing, now) },
    { label: 'Visible in TestFlight', ...aged(MANUAL_FACTS.iosBuildVisible, now) },
    { label: 'Internal testing availability', ...aged(MANUAL_FACTS.iosTesters, now) },
    { label: 'Previous build still available', ...aged(MANUAL_FACTS.ios211Available, now) },
  ]

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="App distribution."
          rest="Android and iOS tracked separately, because they fail separately."
          className="mt-4"
        />
        <Card className="mt-8 p-6" edge="ring" tone="sunk">
          <p className="text-small text-ink-soft">
            Every value on this page is recorded by hand. This site has no access to either store
            console and no access to the mobile repository, so nothing here is measured. Where a
            console fact has not been read by anyone, it says <em>Not verified</em> rather than
            showing a reassuring default.
          </p>
        </Card>
      </Section>

      <Section tone="sunk" space="tight">
        <PanelGrid>
          <FactPanel title="Android" facts={android} />
          <FactPanel title="iOS" facts={ios} />
        </PanelGrid>
      </Section>

      <Section tone="ground" space="tight">
        <Card className="p-6" edge="ring">
          <p className="text-body font-semibold text-ink">No controls here, deliberately.</p>
          <p className="text-body mt-2 text-ink-soft">
            There is no button to promote a build, submit for review, or move a release to a wider
            cohort. Those actions change what real people install, and they belong in the store
            console where they are attributable to a named account rather than to a shared admin
            password.
          </p>
        </Card>
      </Section>
    </>
  )
}
