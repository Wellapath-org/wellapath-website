/**
 * The admin panel's sections.
 *
 * One list, read by the shell's navigation and by scripts/check-admin.mjs, so
 * a section cannot exist without the access check covering it.
 *
 * The three groups are how the work actually divides: what we are shipping,
 * who is waiting for it, and what we can measure. A flat list of ten is a list
 * you read; three groups of three or four is a thing you navigate.
 */

export type AdminGroup = 'Operations' | 'Audience' | 'Measurement'

export type AdminSection = {
  href: string
  label: string
  group: AdminGroup
  /** One line describing what the section answers. */
  blurb: string
}

export const ADMIN_GROUPS: readonly AdminGroup[] = ['Operations', 'Audience', 'Measurement']

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  {
    href: '/admin',
    label: 'Overview',
    group: 'Operations',
    blurb: 'Where the launch stands, in one screen.',
  },
  {
    href: '/admin/launch-readiness',
    label: 'Launch readiness',
    group: 'Operations',
    blurb: 'The gates between here and a public launch.',
  },
  {
    href: '/admin/distribution',
    label: 'App distribution',
    group: 'Operations',
    blurb: 'Android and iOS builds, tracked separately.',
  },
  {
    href: '/admin/system-health',
    label: 'System health',
    group: 'Operations',
    blurb: 'Production configuration, measured.',
  },
  {
    href: '/admin/data',
    label: 'Facilities and data',
    group: 'Operations',
    blurb: 'Clinical artifacts and coverage.',
  },

  {
    href: '/admin/signups',
    label: 'Waitlist',
    group: 'Audience',
    blurb: 'Launch signups. Personal data.',
  },
  { href: '/admin/feedback', label: 'Feedback', group: 'Audience', blurb: 'Not active.' },
  { href: '/admin/support', label: 'Support', group: 'Audience', blurb: 'Not active.' },

  {
    href: '/admin/reliability',
    label: 'Reliability',
    group: 'Measurement',
    blurb: 'Crash diagnostics. Engineering only.',
  },
  {
    href: '/admin/product-insights',
    label: 'Product insights',
    group: 'Measurement',
    blurb: 'Product analytics. Separate from crash diagnostics.',
  },
] as const

export const ADMIN_ROUTES: readonly string[] = ADMIN_SECTIONS.map((s) => s.href)

export function sectionsIn(group: AdminGroup): readonly AdminSection[] {
  return ADMIN_SECTIONS.filter((s) => s.group === group)
}

/** The section a pathname belongs to, for the active marker and page titles. */
export function currentSection(pathname: string): AdminSection | undefined {
  return ADMIN_SECTIONS.find(
    (s) => pathname === s.href || (s.href !== '/admin' && pathname.startsWith(`${s.href}/`)),
  )
}
