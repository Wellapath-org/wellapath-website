import type { Metadata } from 'next'

import { Card, Eyebrow, Section, TwoTone } from '@/components/ui'
import { GATE_LABEL, launchGates, type GateState } from '@/content/admin/gates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Launch readiness',
  robots: { index: false, follow: false, nocache: true },
}

const GATE_CLASS: Record<GateState, string> = {
  ready: 'text-triage-safe',
  waiting: 'text-triage-warn',
  blocked: 'text-triage-crit',
  'not-verified': 'text-ink-mute',
}

const ORDER: GateState[] = ['blocked', 'not-verified', 'waiting', 'ready']

export default function LaunchReadinessPage() {
  const gates = [...launchGates()].sort(
    (a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state),
  )
  const counts = ORDER.map((state) => ({
    state,
    n: gates.filter((g) => g.state === state).length,
  }))

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Launch readiness."
          rest="Each gate, who owns it, and how its state was established."
          className="mt-4"
        />
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
          {counts.map(({ state, n }) => (
            <p key={state} className="text-body">
              <span className={`font-semibold ${GATE_CLASS[state]}`}>{GATE_LABEL[state]}</span>
              <span className="text-ink-soft"> · {n}</span>
            </p>
          ))}
        </div>
      </Section>

      <Section tone="sunk" space="tight">
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="text-body w-full border-collapse">
            <caption className="sr-only">Launch gates, most urgent first</caption>
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  State
                </th>
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  Gate
                </th>
                <th scope="col" className="pb-3 pr-4 font-semibold text-ink">
                  Owner
                </th>
                <th scope="col" className="pb-3 font-semibold text-ink">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate) => (
                <tr key={gate.name} className="border-b border-rule align-top">
                  <td
                    className={`py-3.5 pr-4 font-semibold whitespace-nowrap ${GATE_CLASS[gate.state]}`}
                  >
                    {GATE_LABEL[gate.state]}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="font-semibold text-ink">{gate.name}</span>
                    <span className="text-small mt-1 block text-ink-soft">{gate.detail}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-soft">{gate.owner}</td>
                  <td className="text-small py-3.5 text-ink-mute">{gate.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="ground" space="tight">
        <Card className="p-6" edge="ring">
          <p className="text-body font-semibold text-ink">
            Waiting and Not verified are different answers.
          </p>
          <p className="text-body mt-2 text-ink-soft">
            Waiting means the state is known and something is in progress. Not verified means
            nobody has looked. Treating the second as the first is how a checklist starts to
            reassure rather than inform, so they are counted separately and never merged.
          </p>
        </Card>
      </Section>
    </>
  )
}
