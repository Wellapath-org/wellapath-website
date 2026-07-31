import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'
import { getAllConditions } from '@/content/conditions'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/how-it-works', '/conditions', '/coverage', '/clinical-safety', '/privacy', '/partners', '/about']
  const now = new Date()

  return [
    ...routes.map((r) => ({
      url: `${SITE.url}${r}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: r === '' ? 1 : 0.8,
    })),
    // The 50 condition pages are the growth engine (§12).
    ...getAllConditions().map((c) => ({
      url: `${SITE.url}/conditions/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
