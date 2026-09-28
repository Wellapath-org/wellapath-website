/**
 * The admin panel's sections, in navigation order.
 *
 * One list, read by the layout's nav and by scripts/check-admin.mjs, so a
 * section cannot exist without the access check covering it.
 */

export type AdminSection = {
  href: string
  label: string
  /** One line describing what the section answers. */
  blurb: string
}

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { href: '/admin', label: 'Overview', blurb: 'Where the launch stands, in one screen.' },
  { href: '/admin/signups', label: 'Waitlist', blurb: 'Launch signups. Personal data.' },
  {
    href: '/admin/launch-readiness',
    label: 'Launch readiness',
    blurb: 'The gates between here and a public launch.',
  },
  {
    href: '/admin/distribution',
    label: 'App distribution',
    blurb: 'Android and iOS builds, tracked separately.',
  },
  {
    href: '/admin/system-health',
    label: 'System health',
    blurb: 'Production configuration, measured.',
  },
  { href: '/admin/data', label: 'Facilities and data', blurb: 'Clinical artifacts and coverage.' },
  { href: '/admin/feedback', label: 'Feedback', blurb: 'Not active.' },
  { href: '/admin/support', label: 'Support', blurb: 'Not active.' },
  {
    href: '/admin/reliability',
    label: 'Reliability',
    blurb: 'Crash diagnostics. Engineering only.',
  },
  {
    href: '/admin/product-insights',
    label: 'Product insights',
    blurb: 'Product analytics. Separate from crash diagnostics.',
  },
] as const

export const ADMIN_ROUTES: readonly string[] = ADMIN_SECTIONS.map((s) => s.href)
