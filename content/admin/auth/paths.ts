/**
 * The /admin routes that exist only in individual mode, and how middleware
 * treats each kind. Edge-safe.
 */

export const SIGN_IN = '/admin/sign-in'
export const TOTP = '/admin/totp'
export const TOTP_ENROL = '/admin/totp/enrol'
export const FORBIDDEN = '/admin/forbidden'

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`)

/** Never served in basic mode: they 404 there exactly as they do on main. */
export const INDIVIDUAL_ONLY_PREFIXES = [
  '/admin/sign-in',
  '/admin/auth',
  '/admin/totp',
  '/admin/forbidden',
  '/admin/moderation',
] as const

export const isIndividualOnly = (p: string) => INDIVIDUAL_ONLY_PREFIXES.some((x) => under(p, x))

/** Pages anyone may load (after the optional outer gate). */
export const isPublicPage = (p: string) => under(p, SIGN_IN)

/** Route handlers. The POST ones resume their own session and check CSRF;
 *  the 403 page needs no session. Middleware only applies the outer gate. */
export const isHandler = (p: string) => under(p, '/admin/auth') || p === '/admin/moderation/act' || p === FORBIDDEN

/** Pages for a signed-in privileged account that has not stepped up yet. */
export const isTotpPage = (p: string) => under(p, TOTP)

/** Only same-site /admin paths are accepted as a post-sign-in destination. */
export function safeNext(raw: unknown): string {
  if (typeof raw !== 'string') return '/admin'
  if (!raw.startsWith('/admin') || raw.startsWith('//') || raw.includes('\\')) return '/admin'
  if (isPublicPage(raw.split('?')[0]) || isHandler(raw.split('?')[0])) return '/admin'
  return raw
}
