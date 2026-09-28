import type { Metadata } from 'next'

import {
  AdminHeader,
  FactPanel,
  PanelGrid,
  ScrollableTable,
  StatusKey,
  StatusSummary,
  type SummaryItem,
} from '@/components/admin'
import {
  LAUNCH_ACTIONS,
  MANUAL_FACTS,
  SEVERITY_ORDER,
  type Severity,
} from '@/content/admin/register'
import { aged, factText, observedLabel, type LabelledFact } from '@/content/admin/facts'
import { adminAuth, redFlagLabels, signupStorage, siteMode } from '@/content/admin/derived'
import { getConfigHealth } from '@/content/admin/config-health'
import { launchGates, GATE_LABEL, type GateState } from '@/content/admin/gates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Overview',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Weight and tone, not the clinical palette. The word is the status; colour
 * would only be a second channel, and here it would be a borrowed one.
 */
const SEVERITY_CLASS: Record<Severity, string> = {
  blocker: 'font-bold text-ink',
  high: 'font-semibold text-ink',
  medium: 'font-medium text-ink-soft',
  low: 'font-medium text-ink-mute',
}

const GATE_CLASS: Record<GateState, string> = {
  ready: 'font-medium text-ink-mute',
  waiting: 'font-semibold text-ink-soft',
  blocked: 'font-bold text-ink',
  'not-verified': 'font-semibold text-ink-soft',
}

/** Where a named action is best acted on, so the row is a route not a hint. */
const ACTION_LINK: Record<string, string> = {
  'RED-FLAG-LABELS': '/admin/launch-readiness',
  'CB-211': '/admin/launch-readiness',
  'DATABASE-URL': '/admin/signups',
  'PLAY-APP-SIGNING': '/admin/distribution',
  'IOS-KEY-ESCROW': '/admin/distribution',
  'ADMIN-MULTIUSER': '/admin',
  'SEARCH-CONSOLE': '/admin/launch-readiness',
  'DPA-RECORD': '/admin/reliability',
  'TELEMETRY-CONSENT': '/admin/product-insights',
  'SIGNUPS-PAGINATION': '/admin/signups',
  'ANDROID-3G': '/admin/launch-readiness',
}

export default async function AdminOverviewPage() {
  const now = new Date()
  const gates = launchGates()
  const blocked = gates.filter((g) => g.state === 'blocked')
  const unverified = gates.filter((g) => g.state === 'not-verified')
  const health = await getConfigHealth()

  const android = aged(MANUAL_FACTS.android211Live, now)
  const ios = aged(MANUAL_FACTS.iosProcessing, now)
  const clinical = aged(MANUAL_FACTS.clinicalReview, now)

  // The questions the first screen has to answer, in the order they are asked.
  const summary: readonly SummaryItem[] = [
    {
      label: 'Blocked gates',
      value: blocked.length === 0 ? 'None' : `${blocked.length} of ${gates.length}`,
      state: 'derived',
      hint: blocked.length ? blocked.map((g) => g.name).join('; ') : undefined,
    },
    {
      label: 'Not verified',
      value: unverified.length === 0 ? 'None' : `${unverified.length} of ${gates.length}`,
      state: 'derived',
      hint: unverified.length ? unverified.map((g) => g.name).join('; ') : undefined,
    },
    {
      label: 'Configuration health',
      value: health.ok
        ? health.integrity === 'match'
          ? 'Reachable, matches baseline'
          : 'Reachable, differs from baseline'
        : 'Not verified',
      state: health.ok ? 'live' : 'unavailable',
      hint: health.ok ? observedLabel(health.observedAt) : 'The probe did not complete.',
    },
    {
      label: 'Android internal build',
      value: factText(android),
      state: android.state,
      hint:
        android.state === 'manual'
          ? `${android.observedBy}, ${android.observedAt.slice(0, 10)}`
          : undefined,
    },
    {
      label: 'iOS internal build',
      value: factText(ios),
      state: ios.state,
      hint: 'Upload succeeded; the processing outcome is unobserved.',
    },
    {
      label: 'Clinical review',
      value: factText(clinical),
      state: clinical.state,
      hint: 'CB_211 gates every external cohort.',
    },
  ]

  const sorted = [...LAUNCH_ACTIONS].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  )

  const build: LabelledFact[] = [
    { label: 'Android 215 uploaded', ...aged(MANUAL_FACTS.android215Uploaded, now) },
    { label: 'iOS visible in TestFlight', ...aged(MANUAL_FACTS.iosBuildVisible, now) },
    { label: 'Android internal testers', ...aged(MANUAL_FACTS.androidTesters, now) },
    { label: 'iOS internal testers', ...aged(MANUAL_FACTS.iosTesters, now) },
  ]

  const site: LabelledFact[] = [siteMode(), signupStorage(), redFlagLabels(), adminAuth()]

  return (
    <>
      <AdminHeader
        title="Overview"
        summary={
          blocked.length > 0
            ? 'The public site is closed and the app is in internal testing.'
            : 'The public site is closed. No gates are blocked.'
        }
        observed={`Generated ${observedLabel(now.toISOString())}`}
      />

      <StatusSummary items={summary} />

      {/* ── what to do next ─────────────────────────────────────────────── */}
      <section className="mt-8 border-t border-rule pt-5">
        <h2 className="text-body font-semibold text-ink">Next actions</h2>
        <p className="text-small mt-1 text-ink-soft">
          Recorded by hand in <code className="rounded-xs bg-rail px-1 py-0.5">register.ts</code>.
          Owners are roles.
        </p>
        <ScrollableTable label="This table">
          <table className="text-small w-full min-w-[560px] border-collapse">
            <caption className="sr-only">Outstanding launch actions, most severe first</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Status
                </th>
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Action
                </th>
                <th scope="col" className="pb-2 font-semibold text-ink">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((action) => (
                <tr key={action.id} className="border-b border-rule align-top">
                  <td
                    className={`py-2.5 pr-4 whitespace-nowrap capitalize ${SEVERITY_CLASS[action.severity]}`}
                  >
                    {action.severity}
                  </td>
                  <td className="py-1.5 pr-4">
                    {/* The title is the link: a full-width target rather than
                        a separate 38px "Open" cell nobody can hit on a phone. */}
                    <a
                      href={ACTION_LINK[action.id] ?? '/admin'}
                      className="flex min-h-12 flex-col justify-center font-semibold text-accent-ink underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                    >
                      {action.title}
                    </a>
                    {action.note && <span className="block text-ink-soft">{action.note}</span>}
                    <span className="mt-0.5 block text-ink-mute">{action.reference}</span>
                  </td>
                  <td className="py-2.5 text-ink-soft">{action.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      {/* ── gates ───────────────────────────────────────────────────────── */}
      <section className="mt-8 border-t border-rule pt-5">
        <h2 className="text-body font-semibold text-ink">Launch gates</h2>
        <ScrollableTable label="This table">
          <table className="text-small w-full min-w-[560px] border-collapse">
            <caption className="sr-only">Launch gates and their current state</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  State
                </th>
                <th scope="col" className="pb-2 pr-4 font-semibold text-ink">
                  Gate
                </th>
                <th scope="col" className="pb-2 font-semibold text-ink">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate) => (
                <tr key={gate.name} className="border-b border-rule align-top">
                  <td className={`py-2.5 pr-4 whitespace-nowrap ${GATE_CLASS[gate.state]}`}>
                    {GATE_LABEL[gate.state]}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-ink">{gate.name}</span>
                    <span className="mt-0.5 block text-ink-soft">{gate.detail}</span>
                  </td>
                  <td className="py-2.5 text-ink-soft">{gate.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      <PanelGrid>
        <FactPanel title="Internal testing" facts={build}>
          Console state. Nothing here can be observed from this site.
        </FactPanel>
        <FactPanel title="This site" facts={site} />
      </PanelGrid>

      <StatusKey />

      <p className="text-small mt-6 border-t border-rule pt-4 text-ink-mute">
        Read-only by design. Nothing here promotes, submits, distributes, edits or deletes
        anything: those actions belong in the console that owns them, where they are attributable
        to a person.
      </p>
    </>
  )
}
