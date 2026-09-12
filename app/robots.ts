import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'
import { LAUNCHED } from '@/content/launch'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin lists personal data. It is behind HTTP Basic auth as well;
    // this is belt and braces, not the lock itself.
    // Before launch the only page is the waitlist. Everything else 307s back
    // to it, so crawling it would produce a site of redirects and a poor first
    // impression in the index on the day we do open.
    rules: LAUNCHED
      ? { userAgent: '*', allow: '/', disallow: ['/admin/', '/notify/'] }
      : // Disallow: / already covers these two. They are named anyway, so the
        // rule that protects a page of personal data does not depend on a
        // blanket line that gets edited on launch day.
        { userAgent: '*', allow: '/$', disallow: ['/', '/admin/', '/notify/'] },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
