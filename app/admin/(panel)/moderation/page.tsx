import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin'
import { Notice, errorText } from '@/components/admin-auth'
import { api, type ReportQueueItem } from '@/content/admin/auth/backend'
import { requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reports queue',
  robots: { index: false, follow: false, nocache: true },
}

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const STATUSES = ['open', 'actioned', 'dismissed'] as const

function excerpt(body: string | null) {
  if (body === null) return 'Body erased'
  return body.length > 160 ? `${body.slice(0, 160)}…` : body
}

/**
 * The Community reports queue (D1). Open reports come back with
 * `self_harm_or_emergency` first, then oldest first; the order is the
 * server's. Nothing here identifies a reporter or an author: identity needs
 * the audited reveal on a report's own page.
 */
export default async function ModerationQueuePage({ searchParams }: { searchParams: Search }) {
  const viewer = await requireViewer()
  const q = await searchParams
  const status = STATUSES.find((s) => s === one(q.status)) ?? 'open'
  const cursor = one(q.cursor)
  const r = await api.reports(viewer.access, { status, cursor: cursor && /^[A-Za-z0-9_-]{1,512}$/.test(cursor) ? cursor : undefined })

  return (
    <>
      <AdminHeader
        title="Reports queue"
        summary="Community reports from members. Every action needs a reason and is recorded against your account."
      />
      <nav aria-label="Report status" className="mt-4 flex gap-2">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/moderation?status=${s}`}
            aria-current={s === status ? 'page' : undefined}
            className={
              'text-small rounded-sm px-3 py-1.5 ' +
              (s === status ? 'bg-accent-wash font-semibold text-accent-ink' : 'text-ink-soft hover:bg-rail')
            }
          >
            {s[0].toUpperCase() + s.slice(1)}
          </a>
        ))}
      </nav>

      {!r.ok ? (
        <Notice tone="error">{errorText(r.error.code)}</Notice>
      ) : r.data.items.length === 0 ? (
        <p className="text-body mt-5 text-ink-soft">No {status} reports.</p>
      ) : (
        <ul className="mt-4 space-y-3" data-queue={status}>
          {r.data.items.map((item: ReportQueueItem) => (
            <li key={item.id} className="rounded-md border border-rule bg-ground p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-small font-semibold text-ink">
                  {item.reason === 'self_harm_or_emergency' ? 'Urgent · ' : ''}
                  {item.reason.replace(/_/g, ' ')}
                </p>
                <time className="text-small text-ink-mute" dateTime={item.created_at}>
                  {item.created_at}
                </time>
              </div>
              <p className="text-small mt-1 text-ink-soft">
                {item.target_type} · {item.target?.status ?? 'unknown'} · {item.target?.open_report_count ?? 0} open
                report(s)
              </p>
              <p className="text-body mt-2 text-ink">{excerpt(item.target?.body ?? null)}</p>
              {item.note && <p className="text-small mt-1 text-ink-mute">Reporter note: {item.note}</p>}
              <a href={`/admin/moderation/reports/${encodeURIComponent(item.id)}`} className="text-small mt-2 inline-block font-semibold text-accent-ink underline">
                Review report
              </a>
            </li>
          ))}
        </ul>
      )}
      {r.ok && r.data.next_cursor && (
        <a
          href={`/admin/moderation?status=${status}&cursor=${encodeURIComponent(r.data.next_cursor)}`}
          className="text-small mt-4 inline-block text-accent-ink underline"
        >
          Older reports
        </a>
      )}
    </>
  )
}
