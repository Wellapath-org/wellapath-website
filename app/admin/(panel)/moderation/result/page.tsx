import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { AdminHeader } from '@/components/admin'
import { AuditEntry, IdentityCard, Notice } from '@/components/admin-auth'
import type { AccountableIdentity, ModerationAction } from '@/content/admin/auth/backend'
import { COOKIE, decodeJson } from '@/content/admin/auth/cookies'
import { requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Action recorded',
  robots: { index: false, follow: false, nocache: true },
}

type Flash = { op?: string; target_type?: string; target_id?: string; back?: string; data?: unknown }

/**
 * What the server recorded for the action just taken. The row comes from the
 * backend's response (the `moderation_actions` row written in the same
 * transaction as the change), carried here for two minutes in an httpOnly
 * cookie scoped to /admin.
 */
export default async function ResultPage() {
  await requireViewer()
  const flash = decodeJson<Flash>((await cookies()).get(COOKIE.flash)?.value)
  const back = typeof flash?.back === 'string' && flash.back.startsWith('/admin/moderation') ? flash.back : '/admin/moderation'

  if (!flash || !flash.data || typeof flash.data !== 'object') {
    return (
      <>
        <AdminHeader title="Action recorded" summary="Nothing to show." />
        <Notice>The confirmation has expired. Every action is in the audit log.</Notice>
        <a href="/admin/moderation/audit" className="text-small mt-4 inline-block text-accent-ink underline">
          Open the audit log
        </a>
      </>
    )
  }

  if (flash.op === 'reveal') {
    const identity = flash.data as AccountableIdentity
    return (
      <>
        <AdminHeader
          title="Accountable identity"
          summary={`Revealed for ${flash.target_type} ${flash.target_id}. This reveal is audit entry ${identity.reveal_action_id}.`}
        />
        <div className="mt-5">
          <IdentityCard identity={identity} />
        </div>
        <p className="mt-4 flex flex-wrap gap-4">
          <a href={`/admin/moderation/accounts/${encodeURIComponent(identity.account_id)}`} className="text-small font-semibold text-accent-ink underline">
            Restrict, suspend or reinstate this account
          </a>
          <a href={`/admin/moderation/audit?target_id=${encodeURIComponent(flash.target_id ?? '')}`} className="text-small text-accent-ink underline">
            Audit log for this content
          </a>
          <a href={back} className="text-small text-accent-ink underline">Back</a>
        </p>
      </>
    )
  }

  const action = flash.data as ModerationAction
  return (
    <>
      <AdminHeader title="Action recorded" summary="The server recorded this entry in the moderation audit log." />
      <div className="mt-5">
        <AuditEntry action={action} />
      </div>
      <p className="mt-4 flex flex-wrap gap-4">
        <a href={`/admin/moderation/audit?target_id=${encodeURIComponent(action.target_id)}`} className="text-small text-accent-ink underline">
          Audit log for this target
        </a>
        <a href={back} className="text-small text-accent-ink underline">Back</a>
        <a href="/admin/moderation" className="text-small text-accent-ink underline">Reports queue</a>
      </p>
    </>
  )
}
