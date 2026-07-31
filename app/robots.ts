import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin lists personal data. It is behind HTTP Basic auth as well;
    // this is belt and braces, not the lock itself.
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/notify/'] },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
