import 'server-only'

/**
 * Facts the repository can establish about itself.
 *
 * These read committed source and the presence of environment variables. They
 * never read a variable's value, and nothing here touches the signups table:
 * `dbConfigured()` returns a boolean about configuration, not a query.
 */
import { LAUNCHED } from '@/content/launch'
import { dbConfigured } from '@/content/db'
import { getAllConditions } from '@/content/conditions'
import { redFlagReviewStatus } from '@/content/red-flag-labels'
import { EXPECTED_ARTIFACTS } from './config-probe'
import type { Fact, LabelledFact } from './facts'

/** Presence only. The value is never read, returned or rendered. */
function isSet(name: string): boolean {
  const v = process.env[name]
  return typeof v === 'string' && v.length > 0
}

export function siteMode(): LabelledFact {
  return {
    label: 'Site mode',
    state: 'derived',
    value: LAUNCHED ? 'Launched, full site' : 'Closed, waitlist only',
    source: 'LAUNCHED, read at build time',
    note: LAUNCHED
      ? 'Every route answers and the full sitemap is published.'
      : 'Only the front door, /privacy and /support answer. Everything else redirects to the waitlist. /admin stays reachable behind its lock.',
  }
}

export function redFlagLabels(): LabelledFact {
  const { total, reviewed, unreviewed } = redFlagReviewStatus()
  return {
    label: 'Danger-sign labels reviewed',
    state: 'derived',
    value: `${reviewed} of ${total}`,
    source: 'content/red-flag-labels.ts',
    note:
      unreviewed === 0
        ? 'All labels carry a clinical signature.'
        : `${unreviewed} still need a clinician's signature. The production build refuses to complete while any is unreviewed; deploys currently pass an override, which is a preview switch and not a launch position.`,
  }
}

export function conditionPages(): LabelledFact {
  return {
    label: 'Condition guides',
    state: 'derived',
    value: `${getAllConditions().length} pages`,
    source: 'content/conditions.ts',
  }
}

export function signupStorage(): LabelledFact {
  const configured = dbConfigured()
  if (configured) {
    return {
      label: 'Signup storage',
      state: 'derived',
      value: 'Postgres configured',
      source: 'Presence of a Postgres URL. The value is never read here.',
    }
  }
  return {
    label: 'Signup storage',
    state: 'unavailable',
    reason: 'not-instrumented',
    source: 'No Postgres URL is set',
    note: 'WhatsApp-only signups cannot be stored. The form fails honestly and writes the details to the server log rather than pretending to have saved them.',
  }
}

export function mailingList(): LabelledFact {
  const configured = isSet('RESEND_API_KEY') && isSet('RESEND_AUDIENCE_ID')
  if (configured) {
    return {
      label: 'Mailing list',
      state: 'derived',
      value: 'Resend configured',
      source: 'Presence of the Resend key and audience. Neither value is read here.',
    }
  }
  return {
    label: 'Mailing list',
    state: 'unavailable',
    reason: 'not-instrumented',
    source: 'Resend key or audience is not set',
    note: 'Signups are still stored when Postgres is configured; only the mail copy is missing.',
  }
}

export function adminAuth(): LabelledFact {
  const configured = isSet('ADMIN_USER') && isSet('ADMIN_PASSWORD')
  return {
    label: 'Admin authentication',
    state: 'derived',
    value: configured ? 'Configured' : 'Not configured, denying all',
    source: 'middleware.ts. Credential values are never read here.',
    note: configured
      ? 'Accepted for founder-operated use only. Individual accounts, roles and an audit trail are required before a second person is given access.'
      : 'Every admin request is denied, which is the safe failure.',
  }
}

export function expectedArtifacts(): LabelledFact {
  const list = Object.entries(EXPECTED_ARTIFACTS)
    .map(([name, version]) => `${name} ${version}`)
    .join(' · ')
  return {
    label: 'Expected artifact versions',
    state: 'derived',
    value: list,
    source: 'content/admin/config-health.ts',
    note: 'What the configuration endpoint is expected to name. The app pins no versions of its own, so what it actually serves is the thing that decides behaviour.',
  }
}

/* ── build identity ───────────────────────────────────────────────────────
 * The mobile build numbers live in the mobile repository, which this site has
 * no access to. They are carried as manual entries rather than guessed, and
 * are marked as such wherever they appear.
 * ------------------------------------------------------------------------ */

export const MOBILE_BUILD_NOTE =
  'Build identity lives in the mobile repository and is not readable from this site. These values are recorded by hand.'

/** Deliberately not a live reading: this site cannot see the mobile repo. */
export function mobileBuild(platform: 'Android' | 'iOS', version: string): Fact {
  return {
    state: 'manual',
    value: version,
    observedBy: 'Engineering',
    observedAt: '2026-09-25',
    source: 'Mobile repository build registry',
    note: MOBILE_BUILD_NOTE,
  }
}
