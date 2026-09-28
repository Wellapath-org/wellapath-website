import type { Metadata } from 'next'

import { Card, Eyebrow, Section, TwoTone } from '@/components/ui'
import { FactPanel, PanelGrid } from '@/components/admin'
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
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Facilities and data."
          rest="Which clinical artifacts are in use, and how far the facility coverage reaches."
          className="mt-4"
        />
      </Section>

      <Section tone="sunk" space="tight">
        <PanelGrid>
          <FactPanel title="Facility data" facts={facilities} />
          <FactPanel title="Clinical content" facts={clinical}>
            Versions and counts only. No clinical record or facility record is read by this panel.
          </FactPanel>
        </PanelGrid>
      </Section>

      <Section tone="ground" space="tight">
        <Card className="p-6" edge="ring">
          <p className="text-small text-ink-soft">
            Artifact contents are deliberately not shown. This page reports which versions are in
            play and whether they match what was reviewed. Reading the artifacts themselves belongs
            in the knowledge-base repository, where changes are reviewable as diffs.
          </p>
        </Card>
      </Section>
    </>
  )
}
