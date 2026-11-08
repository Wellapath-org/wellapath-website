import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin'
import { AuditEntry, Notice, errorText } from '@/components/admin-auth'
import { api, safeId } from '@/content/admin/auth/backend'
import { requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Audit log',
  robots: { index: false, follow: false, nocache: true },
}

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** The moderation audit log (D13), newest first. Read-only: no write API for
 *  it exists anywhere. */
export default async function AuditPage({ searchParams }: { searchParams: Search }) {
  const viewer = await requireViewer()
  const q = await searchParams
  const targetId = safeId(one(q.target_id) ?? '') ?? undefined
  const cursor = one(q.cursor)
  const r = await api.actions(viewer.access, {
    target_id: targetId,
    cursor: cursor && /^[A-Za-z0-9_-]{1,512}$/.test(cursor) ? cursor : undefined,
  })
  return (
    <>
      <AdminHeader
        title="Audit log"
        summary={targetId ? `Moderation actions on ${targetId}.` : 'Every moderation action, newest first.'}
      />
      {!r.ok ? (
        <Notice tone="error">{errorText(r.error.code)}</Notice>
      ) : r.data.items.length === 0 ? (
        <p className="text-body mt-5 text-ink-soft">No actions recorded.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {r.data.items.map((a) => (
            <li key={a.id}>
              <AuditEntry action={a} />
            </li>
          ))}
        </ul>
      )}
      {r.ok && r.data.next_cursor && (
        <a
          href={`/admin/moderation/audit?${new URLSearchParams({ ...(targetId ? { target_id: targetId } : {}), cursor: r.data.next_cursor })}`}
          className="text-small mt-4 inline-block text-accent-ink underline"
        >
          Older entries
        </a>
      )}
    </>
  )
}
