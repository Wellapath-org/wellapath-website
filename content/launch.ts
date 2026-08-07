/**
 * The launch switch.
 *
 * Until the app is out, wellapath.org is a waitlist and nothing else. The
 * marketing site is written, checked and deployed, but a visitor who lands on
 * it today reads about a product they cannot get, which is the problem this
 * solves: the front door explains what WellaPath is and asks for one way to
 * reach them.
 *
 * ── How it flips ───────────────────────────────────────────────────────────
 *
 * Set `LAUNCHED=true` in the Vercel project and redeploy. That is the whole
 * operation. `/` goes back to the real home page, the redirects stop, the nav
 * and footer come back, and the sitemap refills with all 62 URLs.
 *
 * Vercel only applies environment variables to deployments created after they
 * are added, so it is set-then-redeploy rather than set-and-wait. The value is
 * read at build rather than per request, deliberately: `/` stays prerendered
 * either way, and a launch is a deploy, not a runtime toggle.
 *
 * The default is false. A missing variable keeps the site closed rather than
 * opening it, which is the safe direction for this particular mistake.
 */
export const LAUNCHED = process.env.LAUNCHED === 'true'

/**
 * What still answers while the site is closed.
 *
 * `/privacy` is on this list for a reason that is not obvious: the capture form
 * links to it at the moment consent is given, and NDPR consent that points at a
 * page the visitor cannot open is not informed consent. `/notify/thanks` is
 * where the form lands, and `/api/notify` is where it posts. `/admin` stays
 * reachable so the signups it collects can be read, still behind HTTP Basic.
 *
 * Everything else redirects to the waitlist.
 */
const OPEN_PATHS = new Set([
  '/',
  '/notify/thanks',
  '/privacy',
  '/api/notify',
  '/robots.txt',
  '/sitemap.xml',
  '/icon.png',
  '/apple-icon.png',
  '/opengraph-image',
  '/favicon.ico',
])

/** Prefixes that stay open, including everything beneath them. */
const OPEN_PREFIXES = ['/admin', '/_next', '/brand', '/fonts']

export function openBeforeLaunch(pathname: string): boolean {
  if (OPEN_PATHS.has(pathname)) return true
  return OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
