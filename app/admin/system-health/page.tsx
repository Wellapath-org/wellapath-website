import type { Metadata } from 'next'

import { Card, Eyebrow, Section, TwoTone } from '@/components/ui'
import { FactPanel } from '@/components/admin'
import { EXPECTED_ARTIFACTS, getConfigHealth } from '@/content/admin/config-health'
import { expectedArtifacts } from '@/content/admin/derived'
import { observedLabel, type LabelledFact } from '@/content/admin/facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'System health',
  robots: { index: false, follow: false, nocache: true },
}

const FAILURE_WORDING: Record<'timeout' | 'network' | 'status' | 'malformed', string> = {
  timeout: 'The probe timed out. That may be this server, the network in between, or the endpoint.',
  network:
    'The probe could not connect. That may be this server, the network in between, or the endpoint.',
  status: 'The endpoint answered with an unexpected status.',
  malformed: 'The endpoint answered, but the response was not the shape this check expects.',
}

export default async function SystemHealthPage() {
  const health = await getConfigHealth()

  const facts: LabelledFact[] = []

  if (health.ok) {
    facts.push({
      label: 'Configuration endpoint',
      state: 'live',
      value: `Answered, ${health.bytes} bytes`,
      source: 'Production configuration endpoint',
      observedAt: health.observedAt,
    })
    facts.push({
      label: 'Integrity against the reviewed baseline',
      state: 'live',
      value: health.integrity === 'match' ? 'Matches' : 'Differs from the baseline',
      source: 'Canonical hash comparison',
      observedAt: health.observedAt,
      note:
        health.integrity === 'match'
          ? 'Compared in canonical form, with keys sorted, so a harmless re-serialisation does not raise a false alarm while a real content change still does.'
          : 'A change is not necessarily wrong, but it must be accounted for before a release. The configuration decides which clinical artifacts every installed app loads.',
    })

    const served = Object.entries(health.artifacts)
      .map(([name, version]) => `${name} ${version}`)
      .join(' · ')
    const asExpected = Object.entries(EXPECTED_ARTIFACTS).every(
      ([name, version]) => health.artifacts[name] === version,
    )
    facts.push({
      label: 'Artifact versions served',
      state: 'live',
      value: served,
      source: 'Production configuration endpoint',
      observedAt: health.observedAt,
      note: asExpected
        ? 'Matches the expected set.'
        : 'Does not match the expected set below. Reconcile before a release.',
    })
  } else {
    facts.push({
      label: 'Configuration endpoint',
      state: 'unavailable',
      reason: 'not-verified',
      source: 'Production configuration endpoint',
      note: `${FAILURE_WORDING[health.reason]} ${health.detail}. Attempted ${observedLabel(health.observedAt)}.`,
    })
    facts.push({
      label: 'Integrity against the reviewed baseline',
      state: 'unavailable',
      reason: 'not-verified',
      source: 'Canonical hash comparison',
      note: 'No response to compare.',
    })
    facts.push({
      label: 'Artifact versions served',
      state: 'unavailable',
      reason: 'not-verified',
      source: 'Production configuration endpoint',
      note: 'No response to read.',
    })
  }

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="System health."
          rest="The one thing on this panel that is actually measured."
          className="mt-4"
        />
        <Card className="mt-8 p-6" edge="ring" tone="sunk">
          <p className="text-small text-ink-soft">
            The app pins no artifact versions. It loads whatever the configuration endpoint names,
            so this response, and not anything in a repository, is what decides which clinical
            knowledge every installed app is working from.
          </p>
          <p className="text-small mt-2 text-ink-soft">
            Read server-side with a 2.5 second timeout and cached for five minutes, so opening this
            page does not put load on production. No credentials and no custom headers are sent; it
            is a public endpoint read exactly as an app reads it. The response is hashed and its
            version fields taken. Nothing else from it is stored or shown.
          </p>
        </Card>
      </Section>

      <Section tone="sunk" space="tight">
        <div className="max-w-[640px]">
          <FactPanel title="Production configuration" facts={facts} />
        </div>
      </Section>

      <Section tone="ground" space="tight">
        <div className="max-w-[640px]">
          <FactPanel title="Expected" facts={[expectedArtifacts()]} />
        </div>
        {!health.ok && (
          <Card className="mt-6 p-6" edge="ring">
            <p className="text-body font-semibold text-ink">
              A failed probe is not the same as an outage.
            </p>
            <p className="text-body mt-2 text-ink-soft">
              This check runs from one server. When it fails, the honest statement is that this
              server could not confirm the endpoint, which is why the row above reads{' '}
              <em>Not verified</em> rather than reporting production as down. Confirm from a second
              vantage point before treating it as an incident.
            </p>
          </Card>
        )}
      </Section>
    </>
  )
}
