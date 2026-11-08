/**
 * The moderation actions /admin can take, and the rule every one shares: a
 * reason of 10–500 characters (contract §12, "every mutating request requires
 * reason"). The form enforces it in the browser with `required`, `minlength`
 * and `maxlength`; the route handler enforces it again before anything is
 * sent; the backend enforces it a third time. A reason is what makes an action
 * reviewable later, so it is never optional and never defaulted.
 *
 * The identity reveal is in this list because it is audited exactly like an
 * action (`reveal_identity`, D6), even though it changes nothing.
 */

export const REASON_MIN = 10
export const REASON_MAX = 500

export type ModTarget = 'post' | 'comment' | 'report' | 'account'

export type ModOp = {
  label: string
  /** What the button says, imperative. */
  verb: string
  targets: readonly ModTarget[]
  path: (target: ModTarget, id: string) => string
  /** restrict and suspend accept an optional expiry. */
  until?: boolean
  /** The admin role is needed when the target account is privileged (D10–D12);
   *  the backend decides, the UI only says so. */
  note?: string
}

const enc = encodeURIComponent

export const MOD_OPS = {
  dismiss: {
    label: 'Dismiss report',
    verb: 'Dismiss',
    targets: ['report'],
    path: (_t, id) => `/v1/community/mod/reports/${enc(id)}/dismiss`,
  },
  hide: {
    label: 'Hide content',
    verb: 'Hide',
    targets: ['post', 'comment'],
    path: (t, id) => `/v1/community/mod/${t}s/${enc(id)}/hide`,
  },
  remove: {
    label: 'Remove content',
    verb: 'Remove',
    targets: ['post', 'comment'],
    path: (t, id) => `/v1/community/mod/${t}s/${enc(id)}/remove`,
  },
  restore: {
    label: 'Restore content',
    verb: 'Restore',
    targets: ['post', 'comment'],
    path: (t, id) => `/v1/community/mod/${t}s/${enc(id)}/restore`,
  },
  restrict: {
    label: 'Restrict account (read-only)',
    verb: 'Restrict',
    targets: ['account'],
    path: (_t, id) => `/v1/community/mod/accounts/${enc(id)}/restrict`,
    until: true,
    note: 'A moderator or admin target needs the admin role.',
  },
  suspend: {
    label: 'Suspend account',
    verb: 'Suspend',
    targets: ['account'],
    path: (_t, id) => `/v1/community/mod/accounts/${enc(id)}/suspend`,
    until: true,
    note: 'Signs the account out everywhere. A moderator or admin target needs the admin role.',
  },
  reinstate: {
    label: 'Reinstate account',
    verb: 'Reinstate',
    targets: ['account'],
    path: (_t, id) => `/v1/community/mod/accounts/${enc(id)}/reinstate`,
  },
  reveal: {
    label: 'Reveal accountable identity',
    verb: 'Reveal identity',
    targets: ['post', 'comment'],
    path: (_t, _id) => '/v1/community/mod/identity/reveal',
    note: 'An audited read. The reason is recorded against your account.',
  },
} as const satisfies Record<string, ModOp>

export type ModOpName = keyof typeof MOD_OPS

export const isModOp = (v: unknown): v is ModOpName =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(MOD_OPS, v)

export type ReasonCheck = { ok: true; reason: string } | { ok: false; rule: 'required' | 'min_length' | 'max_length' }

export function validateReason(raw: unknown): ReasonCheck {
  const reason = typeof raw === 'string' ? raw.trim() : ''
  if (!reason) return { ok: false, rule: 'required' }
  if (reason.length < REASON_MIN) return { ok: false, rule: 'min_length' }
  if (reason.length > REASON_MAX) return { ok: false, rule: 'max_length' }
  return { ok: true, reason }
}

/** `until` from a datetime-local field (interpreted as UTC) to RFC 3339, or
 *  an error. Must be in the future and at most 365 days ahead (contract §1). */
export function parseUntil(raw: unknown, now: number = Date.now()): { ok: true; until?: string } | { ok: false } {
  if (raw === undefined || raw === null || raw === '') return { ok: true }
  if (typeof raw !== 'string') return { ok: false }
  const withZone = /[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw}Z`
  const t = Date.parse(withZone)
  if (!Number.isFinite(t) || t <= now || t > now + 365 * 24 * 3600 * 1000) return { ok: false }
  return { ok: true, until: new Date(t).toISOString() }
}

export function requestBody(op: ModOpName, target: ModTarget, id: string, reason: string, until?: string) {
  if (op === 'reveal') return { target_type: target, target_id: id, reason }
  return until ? { reason, until } : { reason }
}

/** Human labels for the server's action enum (§13). Unknown values show raw. */
export const ACTION_LABEL: Record<string, string> = {
  dismiss_report: 'Report dismissed',
  reveal_identity: 'Identity revealed',
  hide_content: 'Content hidden',
  restore_content: 'Content restored',
  remove_content: 'Content removed',
  restrict_account: 'Account restricted',
  suspend_account: 'Account suspended',
  reinstate_account: 'Account reinstated',
  change_role: 'Role changed',
  reset_totp: 'TOTP reset',
  verify_professional: 'Professional verified',
  revoke_professional: 'Professional revoked',
  withdraw_professional: 'Professional withdrawn',
  delete_account: 'Account deleted',
}
