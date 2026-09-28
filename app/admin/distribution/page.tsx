import type { Metadata } from 'next'

import { AdminHeader, FactPanel, PanelGrid } from '@/components/admin'
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
    { label: '211 · track state', ...aged(MANUAL_FACTS.android211Track, now) },
    { label: '211 · internal testers', ...aged(MANUAL_FACTS.android211Testers, now) },
    {
      label: '215 · artifact',
      state: 'manual',
      value: '0.3.0 (215), signed and verified',
      observedBy: 'Engineering',
      observedAt: '2026-09-25',
      source: 'Mobile release record',
      note: `Signature verified, certificate matches the established upload key, bundle validation passed. ${MOBILE_BUILD_NOTE}`,
    },
    { label: '215 · track state', ...aged(MANUAL_FACTS.android215Track, now) },
    { label: '215 · internal testers', ...aged(MANUAL_FACTS.android215Testers, now) },
    { label: 'App signing enrolment prompt', ...aged(MANUAL_FACTS.playAppSigningPrompt, now) },
  ]

  const ios: LabelledFact[] = [
    { label: '211 · TestFlight availability', ...aged(MANUAL_FACTS.ios211Track, now) },
    {
      label: '215 · artifact',
      state: 'manual',
      value: '0.3.0 (215), signed and uploaded',
      observedBy: 'Engineering',
      observedAt: '2026-09-25',
      source: 'Mobile release record',
      note: `Exported internal-only, which bars external testing and beta review for this build by construction. The upload call returned success; that is not the same as availability. ${MOBILE_BUILD_NOTE}`,
    },
    { label: '215 · processing outcome', ...aged(MANUAL_FACTS.ios215Track, now) },
    { label: '215 · internal testers', ...aged(MANUAL_FACTS.ios215Testers, now) },
  ]

  return (
    <>
      <div>
        <AdminHeader
          title="App distribution"
          summary="Android and iOS tracked separately, because they fail separately."
        />
        <div className="mt-5 rounded-md border border-rule bg-ground p-5">
          <p className="text-small text-ink-soft">
            Every value on this page is recorded by hand. This site has no access to either store
            console and no access to the mobile repository, so nothing here is measured. Where a
            console fact has not been read by anyone, it says <em>Not verified</em> rather than
            showing a reassuring default.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PanelGrid>
          <FactPanel title="Android" facts={android} />
          <FactPanel title="iOS" facts={ios} />
        </PanelGrid>
      </div>

      <div>
        <div className="mt-5 rounded-md border border-rule bg-ground p-5">
          <p className="text-body font-semibold text-ink">No controls here, deliberately.</p>
          <p className="text-body mt-2 text-ink-soft">
            There is no button to promote a build, submit for review, or move a release to a wider
            cohort. Those actions change what real people install, and they belong in the store
            console where they are attributable to a named account rather than to a shared admin
            password.
          </p>
        </div>
      </div>
    </>
  )
}
