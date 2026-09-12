/**
 * The default share card, used by every page that does not define its own.
 *
 * Next resolves `opengraph-image` up the route tree, so this one file covers
 * the home page, /how-it-works, /coverage, /about and the rest. Only
 * /conditions/[slug] overrides it, because a condition name is the thing worth
 * putting on the card when a specific guide is shared.
 */
import { OG_SIZE, OG_CONTENT_TYPE } from '@/components/og-size'
import { SITE } from '@/content/site'

export const alt = `${SITE.name} — ${SITE.tagline}`
// Explicit: the card reads its fonts from disk with node:fs, which the edge
// runtime cannot do.
export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// The renderer is pulled in here, inside the handler, rather than at the top of
// the file. Next evaluates this module to read the three constants above every
// time it resolves metadata for a route that is not prerendered, so anything
// imported at the top of this file is imported on those requests too. The bug
// that made this necessary was og-card's font read (see the note there); this
// import stays lazy so `next/og` and its WASM renderer are not loaded on a
// request that never draws an image.
export default async function Image() {
  const { ogCard } = await import('@/components/og-card')
  return ogCard({
    eyebrow: 'Clinical decision support · Nigeria',
    lead: SITE.tagline,
    rest: 'Built on Nigerian clinical guidance. Not on a guess.',
  })
}
