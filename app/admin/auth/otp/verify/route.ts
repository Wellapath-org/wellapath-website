import { api, isPrivileged, normaliseRole } from '@/content/admin/auth/backend'
import { COOKIE, decodeJson, del, randomToken, type CookieOp } from '@/content/admin/auth/cookies'
import { formRoute, seeOther, withQuery } from '@/content/admin/auth/handler'
import { FORBIDDEN, TOTP, TOTP_ENROL, safeNext } from '@/content/admin/auth/paths'
import { tokenPairOps } from '@/content/admin/auth/session'

export const dynamic = 'force-dynamic'

const DEVICE_MAX_AGE = 60 * 60 * 24 * 400

/** A device id in the contract's shape (UUID), kept per browser. */
function deviceId(existing: string | undefined): { id: string; op?: CookieOp } {
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return { id: existing }
  const id = crypto.randomUUID()
  return { id, op: { name: COOKIE.device, value: id, maxAge: DEVICE_MAX_AGE } }
}

/**
 * Step two of sign-in: exchange the emailed code for a token pair (A2).
 *
 * Only moderator and admin accounts may hold an admin session. Any other
 * account is signed straight back out at the backend, gets no cookie, and is
 * shown the 403 page. Nobody reaches the panel from here: the next stop is
 * always TOTP, enrolment for a first sign-in and a step-up otherwise.
 */
export const POST = formRoute(async ({ req, field, cookie }) => {
  const next = safeNext(field('next'))
  const pending = decodeJson<{ e?: string }>(cookie(COOKIE.otp))
  const email = typeof pending?.e === 'string' ? pending.e : ''
  if (!email) return seeOther(req, withQuery('/admin/sign-in', 'error', 'code_expired'))

  const code = field('code').replace(/\s+/g, '')
  const codePage = next === '/admin' ? '/admin/sign-in/code' : `/admin/sign-in/code?next=${encodeURIComponent(next)}`
  if (!/^[0-9]{6}$/.test(code)) return seeOther(req, withQuery(codePage, 'error', 'invalid_code'))

  const device = deviceId(cookie(COOKIE.device))
  const r = await api.otpVerify(email, code, device.id)
  if (!r.ok) {
    if (r.error.code === 'invalid_code') return seeOther(req, withQuery(codePage, 'error', 'invalid_code'))
    if (r.error.code === 'account_suspended') {
      return seeOther(req, withQuery('/admin/sign-in', 'error', 'suspended'), [del(COOKIE.otp)])
    }
    if (r.error.status === 429) return seeOther(req, withQuery(codePage, 'error', 'rate_limited'))
    return seeOther(req, withQuery(codePage, 'error', 'unavailable'))
  }

  const account = r.data.account
  const ops: CookieOp[] = [del(COOKIE.otp)]
  if (device.op) ops.push(device.op)

  if (!isPrivileged(normaliseRole(account?.role)) || account?.status === 'suspended') {
    await api.logout(r.data.access_token, r.data.refresh_token).catch(() => undefined)
    return seeOther(req, FORBIDDEN, ops)
  }

  const now = Date.now()
  ops.push(...tokenPairOps(r.data, now).ops)
  // CSRF token rotates at sign-in, so a value seen before authentication is
  // not the one that guards the session.
  ops.push({ name: COOKIE.csrf, value: randomToken(), maxAge: 60 * 60 * 24 })

  const dest = account.two_factor_enabled
    ? next === '/admin'
      ? TOTP
      : `${TOTP}?next=${encodeURIComponent(next)}`
    : TOTP_ENROL
  return seeOther(req, dest, ops)
})
