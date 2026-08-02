/**
 * The default share card, used by every page that does not define its own.
 *
 * Next resolves `opengraph-image` up the route tree, so this one file covers
 * the home page, /how-it-works, /coverage, /about and the rest. Only
 * /conditions/[slug] overrides it, because a condition name is the thing worth
 * putting on the card when a specific guide is shared.
 */
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/components/og-card'
import { SITE } from '@/content/site'

export const alt = `${SITE.name} — ${SITE.tagline}`
// Explicit: the card reads its fonts from disk with node:fs, which the edge
// runtime cannot do. These render at build time, so this costs nothing at run.
export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    eyebrow: 'Clinical decision support · Nigeria',
    lead: SITE.tagline,
    rest: 'Built on Nigerian clinical guidance. Not on a guess.',
  })
}
