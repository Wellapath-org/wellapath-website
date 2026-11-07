import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin'
import { ModActionForm, Notice, errorText } from '@/components/admin-auth'
import { api, safeId } from '@/content/admin/auth/backend'
import { csrfToken, requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report',
  robots: { index: false, follow: false, nocache: true },
}

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** One report (D2), its target as moderators see it, and every action. */
export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const viewer = await requireViewer()
  const id = safeId((await params).id)
  if (!id) notFound()
  const q = await searchParams
  const r = await api.report(viewer.access, id)
  if (!r.ok && r.error.status === 404) notFound()
  const csrf = await csrfToken()
  const here = `/admin/moderation/reports/${id}`
  const error = errorText(one(q.error))

  if (!r.ok) {
    return (
      <>
        <AdminHeader title="Report" summary="Could not load this report." />
        <Notice tone="error">{errorText(r.error.code)}</Notice>
      </>
    )
  }
  const item = r.data
  const t = item.target
  const forms = { csrf, returnTo: here }

  return (
    <>
      <AdminHeader title={`Report: ${item.reason.replace(/_/g, ' ')}`} summary={`Status ${item.status}. Reported ${item.created_at}.`} />
      {error && <Notice tone="error">{error}</Notice>}

      <section className="mt-5 rounded-md border border-rule bg-ground p-4">
        <h2 className="text-body font-semibold text-ink">
          Reported {item.target_type} <span className="text-small font-normal text-ink-mute">{item.target_id}</span>
        </h2>
        <p className="text-small mt-1 text-ink-soft">
          Now {t?.status ?? 'unknown'} · space {t?.space_id ?? 'unknown'} · {t?.open_report_count ?? 0} open report(s) ·
          author shown as {t?.author?.display_name ?? 'pseudonymous'}
        </p>
        <p className="text-body mt-3 whitespace-pre-wrap text-ink">{t?.body ?? 'Body erased by the author.'}</p>
        {item.note && <p className="text-small mt-2 text-ink-mute">Reporter note: {item.note}</p>}
      </section>

      <section className="mt-5">
        <h2 className="text-body font-semibold text-ink">Actions</h2>
        <p className="text-small mt-1 text-ink-soft">
          Each action needs its own reason. The server records your account id, the action, the target, the reason and
          the time, and shows you that record when it is done.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {item.status === 'open' && (
            <ModActionForm op="dismiss" targetType="report" targetId={item.id} idem={crypto.randomUUID()} {...forms} />
          )}
          {(['hide', 'remove', 'restore'] as const).map((op) => (
            <ModActionForm key={op} op={op} targetType={item.target_type} targetId={item.target_id} idem={crypto.randomUUID()} {...forms} />
          ))}
          <ModActionForm op="reveal" targetType={item.target_type} targetId={item.target_id} idem={crypto.randomUUID()} {...forms} />
        </div>
        <p className="text-small mt-3 text-ink-mute">
          Restricting or suspending an account needs its account id, which only the audited identity reveal provides.
        </p>
      </section>
    </>
  )
}
