import 'server-only'

/**
 * Launch gates.
 *
 * A gate is not a measurement, so it has its own four-state vocabulary rather
 * than borrowing the `Fact` one. The distinction that matters here is whether
 * something is done, waiting on someone, actively blocked, or simply unknown.
 *
 * `not-verified` is separate from `waiting` on purpose. Waiting means we know
 * the state and it is in progress. Not verified means nobody has looked, and
 * conflating the two is how a launch checklist starts lying.
 */
import { redFlagReviewStatus } from '@/content/red-flag-labels'
import { dbConfigured } from '@/content/db'
import { LAUNCHED } from '@/content/launch'

export type GateState = 'ready' | 'waiting' | 'blocked' | 'not-verified'

export const GATE_LABEL: Record<GateState, string> = {
  ready: 'Ready',
  waiting: 'Waiting',
  blocked: 'Blocked',
  'not-verified': 'Not verified',
}

export type Gate = {
  name: string
  state: GateState
  owner: string
  detail: string
  /** Where the state came from, so a reader can check it. */
  source: string
}

export function launchGates(): Gate[] {
  const { reviewed, total, unreviewed } = redFlagReviewStatus()

  return [
    {
      name: 'Clinical approval of danger-sign labels',
      state: unreviewed === 0 ? 'ready' : 'blocked',
      owner: 'Clinical',
      detail:
        unreviewed === 0
          ? `All ${total} labels carry a signature.`
          : `${reviewed} of ${total} signed. The production build refuses to complete while any is unreviewed.`,
      source: 'content/red-flag-labels.ts, read at build',
    },
    {
      name: 'CB_211 clinical adjudication',
      state: 'blocked',
      owner: 'Clinical and Product',
      detail:
        'The one open finding in the mobile case bank. Blocks every external cohort. Does not block internal testing.',
      source: 'Mobile repository, recorded by hand',
    },
    {
      name: 'Android internal testing',
      state: 'not-verified',
      owner: 'Founder',
      detail:
        'A signed artifact is verified and on disk. Whether it has been uploaded to the internal track has not been observed.',
      source: 'Play Console, not readable from this site',
    },
    {
      name: 'TestFlight availability',
      state: 'not-verified',
      owner: 'Founder',
      detail:
        'The upload succeeded. The processing outcome and tester availability have not been observed.',
      source: 'App Store Connect, not readable from this site',
    },
    {
      name: 'Store metadata: privacy policy and support',
      state: 'ready',
      owner: 'Founder',
      detail:
        'Both URLs are published, public, HTTPS, with no sign-in and no redirect, and were verified after deploy for store review.',
      source: '/privacy and /support on this site',
    },
    {
      name: 'Signup storage',
      state: dbConfigured() ? 'ready' : 'waiting',
      owner: 'Founder',
      detail: dbConfigured()
        ? 'Postgres is configured, so every signup is stored.'
        : 'No Postgres URL is set, so WhatsApp-only signups cannot be stored. Email signups still reach the mailing list.',
      source: 'Presence of a Postgres URL. The value is never read.',
    },
    {
      name: 'Public site opened',
      state: LAUNCHED ? 'ready' : 'waiting',
      owner: 'Founder',
      detail: LAUNCHED
        ? 'The full site answers.'
        : 'Deliberately closed. Setting the launch variable and redeploying is the whole operation.',
      source: 'LAUNCHED, read at build time',
    },
    {
      name: 'Physical-device testing',
      state: 'not-verified',
      owner: 'Engineering',
      detail:
        'No physical-handset smoke test has been recorded for the current build on either platform.',
      source: 'Recorded by hand',
    },
  ]
}
