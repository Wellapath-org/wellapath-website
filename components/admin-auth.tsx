/**
 * Presentation for individual admin sign-in and moderation.
 *
 * Server components, no client JavaScript, like the rest of the admin panel.
 * Every form is a plain HTML form posting to a route handler, carrying the
 * CSRF token as a hidden field. Validation the browser can do is declared on
 * the field (`required`, `minlength`, `pattern`) and repeated on the server.
 */
import type { InputHTMLAttributes, ReactNode } from 'react'

import { Wordmark } from '@/components/chrome'
import type { AccountableIdentity, ModerationAction, Role } from '@/content/admin/auth/backend'
import type { SessionMeta } from '@/content/admin/auth/cookies'
import { CSRF_FIELD } from '@/content/admin/auth/csrf'
import { ACTION_LABEL, MOD_OPS, REASON_MAX, REASON_MIN, type ModOpName, type ModTarget } from '@/content/admin/auth/moderation'
import { PRIVILEGED_IDLE_MS } from '@/content/admin/auth/session'

/* ── messages ───────────────────────────────────────────────────────────── */

export const SIGN_IN_REASON: Record<string, string> = {
  idle: 'You were signed out after an hour without activity.',
  expired: 'Your session reached its 12-hour limit. Sign in again.',
  session_ended: 'Your session has ended. Sign in again.',
  signed_out: 'You are signed out.',
  totp_lockout:
    'Too many wrong authenticator codes. You have been signed out, and step-up is locked for 15 minutes.',
  unavailable: 'The sign-in service is not reachable right now. Try again shortly.',
}

export const FORM_ERROR: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  rate_limited: 'Too many attempts. Wait a few minutes and try again.',
  unavailable: 'The sign-in service is not reachable right now. Try again shortly.',
  invalid_code: 'That code is not right, or it has expired.',
  code_expired: 'The code request expired. Enter your email again.',
  suspended: 'This account cannot sign in.',
  locked: 'Step-up is locked for 15 minutes after repeated wrong codes.',
  restart: 'The enrolment expired. Start it again.',
  retry: 'Another tab refreshed your session at the same moment. Try again.',
  reason_required: 'A reason is required.',
  reason_min_length: `The reason must be at least ${REASON_MIN} characters.`,
  reason_max_length: `The reason must be at most ${REASON_MAX} characters.`,
  server_reason: `The server rejected the reason. It must be ${REASON_MIN}–${REASON_MAX} characters.`,
  invalid_target: 'That action does not apply to this item.',
  invalid_until: 'The end date must be in the future and within a year.',
  unknown_action: 'Unknown action.',
  'invalid_state.already_in_state': 'Nothing changed: it is already in that state.',
  'invalid_state.not_hidden_or_removed': 'Only hidden or removed content can be restored.',
  'invalid_state.content_erased': 'This content was erased and cannot be restored.',
  'invalid_state.not_restricted_or_suspended': 'This account is not restricted or suspended.',
  self_action_forbidden: 'You cannot act on your own content or account.',
  forbidden: 'Your role does not allow this action. Acting on a moderator or admin needs the admin role.',
  not_found: 'That item no longer exists or is not available.',
  community_unavailable: 'The Community service is not reachable right now.',
}

export function errorText(code: string | undefined): string | null {
  if (!code) return null
  return FORM_ERROR[code] ?? 'Something went wrong. Nothing was changed.'
}

/* ── frame ──────────────────────────────────────────────────────────────── */

export function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sunk px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-[460px]">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="block w-[104px] text-ink">
            <Wordmark />
          </span>
          <span className="text-eyebrow font-semibold text-ink-mute uppercase">Admin</span>
        </div>
        <section className="rounded-md border border-rule bg-ground p-5 sm:p-6">
          <h1 className="text-h2 font-semibold text-ink">{title}</h1>
          {children}
        </section>
      </div>
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        'text-small mt-4 rounded-sm border px-3 py-2 ' +
        (tone === 'error' ? 'border-ink text-ink' : 'border-rule text-ink-soft')
      }
    >
      {children}
    </p>
  )
}

export const CsrfField = ({ token }: { token: string }) => <input type="hidden" name={CSRF_FIELD} value={token} />

const inputClass =
  'text-body mt-1 block w-full rounded-sm border border-rule bg-ground px-3 py-2 text-ink focus:border-accent-ink focus:outline-none'

export const buttonClass =
  'text-small mt-4 inline-flex min-h-11 items-center rounded-sm bg-ink px-4 font-semibold text-ground hover:opacity-90'

export const quietButtonClass =
  'text-small inline-flex min-h-9 items-center rounded-sm border border-rule px-3 text-ink-soft hover:text-ink'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="mt-4 block">
      <span className="text-small font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-small mt-1 block text-ink-mute">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />
}

/* ── the acting-as bar ──────────────────────────────────────────────────── */

const fmt = (ms: number) =>
  new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

/**
 * Who is acting, always visible: display name and account id, the role, and
 * when this session ends. The idle deadline is shown as a time and enforced
 * without JavaScript: the page reloads itself just after it, middleware finds
 * the session idle, revokes it and shows the sign-in page with the reason.
 */
export function ActingAs({
  displayName,
  accountId,
  role,
  meta,
  csrf,
  now,
}: {
  displayName: string | null
  accountId: string
  role: Role
  meta: SessionMeta | null
  csrf: string
  now: number
}) {
  const idleAt = meta ? meta.last + PRIVILEGED_IDLE_MS : null
  const endAt = meta ? Math.min(meta.abs, idleAt ?? meta.abs) : null
  const reloadIn = endAt ? Math.max(5, Math.ceil((endAt - now) / 1000) + 5) : null
  return (
    <div
      data-acting-as={accountId}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule bg-ground px-5 py-2.5 sm:px-6 lg:px-8"
    >
      {reloadIn && <meta httpEquiv="refresh" content={String(reloadIn)} />}
      <p className="text-small text-ink-soft">
        Acting as <strong className="font-semibold text-ink">{displayName ?? 'No display name'}</strong>{' '}
        <span className="text-ink-mute">· account {accountId} · {role}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {meta && idleAt && (
          <p className="text-small text-ink-mute">
            Idle sign-out <time dateTime={new Date(idleAt).toISOString()}>{fmt(idleAt)}</time> · session ends{' '}
            <time dateTime={new Date(meta.abs).toISOString()}>{fmt(meta.abs)}</time>
          </p>
        )}
        <form method="post" action="/admin/auth/sign-out">
          <CsrfField token={csrf} />
          <button type="submit" className={quietButtonClass}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── moderation ─────────────────────────────────────────────────────────── */

/**
 * One action, one form, one reason. The reason field is `required` with the
 * contract's length bounds, so the browser refuses an empty or short reason
 * before anything is sent; the route handler and the backend refuse it again.
 */
export function ModActionForm({
  op,
  targetType,
  targetId,
  csrf,
  returnTo,
  idem,
}: {
  op: ModOpName
  targetType: ModTarget
  targetId: string
  csrf: string
  returnTo: string
  idem: string
}) {
  const def = MOD_OPS[op]
  const fieldId = `reason-${op}-${targetId}`
  return (
    <form method="post" action="/admin/moderation/act" className="rounded-sm border border-rule p-3" data-op={op}>
      <CsrfField token={csrf} />
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="idem" value={idem} />
      <p className="text-small font-semibold text-ink">{def.label}</p>
      {'note' in def && def.note && <p className="text-small mt-0.5 text-ink-mute">{def.note}</p>}
      <label htmlFor={fieldId} className="text-small mt-2 block text-ink-soft">
        Reason (required, {REASON_MIN}–{REASON_MAX} characters, recorded in the audit log)
      </label>
      <textarea
        id={fieldId}
        name="reason"
        required
        minLength={REASON_MIN}
        maxLength={REASON_MAX}
        rows={2}
        className={inputClass}
      />
      {'until' in def && def.until && (
        <label className="text-small mt-2 block text-ink-soft">
          Until (optional, UTC)
          <input type="datetime-local" name="until" className={inputClass} />
        </label>
      )}
      <button type="submit" className={buttonClass.replace('mt-4', 'mt-2')}>
        {def.verb}
      </button>
    </form>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-t border-rule py-2 first:border-t-0">
      <dt className="text-small text-ink-mute">{label}</dt>
      <dd className="text-small break-words text-ink">{children}</dd>
    </div>
  )
}

/** The audit row exactly as the server recorded it. */
export function AuditEntry({ action }: { action: ModerationAction }) {
  return (
    <dl className="rounded-sm border border-rule bg-ground px-4 py-2" data-audit-id={action.id}>
      <Row label="Audit entry">{action.id}</Row>
      <Row label="Action">
        {ACTION_LABEL[action.action] ?? action.action} <span className="text-ink-mute">({action.action})</span>
      </Row>
      <Row label="Actor account">{action.actor_account_id}</Row>
      <Row label="Target">
        {action.target_type} {action.target_id}
      </Row>
      <Row label="Reason">{action.reason}</Row>
      <Row label="Recorded at">
        <time dateTime={action.created_at}>{action.created_at}</time>
      </Row>
      {action.target_status && <Row label="Target is now">{action.target_status}</Row>}
      {typeof action.sessions_revoked === 'number' && <Row label="Sessions revoked">{action.sessions_revoked}</Row>}
    </dl>
  )
}

export function IdentityCard({ identity }: { identity: AccountableIdentity }) {
  return (
    <dl className="rounded-sm border border-rule bg-ground px-4 py-2">
      <Row label="Account">{identity.account_id}</Row>
      <Row label="Display name">{identity.display_name ?? 'None set'}</Row>
      <Row label="Role">{identity.role}</Row>
      <Row label="Status">{identity.status}</Row>
      <Row label="Created">{identity.created_at}</Row>
      <Row label="Prior actions">{identity.prior_moderation_actions}</Row>
      <Row label="Audit entry">{identity.reveal_action_id}</Row>
    </dl>
  )
}
