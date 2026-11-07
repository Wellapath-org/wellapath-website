import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin'
import { ModActionForm, Notice, errorText } from '@/components/admin-auth'
import { safeId } from '@/content/admin/auth/backend'
import { csrfToken, requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account actions',
  robots: { index: false, follow: false, nocache: true },
}

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Restrict, suspend or reinstate one account (D10–D12). Reached from an
 *  identity reveal; shows the id and nothing else about the person. */
export default async function AccountActionsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  await requireViewer()
  const id = safeId((await params).id)
  if (!id) notFound()
  const error = errorText(one((await searchParams).error))
  const csrf = await csrfToken()
  const forms = { csrf, returnTo: `/admin/moderation/accounts/${id}` }
  return (
    <>
      <AdminHeader title="Account actions" summary={`Account ${id}. Every action needs a reason and is audited.`} />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(['restrict', 'suspend', 'reinstate'] as const).map((op) => (
          <ModActionForm key={op} op={op} targetType="account" targetId={id} idem={crypto.randomUUID()} {...forms} />
        ))}
      </div>
    </>
  )
}
