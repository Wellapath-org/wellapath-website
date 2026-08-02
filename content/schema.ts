/**
 * Structured data.
 *
 * One module so the entity identifiers stay consistent. Search engines join
 * these up by `@id`, and the join only works if every page names the
 * organisation the same way, which is exactly the thing that drifts when each
 * page hand-rolls its own block.
 *
 * ── What is deliberately NOT here ──────────────────────────────────────────
 *
 * `reviewedBy` and `lastReviewed` on MedicalWebPage. They are the two fields a
 * health site most wants, and both are claims about clinical sign-off. 36 of
 * the 48 danger-sign labels are still unreviewed (content/red-flag-labels.ts),
 * so asserting a reviewer would be a lie told in a machine-readable format, to
 * the one audience that indexes it. Add them the day a named clinician signs
 * off, and not before. The build gate that blocks unreviewed labels is the
 * same rule; this is that rule applied to metadata.
 *
 * `FAQPage`. Google restricted FAQ rich results in 2023 to well-known,
 * authoritative government and health sites. Marking up FAQs here would render
 * nothing and would be reaching for authority the site has not earned yet.
 *
 * `sameAs` and `contactPoint` on Organization. There is no social account or
 * published contact address in this repo to point at. Both are worth adding
 * once they exist; neither is worth inventing.
 */
import { SITE } from './site'
import type { Condition } from './conditions'
import { URGENCY_COPY } from './urgency'

/** Stable identifiers, so every page describes one organisation, not several. */
export const ORG_ID = `${SITE.url}/#organization`
export const SITE_ID = `${SITE.url}/#website`

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/brand/wordmark.png`,
      caption: SITE.name,
    },
    // Three states, named. §3 forbids "across Nigeria", and that applies to the
    // machine-readable copy as much as to the visible copy.
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Lagos State, Nigeria' },
      { '@type': 'AdministrativeArea', name: 'Kano State, Nigeria' },
      { '@type': 'AdministrativeArea', name: 'Federal Capital Territory, Nigeria' },
    ],
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en-NG',
    publisher: { '@id': ORG_ID },
    // No SearchAction: the site has no search endpoint, and declaring one that
    // 404s is worse than declaring nothing.
  }
}

/** The sitewide graph, emitted once from the root layout. */
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema(), websiteSchema()],
  }
}

/**
 * Breadcrumbs. These genuinely do render in Google results, replacing the raw
 * URL under the title, so they are worth the bytes on any page more than one
 * level deep.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE.url}${t.path}`,
    })),
  }
}

export function conditionSchema(c: Condition) {
  const url = `${SITE.url}/conditions/${c.slug}`
  const copy = URGENCY_COPY[c.urgency]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `${url}#page`,
        name: `${c.name}: symptoms and how urgently to act`,
        url,
        inLanguage: 'en-NG',
        isPartOf: { '@id': SITE_ID },
        publisher: { '@id': ORG_ID },
        // What the page is FOR, in schema.org's own vocabulary. The site does
        // not diagnose, so the aspects claimed are symptoms and prognosis
        // (how urgent), never diagnosis or treatment.
        mainContentOfPage: { '@type': 'WebPageElement', cssSelector: '#main' },
        significantLink: `${SITE.url}/clinical-safety`,
        about: { '@id': `${url}#condition` },
      },
      {
        '@type': 'MedicalCondition',
        '@id': `${url}#condition`,
        name: c.name,
        // "body hot", "fever dey" — the local phrasings are the strongest
        // organic-search asset in the repo (§12), and alternateName is where a
        // search engine actually looks for them.
        alternateName: c.localExpressions,
        signOrSymptom: c.symptoms.map((s) => ({
          '@type': 'MedicalSignOrSymptom',
          name: s.label,
        })),
        // Danger signs are the clinically load-bearing part of every page.
        ...(c.dangerSigns.length > 0
          ? {
              possibleComplication: c.dangerSigns.map((d) => d.label).join('. '),
            }
          : {}),
        ...(c.whoIsMostAtRisk.length > 0
          ? { riskFactor: c.whoIsMostAtRisk.map((r) => ({ '@type': 'MedicalRiskFactor', name: r.label })) }
          : {}),
        expectedPrognosis: `${copy.headline} ${copy.timeframe}.`,
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Conditions', path: '/conditions' },
        { name: c.name, path: `/conditions/${c.slug}` },
      ]),
    ],
  }
}

/** Serialise for a <script type="application/ld+json">. */
export function jsonLd(value: unknown) {
  // `<` is escaped so a stray one in content cannot close the script tag early.
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
