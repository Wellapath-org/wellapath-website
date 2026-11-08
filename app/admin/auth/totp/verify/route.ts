import { api } from '@/content/admin/auth/backend'
import { formRoute, seeOther, sessionFor, signedOut, withQuery } from '@/content/admin/auth/handler'
import { TOTP, TOTP_ENROL, safeNext } from '@/content/admin/auth/paths'
import { metaOp } from '@/content/admin/auth/session'

export const dynamic = 'force-dynamic'

/**
 * The TOTP step-up (A9), with a code from the authenticator or one backup
 * code. Five consecutive failures on the account make the backend revoke this
 * session and lock step-ups for 15 minutes (ADR-001 §8); the 401 that carries
 * that is turned into a full sign-out here, cookies and all.
 */
export const POST = formRoute(async (ctx) => {
  const next = safeNext(ctx.field('next'))
  const page = next === '/admin' ? TOTP : `${TOTP}?next=${encodeURIComponent(next)}`
  const live = await sessionFor(ctx, page)
  if (!live.ok) return live.res
  const { s } = live

  const code = ctx.field('code').replace(/\s+/g, '')
  const backup = ctx.field('backup_code').trim()
  let body: { code: string } | { backup_code: string }
  if (backup) {
    if (backup.length < 8 || backup.length > 32) return seeOther(ctx.req, withQuery(page, 'error', 'invalid_code'), s.ops)
    body = { backup_code: backup }
  } else {
    if (!/^[0-9]{6}$/.test(code)) return seeOther(ctx.req, withQuery(page, 'error', 'invalid_code'), s.ops)
    body = { code }
  }

  const r = await api.totpVerify(s.access, body)
  if (!r.ok) {
    if (r.error.status === 401) return signedOut(ctx.req, 'totp_lockout')
    if (r.error.code === 'invalid_code') return seeOther(ctx.req, withQuery(page, 'error', 'invalid_code'), s.ops)
    if (r.error.code === 'mfa_enrollment_required') return seeOther(ctx.req, TOTP_ENROL, s.ops)
    if (r.error.status === 429) {
      return seeOther(ctx.req, withQuery(page, 'error', 'locked'), s.ops)
    }
    return seeOther(ctx.req, withQuery(page, 'error', 'unavailable'), s.ops)
  }

  const now = Date.now()
  const su = Date.parse(r.data.step_up_expires_at)
  const meta = { ...s.meta, su: Number.isFinite(su) ? Math.min(su, s.meta.abs) : 0 }
  return seeOther(ctx.req, next, [...s.ops, metaOp(meta, now)])
})
