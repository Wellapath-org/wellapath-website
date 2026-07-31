/**
 * Site-wide constants and the receipts.
 *
 * Every figure here is imported from `stamp.json`, which sync-kb.mjs derives from
 * the shipped artifacts. Nothing on the site hardcodes a number — WEBSITE_GUIDE §3
 * says do not round them up and do not invent new ones, and the cheapest way to
 * guarantee that is to make it impossible to type one by hand.
 */
import stamp from './artifacts/stamp.json'

export const RECEIPTS = stamp.receipts

export const SITE = {
  name: 'WellaPath',
  domain: 'wellapath.org',
  url: 'https://wellapath.org',
  tagline: 'Know how urgently to act.',
  description:
    'A symptom check built on Nigerian clinical guidance. It tells you how urgently to seek care and where. Not what you have.',
} as const

/**
 * The disclaimer. Verbatim from the app, so a visitor moving between the two
 * surfaces reads the same sentence. §1: this is a design element, not fine print.
 */
export const DISCLAIMER =
  'This is a symptom assessment, not a diagnosis. Your symptoms may be caused by a condition not mentioned here.'

/**
 * Emergency number.
 *
 * 112 is what the app already publishes on its home screen ("Call emergency — 112"),
 * so the site matches it rather than inventing a second answer.
 *
 * ── STILL NEEDS VERIFYING ───────────────────────────────────────────────────
 * WEBSITE_GUIDE §14 flags that state services differ and Lagos runs its own line
 * (767). Getting this wrong is a safety issue, not a content one. Confirm per
 * covered state before launch.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const EMERGENCY = {
  national: '112',
  note: 'Free from any phone, anywhere in Nigeria.',
  needsVerification: true,
} as const

export const COVERAGE = {
  states: [
    { name: 'Lagos', count: RECEIPTS.byState.Lagos },
    { name: 'Kano', count: RECEIPTS.byState.Kano },
    { name: 'FCT', count: RECEIPTS.byState.FCT },
  ],
} as const


/**
 * The four audiences.
 *
 * NN/g's guidance on audience-based navigation is to keep the PRIMARY nav
 * task-based and expose audiences as a secondary route, prefixed with "for"
 * so there is no ambiguity between content *about* a group and content *for*
 * them. Every segment gets a real landing page rather than a menu entry —
 * a menu-only segment is IA mistake #3.
 */
export const AUDIENCES = [
  {
    kind: 'For households',
    title: 'People deciding whether to go in',
    blurb:
      'A parent at 11pm with a feverish child. The app tells them how urgently to act and which nearby facility can treat it.',
    cta: 'Get the app',
    href: '/for/households',
    primary: true,
  },
  {
    kind: 'For health facilities',
    title: 'Clinics and hospitals',
    blurb:
      'People arriving at the right level of care, at the right time, plus an accurate listing in a directory they actually search.',
    cta: 'For health facilities',
    href: '/for/health-facilities',
    primary: false,
  },
  {
    kind: 'For clinicians',
    title: 'Doctors and medical experts',
    blurb:
      'Review the knowledge base, challenge a rule, or put your name to the guidance that reaches thousands of households.',
    cta: 'For clinicians',
    href: '/for/clinicians',
    primary: false,
  },
  {
    kind: 'For public health',
    title: 'Ministries and NGOs',
    blurb:
      'Seasonal and demographic escalation already modelled across 50 conditions, running offline on the phones your population already owns.',
    cta: 'For ministries & NGOs',
    href: '/for/public-health',
    primary: false,
  },
] as const


/**
 * The mega-menu.
 *
 * Everything the site can reach lives here. Before this, /privacy, /about,
 * /partners and the four /for/* segment pages were only reachable from the
 * footer, which is where links go to be ignored. A single wide panel puts the
 * whole map in front of the visitor without adding top-level nav items.
 *
 * NN/g's caution about audience-based navigation still holds: the top level is
 * task-based, and the audiences sit inside a column explicitly prefixed "For".
 */
export const MENU: {
  title: string
  href?: string
  columns?: { heading: string; links: { href: string; label: string; note?: string }[] }[]
}[] = [
  {
    title: 'Product',
    columns: [
      {
        heading: 'How it works',
        links: [
          { href: '/how-it-works', label: 'The method', note: 'Four steps, in order' },
          { href: '/how-it-works#limits', label: 'What it does not do', note: 'Stated by us first' },
          { href: '/coverage', label: 'Coverage', note: 'Lagos, Kano and the FCT' },
        ],
      },
      {
        heading: 'Conditions',
        links: [
          { href: '/conditions', label: 'All 50 conditions' },
          { href: '/conditions?urgency=emergency', label: 'Emergency-level' },
          { href: '/conditions?urgency=urgent', label: 'Urgent' },
          { href: '/conditions?seasonal=true', label: 'Seasonal conditions' },
        ],
      },
      {
        heading: 'Clinical',
        links: [
          { href: '/clinical-safety', label: 'Clinical safety' },
          { href: '/clinical-safety#limits', label: 'Limitations' },
          { href: '/privacy', label: 'Privacy and NDPR' },
        ],
      },
    ],
  },
  {
    title: 'For partners',
    columns: [
      {
        heading: 'By organisation',
        links: [
          { href: '/for/health-facilities', label: 'Health facilities', note: 'Clinics and hospitals' },
          { href: '/for/clinicians', label: 'Doctors and clinicians', note: 'Review the knowledge base' },
          { href: '/for/public-health', label: 'Ministries and NGOs', note: 'Population-level triage' },
        ],
      },
      {
        heading: 'For households',
        links: [
          { href: '/for/households', label: 'People deciding whether to go in' },
          { href: '/#get-the-app', label: 'Get the app' },
        ],
      },
      {
        heading: 'Talk to us',
        links: [
          { href: '/partners', label: 'Book a conversation' },
          { href: '/about', label: 'About WellaPath' },
        ],
      },
    ],
  },
  { title: 'Conditions', href: '/conditions' },
  { title: 'Coverage', href: '/coverage' },
  { title: 'About', href: '/about' },
]

export const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/conditions', label: 'Conditions' },
  { href: '/coverage', label: 'Coverage' },
  { href: '/clinical-safety', label: 'Clinical safety' },
  { href: '/for/health-facilities', label: 'For partners' },
] as const

/**
 * Footer columns.
 *
 * Four columns with dotted rules between, matching the reference. Some columns
 * carry a second stacked group, which is how the reference fits a long site map
 * without a fifth column. Every route on the site appears here — the footer is
 * the complete map, the mega-menu is the shortcut.
 */
export const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/conditions', label: 'All 50 conditions' },
      { href: '/conditions?seasonal=true', label: 'Seasonal conditions' },
      { href: '/conditions?urgency=emergency', label: 'Emergency-level' },
      { href: '/conditions?urgency=urgent', label: 'Urgent' },
      { href: '/conditions?urgency=non_urgent', label: 'Non-urgent' },
      { href: '/coverage', label: 'Coverage' },
      { href: '/#get-the-app', label: 'Get the app' },
    ],
  },
  {
    title: 'For partners',
    links: [
      { href: '/for/households', label: 'Households' },
      { href: '/for/health-facilities', label: 'Health facilities' },
      { href: '/for/clinicians', label: 'Doctors and clinicians' },
      { href: '/for/public-health', label: 'Ministries and NGOs' },
      { href: '/partners', label: 'Book a conversation' },
    ],
    second: {
      title: 'Company',
      links: [
        { href: '/about', label: 'About WellaPath' },
        { href: '/about#team', label: 'The team' },
      ],
    },
  },
  {
    title: 'Clinical',
    links: [
      { href: '/clinical-safety', label: 'Clinical safety' },
      { href: '/clinical-safety#limits', label: 'Limitations' },
      { href: '/how-it-works', label: 'The method' },
      { href: '/how-it-works#limits', label: 'What it does not do' },
    ],
    second: {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy and NDPR' },
        { href: '/privacy#collect', label: 'What we never collect' },
      ],
    },
  },
  {
    title: 'Emergency',
    links: [
      { href: 'tel:112', label: 'Call 112' },
      { href: '/coverage', label: 'Emergency-capable facilities' },
    ],
    second: {
      title: 'Coverage',
      links: [
        { href: '/coverage', label: 'Lagos · 2,690' },
        { href: '/coverage', label: 'Kano · 2,040' },
        { href: '/coverage', label: 'FCT · 614' },
      ],
    },
  },
] as const

export const ARTIFACT_VERSIONS = stamp.artifacts
