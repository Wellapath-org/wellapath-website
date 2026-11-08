/**
 * The shared HTTP Basic check, as middleware has always done it.
 *
 * Moved here unchanged so that the middleware can apply it in two places: as
 * the whole lock in `basic` mode, and as the optional outer gate in
 * `individual` mode. Edge-safe (atob, no Buffer).
 *
 * IT FAILS CLOSED. If ADMIN_USER or ADMIN_PASSWORD is unset, every request is
 * denied rather than allowed.
 */

/** Length-independent, constant-time-ish compare. Avoids leaking length by
 *  early return, which a naive === does. */
export function safeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

export type BasicOutcome =
  | { ok: true }
  | { ok: false; message: 'Admin access is not configured on this deployment.' | 'Authentication required.' }

export function checkBasic(authorization: string | null): BasicOutcome {
  const user = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASSWORD

  if (!user || !password) {
    return { ok: false, message: 'Admin access is not configured on this deployment.' }
  }

  const header = authorization ?? ''
  if (!header.startsWith('Basic ')) return { ok: false, message: 'Authentication required.' }

  let decoded = ''
  try {
    decoded = atob(header.slice(6))
  } catch {
    return { ok: false, message: 'Authentication required.' }
  }

  const i = decoded.indexOf(':')
  const givenUser = i === -1 ? decoded : decoded.slice(0, i)
  const givenPass = i === -1 ? '' : decoded.slice(i + 1)

  // Both compared every time. Assigning each result before combining them is
  // what makes that true: `a() && b()` would skip the password comparison
  // whenever the username is wrong, and the difference is measurable.
  const userOk = safeEqual(givenUser, user)
  const passOk = safeEqual(givenPass, password)
  if (!(userOk && passOk)) return { ok: false, message: 'Authentication required.' }
  return { ok: true }
}
