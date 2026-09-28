import 'server-only'
import { headers } from 'next/headers'

/**
 * A second assertion of the admin lock, inside the React tree.
 *
 * `middleware.ts` is the real gate and runs first. This exists because that
 * gate is a path-prefix test inside a matcher config, and a matcher config is
 * one careless edit away from not covering a route. If that ever happens, the
 * page should fail to render rather than quietly serve.
 *
 * It repeats the middleware's logic rather than trusting a header the
 * middleware set, because a header is exactly what an attacker would forge if
 * the middleware were bypassed.
 */

/** Length-independent compare with no early return. */
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

function decodeBasic(header: string): { user: string; pass: string } | null {
  if (!header.startsWith('Basic ')) return null
  let decoded: string
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  } catch {
    return null
  }
  const i = decoded.indexOf(':')
  return i === -1 ? { user: decoded, pass: '' } : { user: decoded.slice(0, i), pass: decoded.slice(i + 1) }
}

/**
 * Throws unless the request carries valid admin credentials.
 *
 * Throwing is the point: an unhandled error in a server component renders the
 * error boundary and no content, which is the correct outcome for a page that
 * cannot prove the viewer is allowed to see it.
 */
export async function assertAdmin(): Promise<void> {
  const user = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASSWORD

  // Fails closed, exactly as the middleware does.
  if (!user || !password) {
    throw new Error('Admin access is not configured on this deployment.')
  }

  const given = decodeBasic((await headers()).get('authorization') ?? '')
  if (!given) throw new Error('Admin authentication required.')

  // Both compared every time. Assigning first and combining after keeps the
  // password comparison from being skipped when the username is wrong.
  const userOk = safeEqual(given.user, user)
  const passOk = safeEqual(given.pass, password)
  if (!(userOk && passOk)) throw new Error('Admin authentication required.')
}
