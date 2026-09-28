import type { Metadata } from 'next'

import { Card, Eyebrow, Section, TwoTone } from '@/components/ui'
import { FactPanel, PanelGrid, ReadingKey } from '@/components/admin'
import { LAUNCH_ACTIONS, MANUAL_FACTS, SEVERITY_ORDER, type Severity } from '@/content/admin/register'
import { aged, type LabelledFact } from '@/content/admin/facts'
import { adminAuth, redFlagLabels, signupStorage, siteMode } from '@/content/admin/derived'
import { launchGates, GATE_LABEL, type GateState } from '@/content/admin/gates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Overview',
  robots: { index: false, follow: false, nocache: true },
}

const SEVERITY_CLASS: Record<Severity, string> = {
  blocker: 'text-triage-crit',
  high: 'text-triage-warn',
  medium: 'text-triage-warn',
  low: 'text-ink-mute',
}

const GATE_CLASS: Record<GateState, string> = {
  ready: 'text-triage-safe',
  waiting: 'text-triage-warn',
  blocked: 'text-triage-crit',
  'not-verified': 'text-ink-mute',
}

export default function AdminOverviewPage() {
  const now = new Date()
  const gates = launchGates()
  const blocked = gates.filter((g) => g.state === 'blocked').length
  const unverified = gates.filter((g) => g.state === 'not-verified').length

  const build: LabelledFact[] = [
    { label: 'Android internal build', ...aged(MANUAL_FACTS.android211Live, now) },
    { label: 'Android 215 uploaded', ...aged(MANUAL_FACTS.android215Uploaded, now) },
    { label: 'iOS processing outcome', ...aged(MANUAL_FACTS.iosProcessing, now) },
  ]

  const readiness: LabelledFact[] = [
    { label: 'Clinical review', ...aged(MANUAL_FACTS.clinicalReview, now) },
    redFlagLabels(),
    { label: 'Physical Android device', ...aged(MANUAL_FACTS.deviceAndroid, now) },
    { label: 'Physical iOS device', ...aged(MANUAL_FACTS.deviceIos, now) },
  ]

  const testers: LabelledFact[] = [
    { label: 'Android internal testers', ...aged(MANUAL_FACTS.androidTesters, now) },
    { label: 'iOS internal testers', ...aged(MANUAL_FACTS.iosTesters, now) },
  ]

  const site: LabelledFact[] = [siteMode(), signupStorage(), adminAuth()]

  const sorted = [...LAUNCH_ACTIONS].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  )

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Where the launch stands."
          rest={`${blocked} gates blocked, ${unverified} not yet checked.`}
          className="mt-4"
        />
        <ReadingKey />
      </Section>

      <Section tone="sunk" space="tight">
        <h2 className="text-h2 font-semibold text-ink">Gates</h2>
        <div className="mt-6 w-full min-w-0 overflow-x-auto">
          <table className="text-body w-full border-collapse">
            <caption className="sr-only">Launch gates and their current state</caption>
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  State
                </th>
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  Gate
                </th>
                <th scope="col" className="pb-3 font-semibold text-ink">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate) => (
                <tr key={gate.name} className="border-b border-rule align-top">
                  <td className={`py-3.5 pr-4 font-semibold whitespace-nowrap ${GATE_CLASS[gate.state]}`}>
                    {GATE_LABEL[gate.state]}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="font-semibold text-ink">{gate.name}</span>
                    <span className="text-small mt-1 block text-ink-soft">{gate.detail}</span>
                  </td>
                  <td className="py-3.5 text-ink-soft">{gate.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="ground" space="tight">
        <PanelGrid>
          <FactPanel title="Build status" facts={build}>
            Build identity lives in the mobile repository, which this site cannot read.
          </FactPanel>
          <FactPanel title="Clinical and device testing" facts={readiness} />
          <FactPanel title="Internal testers" facts={testers}>
            Console state. Nothing here can be observed from this site.
          </FactPanel>
          <FactPanel title="This site" facts={site} />
        </PanelGrid>
      </Section>

      <Section tone="sunk" space="tight">
        <h2 className="text-h2 font-semibold text-ink">Outstanding actions</h2>
        <p className="text-small mt-2 text-ink-soft">
          Maintained by hand in <code className="rounded-xs bg-rail px-1.5 py-0.5">content/admin/register.ts</code>.
          Owners are roles.
        </p>
        <div className="mt-6 w-full min-w-0 overflow-x-auto">
          <table className="text-body w-full border-collapse">
            <caption className="sr-only">Outstanding launch actions by severity</caption>
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  Severity
                </th>
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  Action
                </th>
                <th scope="col" className="pb-3 font-semibold text-ink">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((action) => (
                <tr key={action.id} className="border-b border-rule align-top">
                  <td
                    className={`py-3.5 pr-4 font-semibold whitespace-nowrap capitalize ${SEVERITY_CLASS[action.severity]}`}
                  >
                    {action.severity}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="font-semibold text-ink">{action.title}</span>
                    {action.note && (
                      <span className="text-small mt-1 block text-ink-soft">{action.note}</span>
                    )}
                    <span className="text-small mt-1 block text-ink-mute">{action.reference}</span>
                  </td>
                  <td className="py-3.5 text-ink-soft">{action.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="ground" space="tight">
        <Card className="p-6" edge="ring">
          <p className="text-small text-ink-soft">
            This panel is read-only by design. It has no control that promotes, submits,
            distributes, edits or deletes anything. Every such action stays in the console that
            owns it, where it is attributable to a person.
          </p>
        </Card>
      </Section>
    </>
  )
}
