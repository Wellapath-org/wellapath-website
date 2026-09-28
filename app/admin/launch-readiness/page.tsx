import type { Metadata } from 'next'

import { AdminHeader, ScrollableTable } from '@/components/admin'
import { GATE_LABEL, launchGates, type GateState } from '@/content/admin/gates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Launch readiness',
  robots: { index: false, follow: false, nocache: true },
}

// Same reasoning as severity: the word is the signal, not a clinical colour.
const GATE_CLASS: Record<GateState, string> = {
  ready: 'font-medium text-ink-mute',
  waiting: 'font-semibold text-ink-soft',
  blocked: 'font-bold text-ink',
  'not-verified': 'font-semibold text-ink-soft',
}

const ORDER: GateState[] = ['blocked', 'not-verified', 'waiting', 'ready']

export default function LaunchReadinessPage() {
  const gates = [...launchGates()].sort(
    (a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state),
  )
  const countLine = ORDER.map(
    (state) => `${GATE_LABEL[state]} ${gates.filter((g) => g.state === state).length}`,
  ).join(' · ')

  return (
    <>
      <AdminHeader
        title="Launch readiness"
        summary="Each gate, who owns it, and how its state was established."
        observed={countLine}
      />

      <ScrollableTable label="This table">
          <table className="text-small w-full min-w-[720px] border-collapse">
            <caption className="sr-only">Launch gates, most urgent first</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  State
                </th>
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Gate
                </th>
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Owner
                </th>
                <th scope="col" className="pb-2 font-semibold text-ink">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate) => (
                <tr key={gate.name} className="border-b border-rule align-top">
                  <td
                    className={`py-2.5 pr-4 whitespace-nowrap ${GATE_CLASS[gate.state]}`}
                  >
                    {GATE_LABEL[gate.state]}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-ink">{gate.name}</span>
                    <span className="mt-0.5 block text-ink-soft">{gate.detail}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-ink-soft">{gate.owner}</td>
                  <td className="py-2.5 text-ink-mute">{gate.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </ScrollableTable>

      <section className="mt-6 rounded-md border border-rule bg-ground p-5">
          <p className="text-body font-semibold text-ink">
            Waiting and Not verified are different answers.
          </p>
          <p className="text-body mt-2 text-ink-soft">
            Waiting means the state is known and something is in progress. Not verified means
            nobody has looked. Treating the second as the first is how a checklist starts to
            reassure rather than inform, so they are counted separately and never merged.
          </p>
      </section>
    </>
  )
}
