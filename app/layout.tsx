import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { SITE } from '@/content/site'
import { siteGraph, jsonLd } from '@/content/schema'
import { SiteHeader, SiteFooter } from '@/components/chrome'
import { IconDefaults } from '@/components/icons'
import { Analytics } from '@/components/analytics'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'en_NG',
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  alternates: { canonical: '/' },
  // summary_large_image, not summary: there is a 1200x630 card now
  // (app/opengraph-image.tsx), and `summary` would crop it to a thumbnail.
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let Google use a full-size image and an unrestricted snippet. The
      // defaults cap both, and on a condition page the snippet IS the answer.
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: { 'color-scheme': 'light' },
}


/**
 * The admin panel is an operational tool, not a page of the website. It gets
 * the same document shell (fonts, tokens, structured data) and none of the
 * marketing chrome: a waitlist header and an emergency card above an
 * operations dashboard cost a third of the first viewport and belong to a
 * different audience entirely.
 *
 * Branching here rather than restructuring into route groups keeps every URL
 * exactly where it is, which matters because /admin/signups is already in use.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = ((await headers()).get('x-pathname') ?? '').startsWith('/admin')

  return (
    <html lang="en-NG">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IconDefaults>
          {!isAdmin && <SiteHeader />}
          <main id="main">{children}</main>
          {!isAdmin && <SiteFooter />}
          {/* Opt-in, renders nothing under /conditions, and nothing here. */}
          {!isAdmin && <Analytics />}
        </IconDefaults>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph()) }}
        />
      </body>
    </html>
  )
}
