import { api, safeId, type AccountableIdentity, type ModerationAction } from '@/content/admin/auth/backend'
import { COOKIE, encodeJson } from '@/content/admin/auth/cookies'
import { formRoute, seeOther, sessionFor, signedOut, withQuery } from '@/content/admin/auth/handler'
import { MOD_OPS, isModOp, parseUntil, requestBody, validateReason, type ModTarget } from '@/content/admin/auth/moderation'
import { TOTP, TOTP_ENROL } from '@/content/admin/auth/paths'
import { hasStepUp, metaOp } from '@/content/admin/auth/session'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Only moderation pages may be returned to. */
function returnPath(raw: string): string {
  return /^\/admin\/moderation(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&%_.-]*)?$/.test(raw) ? raw : '/admin/moderation'
}

/**
 * Every moderation action, and the audited identity reveal, goes through here.
 *
 * Refused before the backend is called: a missing or short reason, an unknown
 * action, a target the action does not apply to, a malformed id, and a session
 * with no TOTP step-up. The backend then applies the same rules again, records
 * the `moderation_actions` row in the same transaction as the change, and
 * returns it. That row, not anything the website made up, is what the result
 * page shows.
 */
export const POST = formRoute(async (ctx) => {
  const back = returnPath(ctx.field('return_to'))
  const fail = (error: string, ops: Parameters<typeof seeOther>[2] = []) =>
    seeOther(ctx.req, withQuery(back, 'error', error), ops)

  const op = ctx.field('op')
  const target = ctx.field('target_type') as ModTarget
  const id = safeId(ctx.field('target_id'))
  if (!isModOp(op)) return fail('unknown_action')
  const def = MOD_OPS[op]
  if (!(def.targets as readonly string[]).includes(target) || !id) return fail('invalid_target')

  const reason = validateReason(ctx.field('reason'))
  if (!reason.ok) return fail(`reason_${reason.rule}`)

  let until: string | undefined
  if ('until' in def && def.until) {
    const u = parseUntil(ctx.field('until'))
    if (!u.ok) return fail('invalid_until')
    until = u.until
  }

  const live = await sessionFor(ctx, back)
  if (!live.ok) return live.res
  const { s } = live
  if (!hasStepUp(s.meta)) return seeOther(ctx.req, `${TOTP}?next=${encodeURIComponent(back)}`, s.ops)

  const idem = ctx.field('idem')
  const r = await api.post<ModerationAction | AccountableIdentity>(
    s.access,
    def.path(target, id),
    requestBody(op, target, id, reason.reason, until),
    op === 'reveal' || !UUID.test(idem) ? undefined : idem,
  )

  if (!r.ok) {
    const e = r.error
    if (e.status === 401) return signedOut(ctx.req, 'session_ended')
    if (e.code === 'mfa_step_up_required') {
      return seeOther(ctx.req, `${TOTP}?next=${encodeURIComponent(back)}`, [...s.ops, metaOp({ ...s.meta, su: 0 }, Date.now())])
    }
    if (e.code === 'mfa_enrollment_required') return seeOther(ctx.req, TOTP_ENROL, s.ops)
    if (e.code === 'validation_failed') return fail(`server_${e.field ?? 'validation'}`, s.ops)
    const detail = e.reason ? `${e.code}.${e.reason}` : e.code
    return fail(detail.replace(/[^a-z_.]/g, ''), s.ops)
  }

  return seeOther(ctx.req, '/admin/moderation/result', [
    ...s.ops,
    {
      name: COOKIE.flash,
      value: encodeJson({ op, target_type: target, target_id: id, back, data: r.data }),
      maxAge: 120,
    },
  ])
})
