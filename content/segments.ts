/**
 * Segment landing pages.
 *
 * One data file, one template. NN/g's warning about audience-based navigation
 * is that it breeds duplicated, thin pages; keeping the content here makes the
 * duplication visible and the differences deliberate.
 *
 * Trust currency differs by audience and that is intentional:
 *   - households get plain language, named clinicians and cited sources
 *   - institutions get artifact versions, architecture and limitations
 * Both are true; only the emphasis moves.
 */
import { RECEIPTS } from './site'

export type Segment = {
  slug: string
  eyebrow: string
  lead: string
  rest: string
  intro: string
  /** The three-to-four things this audience actually cares about. */
  points: { icon: string; title: string; body: string }[]
  /** Short, checkable claims. Institutional pages get the harder ones. */
  facts: { label: string; value: string }[]
  /** What we will not claim to this audience. Honesty is the differentiator. */
  limits: string[]
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

export const SEGMENTS: Record<string, Segment> = {
  households: {
    slug: 'households',
    eyebrow: 'For households',
    lead: 'For the 11pm decision.',
    rest: 'Go in tonight, or wait until morning?',
    intro:
      'That is the question WellaPath answers. Not what you have. How urgently to act, and which nearby facility can actually treat it.',
    points: [
      {
        icon: 'Waypoints',
        title: 'It tells you how urgently, not what you have',
        body: 'One of 3 urgency levels: home care may be enough, see a doctor today, or go now. Each comes with a timeframe, because "soon" gets read as "eventually".',
      },
      {
        icon: 'TriangleAlert',
        title: 'Danger signs come first',
        body: `Confusion, convulsions, difficulty breathing, dark urine. ${RECEIPTS.rulesGlobal} global rules return emergency on their own, before any scoring happens.`,
      },
      {
        icon: 'CloudRain',
        title: 'It knows what month it is',
        body: 'Malaria weighting rises during the May–October rainy season. Being under 5, pregnant or elderly raises the urgency too. Same symptoms, different answer.',
      },
      {
        icon: 'Lock',
        title: 'Nothing you enter leaves your phone',
        body: 'The assessment runs on the device. There are 0 symptom records on our servers because there is no path for them to arrive.',
      },
    ],
    facts: [
      { label: 'Cost', value: 'Free' },
      { label: 'Account needed', value: 'None' },
      { label: 'Works offline', value: 'Yes, once installed' },
      { label: 'Languages', value: 'English at launch' },
    ],
    limits: [
      'It is not a diagnosis, and it never tells you what you have.',
      'It does not prescribe, treat, or replace a clinician.',
      `${RECEIPTS.conditions} conditions are covered. Yours may not be one of them.`,
      'In an emergency, call 112. Do not open an app.',
    ],
    primaryCta: { label: 'Get the app', href: '/#get-the-app' },
    secondaryCta: { label: 'See how it works', href: '/how-it-works' },
  },

  'health-facilities': {
    slug: 'health-facilities',
    eyebrow: 'For health facilities',
    lead: 'Patients who arrive at the right time.',
    rest: 'Late presentation is the failure mode you can least control.',
    intro:
      'WellaPath sits upstream of your front desk. It tells people how urgently to seek care and routes them to a facility that can treat what they have, which means fewer avoidable emergencies and fewer inappropriate walk-ins.',
    points: [
      {
        icon: 'Hospital',
        title: 'Right level of care, right time',
        body: 'Three urgency levels mapped to real routes: home care, clinic today, emergency now. Emergency-capable facilities are flagged separately so the urgent cases reach the right doors.',
      },
      {
        icon: 'MapPin',
        title: 'Your listing, accurate',
        body: `We hold ${RECEIPTS.facilities.toLocaleString('en-NG')} mapped facilities across Lagos, Kano and the FCT. If yours is wrong, missing, or not flagged emergency-capable when it should be, tell us and we will fix it.`,
      },
      {
        icon: 'ClipboardList',
        title: 'Guidance you can audit',
        body: `${RECEIPTS.conditions} conditions and ${RECEIPTS.rules} triage rules ship as versioned artifacts. You can read exactly which rule produced which recommendation.`,
      },
    ],
    facts: [
      { label: 'Mapped facilities', value: RECEIPTS.facilities.toLocaleString('en-NG') },
      { label: 'Emergency-capable', value: String(RECEIPTS.emergencyCapable) },
      { label: 'States covered', value: 'Lagos, Kano, FCT' },
      { label: 'Integration required', value: 'None' },
    ],
    limits: [
      'We do not book appointments or hold a queue. The app routes, it does not transact.',
      'We do not send you patient data. The assessment never leaves the user’s device.',
      `Only ${RECEIPTS.withPhone} of our records carry a phone number, so most listings show none.`,
    ],
    primaryCta: { label: 'Update your listing', href: '/partners' },
    secondaryCta: { label: 'Clinical safety', href: '/clinical-safety' },
  },

  clinicians: {
    slug: 'clinicians',
    eyebrow: 'For clinicians',
    lead: 'Read the rules. Challenge them.',
    rest: 'The knowledge base is not a black box.',
    intro:
      'WellaPath is clinical decision support, which means the guidance is only as good as the clinicians willing to review it. Everything that reaches a user is a versioned artifact you can read, question and correct.',
    points: [
      {
        icon: 'Stethoscope',
        title: 'Danger signs are evaluated before scoring',
        body: `${RECEIPTS.rulesGlobal} global red-flag rules halt the pass and return emergency on their own. A low-scoring but dangerous presentation cannot be talked down by a high-scoring benign one.`,
      },
      {
        icon: 'FileText',
        title: 'Versioned, reviewable artifacts',
        body: `Conditions, rules and the facility directory ship as separate versioned files. This site is built against kb v2.4, rules v2.2 and facilities v1.1, stated on every relevant page.`,
      },
      {
        icon: 'UserRoundCheck',
        title: 'Named review, credited',
        body: 'We want reviewers named on the clinical safety page, with credentials and a review date. It is the strongest trust signal in this category and we would rather earn it than skip it.',
      },
    ],
    facts: [
      { label: 'Conditions', value: String(RECEIPTS.conditions) },
      {
        label: 'Rules',
        value: `${RECEIPTS.rules} (${RECEIPTS.rulesGlobal} global)`,
      },
      { label: 'Diagnostic claim', value: 'None made' },
      { label: 'Accuracy figures', value: 'Not published' },
    ],
    limits: [
      'No clinical validation study has been run, so no sensitivity or specificity figures are published.',
      'Input is self-reported symptoms. The engine cannot examine, measure or test.',
      'Demographic modifiers escalate urgency; they do not adjust likelihood.',
    ],
    primaryCta: { label: 'Request review access', href: '/partners' },
    secondaryCta: { label: 'Clinical safety', href: '/clinical-safety' },
  },

  'public-health': {
    slug: 'public-health',
    eyebrow: 'For ministries & NGOs',
    lead: 'Triage that runs on the phones people already own.',
    rest: 'Offline, on-device, aligned to Nigerian guidance.',
    intro:
      'WellaPath is a triage layer for a population, not a platform you have to host. The clinical artifacts download once and the engine runs on the handset, which is why it works in places connectivity does not.',
    points: [
      {
        icon: 'Globe',
        title: 'Built for Nigerian disease burden',
        body: 'Lassa fever, cerebrospinal meningitis, cholera, yellow fever, snake bite, measles. Conditions a symptom checker built elsewhere does not carry, and will route around.',
      },
      {
        icon: 'CloudRain',
        title: 'Seasonality already modelled',
        body: `${RECEIPTS.conditions} conditions in the knowledge base, of which a substantial share carry seasonal modifiers: malaria in the rainy season, meningitis in its own belt season.`,
      },
      {
        icon: 'Lock',
        title: 'No population data leaves the device',
        body: 'There is no symptom database to govern, breach or transfer. That removes an entire category of data-protection risk from a deployment.',
      },
      {
        icon: 'Database',
        title: 'Versioned artifacts, not a black box',
        body: 'Clinical content ships as reviewable files with version numbers. A guideline change is a re-release, not a code deployment.',
      },
    ],
    facts: [
      { label: 'Deployment', value: 'App install only' },
      { label: 'Hosting required', value: 'None' },
      { label: 'Works offline', value: 'Yes' },
      { label: 'Data protection', value: 'NDPR-aligned' },
    ],
    limits: [
      'Coverage is 3 states today: Lagos, Kano and the FCT. Not the federation.',
      'English only at launch. Hausa would widen reach considerably and is not yet available.',
      'It is not a surveillance tool: because nothing leaves the device, it cannot report case counts.',
    ],
    primaryCta: { label: 'Talk to us', href: '/partners' },
    secondaryCta: { label: 'See coverage', href: '/coverage' },
  },
}

export const SEGMENT_SLUGS = Object.keys(SEGMENTS)
