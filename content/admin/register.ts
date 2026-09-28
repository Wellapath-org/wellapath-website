/**
 * Facts the repository cannot observe for itself, and the launch action list.
 *
 * Everything here is testimony: a person looked at a console, a handset or a
 * clinical decision and wrote down what they saw. It is rendered with a MANUAL
 * badge, the observer's name and the date, and it expires (see `aged`).
 *
 * Rules for editing this file:
 *   - `manual` requires value, observedBy and observedAt. The type enforces it.
 *   - Nobody has looked yet is `unavailable` with reason 'not-verified'.
 *     Never guess a value.
 *   - Owners are roles. No email addresses, no phone numbers, no personal
 *     contact details of any kind; scripts/check-admin.mjs fails the build if
 *     one appears.
 */
import type { Fact } from './facts'

export const MANUAL_FACTS = {
  // ── App Store Connect ──────────────────────────────────────────────────
  iosProcessing: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'App Store Connect, TestFlight, iOS builds',
    note: 'Upload succeeded 2026-09-25T14:18:57Z (xcodebuild exit 0). The processing OUTCOME has not been observed by anyone yet.',
  },
  iosBuildVisible: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'App Store Connect, TestFlight, iOS builds',
    note: 'Awaiting a console read.',
  },
  iosTesters: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'App Store Connect, Internal Testing group',
    note: 'Exported with testFlightInternalTestingOnly, so external testing and Beta App Review are barred for this build by construction. The number of internal testers who can install it has not been observed.',
  },
  ios211Available: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'App Store Connect, TestFlight, iOS builds',
    note: 'Build 211 remains the soft-launch candidate. Confirm it has not expired out of the 90-day TestFlight window.',
  },

  // ── Google Play ────────────────────────────────────────────────────────
  android215Uploaded: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'Play Console, Testing, Internal testing',
    note: 'The signed artifact is verified and on disk but was not uploaded by engineering. Upload is a founder console action.',
  },
  androidTesters: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'Play Console, Internal testing, Testers',
    note: 'Five testers were confirmed on the track for build 211. Not re-observed for 215.',
  },
  android211Live: {
    state: 'manual',
    value: 'Build 211 live, 5 testers',
    observedBy: 'Founder',
    observedAt: '2026-09-25',
    source: 'Play Console, Internal testing track',
    note: 'Direct console confirmation. This superseded an earlier record that said the app had never been uploaded.',
  },
  playAppSigningPrompt: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'Play Console, Release, Setup, App signing',
    note: 'Must remain absent. Build 215 is not a first upload; if the console offers enrolment, that contradicts the confirmed state. Stop, capture the screen and reconcile before uploading.',
  },

  // ── Clinical ───────────────────────────────────────────────────────────
  clinicalReview: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'Clinical reviewer',
    note: 'The CB_211 adjudication is the open item and it gates every external cohort. Record a decision here only when a real one exists.',
  },
  redFlagLabels: {
    state: 'manual',
    value: '12 of 48 reviewed',
    observedBy: 'Engineering',
    observedAt: '2026-09-15',
    source: 'content/red-flag-labels.ts',
    note: 'The build fails while any label is unreviewed. Deploys currently pass ALLOW_UNREVIEWED_RED_FLAGS, which is a preview switch and not a launch position.',
  },

  // ── Device testing ─────────────────────────────────────────────────────
  deviceAndroid: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'Manual test on a physical handset',
    note: 'No physical-device smoke test of the current build has been recorded. Emulator and CI runs do not satisfy this.',
  },
  deviceIos: {
    state: 'unavailable',
    reason: 'not-verified',
    source: 'Manual test on a physical handset via TestFlight',
    note: 'Blocked until the iOS build finishes processing and reaches an internal tester.',
  },

  // ── Store listing prerequisites ────────────────────────────────────────
  supportContact: {
    state: 'manual',
    value: 'Published',
    observedBy: 'Founder',
    observedAt: '2026-09-12',
    source: '/support and /privacy',
    note: 'A monitored address is published as the support and privacy contact. It is not a named Data Protection Officer and must not be described as one until someone is formally appointed.',
  },
  privacyPolicy: {
    state: 'manual',
    value: 'Published and store-verified',
    observedBy: 'Founder',
    observedAt: '2026-09-12',
    source: '/privacy',
    note: 'Verified after deploy as public, HTTPS, no sign-in and no redirect. Must be updated before Sentry is ever activated.',
  },
} satisfies Record<string, Fact>

export type ManualFactKey = keyof typeof MANUAL_FACTS

// ── Outstanding launch actions ────────────────────────────────────────────

export type Severity = 'blocker' | 'high' | 'medium' | 'low'

export type LaunchAction = {
  id: string
  title: string
  /** A role, never a person's contact details. */
  owner: string
  severity: Severity
  reference: string
  note?: string
}

export const SEVERITY_ORDER: readonly Severity[] = ['blocker', 'high', 'medium', 'low']

export const LAUNCH_ACTIONS: readonly LaunchAction[] = [
  {
    id: 'RED-FLAG-LABELS',
    title: 'Clinician sign-off on the danger-sign labels',
    owner: 'Clinical',
    severity: 'blocker',
    reference: 'content/red-flag-labels.ts',
    note: 'The sentences at the top of every condition page telling a reader what means go now. The build refuses to complete while any is unreviewed.',
  },
  {
    id: 'CB-211',
    title: 'CB_211 clinical adjudication',
    owner: 'Clinical and Product',
    severity: 'blocker',
    reference: 'Mobile: docs/release/CB_211_DISPOSITION.md',
    note: 'The one open finding in the 239-case bank. Blocks every external cohort. Does not block internal testing.',
  },
  {
    id: 'DATABASE-URL',
    title: 'Provision Postgres and set the database URL',
    owner: 'Founder',
    severity: 'high',
    reference: 'docs/PROGRESS.md, Vercel environment variables',
    note: 'Until it is set, WhatsApp-only signups cannot be stored. The form fails honestly and writes to the server log rather than pretending to work.',
  },
  {
    id: 'PLAY-APP-SIGNING',
    title: 'Enrol in Play App Signing at the next upload',
    owner: 'Founder',
    severity: 'high',
    reference: 'Mobile: docs/release/SIGNING_CONTINUITY.md',
    note: 'The upload key exists on one machine with no escrowed backup.',
  },
  {
    id: 'IOS-KEY-ESCROW',
    title: 'Escrow the replacement Apple Distribution private key',
    owner: 'Founder and Engineering',
    severity: 'high',
    reference: 'Mobile: PROGRESS.md, build 215 iOS section',
    note: 'The original private key was unrecoverable and a replacement certificate was issued. Exporting to secure storage now prevents an identical loss.',
  },
  {
    id: 'ADMIN-MULTIUSER',
    title: 'Individual accounts before anyone else gets admin access',
    owner: 'Engineering',
    severity: 'high',
    reference: 'middleware.ts',
    note: 'Shared-credential access is accepted for founder-operated Phase 1 only. A second person needs individual authentication, roles and an audit trail first. Detail of the current control is deliberately not recorded here: this repository is public.',
  },
  {
    id: 'SEARCH-CONSOLE',
    title: 'Verify the domain in Search Console and submit the sitemap',
    owner: 'Founder',
    severity: 'medium',
    reference: 'docs/PROGRESS.md',
    note: 'None of the SEO work is measurable until this exists, and analytics deliberately never runs on condition pages.',
  },
  {
    id: 'DPA-RECORD',
    title: 'Reconcile the contradictory crash-reporting DPA records',
    owner: 'Engineering',
    severity: 'medium',
    reference: 'Mobile: docs/I1_OBSERVABILITY_BASELINE_CLOSURE.md against docs/store/CRASH_PRIVACY_DECLARATIONS.md',
    note: 'One document says pending acceptance, another says signed and effective. Settle it before crash reporting is enabled, not after.',
  },
  {
    id: 'TELEMETRY-CONSENT',
    title: 'Decide whether analytics consent is required in the app',
    owner: 'Product and Privacy',
    severity: 'medium',
    reference: 'Mobile: docs/TELEMETRY_MOBILE.md',
    note: 'Unresolved. Required before any external cohort if telemetry is ever enabled.',
  },
  {
    id: 'SIGNUPS-PAGINATION',
    title: 'Paginate the signups query',
    owner: 'Engineering',
    severity: 'low',
    reference: 'content/db.ts, the signups query',
    note: 'The query has no limit, so every admin page load reads the whole table. Harmless at current volume, and a follow-up rather than a Phase 1 change.',
  },
  {
    id: 'ANDROID-3G',
    title: 'Test the site on a real Android handset over 3G',
    owner: 'Engineering',
    severity: 'low',
    reference: 'docs/PROGRESS.md',
    note: 'Everything so far is measured in a headless browser on a laptop.',
  },
]
