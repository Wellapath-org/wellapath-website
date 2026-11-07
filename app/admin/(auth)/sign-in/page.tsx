import { AuthFrame, CsrfField, Field, Notice, SIGN_IN_REASON, TextInput, buttonClass, errorText } from '@/components/admin-auth'
import { communityApiBase } from '@/content/admin/auth/mode'
import { safeNext } from '@/content/admin/auth/paths'
import { assertIndividualMode, csrfToken } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function SignInPage({ searchParams }: { searchParams: Search }) {
  assertIndividualMode()
  const q = await searchParams
  const reason = one(q.reason)
  const error = errorText(one(q.error))
  const next = safeNext(one(q.next))
  const csrf = await csrfToken()
  const configured = communityApiBase() !== null

  return (
    <AuthFrame title="Sign in to WellaPath admin">
      <p className="text-body mt-2 text-ink-soft">
        For moderator and admin accounts. Each person signs in with their own account, and every
        moderation action is recorded against it.
      </p>
      {reason && SIGN_IN_REASON[reason] && <Notice>{SIGN_IN_REASON[reason]}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {!configured ? (
        <Notice tone="error">Individual sign-in is not configured on this deployment.</Notice>
      ) : (
        <form method="post" action="/admin/auth/otp/request">
          <CsrfField token={csrf} />
          <input type="hidden" name="next" value={next} />
          <Field label="Work email" hint="We email a six-digit code. It expires in 5 minutes.">
            <TextInput type="email" name="email" required maxLength={254} autoComplete="email" />
          </Field>
          <button type="submit" className={buttonClass}>
            Email me a code
          </button>
        </form>
      )}
    </AuthFrame>
  )
}
