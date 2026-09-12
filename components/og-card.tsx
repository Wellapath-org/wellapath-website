/**
 * The share card.
 *
 * One layout, used by every `opengraph-image` route. Cards are what the site
 * looks like in a WhatsApp forward, and in this market that is a larger share
 * of the traffic than the search result is, so the card is treated as a real
 * surface rather than a fallback.
 *
 * ── Notes that are not obvious from the code ───────────────────────────────
 *
 * 1. FONTS ARE STATIC TTF INSTANCES, in assets/og/, not the woff2 the site
 *    ships. Satori (which renders these) cannot read woff2 and cannot read a
 *    variable font, so `assets/og/*.ttf` are wght-400 and wght-700 instances
 *    cut from public/fonts/inter-latin-var.woff2. If the brand font ever
 *    changes, re-cut them; the recipe is in docs/DESIGN.md.
 *
 *    They live outside public/ deliberately. They are needed at build time and
 *    never by a browser, and serving a second copy of Inter would be 130 KB of
 *    dead weight on a phone.
 *
 * 2. NO IMAGE IS EMBEDDED. The wordmark is set as live text rather than
 *    pulled in as a PNG: Satori would need it inlined as a data URI, which
 *    adds 12 KB to every one of the 51 cards for a logo that is a word.
 *
 * 3. Every card carries the disclaimer line. A card is the one piece of this
 *    site that travels without its page, so the "not a diagnosis" framing has
 *    to travel with it. §11 would be satisfied by the page alone; this is the
 *    stricter reading, and the right one.
 */
import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { OG_SIZE, OG_CONTENT_TYPE } from './og-size'

export { OG_SIZE, OG_CONTENT_TYPE }

/* Read on the first card drawn — NOT while this module is imported.

   These two lines were `readFileSync` at module scope, and that shipped a bug
   that only ever appeared in production. Next resolves the `opengraph-image`
   convention by evaluating its module to read `alt`/`size`/`contentType`, and
   for a route rendered on demand it does that per request rather than at build.
   The read therefore ran inside metadata resolution — and on Vercel it threw,
   because `join(process.cwd(), ...)` is not a path the file tracer can follow,
   so assets/og/*.ttf is in no function's bundle. Locally the files are always
   on disk, so it never reproduced; the fonts were only ever really present at
   build time, which is exactly when the cards are drawn.

   A throw there is swallowed into the metadata boundary: an empty <head>, then
   "Application error: a client-side exception has occurred" on hydration. It
   hit /conditions and /notify/thanks and nothing else, those being the only two
   routes not prerendered — which made it look like a form bug, since the form
   is how anyone reaches /notify/thanks.

   Keeping the read inside the call makes importing this module free, which is
   all the convention actually asks for. Still read once per process, so the 51
   cards drawn during a build pay for the fonts once, exactly as before. */
const fontDir = join(process.cwd(), 'assets', 'og')

let fonts: { name: 'Inter'; data: Buffer; weight: 400 | 700; style: 'normal' }[] | null = null

function getFonts() {
  if (!fonts) {
    fonts = [
      {
        name: 'Inter',
        data: readFileSync(join(fontDir, 'Inter-Regular.ttf')),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: readFileSync(join(fontDir, 'Inter-Bold.ttf')),
        weight: 700,
        style: 'normal',
      },
    ]
  }
  return fonts
}

/* The tokens from globals.css, repeated as literals because Satori resolves no
   custom properties. Keep them in step with @theme by hand. */
const INK = '#100032'
const INK_SOFT = '#565175'
const INK_MUTE = '#6f6a8a'
const ACCENT = '#6f17ff'
const RULE = '#e7e4f0'

export type OgCard = {
  /** Small mono line at the top. */
  eyebrow: string
  /** The bold half of the two-tone heading. */
  lead: string
  /** The muted half. Keep it to two lines. */
  rest?: string
  /** Optional pill, used for urgency on condition cards. */
  tag?: { text: string; color: string }
}

export function ogCard({ eyebrow, lead, rest, tag }: OgCard) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#ffffff',
          fontFamily: 'Inter',
          padding: '64px 72px',
          justifyContent: 'space-between',
        }}
      >
        {/* The violet edge is the whole brand signature at card size. A logo
            would be smaller than this bar and read as less. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            background: ACCENT,
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 24, letterSpacing: '0.09em', color: INK_MUTE }}>
            {eyebrow.toUpperCase()}
          </span>
          {tag && (
            <span
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: tag.color,
                border: `2px solid ${tag.color}`,
                borderRadius: 8,
                padding: '4px 14px',
              }}
            >
              {tag.text.toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: lead.length > 34 ? 68 : 82,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.03em',
              lineHeight: 1.04,
            }}
          >
            {lead}
          </div>
          {rest && (
            <div
              style={{
                fontSize: 36,
                color: INK_SOFT,
                marginTop: 22,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}
            >
              {rest}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${RULE}`,
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 700, color: INK }}>wellapath.org</span>
          <span style={{ fontSize: 22, color: INK_MUTE }}>
            A symptom assessment, not a diagnosis
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: getFonts() },
  )
}
