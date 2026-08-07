/**
 * Gate on /admin/*.
 *
 * The signup dashboard lists real email addresses. /privacy commits to not
 * sharing them, so this is not a "hard to guess URL" situation — it needs an
 * actual lock, applied before any data is fetched or rendered.
 *
 * HTTP Basic over TLS is deliberately chosen over a hand-rolled session: there
 * is no login form to phish, no cookie to steal, no session store to get wrong,
 * and the browser handles it. Vercel terminates TLS, so credentials are never
 * sent in the clear in production.
 *
 * IT FAILS CLOSED. If ADMIN_USER or ADMIN_PASSWORD is unset, every request is
 * denied rather than allowed. A missing environment variable must never be the
 * thing that publishes a contact list.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { LAUNCHED, openBeforeLaunch } from '@/content/launch'

// Everything except the build output and the two asset folders, because before
// launch this has a second job: sending the closed pages back to the waitlist.
// The /admin gate below is unchanged and runs regardless of launch state.
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}

/** Length-independent, constant-time-ish compare. Avoids leaking length by
 *  early return, which a naive === does. */
function safeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

function deny(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="WellaPath admin", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── The pre-launch gate ──────────────────────────────────────────────────
  // 307 and not 308. A permanent redirect is cached by the browser and by every
  // proxy in between, and would still be sending people away from /conditions
  // days after launch, with no way to reach the visitors holding the cache.
  // The whole point of this redirect is that it stops being true.
  if (!LAUNCHED && !openBeforeLaunch(pathname)) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin), 307)
  }

  // The lock below is only for /admin. Everything else is done here.
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  const user = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASSWORD

  if (!user || !password) {
    return deny('Admin access is not configured on this deployment.')
  }

  const header = req.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return deny('Authentication required.')

  let decoded = ''
  try {
    decoded = atob(header.slice(6))
  } catch {
    return deny('Authentication required.')
  }

  const i = decoded.indexOf(':')
  const givenUser = i === -1 ? decoded : decoded.slice(0, i)
  const givenPass = i === -1 ? '' : decoded.slice(i + 1)

  // Both compared every time — no short-circuit on the username.
  const ok = safeEqual(givenUser, user) && safeEqual(givenPass, password)
  if (!ok) return deny('Authentication required.')

  const res = NextResponse.next()
  // Personal data: never cached by a proxy, never indexed.
  res.headers.set('Cache-Control', 'no-store, max-age=0')
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}
