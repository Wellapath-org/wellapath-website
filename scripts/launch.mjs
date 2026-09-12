/**
 * Launch state, for the check scripts.
 *
 * Mirrors content/launch.ts. It is a copy rather than an import because these
 * scripts are plain .mjs run by node against a built server, with no TypeScript
 * step and no bundler; the duplication is four lines and the alternative is a
 * build step for the checks.
 *
 * Why the checks need to know: before launch every route but the waitlist 307s
 * back to `/`, so a suite that walks the full route list would report a wall of
 * failures that only mean "the site is closed, as designed".
 *
 * The important part is that a green run says WHICH site it checked. A closed
 * run does not verify the 50 condition guides, and a report that quietly
 * shrinks from 17 routes to 3 while still printing a tick would be the kind of
 * false all-clear these scripts exist to prevent.
 */
export const LAUNCHED = process.env.LAUNCHED === 'true'

/** Kept in step with OPEN_PATHS in content/launch.ts. */
const OPEN = new Set(['/', '/privacy', '/support', '/notify/thanks'])

export function openNow(route) {
  if (LAUNCHED) return true
  return OPEN.has(route.split('?')[0])
}

/** Filter a route list down to whatever currently answers. */
export function reachable(routes) {
  return routes.filter(openNow)
}

/** Print the mode, so a tick is never read as more than it is. */
export function announce(routes, all) {
  if (LAUNCHED) return
  const skipped = all.length - routes.length
  console.log(
    `  Pre-launch: the site is closed, so ${skipped} of ${all.length} routes are not checked.\n` +
      `  For the full site: LAUNCHED=true npm run build && LAUNCHED=true npm run check\n`,
  )
}
