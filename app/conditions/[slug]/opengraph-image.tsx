/**
 * One share card per condition.
 *
 * A shared link to a condition guide is usually someone sending it to a person
 * who is worried right now. The card carries the condition name and its urgency
 * level, so the answer starts before the page has loaded, which on a slow
 * connection is the difference that matters.
 *
 * The urgency colour is the semantic triage token, not decoration. §2.2 forbids
 * using these for anything else, and this is exactly the thing they are for.
 */
import { OG_SIZE, OG_CONTENT_TYPE } from '@/components/og-size'
import { getAllConditions, getCondition } from '@/content/conditions'
import { URGENCY_COPY } from '@/content/urgency'

// Explicit: the card reads its fonts from disk with node:fs, which the edge
// runtime cannot do.
export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'How urgently to act, and where to go'

export function generateStaticParams() {
  return getAllConditions().map((c) => ({ slug: c.slug }))
}

const TRIAGE: Record<string, string> = {
  non_urgent: '#14764a',
  urgent: '#8a5a00',
  emergency: '#c0281f',
}

// Imported here rather than at the top of the file: see the note in
// app/opengraph-image.tsx. `next/og` must not be evaluated during metadata
// resolution. A slug outside generateStaticParams renders on demand, which is
// exactly the case that broke.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { ogCard } = await import('@/components/og-card')
  const { slug } = await params
  const c = getCondition(slug)
  if (!c) {
    return ogCard({ eyebrow: 'Condition guide', lead: 'Not found.' })
  }
  const u = URGENCY_COPY[c.urgency]
  return ogCard({
    eyebrow: 'Condition guide · Nigeria',
    lead: c.name,
    rest: u.headline,
    tag: { text: u.timeframe, color: TRIAGE[c.urgency] ?? '#100032' },
  })
}
