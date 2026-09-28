/**
 * Admin access control, honest-state and isolation checks.
 *
 * Written the way the other checks in this directory are written: plain Node,
 * hand-rolled assertions, a failure counter, exit 1. No test framework, on
 * purpose, because one more dependency to keep current is a real cost and
 * these assertions do not need one.
 *
 * WHY THIS EXISTS SEPARATELY. The other five check scripts all skip /admin,
 * and they have to: it is behind HTTP Basic, so an unauthenticated fetch gets
 * a 401 rather than a page. That left the one part of the site holding
 * personal data as the one part with no automated verification. This closes
 * that gap.
 *
 * CREDENTIALS. This script requires its own credentials, passed in the
 * environment, and starts a server configured with them. It never reads,
 * needs or prints the live admin password. Generate throwaway values:
 *
 *   ADMIN_USER=check ADMIN_PASSWORD="$(openssl rand -base64 24)" \
 *     npm run check:admin
 *
 * The runner below sets them itself when they are absent, so the ordinary
 * invocation is just `npm run check:admin`.
 *
 * Usage:
 *   node scripts/check-admin.mjs [baseUrl]
 *
 * It expects a production server already running with the same credentials
 * this process has in its environment. `npm run check:admin` handles that.
 */
import { ADMIN_SECTIONS, ADMIN_GROUPS } from '../content/admin/sections.ts'
import { csvField, csvDocument, defuseFormula } from '../content/csv.ts'
import { aged, factText, panelKind } from '../content/admin/facts.ts'
import {
  interpretResponse,
  canonicalJson,
  matchesExpected,
  BASELINE_CANONICAL_SHA256,
  TIMEOUT_MS,
  TTL_MS,
} from '../content/admin/config-probe.ts'
import { MANUAL_FACTS, LAUNCH_ACTIONS } from '../content/admin/register.ts'

const BASE = process.argv[2] ?? 'http://localhost:3737'
const USER = process.env.ADMIN_USER
const PASS = process.env.ADMIN_PASSWORD

let failures = 0
let checks = 0

function ok(label) {
  checks += 1
  console.log(`  ok   ${label}`)
}

function fail(label, detail) {
  checks += 1
  failures += 1
  console.error(`  FAIL ${label}`)
  if (detail) console.error(`       ${detail}`)
}

function assert(condition, label, detail) {
  if (condition) ok(label)
  else fail(label, detail)
}

const authHeader = () => 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

async function get(path, { auth = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: auth ? { authorization: authHeader() } : {},
    redirect: 'manual',
  })
  const body = await res.text()
  return { status: res.status, headers: res.headers, body }
}

/* ────────────────────────────────────────────────────────────────────────
 * 1. Every admin route denies an unauthenticated request
 * ──────────────────────────────────────────────────────────────────────── */
async function checkDenied() {
  console.log('\nUnauthenticated requests are refused')
  for (const section of ADMIN_SECTIONS) {
    const res = await get(section.href)
    assert(res.status === 401, `${section.href} returns 401`, `got ${res.status}`)
    assert(
      (res.headers.get('www-authenticate') ?? '').startsWith('Basic'),
      `${section.href} challenges with Basic`,
      res.headers.get('www-authenticate') ?? '(absent)',
    )
    // The body of a 401 must not carry page content.
    assert(
      !res.body.includes('<table'),
      `${section.href} 401 body carries no page content`,
    )
  }

  // A route that does not exist must still be gated, not 404 with detail.
  const unknown = await get('/admin/does-not-exist')
  assert(unknown.status === 401, '/admin/does-not-exist is gated before routing', `got ${unknown.status}`)

  // A wrong password must not be accepted.
  const wrong = await fetch(`${BASE}/admin`, {
    headers: { authorization: 'Basic ' + Buffer.from(`${USER}:not-the-password`).toString('base64') },
    redirect: 'manual',
  })
  assert(wrong.status === 401, 'a wrong password is refused', `got ${wrong.status}`)
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. Every admin route answers with credentials, and carries its headers
 * ──────────────────────────────────────────────────────────────────────── */
async function checkAllowed() {
  console.log('\nAuthenticated requests are served, with the right headers')
  const pages = {}
  for (const section of ADMIN_SECTIONS) {
    const res = await get(section.href, { auth: true })
    assert(res.status === 200, `${section.href} returns 200 with credentials`, `got ${res.status}`)
    pages[section.href] = res.body

    const cache = res.headers.get('cache-control') ?? ''
    assert(cache.includes('no-store'), `${section.href} is no-store`, cache || '(absent)')

    const robots = res.headers.get('x-robots-tag') ?? ''
    assert(
      robots.includes('noindex') && robots.includes('nofollow'),
      `${section.href} is noindex, nofollow`,
      robots || '(absent)',
    )

    const csp = res.headers.get('content-security-policy') ?? ''
    assert(
      csp.includes("frame-ancestors 'none'"),
      `${section.href} forbids framing`,
      csp || '(absent)',
    )
    assert(
      (res.headers.get('x-frame-options') ?? '').toUpperCase() === 'DENY',
      `${section.href} sends X-Frame-Options DENY`,
      res.headers.get('x-frame-options') ?? '(absent)',
    )
    assert(
      (res.headers.get('referrer-policy') ?? '').length > 0,
      `${section.href} sends a Referrer-Policy`,
    )
    assert(
      (res.headers.get('permissions-policy') ?? '').includes('geolocation=()'),
      `${section.href} sends a Permissions-Policy`,
    )
  }
  return pages
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. The waitlist page still works, and still tells the truth
 * ──────────────────────────────────────────────────────────────────────── */
function checkWaitlistPreserved(pages) {
  console.log('\nThe waitlist dashboard is unchanged in behaviour')
  const html = pages['/admin/signups']

  assert(Boolean(html), '/admin/signups still renders')
  assert(html.includes('<h1'), '/admin/signups still has exactly one h1')
  assert((html.match(/<h1/g) ?? []).length === 1, '/admin/signups has one h1, not several')

  // It must be in one of its two genuine states, never a silent empty table.
  const listed = html.includes('Launch signups')
  const cannotReach = html.includes('Cannot reach the signup list')
  assert(
    listed || cannotReach,
    '/admin/signups shows a real state, not a blank',
    'neither the list heading nor the honest-failure heading was found',
  )

  // When the store is unreachable it must say so rather than report zero.
  if (cannotReach) {
    assert(
      html.includes('The site itself is unaffected'),
      'the unreachable state explains the blast radius',
    )
    assert(
      !/>\s*0\s*</.test(html.split('Cannot reach')[1] ?? ''),
      'the unreachable state reports no figures at all',
    )
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. Unavailable facts never render as a number
 * ──────────────────────────────────────────────────────────────────────── */
function checkNoFalseZeros(pages) {
  console.log('\nUnavailable facts render as words, never as figures')

  // At the model level: the union has no `value` on the unavailable branch,
  // and factText falls back to the state word.
  const words = ['Disabled', 'Not instrumented', 'Awaiting data', 'Not verified']
  for (const reason of ['disabled', 'not-instrumented', 'awaiting-data', 'not-verified']) {
    const text = factText({ state: 'unavailable', reason, source: 's' })
    assert(words.includes(text), `an unavailable fact reads "${text}"`)
    assert(text !== '0' && text !== '', `an unavailable fact is never a zero or a blank`)
  }

  // At the page level: the two pages whose whole point is a switched-off
  // subsystem must not present a figure beside the thing that is off.
  for (const route of ['/admin/reliability', '/admin/product-insights']) {
    const html = pages[route]
    const hasWord = words.some((w) => html.includes(w))
    assert(hasWord, `${route} states an unavailable word`)
    assert(
      !/>\s*0\s*<\/p>/.test(html) && !/>\s*0%\s*</.test(html),
      `${route} renders no bare zero`,
    )
    assert(
      !html.includes('100%'),
      `${route} claims no perfect rate for something that is not running`,
    )
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 5. The inactive and disabled sections say so
 * ──────────────────────────────────────────────────────────────────────── */
function checkHonestSections(pages) {
  console.log('\nInactive and disabled sections are labelled as such')

  for (const route of ['/admin/feedback', '/admin/support']) {
    assert(
      pages[route].includes('Not active. Nothing is collected.'),
      `${route} renders as inactive`,
    )
    assert(pages[route].includes('Disabled'), `${route} labels the state Disabled`)
  }
  assert(
    pages['/admin/reliability'].includes('Disabled'),
    '/admin/reliability reports crash reporting as disabled',
  )
  assert(
    pages['/admin/reliability'].includes('Not instrumented'),
    '/admin/reliability reports the crash-free rate as not instrumented',
  )
  assert(
    pages['/admin/product-insights'].includes('Disabled') ||
      pages['/admin/product-insights'].includes('Not instrumented'),
    '/admin/product-insights reports telemetry as off, not as zero',
  )

  // Read-only: no control that changes anything.
  for (const section of ADMIN_SECTIONS) {
    if (section.href === '/admin/signups') continue // pre-existing CSV download link
    const html = pages[section.href]
    assert(!/<form\b/i.test(html), `${section.href} contains no form`)
    assert(!/<button\b/i.test(html), `${section.href} contains no button`)
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 6. Waitlist identities stay inside the waitlist page
 * ──────────────────────────────────────────────────────────────────────── */
async function checkIsolation(pages) {
  console.log('\nWaitlist records are read by nothing else')

  // Static: no admin module outside the signups page imports the signup
  // reader or the database.
  const { readFileSync, readdirSync, statSync } = await import('node:fs')
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const p = `${dir}/${name}`
      return statSync(p).isDirectory() ? walk(p) : [p]
    })

  const adminSources = [
    ...walk('app/admin').filter((p) => !p.includes('/signups/')),
    ...walk('content/admin'),
    'components/admin.tsx',
  ].filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))

  const forbidden = ['content/signups', 'listSignups', 'getSignups', 'SignupRow']
  for (const file of adminSources) {
    const src = readFileSync(file, 'utf8')
    for (const needle of forbidden) {
      assert(!src.includes(needle), `${file} does not reference ${needle}`)
    }
  }

  // `derived.ts` may import dbConfigured, which is a boolean about
  // configuration and reads no row. Assert that is the only database contact.
  const derived = readFileSync('content/admin/derived.ts', 'utf8')
  const dbImports = derived.match(/from '@\/content\/db'/g) ?? []
  if (dbImports.length > 0) {
    assert(
      /import \{ dbConfigured \} from '@\/content\/db'/.test(derived),
      'derived.ts imports only dbConfigured from the database module',
    )
  }

  // Runtime: no other admin page renders anything shaped like a contact.
  const emailish = /[\w.+-]+@[\w-]+\.[\w]{2,}/g
  const allowed = new Set(['support@wellapath.org'])
  for (const section of ADMIN_SECTIONS) {
    if (section.href === '/admin/signups') continue
    const found = (pages[section.href].match(emailish) ?? []).filter((e) => !allowed.has(e))
    assert(
      found.length === 0,
      `${section.href} renders no email address`,
      found.join(', '),
    )
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 7. The register carries no personal contact details
 * ──────────────────────────────────────────────────────────────────────── */
function checkRegisterHygiene() {
  console.log('\nThe hand-maintained register names roles, not people')

  const emailish = /[\w.+-]+@[\w-]+\.[\w]{2,}/
  const isoDate = /^\d{4}-\d{2}-\d{2}$/
  const phoneish = /(?<!\d)\+?\d[\d\s()-]{7,}\d(?!\d)/g

  const blobs = [
    ...Object.values(MANUAL_FACTS).map((f) => JSON.stringify(f)),
    ...LAUNCH_ACTIONS.map((a) => JSON.stringify(a)),
  ]
  for (const blob of blobs) {
    assert(!emailish.test(blob), 'no email address in the register')
    const digits = (blob.match(phoneish) ?? [])
      .map((s) => s.trim())
      .filter((s) => !isoDate.test(s))
    assert(digits.length === 0, 'no phone-shaped value in the register', digits.join(', '))
  }

  for (const action of LAUNCH_ACTIONS) {
    assert(action.owner.length > 0, `action ${action.id} names an owner`)
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 8. Sitemap and robots still exclude admin
 * ──────────────────────────────────────────────────────────────────────── */
async function checkNotIndexed() {
  console.log('\nAdmin stays out of the sitemap and disallowed in robots')

  const sitemap = await get('/sitemap.xml')
  assert(sitemap.status === 200, 'sitemap.xml is served', `got ${sitemap.status}`)
  assert(!sitemap.body.includes('/admin'), 'sitemap lists no admin route')

  const robots = await get('/robots.txt')
  assert(robots.status === 200, 'robots.txt is served', `got ${robots.status}`)
  assert(/Disallow:\s*\/admin/i.test(robots.body), 'robots.txt disallows /admin')
}

/* ────────────────────────────────────────────────────────────────────────
 * 8b. The health probe fails safely in every direction
 * ──────────────────────────────────────────────────────────────────────── */
async function checkProbe() {
  console.log('\nThe health probe fails safely in every direction')

  const at = '2026-09-28T00:00:00.000Z'
  const good = JSON.stringify({ artifacts: { facilities: { version: '1.1' } } })

  const nonOk = await interpretResponse(503, 'unavailable', at)
  assert(nonOk.ok === false && nonOk.reason === 'status', 'a non-200 is a status failure')

  const bad = await interpretResponse(200, '<html>not json</html>', at)
  assert(bad.ok === false && bad.reason === 'malformed', 'invalid JSON is a malformed failure')

  const empty = await interpretResponse(200, '{"a":1}', at)
  assert(
    empty.ok === false && empty.reason === 'malformed',
    'a response with no artifact block is malformed, not an empty success',
  )

  const wrongHash = await interpretResponse(200, good, at)
  assert(wrongHash.ok === true, 'a well-formed 200 succeeds')
  assert(wrongHash.integrity === 'differs', 'a body that is not the baseline reports differs')
  assert(wrongHash.artifacts.facilities === '1.1', 'versions are read from the body')

  // The same body compared against its own hash must match, which proves the
  // comparison is real rather than always reporting differs.
  const ownHash = await (async () => {
    const bytes = new TextEncoder().encode(canonicalJson(JSON.parse(good)))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  })()
  const matching = await interpretResponse(200, good, at, ownHash)
  assert(matching.ok === true && matching.integrity === 'match', 'a matching body reports match')

  // Key order must not change the verdict.
  const a = canonicalJson(JSON.parse('{"z":1,"a":2,"n":{"y":1,"x":2}}'))
  const b = canonicalJson(JSON.parse('{"a":2,"z":1,"n":{"x":2,"y":1}}'))
  assert(a === b, 'key order does not change the canonical form')

  // No failure path carries data it did not read.
  assert(!('artifacts' in nonOk), 'a failed probe carries no artifact data')
  assert(!('integrity' in bad), 'a malformed probe carries no integrity verdict')

  assert(
    matchesExpected({
      token_dictionary: '1.1',
      knowledge_base: '2.4',
      rules: '2.2',
      facilities: '1.1',
    }),
    'the expected set matches itself',
  )
  assert(!matchesExpected({ facilities: '1.0' }), 'a wrong version does not match the expected set')

  assert(TIMEOUT_MS === 2500, 'the probe timeout is 2.5 seconds', String(TIMEOUT_MS))
  assert(TTL_MS === 300000, 'the probe is cached for five minutes', String(TTL_MS))
  assert(BASELINE_CANONICAL_SHA256.length === 64, 'the baseline is a full sha256')

  // The live module must stay server-only: importing it here must throw.
  let serverOnly = false
  try {
    await import('../content/admin/config-health.ts')
  } catch {
    serverOnly = true
  }
  assert(
    serverOnly,
    'config-health.ts is server-only and cannot be imported outside a server context',
  )
}

/* ────────────────────────────────────────────────────────────────────────
 * 9. Unit checks that need no server
 * ──────────────────────────────────────────────────────────────────────── */
function checkCsv() {
  console.log('\nCSV export quotes, escapes and defuses')

  assert(csvField('plain') === 'plain', 'a plain value is unquoted')
  assert(csvField('a,b') === '"a,b"', 'a comma forces quoting')
  assert(csvField('say "hi"') === '"say ""hi"""', 'inner quotes are doubled')
  assert(csvField('line\nbreak') === '"line\nbreak"', 'a newline forces quoting')
  assert(csvField('carriage\rreturn') === '"carriage\rreturn"', 'a carriage return forces quoting')
  assert(csvField(null) === '', 'null becomes an empty field')
  assert(csvField(undefined) === '', 'undefined becomes an empty field')
  assert(csvField(false) === 'false', 'a boolean is written out')
  assert(
    csvField(new Date('2026-09-28T10:00:00.000Z')) === '2026-09-28T10:00:00.000Z',
    'a date is an ISO timestamp',
  )

  for (const leader of ['=', '+', '-', '@', '\t', '\r']) {
    const defused = defuseFormula(`${leader}HYPERLINK("http://x")`)
    assert(defused.startsWith("'"), `a leading ${JSON.stringify(leader)} is defused`)
  }
  assert(defuseFormula('') === '', 'an empty value is left alone')
  assert(defuseFormula('normal') === 'normal', 'an ordinary value is left alone')

  // The combination: a formula containing a comma must be both defused and
  // quoted, or it breaks the row as well as running.
  const nasty = csvField('=SUM(1,2)')
  assert(nasty.startsWith('"\''), 'a formula with a comma is defused then quoted')
  assert(nasty.includes('=SUM(1,2)'), 'the original text survives defusing')

  // Unicode passes through untouched. Nigerian names carry accents and the
  // form accepts any language, so mangling here would be a real data loss.
  assert(csvField('Adéwálé') === 'Adéwálé', 'accented text is unchanged')
  assert(csvField('naïve, bold') === '"naïve, bold"', 'accented text with a comma is quoted')
  assert(csvField('\u{1F1F3}\u{1F1EC}') === '\u{1F1F3}\u{1F1EC}', 'an emoji is unchanged')
  assert(csvField('') === '', 'an empty string stays empty')
  assert(csvField(0) === '0', 'a real zero is written, because it is a real value')
  assert(csvField('a\r\nb') === '"a\r\nb"', 'a CRLF pair forces quoting')
  assert(csvField('"') === '""""', 'a lone quote is escaped and quoted')
  assert(csvField('=1+1') === "'=1+1", 'an equals formula is defused')
  assert(csvField('@SUM(A1)') === "'@SUM(A1)", 'an at-sign formula is defused')
  assert(csvField('+1+1') === "'+1+1", 'a plus formula is defused')
  assert(csvField('-1-1') === "'-1-1", 'a minus formula is defused')
  assert(csvField('\t=1') === "'\t=1", 'a tab-led formula is defused')
  assert(csvField('+2348031234567') === "'+2348031234567", 'a phone number is defused, not lost')
  assert(
    csvField('=HYPERLINK("http://evil","click")').startsWith('"\''),
    'a hyperlink formula containing a comma is defused and quoted',
  )

  const doc = csvDocument(['a', 'b'], [['1', 'x,y']])
  assert(doc === 'a,b\r\n1,"x,y"', 'a document uses CRLF between rows', JSON.stringify(doc))
}

function checkFactModel() {
  console.log('\nThe fact model refuses to lose a manual observation')

  const manual = {
    state: 'manual',
    value: 'Approved',
    observedBy: 'Reviewer',
    observedAt: '2026-09-01',
    source: 'somewhere',
  }
  const fresh = aged(manual, new Date('2026-09-10T00:00:00Z'))
  assert(fresh.state === 'manual', 'a recent observation stays manual')
  assert(factText(fresh) === 'Approved', 'a recent observation keeps its value')

  const stale = aged(manual, new Date('2026-10-01T00:00:00Z'))
  assert(stale.state === 'unavailable', 'a stale observation is demoted')
  assert(factText(stale) === 'Not verified', 'a stale observation reads Not verified')
  assert(stale.note.includes('2026-09-01'), 'the original date survives the demotion')
  assert(stale.note.includes('Reviewer'), 'the original observer survives the demotion')

  const derived = { state: 'derived', value: 'x', source: 's' }
  const live = { state: 'live', value: 'y', source: 's', observedAt: '2026-09-28T00:00:00Z' }
  const missing = { state: 'unavailable', reason: 'not-verified', source: 's' }
  const off = { state: 'unavailable', reason: 'disabled', source: 's' }

  assert(panelKind([derived]) === 'derived', 'all derived reads Derived')
  assert(panelKind([derived, live]) === 'live', 'a live reading makes the panel Live')
  assert(panelKind([live, manual]) === 'manual', 'one manual fact makes the panel Manual')
  assert(panelKind([live, manual, missing]) === 'incomplete', 'a missing fact outranks everything')
  assert(panelKind([off]) === 'derived', 'a switched-off subsystem is an established fact')
  assert(panelKind([]) === 'incomplete', 'an empty panel is never Live')
}

/* ────────────────────────────────────────────────────────────────────────
 * 10. The admin shell is an admin shell, not the marketing site
 * ──────────────────────────────────────────────────────────────────────── */
function checkShell(pages) {
  console.log('\nThe admin shell is separate from the marketing site')

  // Markers that only the public chrome renders. If any appears under /admin,
  // the root layout has started inheriting the website again.
  const MARKETING = [
    'Join waitlist',
    'In an emergency, do not use an app',
    'Built for Nigerians',
    'id="site-nav"',
  ]

  for (const section of ADMIN_SECTIONS) {
    const html = pages[section.href]

    for (const marker of MARKETING) {
      assert(!html.includes(marker), `${section.href} does not render "${marker}"`)
    }

    // The admin navigation is present, and is the admin one.
    assert(
      html.includes('aria-label="Admin sections"'),
      `${section.href} renders the admin navigation`,
    )
    for (const group of ADMIN_GROUPS) {
      assert(html.includes(group), `${section.href} navigation shows the ${group} group`)
    }

    // The navigation renders twice, once for the phone disclosure and once
    // for the desktop sidebar, with CSS showing one. So the active marker
    // appears once per instance, and both must point at this section.
    const current = (html.match(/aria-current="page"/g) ?? []).length
    assert(current === 2, `${section.href} marks the active item in both navs`, `found ${current}`)
    const activeHref = new RegExp(
      `href="${section.href.replace('/', '\\/')}"[^>]*aria-current="page"`,
    )
    assert(activeHref.test(html), `${section.href} marks itself active, not another section`)

    // Every section is reachable from every other.
    for (const other of ADMIN_SECTIONS) {
      assert(
        html.includes(`href="${other.href}"`),
        `${section.href} links to ${other.href}`,
      )
    }

    // One h1, and it is the compact page title rather than a display headline.
    const h1s = (html.match(/<h1/g) ?? []).length
    assert(h1s === 1, `${section.href} has exactly one h1`, `found ${h1s}`)

    // Still not indexed, and still says so on the page.
    assert(html.includes('Internal · Not indexed'), `${section.href} shows the internal label`)
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 11. The first screen answers the operational questions
 * ──────────────────────────────────────────────────────────────────────── */
function checkFirstViewport(pages) {
  console.log('\nThe overview leads with status, then actions')

  const html = pages['/admin']
  const at = (needle) => html.indexOf(needle)

  const summary = at('aria-label="Current status"')
  const actions = at('Next actions')
  const gates = at('Launch gates')
  const explainer = at('How dashboard statuses work')

  assert(summary > 0, 'the status summary is present')
  assert(actions > 0, 'the next-actions list is present')
  assert(summary < actions, 'status comes before actions')
  assert(actions < gates, 'actions come before the full gate table')
  assert(explainer > gates, 'the explanation is below the data, not above it')

  // The five questions, each answerable from the summary strip.
  for (const label of [
    'Blocked gates',
    'Not verified',
    'Configuration health',
    'Android internal build',
    'iOS internal build',
    'Clinical review',
  ]) {
    assert(html.includes(label), `the summary answers "${label}"`)
  }

  // Each action row is itself a link to where it is acted on.
  for (const action of LAUNCH_ACTIONS) {
    assert(
      html.includes(action.title),
      `the action list shows "${action.title}"`,
    )
  }
  // Each title is wrapped in an anchor, so the row's target is the title's
  // full width rather than a small cell at the end of the row.
  for (const action of LAUNCH_ACTIONS) {
    const escaped = action.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const linked = new RegExp(`<a[^>]*href="/admin[^"]*"[^>]*>${escaped}</a>`)
    assert(linked.test(html), `"${action.title}" is itself the link`)
  }

  // The explanation is collapsed, not occupying the first screen.
  assert(html.includes('<details'), 'the explanation is a disclosure')
}

/* ────────────────────────────────────────────────────────────────────────
 * 12. Status is legible as text, and tables say they scroll
 * ──────────────────────────────────────────────────────────────────────── */
function checkTextualStatus(pages) {
  console.log('\nStatus is carried by words, and scrolling is announced')

  // Provenance words, not just colour.
  for (const word of ['MEASURED', 'FROM SOURCE', 'RECORDED', 'NO VALUE']) {
    assert(
      pages['/admin'].toUpperCase().includes(word),
      `the overview states provenance in text: ${word}`,
    )
  }

  // Every page carrying a wide table announces that it scrolls.
  for (const route of ['/admin', '/admin/launch-readiness', '/admin/signups']) {
    assert(
      pages[route].includes('scrolls sideways on a narrow screen'),
      `${route} announces its scrollable table`,
    )
  }

  // Gate and severity states are words.
  for (const word of ['Blocked', 'Not verified', 'Waiting', 'Ready']) {
    assert(pages['/admin'].includes(word), `gate state "${word}" appears as text`)
  }

  // The inactive sections answer all three questions.
  for (const route of ['/admin/feedback', '/admin/support']) {
    for (const heading of ['Current state', 'Why there is no data', 'Before this becomes active']) {
      assert(pages[route].includes(heading), `${route} explains: ${heading}`)
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 13. No client JavaScript was added
 * ──────────────────────────────────────────────────────────────────────── */
async function checkNoClientJs() {
  console.log('\nThe admin tree ships no client JavaScript of its own')

  const { readFileSync, readdirSync, statSync } = await import('node:fs')
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const p = `${dir}/${name}`
      return statSync(p).isDirectory() ? walk(p) : [p]
    })

  const sources = [...walk('app/admin'), ...walk('content/admin'), 'components/admin.tsx'].filter(
    (p) => p.endsWith('.ts') || p.endsWith('.tsx'),
  )
  for (const file of sources) {
    const src = readFileSync(file, 'utf8')
    assert(!src.includes("'use client'"), `${file} is a server component`)
    assert(!src.includes('useState') && !src.includes('useEffect'), `${file} uses no client hooks`)
  }
}

/* ──────────────────────────────────────────────────────────────────────── */

async function main() {
  if (!USER || !PASS) {
    console.error(
      'check-admin: ADMIN_USER and ADMIN_PASSWORD must be set for this check.\n' +
        '            Use throwaway values, not the live password:\n' +
        '              ADMIN_USER=check ADMIN_PASSWORD="$(openssl rand -base64 24)" npm run check:admin',
    )
    process.exit(2)
  }

  console.log(`check-admin: ${BASE}`)
  console.log(`check-admin: ${ADMIN_SECTIONS.length} admin routes`)

  // Server-free checks first, so a broken server does not hide them.
  checkCsv()
  checkFactModel()
  await checkProbe()
  checkRegisterHygiene()

  try {
    await get('/')
  } catch {
    console.error(`\ncheck-admin: nothing is answering on ${BASE}.`)
    console.error('            Start a production server there first, or pass a base URL.')
    process.exit(2)
  }

  await checkDenied()
  const pages = await checkAllowed()
  checkWaitlistPreserved(pages)
  checkNoFalseZeros(pages)
  checkHonestSections(pages)
  await checkIsolation(pages)
  await checkNotIndexed()
  checkShell(pages)
  checkFirstViewport(pages)
  checkTextualStatus(pages)
  await checkNoClientJs()

  console.log(`\ncheck-admin: ${checks} checks, ${failures} failed`)
  if (failures > 0) process.exit(1)
}

await main()
