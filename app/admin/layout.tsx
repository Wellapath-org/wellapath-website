import type { Metadata } from 'next'
import type { ReactNode } from 'react'

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

  return (
    <div>
      <nav aria-label="Admin sections" className="border-b border-rule bg-sunk">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-3 sm:px-6 md:px-10">
          <p className="text-eyebrow font-semibold text-ink-mute">WellaPath admin</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            {ADMIN_SECTIONS.map((section) => (
              <li key={section.href}>
                <a
                  href={section.href}
                  className="text-small text-ink-soft underline decoration-rule underline-offset-4 hover:text-accent-ink hover:decoration-accent"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {children}
    </div>
  )
}
