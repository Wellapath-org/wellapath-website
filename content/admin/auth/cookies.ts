/**
 * The cookies individual admin sign-in uses, and the one set of flags they all
 * share.
 *
 * Every one is httpOnly (no script on the page can read a token), Secure
 * (never sent over plain HTTP; browsers treat http://localhost as secure for
 * development), SameSite=Strict (never sent on a request that starts on
 * another site, which is the first CSRF defence) and scoped to /admin, so the
 * marketing site never carries them. The `__Secure-` prefix makes the browser
 * refuse any of them that arrives without the Secure flag.
 *
 * The backend tokens live here and only here. The access token is forwarded to
 * the backend by the Next server and is never rendered into a page or exposed
 * to client JavaScript.
 *
 * Edge-safe.
 */

export const COOKIE = {
  /** Backend access JWT (≤ 15 min). */
  access: '__Secure-wpa_at',
  /** Backend opaque refresh token, single use, rotated on every refresh. */
  refresh: '__Secure-wpa_rt',
  /** Local session clock: absolute and idle deadlines, step-up expiry. */
  meta: '__Secure-wpa_meta',
  /** Per-browser device id the backend binds the refresh family to. */
  device: '__Secure-wpa_dev',
  /** Double-submit CSRF token. */
  csrf: '__Secure-wpa_csrf',
  /** The email address between "send code" and "enter code", 5 minutes. */
  otp: '__Secure-wpa_otp',
  /** The result of the last moderation action, read once on the result page. */
  flash: '__Secure-wpa_flash',
  /** The pending TOTP enrolment (URI and secret) until it is confirmed. */
  enrol: '__Secure-wpa_enrol',
  /** Backup codes, shown once after enrolment. */
  backup: '__Secure-wpa_backup',
} as const

export type CookieName = (typeof COOKIE)[keyof typeof COOKIE]

export const COOKIE_FLAGS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/admin',
} as const

/** A cookie write. `maxAge: 0` deletes it. */
export type CookieOp = { name: CookieName; value: string; maxAge: number }

export const del = (name: CookieName): CookieOp => ({ name, value: '', maxAge: 0 })

/** Everything that belongs to a signed-in session. The device id and the CSRF
 *  token survive sign-out on purpose: neither grants anything. */
export function clearSessionOps(): CookieOp[] {
  return [COOKIE.access, COOKIE.refresh, COOKIE.meta, COOKIE.otp, COOKIE.flash, COOKIE.enrol, COOKIE.backup].map(
    del,
  )
}

type CookieSink = {
  cookies: {
    set: (
      name: string,
      value: string,
      opts: { httpOnly: boolean; secure: boolean; sameSite: 'strict'; path: string; maxAge: number },
    ) => unknown
  }
}

export function applyOps<T extends CookieSink>(res: T, ops: readonly CookieOp[]): T {
  for (const op of ops) {
    res.cookies.set(op.name, op.value, { ...COOKIE_FLAGS, maxAge: Math.max(0, Math.floor(op.maxAge)) })
  }
  return res
}

/* ── base64url JSON, for the small structured cookies ───────────────────── */

export function encodeJson(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeJson<T = unknown>(raw: string | undefined | null): T | null {
  if (!raw) return null
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}

/* ── the session clock ──────────────────────────────────────────────────── */

/**
 * Not a credential. It tells the website when to stop trying, so that it can
 * sign someone out at the idle or absolute limit with a clear message instead
 * of waiting for the backend to refuse. The backend enforces the same limits
 * independently (contract §3.2), so editing this cookie can only shorten a
 * session, never extend one, and the step-up shown here is re-proved against
 * the backend before any privileged page renders.
 */
export type SessionMeta = {
  v: 1
  /** Absolute end of the session, epoch ms. */
  abs: number
  /** Last request seen, epoch ms. */
  last: number
  /** Access token expiry, epoch ms. */
  at: number
  /** TOTP step-up expiry for this session, epoch ms, 0 if none. */
  su: number
}

export function decodeMeta(raw: string | undefined | null): SessionMeta | null {
  const m = decodeJson<Partial<SessionMeta>>(raw)
  if (!m || m.v !== 1) return null
  for (const k of ['abs', 'last', 'at', 'su'] as const) {
    if (typeof m[k] !== 'number' || !Number.isFinite(m[k])) return null
  }
  return m as SessionMeta
}

export const encodeMeta = (m: SessionMeta) => encodeJson(m)

/** 32 random bytes, base64url. */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  let bin = ''
  for (const b of buf) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
