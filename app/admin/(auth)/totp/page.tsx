import { AuthFrame, CsrfField, Field, Notice, TextInput, buttonClass, errorText } from '@/components/admin-auth'
import { safeNext } from '@/content/admin/auth/paths'
import { csrfToken, requireViewer } from '@/content/admin/auth/viewer'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * The step-up. Required on every new session before any admin page or
 * moderation action, because privileged sessions expose accountable
 * identities (ADR-001 §8).
 */
export default async function TotpPage({ searchParams }: { searchParams: Search }) {
  const viewer = await requireViewer(false)
  if (!viewer.me.two_factor_enabled) redirect('/admin/totp/enrol')
  const q = await searchParams
  const error = errorText(one(q.error))
  const next = safeNext(one(q.next))
  const csrf = await csrfToken()

  return (
    <AuthFrame title="Confirm it is you">
      <p className="text-body mt-2 text-ink-soft">
        Enter the six-digit code from your authenticator app. After five wrong codes you are signed
        out and step-up is locked for 15 minutes.
      </p>
      {one(q.notice) === 'enrolled' && <Notice>This account already has an authenticator enrolled.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <form method="post" action="/admin/auth/totp/verify">
        <CsrfField token={csrf} />
        <input type="hidden" name="next" value={next} />
        <Field label="Authenticator code">
          <TextInput name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" />
        </Field>
        <button type="submit" className={buttonClass}>
          Verify
        </button>
      </form>
      <details className="mt-5">
        <summary className="text-small cursor-pointer text-ink-soft">Lost your authenticator? Use a backup code</summary>
        <form method="post" action="/admin/auth/totp/verify">
          <CsrfField token={csrf} />
          <input type="hidden" name="next" value={next} />
          <Field label="Backup code" hint="Each backup code works once. Then ask an admin to reset your TOTP and enrol again.">
            <TextInput name="backup_code" required minLength={8} maxLength={32} autoComplete="off" />
          </Field>
          <button type="submit" className={buttonClass}>
            Use backup code
          </button>
        </form>
      </details>
    </AuthFrame>
  )
}
