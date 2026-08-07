/**
 * Analytics consent checks.
 *
 * /privacy makes two specific promises about Google Analytics. They are the
 * kind that hold on the day they are written and quietly stop holding six
 * months later, when someone adds a tag manager or moves the component, so
 * they are asserted against the running site instead of trusted:
 *
 *   1. "genuinely opt-in and never pre-checked" — no request reaches Google
 *      before someone presses Accept, and the two buttons are of equal weight
 *      with neither preselected.
 *
 *   2. "never run on a condition page" — nothing under /conditions loads the
 *      script or reports a page view, even for a visitor who has accepted.
 *
 * Needs a built server:  npm run check:analytics
 */
import puppeteer from 'puppeteer-core'

import { LAUNCHED } from './launch.mjs'

const BASE = process.argv[2] ?? 'http://localhost:3737'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const GA_HOSTS = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net/

let failures = 0
const fail = (m) => {
  failures++
  console.log(`  ✗ ${m}`)
}
const ok = (m) => console.log(`  ✓ ${m}`)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})

console.log(`\nAnalytics consent checks at ${BASE}\n`)

/**
 * A page in its own browser context.
 *
 * Isolation is the whole point. localStorage is shared across pages of one
 * profile, so running these in sequence in a single context meant the
 * "declined" case left `denied` behind and the banner case that followed saw
 * an already-decided visitor and reported the banner missing. The banner was
 * fine; the check was contaminated. Every case now starts with empty storage.
 */
async function freshPage() {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  return { page, close: () => context.close() }
}

/** Every request the page made to a Google measurement host. */
async function watch(fn, { consent } = {}) {
  const { page, close } = await freshPage()
  const hits = []
  page.on('request', (r) => {
    if (GA_HOSTS.test(r.url())) hits.push(r.url())
  })
  if (consent) {
    await page.evaluateOnNewDocument(
      (v) => localStorage.setItem('wellapath.analytics-consent', v),
      consent,
    )
  }
  const result = await fn(page)
  // Give any late-firing beacon a chance to appear before judging.
  await new Promise((r) => setTimeout(r, 1200))
  await close()
  return { hits, result }
}

const go = (url) => (page) => page.goto(url, { waitUntil: 'networkidle2' })

// ── 1. Nothing before consent ──────────────────────────────────────────────
{
  const { hits } = await watch(go(`${BASE}/`))
  if (hits.length) fail(`home, undecided — ${hits.length} request(s) to Google: ${hits[0]}`)
  else ok('undecided visitor: no request reaches Google')
}

// ── 2. Nothing after declining ─────────────────────────────────────────────
{
  const { hits } = await watch(go(`${BASE}/`), { consent: 'denied' })
  if (hits.length) fail(`home, declined — ${hits.length} request(s) to Google`)
  else ok('declined visitor: no request reaches Google')
}

// ── 3. The banner is a real choice ─────────────────────────────────────────
{
  const { page, close } = await freshPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
  // The banner renders only after the stored choice is read, so wait for it
  // rather than sampling the instant navigation settles.
  await page
    .waitForSelector('[role="dialog"]', { timeout: 5000 })
    .catch(() => {})
  const b = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    const buttons = [...dialog.querySelectorAll('button')].map((el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return {
        text: el.textContent.trim(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        bg: s.backgroundColor,
        checked: el.getAttribute('aria-pressed') === 'true',
      }
    })
    const inputs = [...dialog.querySelectorAll('input')].map((i) => ({
      type: i.type,
      checked: i.checked,
    }))
    return { buttons, inputs }
  })

  if (!b) fail('home — no consent banner shown to an undecided visitor')
  else {
    if (b.buttons.length < 2) fail(`banner — ${b.buttons.length} button(s), expected accept and decline`)
    if (b.inputs.some((i) => i.checked))
      fail('banner — a control is pre-checked, which /privacy says it never is')
    if (b.buttons.some((x) => x.checked))
      fail('banner — a button is preselected, which /privacy says it never is')
    // "Neither is louder": same fill, and neither materially smaller.
    const fills = new Set(b.buttons.map((x) => x.bg))
    if (fills.size > 1)
      fail(`banner — buttons have different fills (${[...fills].join(' vs ')}), so one reads as preferred`)
    for (const x of b.buttons) {
      if (x.h < 44) fail(`banner — "${x.text}" is ${x.h}px tall, under the 44px target`)
    }
    if (b.buttons.length >= 2) {
      const [a, c] = b.buttons
      const ratio = Math.max(a.w, c.w) / Math.min(a.w, c.w)
      if (ratio > 1.6)
        fail(`banner — one button is ${ratio.toFixed(1)}x the width of the other`)
      else ok(`banner: ${b.buttons.length} equal-weight buttons, none preselected`)
    }
  }
  await close()
}

// ── 4. Condition pages: no script, no banner, even having accepted ─────────
// Pre-launch these 307 to the waitlist, which does run analytics on consent, so
// following the redirect would assert the opposite of what this checks.
for (const route of !LAUNCHED
  ? []
  : ['/conditions', '/conditions/malaria', '/conditions?urgency=emergency']) {
  const { hits, result } = await watch(
    async (page) => {
      await page.goto(BASE + route, { waitUntil: 'networkidle2' })
      return page.evaluate(() => ({
        banner: Boolean(document.querySelector('[role="dialog"]')),
        script: Boolean(document.getElementById('ga-src')),
        dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer.length : 0,
      }))
    },
    { consent: 'granted' },
  )
  if (hits.length) fail(`${route} — reported to Google despite the promise it never would`)
  if (result.script) fail(`${route} — the gtag script is present`)
  if (result.banner) fail(`${route} — the consent banner appears on a condition page`)
  if (!hits.length && !result.script && !result.banner) ok(`${route}: silent, as promised`)
}

// ── 5. It does work where it is allowed ────────────────────────────────────
// A check that only proves absence would pass if analytics were removed
// entirely, which is not what was asked for.
{
  const marketing = LAUNCHED ? '/how-it-works' : '/'
  const { hits } = await watch(go(`${BASE}${marketing}`), { consent: 'granted' })
  if (!hits.length) fail(`${marketing}, accepted — nothing sent, so consent does not actually work`)
  else ok(`accepted visitor on a marketing page: ${hits.length} request(s) sent`)
}

// ── 6. Navigating from marketing to a condition page reports nothing ───────
// Needs a condition page to navigate to, so it waits for launch.
if (LAUNCHED)
// The honest limit stated on /privacy: the script stays in memory, but no
// condition URL may ever be transmitted.
{
  const { page, close } = await freshPage()
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem('wellapath.analytics-consent', 'granted'),
  )
  const after = []
  await page.goto(`${BASE}/how-it-works`, { waitUntil: 'networkidle2' })
  page.on('request', (r) => {
    if (GA_HOSTS.test(r.url())) after.push(r.url())
  })
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find((a) =>
      (a.getAttribute('href') ?? '').startsWith('/conditions'),
    )
    if (link) link.click()
  })
  await new Promise((r) => setTimeout(r, 2000))
  const path = await page.evaluate(() => location.pathname)
  if (!path.startsWith('/conditions')) {
    console.log(`    (skipped: client navigation landed on ${path})`)
  } else {
    const leaked = after.filter((u) => /conditions/.test(decodeURIComponent(u)))
    if (leaked.length) fail(`client nav to ${path} — condition URL sent to Google: ${leaked[0]}`)
    else ok(`client nav to ${path}: no condition URL transmitted`)
  }
  await close()
}

await browser.close()

console.log(`\n${'─'.repeat(60)}`)
if (failures === 0) {
  console.log(
    LAUNCHED
      ? '✓ Opt-in holds, and condition pages are never reported.\n'
      : '✓ Opt-in holds. The condition-page silence rule is not checked while the site is closed.\n',
  )
} else {
  console.log(`✗ ${failures} consent violation${failures === 1 ? '' : 's'}.\n`)
  process.exit(1)
}
