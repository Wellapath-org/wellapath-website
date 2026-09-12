/**
 * The card's dimensions and type, kept apart from the card itself.
 *
 * An `opengraph-image` route has to export `size` and `contentType` as module
 * constants, because Next reads them to build the `og:image` tags. Importing
 * them from `og-card.tsx` would drag `next/og` — and the WASM renderer it loads
 * at module scope — into every metadata resolution, which is what broke every
 * on-demand route. These two literals are all the metadata layer needs; the
 * renderer stays behind a dynamic import in the route's own body.
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'
