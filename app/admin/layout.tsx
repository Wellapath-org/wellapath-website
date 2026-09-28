import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'

import { Eyebrow } from '@/components/ui'
import { ADMIN_SECTIONS } from '@/content/admin/sections'
import { assertAdmin } from '@/content/admin/guard'

/**
 * The admin panel shell: shared navigation, and a second assertion of the
 * lock.
 *
 * `middleware.ts` is the gate that matters and runs at the edge before this
 * renders. `assertAdmin()` runs again here so that a regression in the
 * middleware matcher fails the render rather than serving the page. Belt and
 * braces, on the one part of the site that shows personal data.
 *
 * This layout nests inside the root layout, so admin pages still carry the
 * marketing header and footer. That is existing behaviour for /admin/signups
 * and is left alone: removing it would mean a route-group restructure, which
 * would move the waitlist page's URL.
 */
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await assertAdmin()

  // Set by middleware.ts so the nav can mark the current section without a
  // client component. Absent in any context where middleware did not run, in
  // which case nothing is marked, which is the harmless outcome.
  const pathname = (await headers()).get('x-pathname') ?? ''

  return (
    <div>
      <nav aria-label="Admin sections" className="border-b border-rule bg-sunk">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-3 sm:px-6 md:px-10">
          <Eyebrow>WellaPath admin</Eyebrow>
          {/* min-h-12 links: the 48px target is also the row spacing. */}
          <ul className="mt-1 flex flex-wrap gap-x-5">
            {ADMIN_SECTIONS.map((section) => {
              const current =
                pathname === section.href ||
                (section.href !== '/admin' && pathname.startsWith(`${section.href}/`))
              return (
                <li key={section.href}>
                  <a
                    href={section.href}
                    aria-current={current ? 'page' : undefined}
                    className={
                      // 48px is the documented floor and is enforced by
                      // scripts/check-layout.mjs now that it covers /admin.
                      'text-small inline-flex min-h-12 items-center underline-offset-4 ' +
                      (current
                        ? 'font-semibold text-ink underline decoration-accent decoration-2'
                        : 'text-ink-soft underline decoration-ink-mute/40 hover:text-accent-ink hover:decoration-accent')
                    }
                  >
                    {section.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
      {/* The root skip link lands before this nav, so give the content its own
          target: ten links are exactly what a skip link exists to skip. */}
      <a
        href="#admin-content"
        className="skip-link absolute left-4 -translate-y-20 focus:translate-y-2"
      >
        Skip to section content
      </a>
      <div id="admin-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}
