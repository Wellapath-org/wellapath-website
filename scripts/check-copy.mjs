#!/usr/bin/env node
/**
 * The mechanical subset of the definition of done (WEBSITE_GUIDE §13, DESIGN.md §7).
 *
 * These are CI checks rather than review comments, because "no banned word appears
 * anywhere in the copy" is not something a human reliably re-verifies on every PR.
 *
 * Usage:  node scripts/check-copy.mjs [baseUrl]
 * Requires the site to be running (npm run build && npx next start).
 */

const BASE = process.argv[2] ?? 'http://localhost:3737'

const ROUTES = [
  '/',
  '/how-it-works',
  '/conditions',
  '/conditions/malaria',
  '/conditions/lassa-fever',
  '/conditions/snake-bite',
  '/coverage',
  '/for/households',
  '/for/health-facilities',
  '/for/clinicians',
  '/for/public-health',
  '/privacy',
  '/clinical-safety',
  '/partners',
  '/about',
]

/**
 * §4.2. Matched on visible text only, word-boundary anchored.
 *
 * `allow` carries the phrases where the word legitimately appears — almost all of
 * them are us saying we do NOT do the thing, which is the opposite of a violation.
 *
 * `consumerOnly` scopes a rule to consumer-facing pages. §4.2's banned list was
 * written for a frightened reader, and two of its entries are wrong when the
 * reader is a clinician or a procurement officer:
 *
 *   - "patient" is banned because it implies WE have a clinical relationship with
 *     the user. A hospital genuinely does have patients, and telling a clinic
 *     "people who arrive at the right time" to avoid the word would read as
 *     evasive rather than careful.
 *   - clinical vocabulary generally is correct on /for/clinicians — §4 itself
 *     says jargon is fine "where a clinician is the reader".
 *
 * The diagnosis ban is NOT scoped. It applies everywhere, to everyone, always.
 */
const CLINICAL_AUDIENCE = /^\/(for\/(health-facilities|clinicians|public-health)|partners)/
const BANNED = [
  { re: /\bdiagnos(e|es|ed|is|ing)\b/gi, why: 'Regulatory claim we cannot make', allow: [/not a diagnosis/i, /does not diagnose/i, /never (returns|tells)/i, /diagnosis engine/i, /diagnostic device/i, /imply diagnosis/i, /a diagnosis\./i] },
  { re: /\byou have\b/gi, why: 'States a fact about the body', allow: [/what you have/i, /you have (given|entered|told)/i, /never returns ["“']?you have/i, /you have to\s/i] },
  { re: /\b\d{1,3}(\.\d+)?%\s*(accurate|accuracy)/gi, why: 'Invites a clinical-validation claim' },
  {
    re: /\baccuracy\b/gi,
    why: 'Invites a clinical-validation claim',
    allow: [/accuracy percentage/i, /listing accuracy/i, /accuracy figures\s+not published/i],
  },
  { re: /\b(cure|cures|cured|prescribe|prescribes)\b/gi, why: 'We do neither', allow: [/does not prescribe/i, /no medicines/i] },
  {
    re: /\bpatients?\b/gi,
    why: 'Implies a clinical relationship',
    allow: [/patients to the right level/i],
    consumerOnly: true,
  },
  { re: /\bfree consultation\b/gi, why: 'Implies a clinician is involved' },
  { re: /\bAI doctor\b/gi, why: 'Overclaim' },
  { re: /\bacross Nigeria\b/gi, why: 'Coverage overclaim — we cover 3 states', allow: [/anywhere in Nigeria/i, /will not say/i, /would be an overclaim/i, /not\s*["“”]across Nigeria/i] },
  { re: /\b(ER|acetaminophen)\b/g, why: 'Americanism' },
]

const stripHtml = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')

let failures = 0
let checks = 0
const fail = (route, msg) => {
  failures++
  console.log(`  ✗ ${route}\n      ${msg}`)
}
const pass = () => checks++

console.log(`\nChecking ${ROUTES.length} routes at ${BASE}\n`)

for (const route of ROUTES) {
  const res = await fetch(BASE + route)
  if (!res.ok) {
    fail(route, `HTTP ${res.status}`)
    continue
  }
  const html = await res.text()
  const text = stripHtml(html)

  // ── §4.2 banned words ────────────────────────────────────────────────────
  for (const { re, why, allow = [], consumerOnly = false } of BANNED) {
    if (consumerOnly && CLINICAL_AUDIENCE.test(route)) continue
    for (const m of text.matchAll(re)) {
      const ctx = text.slice(Math.max(0, m.index - 70), m.index + 70)
      if (allow.some((a) => a.test(ctx))) continue
      fail(route, `Banned word "${m[0]}" (${why})\n      …${ctx.trim()}…`)
    }
  }
  pass()

  // ── §11 disclaimer present and not visually suppressed ───────────────────
  if (!text.includes('not a diagnosis')) fail(route, 'Disclaimer missing')
  else pass()

  // ── §11 emergency contact reachable from the footer of every page ────────
  if (!text.includes('112')) fail(route, 'Emergency number missing from page')
  else pass()

  // ── §10 exactly one h1 ───────────────────────────────────────────────────
  const h1s = (html.match(/<h1[\s>]/g) || []).length
  if (h1s !== 1) fail(route, `Expected exactly 1 <h1>, found ${h1s}`)
  else pass()

  // ── §10 landmarks ────────────────────────────────────────────────────────
  for (const tag of ['<header', '<main', '<footer', '<nav']) {
    if (!html.includes(tag)) fail(route, `Missing landmark ${tag}>`)
    else pass()
  }

  // ── §10 informative images carry real alt text ───────────────────────────
  for (const img of html.match(/<img[^>]*>/g) || []) {
    if (!/\salt=/.test(img)) fail(route, `<img> with no alt attribute: ${img.slice(0, 90)}`)
    else pass()
  }

  // ── §10 no outline suppression without replacement ───────────────────────
  if (/outline:\s*none/.test(html) && !/outline:\s*2px/.test(html))
    fail(route, 'outline:none with no visible replacement')
  else pass()

  // ── DESIGN.md §4.3 danger signs must never be collapsible ────────────────
  const danger = html.match(/Danger signs — go now[\s\S]{0,4000}/)
  if (danger) {
    const section = danger[0]
    if (/<details|aria-expanded|<summary/.test(section))
      fail(route, 'Danger signs are inside a collapsible element')
    else pass()
  }

  // ── DESIGN.md §4.2 urgency colour never travels alone ────────────────────
  if (/text-triage-(safe|warn|crit)/.test(html)) {
    const hasLabel = /non-urgent|urgent|emergency/i.test(text)
    if (!hasLabel) fail(route, 'Triage colour used with no text label')
    else pass()
  }

  // ── No em-dashes in published copy ───────────────────────────────────────
  //  Heavy em-dash use now reads as machine-written. Commas, colons and full
  //  stops carry the same meaning without the signal. En-dashes in numeric
  //  ranges (May–October) are correct typography and are left alone.
  for (const m of text.matchAll(/[^.!?]{0,45}—[^.!?]{0,45}/g)) {
    fail(route, `Em-dash in published copy — rewrite it\n      …${m[0].trim()}…`)
  }
  pass()

  // ── §5.2 no all-caps prose (uppercase runs of 4+ words) ──────────────────
  const shouty = text.match(/\b([A-Z]{3,}\s){4,}/g)
  if (shouty) fail(route, `All-caps prose: "${shouty[0].trim()}"`)
  else pass()
}

console.log(`\n${'─'.repeat(60)}`)
if (failures === 0) {
  console.log(`✓ ${checks} checks passed across ${ROUTES.length} routes. No violations.`)
} else {
  console.log(`✗ ${failures} violation${failures === 1 ? '' : 's'} (${checks} checks passed).`)
  process.exit(1)
}
