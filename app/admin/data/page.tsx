import type { Metadata } from 'next'

import { AdminHeader, FactPanel, PanelGrid } from '@/components/admin'
import { conditionPages, expectedArtifacts, redFlagLabels } from '@/content/admin/derived'
import { getConfigHealth } from '@/content/admin/config-health'
import type { LabelledFact } from '@/content/admin/facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Facilities and data',
  robots: { index: false, follow: false, nocache: true },
}

export default async function DataPage() {
  const health = await getConfigHealth()

  const served: LabelledFact = health.ok
    ? {
        label: 'Facility dataset in use',
        state: 'live',
        value: health.artifacts.facilities
          ? `Version ${health.artifacts.facilities}`
          : 'Not named by the configuration',
        source: 'Production configuration endpoint',
        observedAt: health.observedAt,
      }
    : {
        label: 'Facility dataset in use',
        state: 'unavailable',
        reason: 'not-verified',
        source: 'Production configuration endpoint',
        note: 'The configuration could not be read, so which dataset the app is loading is unknown from here.',
      }

  const facilities: LabelledFact[] = [
    served,
    {
      label: 'Coverage',
      state: 'manual',
      value: 'Three states, not national',
      observedBy: 'Engineering',
      observedAt: '2026-09-21',
      source: 'Mobile release record',
      note: 'Lagos, Kano and the Federal Capital Territory. Someone outside those states finds no nearby facility, which is a product limitation rather than a fault.',
    },
    {
      label: 'Directory on this site',
      state: 'derived',
      value: 'Not published here',
      source: 'app/coverage/page.tsx',
      note: 'The website carries a coverage proof page. The live directory is the app’s job, so no facility record is served from this site.',
    },
  ]

  const clinical: LabelledFact[] = [expectedArtifacts(), redFlagLabels(), conditionPages()]

  return (
    <>
      <div>
        <AdminHeader
          title="Facilities and data"
          summary="Which clinical artifacts are in use, and how far facility coverage reaches."
        />
      </div>

      <div className="mt-5">
        <PanelGrid>
          <FactPanel title="Facility data" facts={facilities} />
          <FactPanel title="Clinical content" facts={clinical}>
            Versions and counts only. No clinical record or facility record is read by this panel.
          </FactPanel>
        </PanelGrid>
      </div>

      <div>
        <div className="mt-5 rounded-md border border-rule bg-ground p-5">
          <p className="text-small text-ink-soft">
            Artifact contents are deliberately not shown. This page reports which versions are in
            play and whether they match what was reviewed. Reading the artifacts themselves belongs
            in the knowledge-base repository, where changes are reviewable as diffs.
          </p>
        </div>
      </div>
    </>
  )
}
