import { api } from '@/content/admin/auth/backend'
import { COOKIE, del, encodeJson } from '@/content/admin/auth/cookies'
import { formRoute, seeOther, sessionFor, signedOut, withQuery } from '@/content/admin/auth/handler'
import { TOTP_ENROL } from '@/content/admin/auth/paths'
import { metaOp } from '@/content/admin/auth/session'

export const dynamic = 'force-dynamic'

/**
 * Confirm enrolment with a first code (A8). Confirmation is also this
 * session's step-up. The ten backup codes come back exactly once; they are
 * held for five minutes in a cookie scoped to the one page that shows them.
 * A wrong code counts toward the same five-failure limit as a step-up.
 */
export const POST = formRoute(async (ctx) => {
  const live = await sessionFor(ctx, TOTP_ENROL)
  if (!live.ok) return live.res
  const { s } = live

  const code = ctx.field('code').replace(/\s+/g, '')
  if (!/^[0-9]{6}$/.test(code)) return seeOther(ctx.req, withQuery(TOTP_ENROL, 'error', 'invalid_code'), s.ops)

  const r = await api.totpConfirm(s.access, code)
  if (!r.ok) {
    if (r.error.status === 401) return signedOut(ctx.req, 'totp_lockout')
    if (r.error.code === 'invalid_code') return seeOther(ctx.req, withQuery(TOTP_ENROL, 'error', 'invalid_code'), s.ops)
    if (r.error.status === 429) return seeOther(ctx.req, withQuery(TOTP_ENROL, 'error', 'locked'), s.ops)
    if (r.error.reason === 'not_enrolled') {
      return seeOther(ctx.req, withQuery(TOTP_ENROL, 'error', 'restart'), [...s.ops, del(COOKIE.enrol)])
    }
    return seeOther(ctx.req, withQuery(TOTP_ENROL, 'error', 'unavailable'), s.ops)
  }

  const now = Date.now()
  const su = Date.parse(r.data.step_up_expires_at)
  const meta = { ...s.meta, su: Number.isFinite(su) ? Math.min(su, s.meta.abs) : 0 }
  return seeOther(ctx.req, '/admin/totp/backup-codes', [
    ...s.ops,
    metaOp(meta, now),
    del(COOKIE.enrol),
    { name: COOKIE.backup, value: encodeJson({ c: r.data.backup_codes }), maxAge: 300 },
  ])
})
