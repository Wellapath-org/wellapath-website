/**
 * Gate on /admin/*.
 *
 * The signup dashboard lists real email addresses. /privacy commits to not
 * sharing them, so this is not a "hard to guess URL" situation — it needs an
 * actual lock, applied before any data is fetched or rendered.
 *
 * TWO LOCKS, ONE AT A TIME, chosen by ADMIN_AUTH_MODE (content/admin/auth/mode.ts):
 *
 * `basic` (the default, and what production runs). HTTP Basic over TLS: no
 * login form to phish, no cookie to steal, no session store to get wrong, and
 * the browser handles it. Vercel terminates TLS, so credentials are never sent
 * in the clear in production. Behaviour is exactly what it was before
 * individual sign-in existed; the routes that belong to individual mode 404.
 *
 * `individual`. Per-person sign-in against the Community auth service, for
 * moderator and admin accounts only, with a mandatory TOTP step-up, so that
 * every moderation action is attributable to one account. The shared Basic
 * credential can stay in front of it as an outer gate during the transition
 * (ADMIN_BASIC_OUTER_GATE=true); it then grants nothing on its own.
 *
 * BOTH FAIL CLOSED. Basic with ADMIN_USER or ADMIN_PASSWORD unset denies every
 * request. Individual with no backend configured signs nobody in.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { LAUNCHED, openBeforeLaunch } from '@/content/launch'
import { adminAuthMode, basicOuterGate } from '@/content/admin/auth/mode'
import { checkBasic } from '@/content/admin/auth/basic'
import { api, isPrivileged, normaliseRole } from '@/content/admin/auth/backend'
import { COOKIE, applyOps, clearSessionOps, encodeMeta, randomToken, type CookieOp } from '@/content/admin/auth/cookies'
import { hasStepUp, resumeSession } from '@/content/admin/auth/session'
import {
  FORBIDDEN,
  SIGN_IN,
  TOTP,
  TOTP_ENROL,
  isHandler,
  isIndividualOnly,
  isPublicPage,
  isTotpPage,
} from '@/content/admin/auth/paths'

// Everything except the build output and the two asset folders, because before
// launch this has a second job: sending the closed pages back to the waitlist.
// The /admin gate below is unchanged and runs regardless of launch state.
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
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

/** Headers only middleware may set. Whatever a caller sends under these names
 *  is removed before the request reaches a page. */
const INTERNAL_HEADERS = ['x-pathname', 'x-wpa-access', 'x-wpa-meta', 'x-wpa-csrf'] as const

/**
 * Every response carries the request path, so a server component can branch on
 * it without becoming a client component. Set from the request, never trusted
 * from it: whatever a caller sends under this name is overwritten here.
 */
function withPathname(req: NextRequest, pathname: string, extra: Record<string, string> = {}) {
  const forwarded = new Headers(req.headers)
  for (const name of INTERNAL_HEADERS) forwarded.delete(name)
  forwarded.set('x-pathname', pathname)
  for (const [k, v] of Object.entries(extra)) forwarded.set(k, v)
  return { request: { headers: forwarded } }
}

/* ── individual mode ─────────────────────────────────────────────────────── */

function redirectTo(req: NextRequest, path: string, ops: readonly CookieOp[] = []) {
  const res = NextResponse.redirect(new URL(path, req.nextUrl.origin), 307)
  applyOps(res, ops)
  adminSecurityHeaders(res.headers)
  return res
}

function signInUrl(req: NextRequest, reason?: string) {
  const p = new URLSearchParams()
  if (reason) p.set('reason', reason)
  const here = req.nextUrl.pathname + req.nextUrl.search
  if (req.method === 'GET' && here !== '/admin') p.set('next', here)
  const q = p.toString()
  return q ? `${SIGN_IN}?${q}` : SIGN_IN
}

/** The CSRF cookie every form needs, created on the first page view. */
function ensureCsrf(req: NextRequest, ops: CookieOp[]): string {
  const existing = req.cookies.get(COOKIE.csrf)?.value
  if (existing && existing.length >= 32) return existing
  const token = randomToken()
  ops.push({ name: COOKIE.csrf, value: token, maxAge: 60 * 60 * 24 })
  return token
}

async function individual(req: NextRequest, pathname: string) {
  // Route handlers resume their own session and check CSRF themselves.
  if (isHandler(pathname)) {
    const res = NextResponse.next(withPathname(req, pathname))
    adminSecurityHeaders(res.headers)
    return res
  }

  const ops: CookieOp[] = []
  const csrf = ensureCsrf(req, ops)

  if (isPublicPage(pathname)) {
    const res = NextResponse.next(withPathname(req, pathname, { 'x-wpa-csrf': csrf }))
    applyOps(res, ops)
    adminSecurityHeaders(res.headers)
    return res
  }

  const now = Date.now()
  const session = await resumeSession({ get: (n) => req.cookies.get(n)?.value }, now)

  if (session.kind === 'race') {
    // Repeat the request; the browser now holds the cookies the winner set.
    return redirectTo(req, req.nextUrl.pathname + req.nextUrl.search)
  }
  if (session.kind === 'none') return redirectTo(req, signInUrl(req), session.ops)
  if (session.kind === 'ended') return redirectTo(req, signInUrl(req, session.reason), session.ops)

  ops.push(...session.ops)

  // Who is this? Asked of the backend on every page, so a revoked session, a
  // suspension or a demotion takes effect on the next click.
  const me = await api.me(session.access)
  if (!me.ok) {
    if (me.error.status === 401) return redirectTo(req, signInUrl(req, 'session_ended'), clearSessionOps())
    return redirectTo(req, signInUrl(req, 'unavailable'), ops)
  }
  if (me.data.status === 'suspended') {
    await api.logout(session.access, session.refresh).catch(() => undefined)
    return redirectTo(req, signInUrl(req, 'session_ended'), clearSessionOps())
  }
  // Not a moderator or admin: the 403 page (app/admin/forbidden/route.ts).
  if (!isPrivileged(normaliseRole(me.data.role))) return redirectTo(req, FORBIDDEN, ops)

  // TOTP is mandatory before anything else in the panel: enrol first, then a
  // step-up on this session. The panel layout re-proves the step-up against
  // the backend; this is the fast path that sends people to the right page.
  if (!isTotpPage(pathname)) {
    if (!me.data.two_factor_enabled) return redirectTo(req, TOTP_ENROL, ops)
    if (!hasStepUp(session.meta, now)) {
      const here = pathname + req.nextUrl.search
      const next = req.method === 'GET' && here !== '/admin' ? `?next=${encodeURIComponent(here)}` : ''
      return redirectTo(req, `${TOTP}${next}`, ops)
    }
  }

  const res = NextResponse.next(
    withPathname(req, pathname, {
      'x-wpa-access': session.access,
      'x-wpa-meta': encodeMeta(session.meta),
      'x-wpa-csrf': csrf,
    }),
  )
  applyOps(res, ops)
  adminSecurityHeaders(res.headers)
  return res
}

/* ── the gate ────────────────────────────────────────────────────────────── */

export async function middleware(req: NextRequest) {
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

  const mode = adminAuthMode()

  if (mode === 'basic' || basicOuterGate()) {
    const basic = checkBasic(req.headers.get('authorization'))
    if (!basic.ok) return deny(basic.message)
  }

  if (mode === 'individual') return individual(req, pathname)

  // Basic mode. The individual-mode routes do not exist here: they get the
  // same not-found page any unknown /admin path gets.
  if (isIndividualOnly(pathname)) {
    const res = NextResponse.rewrite(new URL('/admin/__not-found__', req.nextUrl.origin), withPathname(req, pathname))
    adminSecurityHeaders(res.headers)
    return res
  }

  const res = NextResponse.next(withPathname(req, pathname))
  adminSecurityHeaders(res.headers)
  return res
}
