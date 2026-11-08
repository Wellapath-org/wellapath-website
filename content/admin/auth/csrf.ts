/**
 * CSRF protection for every state-changing /admin route.
 *
 * Three layers, any one of which would stop a forged cross-site form:
 *
 *  1. Every admin cookie is SameSite=Strict, so a request that starts on
 *     another site arrives with no session at all.
 *  2. Fetch metadata and Origin: a browser marks a cross-site request with
 *     `Sec-Fetch-Site: cross-site` and an `Origin` that is not ours. Either is
 *     refused outright.
 *  3. A double-submit token: a random value in an httpOnly cookie, rendered
 *     by the server into each form as a hidden field, and compared in constant
 *     time. Another origin can neither read the cookie nor the page.
 *
 * Edge-safe.
 */
import { safeEqual } from './basic'

export const CSRF_FIELD = 'csrf'

function requestHost(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-host')
  const host = (fwd ? fwd.split(',')[0] : req.headers.get('host'))?.trim()
  return host ? host.toLowerCase() : null
}

export function sameOrigin(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false

  const origin = req.headers.get('origin')
  if (!origin) return true // older browsers and non-browser clients: the token decides
  if (origin === 'null') return false
  let host: string
  try {
    host = new URL(origin).host.toLowerCase()
  } catch {
    return false
  }
  return host === requestHost(req)
}

export function csrfValid(req: Request, cookieToken: string | undefined, formToken: unknown): boolean {
  if (!sameOrigin(req)) return false
  if (!cookieToken || typeof formToken !== 'string' || cookieToken.length < 32) return false
  return safeEqual(cookieToken, formToken)
}
