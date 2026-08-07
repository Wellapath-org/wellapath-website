/**
 * The sitemap.
 *
 * ── Three decisions worth stating ──────────────────────────────────────────
 *
 * 1. EVERY indexable route is here. The four /for/* segment pages were missing
 *    before, which is four of the site's most commercially important pages
 *    left out of the one file whose entire job is to list them. The list is
 *    now built from the same constant the navigation reads, so a new segment
 *    cannot be added without appearing here.
 *
 * 2. `lastModified` is set only where a real date exists. Condition pages
 *    derive from the clinical artifacts, and those carry a release date, so
 *    that is the honest answer for them. Marketing pages have no such date at
 *    build time: file mtimes on a fresh CI checkout are all the moment of the
 *    checkout. This file used to send `new Date()` for everything, which told
 *    crawlers that all 58 pages changed on every deploy. A lastmod that is
 *    always "now" is worse than no lastmod, because it is a false claim rather
 *    than a gap, and it gets the whole file's dates discounted.
 *
 * 3. No `priority` or `changeFrequency`. Google has stated it ignores both.
 *    They were a column of numbers that nothing reads, implying the ordering
 *    meant something.
 */
import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'
import { LAUNCHED } from '@/content/launch'
import { getAllConditions } from '@/content/conditions'
import { SEGMENT_SLUGS } from '@/content/segments'
import stamp from '@/content/artifacts/stamp.json'

export const dynamic = 'force-static'

/** The newest release date across the clinical artifacts a condition page reads. */
function artifactsReleased(): Date | undefined {
  // Not every artifact carries a date: red-flag-display.json has release_date
  // null precisely because it is the unreviewed one.
  const dates = Object.values(
    stamp.artifacts as Record<string, { release_date?: string | null }>,
  )
    .map((a) => a.release_date)
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
  if (dates.length === 0) return undefined
  return new Date(Math.max(...dates.map((d) => d.getTime())))
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Before launch there is one page, and listing the other 61 would be asking
  // Google to crawl 61 redirects back to it. They return the moment LAUNCHED
  // is set, which is a redeploy, which is when the sitemap is rebuilt anyway.
  if (!LAUNCHED) return [{ url: SITE.url }]

  const marketing = [
    '',
    '/how-it-works',
    '/conditions',
    '/coverage',
    '/clinical-safety',
    '/partners',
    '/about',
    '/privacy',
    ...SEGMENT_SLUGS.map((s) => `/for/${s}`),
  ]

  const lastModified = artifactsReleased()

  return [
    ...marketing.map((r) => ({ url: `${SITE.url}${r}` })),
    // The 50 condition pages are the growth engine (§12).
    ...getAllConditions().map((c) => ({
      url: `${SITE.url}/conditions/${c.slug}`,
      ...(lastModified ? { lastModified } : {}),
    })),
  ]
}
