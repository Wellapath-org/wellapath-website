import { api } from '@/content/admin/auth/backend'
import { COOKIE, encodeJson } from '@/content/admin/auth/cookies'
import { formRoute, seeOther, sessionFor, signedOut, withQuery } from '@/content/admin/auth/handler'
import { FORBIDDEN, TOTP, TOTP_ENROL } from '@/content/admin/auth/paths'

export const dynamic = 'force-dynamic'

/**
 * Start TOTP enrolment (A7). The secret is not active until it is confirmed
 * with a code (A8). Until then the URI is held for ten minutes in an httpOnly
 * cookie scoped to the enrolment page, so the page can draw the QR code.
 */
export const POST = formRoute(async (ctx) => {
  const live = await sessionFor(ctx, TOTP_ENROL)
  if (!live.ok) return live.res
  const { s } = live

  const r = await api.totpEnrol(s.access)
  if (!r.ok) {
    if (r.error.status === 401) return signedOut(ctx.req, 'session_ended')
    if (r.error.reason === 'totp_already_enrolled') return seeOther(ctx.req, withQuery(TOTP, 'notice', 'enrolled'), s.ops)
    if (r.error.code === 'forbidden') return seeOther(ctx.req, FORBIDDEN, s.ops)
    return seeOther(ctx.req, withQuery(TOTP_ENROL, 'error', r.error.status === 429 ? 'rate_limited' : 'unavailable'), s.ops)
  }

  return seeOther(ctx.req, TOTP_ENROL, [
    ...s.ops,
    {
      name: COOKIE.enrol,
      value: encodeJson({ u: r.data.otpauth_uri, s: r.data.secret_base32, d: r.data.digits, p: r.data.period }),
      maxAge: 600,
    },
  ])
})
