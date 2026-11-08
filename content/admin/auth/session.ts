/**
 * Resuming a signed-in admin session from its cookies.
 *
 * One function, used by middleware for every page and by every route handler
 * for its own request, so that the idle and absolute limits and the refresh
 * rotation are decided in one place. Route handlers do their own resume
 * instead of relying on middleware so that a single response never carries
 * two competing writes of the same cookie.
 *
 * Limits are ADR-001 §8 (A2) for privileged accounts: 12 hours absolute from
 * sign-in, 1 hour idle. The backend enforces both independently; enforcing
 * them here as well means the website signs someone out at the limit with a
 * clear reason, and best-effort revokes the backend family too, rather than
 * leaving a session that the next request would find dead.
 *
 * Edge-safe.
 */
import { api, type TokenPair } from './backend'
import {
  COOKIE,
  clearSessionOps,
  decodeMeta,
  encodeMeta,
  type CookieOp,
  type SessionMeta,
} from './cookies'

export const PRIVILEGED_ABSOLUTE_MS = 12 * 60 * 60 * 1000
export const PRIVILEGED_IDLE_MS = 60 * 60 * 1000
/** Refresh this long before the access token expires, so a request never
 *  reaches the backend with a token that dies in flight. */
export const REFRESH_SKEW_MS = 60 * 1000

export type EndReason = 'idle' | 'expired' | 'session_ended' | 'unavailable'

export type SessionOutcome =
  | { kind: 'none'; ops: CookieOp[] }
  | { kind: 'ended'; reason: EndReason; ops: CookieOp[] }
  /** Another request rotated the refresh token first (contract §3.2, 409
   *  refresh_race). The browser already holds the winner's cookies, so the
   *  right move is to repeat the request, not to sign out. */
  | { kind: 'race' }
  | { kind: 'ok'; access: string; refresh: string; device: string; meta: SessionMeta; ops: CookieOp[] }

export type CookieReader = { get(name: string): string | undefined }

const parseTime = (s: string | undefined, fallback: number) => {
  const t = s ? Date.parse(s) : NaN
  return Number.isFinite(t) ? t : fallback
}

/**
 * Cookie writes for a fresh token pair. On sign-in there is no previous clock;
 * on refresh the absolute deadline can only move earlier, never later, and the
 * step-up carries over (it is bound to the backend session, which a refresh
 * keeps).
 */
export function tokenPairOps(pair: TokenPair, now: number, prev?: SessionMeta | null): {
  meta: SessionMeta
  ops: CookieOp[]
} {
  const at = parseTime(pair.access_token_expires_at, now + (pair.expires_in || 900) * 1000)
  const backendAbs = parseTime(pair.refresh_token_expires_at, now + PRIVILEGED_ABSOLUTE_MS)
  const abs = Math.min(backendAbs, prev ? prev.abs : now + PRIVILEGED_ABSOLUTE_MS)
  const meta: SessionMeta = { v: 1, abs, last: now, at, su: prev?.su ?? 0 }
  const absSeconds = Math.max(1, Math.ceil((abs - now) / 1000))
  return {
    meta,
    ops: [
      { name: COOKIE.access, value: pair.access_token, maxAge: Math.max(1, Math.ceil((at - now) / 1000)) },
      { name: COOKIE.refresh, value: pair.refresh_token, maxAge: absSeconds },
      { name: COOKIE.meta, value: encodeMeta(meta), maxAge: absSeconds },
    ],
  }
}

export function metaOp(meta: SessionMeta, now: number): CookieOp {
  return { name: COOKIE.meta, value: encodeMeta(meta), maxAge: Math.max(1, Math.ceil((meta.abs - now) / 1000)) }
}

async function endWith(
  reason: EndReason,
  access: string | undefined,
  refresh: string | undefined,
): Promise<SessionOutcome> {
  // Best effort: revoke the backend family so the session is dead there too.
  // The logout route accepts an expired-but-valid access token (§3.3 A4).
  if (access) await api.logout(access, refresh).catch(() => undefined)
  return { kind: 'ended', reason, ops: clearSessionOps() }
}

export async function resumeSession(
  cookies: CookieReader,
  now: number = Date.now(),
): Promise<SessionOutcome> {
  const refresh = cookies.get(COOKIE.refresh)
  const device = cookies.get(COOKIE.device)
  const meta = decodeMeta(cookies.get(COOKIE.meta))
  const access = cookies.get(COOKIE.access)

  if (!refresh || !device || !meta) {
    // A partial set is debris from an earlier session: clear it.
    const debris = Boolean(refresh || access || cookies.get(COOKIE.meta))
    return { kind: 'none', ops: debris ? clearSessionOps() : [] }
  }

  if (now >= meta.abs) return endWith('expired', access, refresh)
  if (now - meta.last >= PRIVILEGED_IDLE_MS) return endWith('idle', access, refresh)

  if (access && now < meta.at - REFRESH_SKEW_MS) {
    const next = { ...meta, last: now }
    return { kind: 'ok', access, refresh, device, meta: next, ops: [metaOp(next, now)] }
  }

  const r = await api.refresh(refresh, device)
  if (!r.ok) {
    if (r.error.status === 409 && r.error.reason === 'refresh_race') return { kind: 'race' }
    if (r.error.status === 401 || r.error.status === 403) {
      return { kind: 'ended', reason: r.error.reason === 'refresh_expired' ? 'expired' : 'session_ended', ops: clearSessionOps() }
    }
    // The backend is unreachable or failing. Do not sign anyone out over an
    // outage, and do not let them in either: the caller treats this as
    // ended-without-clearing.
    return { kind: 'ended', reason: 'unavailable', ops: [] }
  }

  const { meta: fresh, ops } = tokenPairOps(r.data, now, meta)
  return { kind: 'ok', access: r.data.access_token, refresh: r.data.refresh_token, device, meta: fresh, ops }
}

/** True while this session holds a TOTP step-up, as far as the website knows.
 *  The backend has the final word (403 mfa_step_up_required). */
export const hasStepUp = (meta: SessionMeta | null, now: number = Date.now()) =>
  Boolean(meta && meta.su > now)
