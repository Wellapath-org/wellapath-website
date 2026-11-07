/**
 * Which lock is on /admin.
 *
 * `basic` is today's behaviour and the default: one shared HTTP Basic
 * credential, read-only pages, no moderation. Anything other than the exact
 * string `individual` is `basic`, so a typo or an unset variable can only ever
 * leave the deployment as it was. It can never switch the new path on.
 *
 * `individual` is per-person sign-in against the WellaPath Community auth
 * service (COMMUNITY_API_CONTRACT §3): email OTP, then a mandatory TOTP
 * step-up, for moderator and admin accounts only. It is the only mode in which
 * the moderation section exists, because the founder decision is that the
 * shared credential must never be used to moderate: every action has to be
 * attributable to one account.
 *
 * Edge-safe: read by middleware as well as by server components. Reads
 * `process.env.X` directly, never through a computed key, because that is the
 * form the edge runtime supplies at request time.
 */

export type AdminAuthMode = 'basic' | 'individual'

export function adminAuthMode(): AdminAuthMode {
  return (process.env.ADMIN_AUTH_MODE ?? '').trim() === 'individual' ? 'individual' : 'basic'
}

/**
 * During the transition the shared Basic credential can stay in front of the
 * individual sign-in as an outer gate. It then only decides who may see the
 * sign-in page; it grants nothing on its own.
 */
export function basicOuterGate(): boolean {
  return (process.env.ADMIN_BASIC_OUTER_GATE ?? '').trim() === 'true'
}

/**
 * The Community API origin (and optional path prefix), or null if it is unset
 * or unsafe. HTTPS is required except for a loopback address, which is what
 * the tests and a local backend use. Null fails closed: individual mode with no
 * backend signs nobody in.
 */
export function communityApiBase(): string | null {
  const raw = (process.env.COMMUNITY_API_BASE_URL ?? '').trim()
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) return null
  if (url.username || url.password || url.search || url.hash) return null
  return url.origin + url.pathname.replace(/\/+$/, '')
}
