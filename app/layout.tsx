import type { Metadata } from 'next'
import { SITE } from '@/content/site'
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
  robots: { index: true, follow: true },
  other: { 'color-scheme': 'light' },
}

/** Organization schema, sitewide. §12. */
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Lagos State, Nigeria' },
    { '@type': 'AdministrativeArea', name: 'Kano State, Nigeria' },
    { '@type': 'AdministrativeArea', name: 'Federal Capital Territory, Nigeria' },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
      </body>
    </html>
  )
}
