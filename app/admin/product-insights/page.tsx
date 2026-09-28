import type { Metadata } from 'next'

import { AdminHeader, FactPanel } from '@/components/admin'
import type { LabelledFact } from '@/content/admin/facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Product insights',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Product analytics, kept separate from crash diagnostics throughout.
 *
 * The metric definitions are here so that the meaning of each number is agreed
 * before any number exists. Every one reads "Not instrumented" until an
 * approved pipeline supplies real data, and none is ever inferred from waitlist
 * signups: a waitlist registration is a named person on this website, and an
 * app metric is an anonymous count from a different system. Joining them would
 * destroy the anonymity of the second.
 */
const METRICS: readonly { name: string; definition: string; notWhat: string }[] = [
  {
    name: 'App opens',
    definition: 'Count of app-open events per day.',
    notWhat: 'Not people, not sessions, not installs.',
  },
  {
    name: 'Onboarding completions',
    definition: 'Count of onboarding-completed events.',
    notWhat: 'Not a rate until first-launch counts exist alongside it.',
  },
  {
    name: 'Symptom checks started',
    definition: 'Count of assessment-start events.',
    notWhat: 'Not people. One person may start several.',
  },
  {
    name: 'Symptom checks completed',
    definition: 'Count of assessment-complete events with a completed status.',
    notWhat: 'Not clinical accuracy and not usefulness. Finishing is not being helped.',
  },
  {
    name: 'Completion rate',
    definition: 'Completed assessments divided by started assessments.',
    notWhat: 'Not satisfaction. A person who leaves may have got what they needed.',
  },
  {
    name: 'Clinic locator opens',
    definition: 'Count of locator-opened events.',
    notWhat: 'Not searches, not facility views, and never a location.',
  },
  {
    name: 'Learn opens',
    definition: 'Count of section-open events for the learn area.',
    notWhat: 'Not which article. What someone reads about their health stays on their device.',
  },
  {
    name: 'Help opens',
    definition: 'Count of help-opened events.',
    notWhat: 'Not support volume. Nothing is submitted.',
  },
]

export default function ProductInsightsPage() {
  const state: LabelledFact[] = [
    {
      label: 'Product analytics',
      state: 'unavailable',
      reason: 'disabled',
      source: 'Mobile: bundled configuration, two independent flags',
      note: 'Both the enable flag and the separate production approval are false in the shipped configuration, and either one alone is enough to keep it off.',
    },
    {
      label: 'Events received',
      state: 'unavailable',
      reason: 'not-instrumented',
      source: 'No pipeline is accepting events',
      note: 'Nothing is emitting and nothing is collecting. A zero here would imply a working pipeline reporting no activity, which is a different and much worse thing to believe.',
    },
    {
      label: 'Analytics consent decision',
      state: 'unavailable',
      reason: 'not-verified',
      source: 'Product and Privacy',
      note: 'Unresolved. Required before any external cohort if analytics is ever enabled. No consent flow exists in the app.',
    },
  ]

  return (
    <>
      <div>
        <AdminHeader
          title="Product insights"
          summary="Definitions agreed now, so the numbers mean something when they arrive."
        />
        <div className="mt-5 rounded-md border border-rule bg-ground p-5">
          <p className="text-small text-ink-soft">
            Product analytics is a different subsystem from crash diagnostics under Reliability,
            with different data and a separate approval. Nothing on this page is measured, and no
            figure here is inferred from waitlist registrations. A waitlist signup is a named
            person on this website; an app metric is an anonymous count from another system.
            Joining them would destroy the anonymity of the second and is not done anywhere.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div>
          <FactPanel title="Current state" facts={state} />
        </div>
      </div>

      <div>
        <h2 className="text-body font-semibold text-ink">Metric definitions</h2>
        <p className="text-small mt-2 max-w-[68ch] text-ink-soft">
          <strong className="font-semibold text-ink">
            Every metric below reads Not instrumented
          </strong>{' '}
          and will keep reading it until an approved pipeline supplies real data. None of them is
          a zero, because nothing is measuring. The second column is the part worth agreeing
          early: what each number is not, so nobody reads more into it later than it can carry.
        </p>
        <div className="mt-6 w-full min-w-0 overflow-x-auto">
          <table className="text-small w-full min-w-[620px] border-collapse">
            <caption className="sr-only">
              Proposed product metrics, their definitions, and what each one does not mean
            </caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Metric
                </th>
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Definition
                </th>
                <th scope="col" className="pb-2 font-semibold text-ink">
                  Not
                </th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => (
                <tr key={metric.name} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-4 font-semibold text-ink">{metric.name}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{metric.definition}</td>
                  <td className="py-2.5 text-ink-mute">{metric.notWhat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <div className="mt-5 rounded-md border border-rule bg-ground p-5">
          <p className="text-body font-semibold text-ink">What may never be collected.</p>
          <p className="text-body mt-2 text-ink-soft">
            Symptoms, answers, results, urgency categories or any medical guidance. Location of any
            precision. Clinic searches. Free text of any kind. A persistent user identifier, a
            device identifier, or anything that links two sessions to the same person. These are
            excluded by the design of the event contract rather than by policy, so a prohibited
            field cannot be expressed by a caller.
          </p>
        </div>
      </div>
    </>
  )
}
