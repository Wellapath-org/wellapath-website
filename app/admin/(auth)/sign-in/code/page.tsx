import { AuthFrame, CsrfField, Field, Notice, TextInput, buttonClass, errorText } from '@/components/admin-auth'
import { safeNext } from '@/content/admin/auth/paths'
import { assertIndividualMode, csrfToken } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function SignInCodePage({ searchParams }: { searchParams: Search }) {
  assertIndividualMode()
  const q = await searchParams
  const error = errorText(one(q.error))
  const next = safeNext(one(q.next))
  const csrf = await csrfToken()

  return (
    <AuthFrame title="Enter the code">
      <p className="text-body mt-2 text-ink-soft">
        If the address belongs to an account that can sign in, a six-digit code is on its way.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      <form method="post" action="/admin/auth/otp/verify">
        <CsrfField token={csrf} />
        <input type="hidden" name="next" value={next} />
        <Field label="Six-digit code">
          <TextInput
            name="code"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            autoComplete="one-time-code"
          />
        </Field>
        <button type="submit" className={buttonClass}>
          Sign in
        </button>
      </form>
      <p className="text-small mt-4">
        <a href="/admin/sign-in" className="text-accent-ink underline">
          Use a different email, or send a new code
        </a>
      </p>
    </AuthFrame>
  )
}
