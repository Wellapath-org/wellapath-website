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

/**
 * Applied to every /admin response, allowed and denied alike.
 *
 * Scoped to /admin on purpose. A site-wide content security policy is a real
 * project with a real chance of breaking the marketing pages, and this is not
 * that; these four are the ones that cost nothing here and matter on a page
 * showing personal data.
 */
function adminSecurityHeaders(headers: Headers) {
  // Personal data: never cached by a proxy, never indexed.
  headers.set('Cache-Control', 'no-store, max-age=0')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  // No framing at all. Both forms, because the CSP directive is the one modern
  // browsers honour and the header is what older ones understand.
  headers.set('Content-Security-Policy', "frame-ancestors 'none'")
  headers.set('X-Frame-Options', 'DENY')
  // An admin URL should not travel to another origin in a Referer header.
  headers.set('Referrer-Policy', 'no-referrer')
  // Nothing here needs a device. Turn the common ones off rather than rely on
  // never adding a feature that asks.
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  )
  return headers
}

function deny(message: string) {
  const res = new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="WellaPath admin", charset="UTF-8"',
    },
  })
  adminSecurityHeaders(res.headers)
  return res
}

/**
 * Every response carries the request path, so a server component can branch on
 * it without becoming a client component. Set from the request, never trusted
 * from it: whatever a caller sends under this name is overwritten here.
 */
function withPathname(req: NextRequest, pathname: string) {
  const forwarded = new Headers(req.headers)
  forwarded.set('x-pathname', pathname)
  return { request: { headers: forwarded } }
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
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next(withPathname(req, pathname))
  }

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

  // Both compared every time. Assigning each result before combining them is
  // what makes that true: `a() && b()` would skip the password comparison
  // whenever the username is wrong, and the difference is measurable.
  const userOk = safeEqual(givenUser, user)
  const passOk = safeEqual(givenPass, password)
  if (!(userOk && passOk)) return deny('Authentication required.')

  const res = NextResponse.next(withPathname(req, pathname))
  adminSecurityHeaders(res.headers)
  return res
}
