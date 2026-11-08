import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'

import { AuthFrame, CsrfField, Field, Notice, TextInput, buttonClass, errorText } from '@/components/admin-auth'
import { COOKIE, decodeJson } from '@/content/admin/auth/cookies'
import { csrfToken, requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

type Search = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

type Pending = { u: string; s: string; d: number; p: number }

/**
 * TOTP enrolment for a moderator or admin who has none (A7/A8). Mandatory:
 * the panel is unreachable until it is done.
 */
export default async function EnrolPage({ searchParams }: { searchParams: Search }) {
  const viewer = await requireViewer(false)
  if (viewer.me.two_factor_enabled) redirect('/admin/totp?notice=enrolled')
  const q = await searchParams
  const error = errorText(one(q.error))
  const csrf = await csrfToken()

  const pending = decodeJson<Pending>((await cookies()).get(COOKIE.enrol)?.value)
  const uri = pending && typeof pending.u === 'string' && pending.u.startsWith('otpauth://totp/') ? pending.u : null
  // Generated on the server as SVG markup from a URI the backend returned; no
  // image request leaves the browser and no script runs.
  const qr = uri ? await QRCode.toString(uri, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 }) : null

  return (
    <AuthFrame title="Set up two-factor sign-in">
      <p className="text-body mt-2 text-ink-soft">
        Moderator and admin accounts must use an authenticator app (any TOTP app) before they can
        open the panel.
      </p>
      {error && <Notice tone="error">{error}</Notice>}

      {!uri || !qr ? (
        <form method="post" action="/admin/auth/totp/enrol">
          <CsrfField token={csrf} />
          <button type="submit" className={buttonClass}>
            Start enrolment
          </button>
        </form>
      ) : (
        <>
          <ol className="text-body mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
            <li>Scan this code with your authenticator app.</li>
            <li>Or add it by hand with the key below (TOTP, {pending!.d} digits, {pending!.p} seconds).</li>
            <li>Enter the code the app shows to finish.</li>
          </ol>
          <div
            className="mx-auto mt-4 w-full max-w-[220px] bg-white p-2"
            role="img"
            aria-label="QR code for your authenticator app"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="text-small mt-3 break-all text-ink-soft">
            Key: <code className="text-ink">{pending!.s}</code>
          </p>
          <details className="mt-2">
            <summary className="text-small cursor-pointer text-ink-soft">Show the otpauth URI</summary>
            <p className="text-small mt-1 break-all text-ink-mute">
              <code>{uri}</code>
            </p>
          </details>
          <form method="post" action="/admin/auth/totp/confirm">
            <CsrfField token={csrf} />
            <Field label="Code from the app">
              <TextInput name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" />
            </Field>
            <button type="submit" className={buttonClass}>
              Confirm and continue
            </button>
          </form>
        </>
      )}
    </AuthFrame>
  )
}
