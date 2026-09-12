/**
 * SEO checks.
 *
 * Every rule here exists because the site shipped without it, not because a
 * checklist somewhere lists it. The findings this replaces:
 *
 *   - eight routes had no canonical, including the home page, while the
 *     navigation itself links to six /conditions filter URLs that a crawler
 *     reads as six near-identical pages
 *   - no page had a share image, in a market where a WhatsApp forward is a
 *     larger share of traffic than a search result
 *   - /for/clinicians rendered as "clinicians: Read the rules. Challenge
 *     them." because the title was derived from a hero heading
 *   - the four /for/* pages were absent from the sitemap
 *   - the sitemap claimed all 58 pages changed today, on every deploy
 *
 * Run against a built server:  npm run check:seo
 */
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:3737'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ORIGIN = 'https://wellapath.org'

/** Indexable routes. Anything here must be canonical, titled and described. */
const ROUTES = [
  '/',
  '/how-it-works',
  '/conditions',
  '/coverage',
  '/clinical-safety',
  '/partners',
  '/about',
  '/privacy',
  '/support',
  '/for/households',
  '/for/health-facilities',
  '/for/clinicians',
  '/for/public-health',
  '/conditions/malaria',
  '/conditions/typhoid-fever',
]

/** These must NOT be indexed: one holds personal data, one is a form result. */
const NOINDEX = ['/notify/thanks']

let failures = 0
const fail = (m) => {
  failures++
  console.log(`  ✗ ${m}`)
}
const note = (m) => console.log(`    ${m}`)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})

console.log(`\nSEO checks at ${BASE}\n`)

const page = await browser.newPage()
const seenTitles = new Map()
const seenDescriptions = new Map()

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })

  const m = await page.evaluate(() => {
    const meta = (sel, attr = 'content') => document.querySelector(sel)?.getAttribute(attr) ?? null
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => s.textContent ?? '',
    )
    return {
      title: document.title || null,
      description: meta('meta[name="description"]'),
      canonical: meta('link[rel="canonical"]', 'href'),
      robots: meta('meta[name="robots"]'),
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogImage: meta('meta[property="og:image"]'),
      ogImageW: meta('meta[property="og:image:width"]'),
      ogImageH: meta('meta[property="og:image:height"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      h1s: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      lang: document.documentElement.getAttribute('lang'),
      ld,
    }
  })

  // ── title ────────────────────────────────────────────────────────────────
  if (!m.title) fail(`${route} — no <title>`)
  else {
    if (m.title.length > 65) fail(`${route} — title ${m.title.length} chars, truncates in results: "${m.title}"`)
    // The bug that shipped: a title beginning mid-phrase because it was sliced
    // out of a hero heading.
    if (/^[a-z]/.test(m.title)) fail(`${route} — title starts lowercase: "${m.title}"`)
    const prev = seenTitles.get(m.title)
    if (prev) fail(`${route} — title identical to ${prev}: "${m.title}"`)
    else seenTitles.set(m.title, route)
  }

  // ── description ──────────────────────────────────────────────────────────
  if (!m.description) fail(`${route} — no meta description`)
  else {
    if (m.description.length < 70)
      fail(`${route} — description only ${m.description.length} chars`)
    if (m.description.length > 165)
      fail(`${route} — description ${m.description.length} chars, will be cut`)
    const prev = seenDescriptions.get(m.description)
    if (prev) fail(`${route} — description identical to ${prev}`)
    else seenDescriptions.set(m.description, route)
  }

  // ── canonical ────────────────────────────────────────────────────────────
  const expected = `${ORIGIN}${route === '/' ? '/' : route}`
  if (!m.canonical) fail(`${route} — no canonical link`)
  else if (m.canonical.replace(/\/$/, '') !== expected.replace(/\/$/, ''))
    fail(`${route} — canonical is ${m.canonical}, expected ${expected}`)

  // ── share card ───────────────────────────────────────────────────────────
  if (!m.ogImage) fail(`${route} — no og:image`)
  else if (m.ogImageW !== '1200' || m.ogImageH !== '630')
    fail(`${route} — og:image is ${m.ogImageW}x${m.ogImageH}, not 1200x630`)
  if (m.twitterCard !== 'summary_large_image')
    fail(`${route} — twitter:card is "${m.twitterCard}", not summary_large_image`)
  if (!m.ogTitle) fail(`${route} — no og:title`)
  if (!m.ogDescription) fail(`${route} — no og:description`)

  // ── one h1, and a language ───────────────────────────────────────────────
  if (m.h1s.length === 0) fail(`${route} — no h1`)
  if (m.h1s.length > 1) fail(`${route} — ${m.h1s.length} h1 elements`)
  if (m.lang !== 'en-NG') fail(`${route} — html lang is "${m.lang}", not en-NG`)

  // ── structured data parses, and names one organisation ───────────────────
  if (m.ld.length === 0) fail(`${route} — no JSON-LD`)
  for (const block of m.ld) {
    try {
      JSON.parse(block)
    } catch {
      fail(`${route} — JSON-LD does not parse`)
    }
  }
  const flat = m.ld.join(' ')
  // The claim the site is not entitled to make while the danger-sign labels
  // are unreviewed. See content/schema.ts.
  if (/"reviewedBy"|"lastReviewed"/.test(flat))
    fail(`${route} — JSON-LD asserts clinical review, which no clinician has given`)
}

// ── the official accounts ──────────────────────────────────────────────────
// sameAs is how a search engine ties this site to the profiles. A typo here is
// silent: the schema still validates, it just points at nothing.
{
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  const r = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => JSON.parse(s.textContent ?? '{}'))
      .flatMap((d) => d['@graph'] ?? [d])
    const org = blocks.find((b) => b['@type'] === 'Organization')
    const footer = [...document.querySelectorAll('footer a[href^="http"]')].map((a) => a.href)
    return { sameAs: org?.sameAs ?? [], footer }
  })

  const EXPECTED = [
    'https://www.instagram.com/wellapath_/',
    'https://www.facebook.com/wellapath',
    'https://www.linkedin.com/company/wellapath',
  ]
  for (const url of EXPECTED) {
    if (!r.sameAs.includes(url)) fail(`schema — sameAs is missing ${url}`)
    // The schema and the footer read one array; if they disagree, one drifted.
    if (!r.footer.some((f) => f.replace(/\/$/, '') === url.replace(/\/$/, '')))
      fail(`footer — does not link to ${url}, which the schema claims as sameAs`)
  }
  for (const url of r.sameAs) {
    if (!EXPECTED.includes(url)) fail(`schema — unexpected sameAs entry ${url}`)
  }
  note(`sameAs: ${r.sameAs.length} accounts, all linked from the footer`)
}

// ── filter URLs must point home ────────────────────────────────────────────
// The navigation links to these, so they get crawled whether or not they are
// in the sitemap.
for (const filtered of ['/conditions?urgency=emergency', '/conditions?seasonal=true']) {
  await page.goto(BASE + filtered, { waitUntil: 'domcontentloaded' })
  const canonical = await page.evaluate(
    () => document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
  )
  if (canonical !== `${ORIGIN}/conditions`)
    fail(`${filtered} — canonical is ${canonical}, should be ${ORIGIN}/conditions`)
}

// ── noindex where it matters ───────────────────────────────────────────────
for (const route of NOINDEX) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  const robots = await page.evaluate(
    () => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
  )
  if (!/noindex/.test(robots)) fail(`${route} — indexable, but should be noindex ("${robots}")`)
}

// ── the sitemap ────────────────────────────────────────────────────────────
{
  const res = await fetch(`${BASE}/sitemap.xml`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((x) => x[1])
  console.log(`\n  sitemap: ${urls.length} URLs`)

  for (const route of ROUTES) {
    const want = `${ORIGIN}${route === '/' ? '' : route}`
    if (!urls.some((u) => u.replace(/\/$/, '') === want.replace(/\/$/, '')))
      fail(`sitemap — missing ${route}`)
  }
  for (const route of NOINDEX) {
    if (urls.some((u) => u.includes(route))) fail(`sitemap — lists noindex route ${route}`)
  }
  if (urls.some((u) => u.includes('/admin'))) fail('sitemap — lists an /admin route')

  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i)
  if (dupes.length) fail(`sitemap — duplicate URLs: ${[...new Set(dupes)].slice(0, 3).join(', ')}`)

  // The regression this replaces: every lastmod being the build time.
  const today = new Date().toISOString().slice(0, 10)
  const mods = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((x) => x[1])
  const todays = mods.filter((d) => d.startsWith(today))
  if (mods.length > 0 && todays.length === mods.length && mods.length > 5)
    fail(`sitemap — all ${mods.length} lastmod values are today's date, which reads as a build stamp`)
  else if (mods.length) note(`${mods.length} entries carry a lastmod; ${todays.length} are today`)
}

// ── robots.txt ─────────────────────────────────────────────────────────────
{
  const res = await fetch(`${BASE}/robots.txt`)
  const txt = await res.text()
  if (!/Sitemap:\s*https?:\/\//i.test(txt)) fail('robots.txt — no absolute Sitemap line')
  if (!/Disallow:\s*\/admin/i.test(txt)) fail('robots.txt — does not disallow /admin')
}

// ── the share card actually renders ────────────────────────────────────────
for (const url of ['/opengraph-image', '/conditions/malaria/opengraph-image']) {
  const res = await fetch(BASE + url)
  const type = res.headers.get('content-type') ?? ''
  const len = Number(res.headers.get('content-length') ?? 0)
  if (!res.ok) fail(`${url} — HTTP ${res.status}`)
  else if (!type.startsWith('image/')) fail(`${url} — content-type ${type}`)
  else if (len > 0 && len < 5000) fail(`${url} — only ${len} bytes, probably blank`)
}

await browser.close()

console.log(`\n${'─'.repeat(60)}`)
if (failures === 0) {
  console.log(`✓ ${ROUTES.length} routes: titled, described, canonical, card, schema.\n`)
} else {
  console.log(`✗ ${failures} SEO violation${failures === 1 ? '' : 's'}.\n`)
  process.exit(1)
}
