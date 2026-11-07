import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'

import { Wordmark } from '@/components/chrome'
import { ActingAs } from '@/components/admin-auth'
import { ADMIN_GROUPS, MODERATION_SECTIONS, currentSection, sectionsIn, type AdminSection } from '@/content/admin/sections'
import { assertAdmin } from '@/content/admin/guard'
import { adminAuthMode } from '@/content/admin/auth/mode'
import { csrfToken, requireViewer, type Viewer } from '@/content/admin/auth/viewer'

/**
 * The admin shell.
 *
 * Deliberately not the website. The root layout drops the marketing header and
 * footer for /admin, so this is the whole chrome: a quiet sidebar on a desktop,
 * a collapsed disclosure on a phone, and nothing else. No avatar, no bell, no
 * search box, no settings cog — every one of those would be a control that
 * does nothing, and a dashboard that lies about what it can do is worse than a
 * plain one.
 *
 * `middleware.ts` is the gate that matters and runs at the edge before this
 * renders. `assertAdmin()` runs again here so a regression in the middleware
 * matcher fails the render rather than serving the page. In individual mode
 * the same second assertion is `requireViewer()`: a moderator or admin, asked
 * of the backend, with a TOTP step-up the backend confirms.
 *
 * Basic mode renders exactly what it always did. The acting-as bar and the
 * Moderation group exist only in individual mode, because the shared
 * credential identifies nobody and must never moderate.
 *
 * No client JavaScript: the mobile navigation is a native <details>.
 */
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
}

function NavList({ pathname, viewer }: { pathname: string; viewer: Viewer | null }) {
  const groups: { group: string; sections: readonly AdminSection[] }[] = ADMIN_GROUPS.map((group) => ({
    group,
    sections: sectionsIn(group).filter((s) => !viewer || !s.minRole || s.minRole === viewer.role),
  }))
  if (viewer) groups.push({ group: 'Moderation', sections: MODERATION_SECTIONS })
  return (
    <>
      {groups.map(({ group, sections }) => (
        <div key={group} className="mb-5 last:mb-0">
          <p className="text-eyebrow px-3 font-semibold text-ink-mute uppercase">{group}</p>
          <ul className="mt-1">
            {sections.map((section) => {
              const active =
                pathname === section.href ||
                (section.href !== '/admin' && pathname.startsWith(`${section.href}/`))
              return (
                <li key={section.href}>
                  <a
                    href={section.href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      'text-small flex min-h-12 items-center rounded-sm px-3 lg:min-h-9 ' +
                      (active
                        ? 'bg-accent-wash font-semibold text-accent-ink'
                        : 'text-ink-soft hover:bg-rail hover:text-ink')
                    }
                  >
                    {section.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </>
  )
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let viewer: Viewer | null = null
  if (adminAuthMode() === 'individual') viewer = await requireViewer(true)
  else await assertAdmin()

  const pathname = (await headers()).get('x-pathname') ?? ''
  const section = currentSection(pathname)
  const csrf = viewer ? await csrfToken() : ''

  return (
    <div className="min-h-screen bg-sunk lg:flex">
      {/* ── phone and tablet: a collapsed disclosure, no JavaScript ───────── */}
      <details className="border-b border-rule bg-ground lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-2 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="block w-[104px] text-ink">
              <Wordmark />
            </span>
            <span className="text-eyebrow font-semibold text-ink-mute uppercase">Admin</span>
          </span>
          <span className="text-small text-ink-soft">
            {section ? section.label : 'Menu'}
            <span aria-hidden="true"> ▾</span>
          </span>
        </summary>
        <nav aria-label="Admin sections" className="border-t border-rule px-2 pt-3 pb-4">
          <NavList pathname={pathname} viewer={viewer} />
        </nav>
      </details>

      {/* ── desktop: a restrained sidebar ─────────────────────────────────── */}
      <div className="hidden w-[240px] shrink-0 border-r border-rule bg-ground lg:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto px-2 py-5">
          <div className="mb-6 flex items-center gap-2.5 px-3">
            <span className="block w-[104px] text-ink">
              <Wordmark />
            </span>
            <span className="text-eyebrow font-semibold text-ink-mute uppercase">Admin</span>
          </div>
          <nav aria-label="Admin sections">
            <NavList pathname={pathname} viewer={viewer} />
          </nav>
        </div>
      </div>

      {/* ── content ───────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {viewer && (
          <ActingAs
            displayName={viewer.displayName}
            accountId={viewer.me.account_id}
            role={viewer.role}
            meta={viewer.meta}
            csrf={csrf}
            now={Date.now()}
          />
        )}
        <div className="w-full max-w-[1060px] px-5 py-7 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  )
}
