import type { Metadata } from 'next'
import { SITE } from '@/content/site'
import { siteGraph, jsonLd } from '@/content/schema'
import { SiteHeader, SiteFooter } from '@/components/chrome'
import { IconDefaults } from '@/components/icons'
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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IconDefaults>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </IconDefaults>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph()) }}
        />
      </body>
    </html>
  )
}
