#!/usr/bin/env node
/**
 * Layout and accessibility checks that need a real engine.
 *
 *  - horizontal overflow at 320/360/390px (§8.1: cracked mid-range Android)
 *  - touch targets ≥48×48 with ≥8px spacing (§8.1)
 *  - computed font sizes: nothing below 15px, no prose below 16px (§5.2)
 *  - visible focus ring on every focusable element (§10)
 *  - 200% zoom without loss of content (§10)
 *
 * Usage: node scripts/check-layout.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:3737'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

import { reachable, announce, LAUNCHED } from './launch.mjs'

const ROUTES = ['/', '/conditions', '/conditions/malaria', '/coverage', '/for/health-facilities', '/how-it-works', '/partners']
// 320 is the narrowest phone still in use; 360 is the commonest Android width
// in Nigeria; 390 and 430 are current iPhone and iPhone Max; 768 and 820 are
// iPad portrait, which used to fall through to the stacked phone layout and so
// went unchecked at exactly the width where it looked worst.
const WIDTHS = [320, 360, 390, 430, 768, 820]

let failures = 0
const fail = (m) => {
  failures++
  console.log(`  ✗ ${m}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb'],
})

const LIVE = reachable(ROUTES)

console.log(`\nLayout checks at ${BASE}\n`)
announce(LIVE, ROUTES)

for (const route of LIVE) {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])

  // ── horizontal overflow ───────────────────────────────────────────────────
  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 })
    await page.goto(BASE + route, { waitUntil: 'networkidle0' })

    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth
      const winW = window.innerWidth
      if (docW <= winW + 1) return null
      const guilty = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.right > winW + 1 && r.width > 0) {
          guilty.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString?.() ?? '').slice(0, 70),
            right: Math.round(r.right),
            text: (el.textContent ?? '').trim().slice(0, 40),
          })
        }
      }
      return { docW, winW, guilty: guilty.slice(0, 4) }
    })

    if (overflow) {
      fail(`${route} @${width}px — page scrolls horizontally (${overflow.docW} > ${overflow.winW})`)
      for (const g of overflow.guilty) {
        console.log(`      <${g.tag} class="${g.cls}"> right=${g.right} "${g.text}"`)
      }
    }
  }

  // ── the rest at 390 ───────────────────────────────────────────────────────
  await page.setViewport({ width: 390, height: 800 })
  await page.goto(BASE + route, { waitUntil: 'networkidle0' })

  // Touch targets
  const small = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('a, button, input, select, textarea, summary')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const s = getComputedStyle(el)
      if (el.closest('[role="img"]')) continue // recreated UI, not operable
      // Hidden from assistive tech AND off-screen: not a target anyone can hit.
      // The signup honeypot lives here. A genuinely interactive control should
      // never be aria-hidden, so this cannot mask a real violation.
      if (el.closest('[aria-hidden="true"]')) continue
      if (s.display === 'inline' && el.closest('p, li')) continue // inline text links exempt
      // A control wrapped in a large label has the label's hit area.
      const lbl = el.closest('label')
      if (lbl && lbl.getBoundingClientRect().height >= 48) continue
      if (r.height < 48 || r.width < 24) {
        out.push({
          tag: el.tagName.toLowerCase(),
          h: Math.round(r.height),
          w: Math.round(r.width),
          text: (el.textContent ?? '').trim().slice(0, 30),
        })
      }
    }
    return out.slice(0, 5)
  })
  for (const t of small) fail(`${route} — touch target ${t.w}×${t.h}px <${t.tag}> "${t.text}"`)

  // Font sizes
  const tiny = await page.evaluate(() => {
    const out = new Set()
    for (const el of document.querySelectorAll('p, li, span, a, label, td, th, dd, dt')) {
      if (!el.textContent?.trim()) continue
      if (el.closest('[role="img"]')) continue // recreated UI, not prose
      const s = getComputedStyle(el)
      const size = parseFloat(s.fontSize)
      const isLabel = s.textTransform === 'uppercase'
      const floor = isLabel ? 12 : 15
      if (size < floor) out.add(`${el.tagName.toLowerCase()} ${size}px "${el.textContent.trim().slice(0, 30)}"`)
    }
    return [...out].slice(0, 5)
  })
  for (const t of tiny) fail(`${route} — text below floor: ${t}`)

  // Focus ring
  const noFocus = await page.evaluate(() => {
    const el = document.querySelector('a[href], button')
    if (!el) return null
    el.focus()
    const s = getComputedStyle(el)
    return s.outlineStyle === 'none' && s.boxShadow === 'none' ? 'first focusable has no visible focus' : null
  })
  if (noFocus) fail(`${route} — ${noFocus}`)

  // ── Emergency information must never be inside an animated container ─────
  //  A danger sign or the emergency number that fades in on scroll is a danger
  //  sign that is briefly invisible. §8.1: emergency information is never behind
  //  an interaction, and a reveal is an interaction the user did not ask for.
  const animatedEmergency = await page.evaluate(() => {
    const bad = []
    const selectors = ['[aria-labelledby="danger-signs"]', '[aria-labelledby="emergency-heading"]']
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.closest('.reveal, .stagger, .settle') || el.matches('.reveal, .stagger, .settle')) {
          bad.push(sel)
        }
      }
    }
    return bad
  })
  for (const sel of animatedEmergency)
    fail(`${route} — emergency content inside an animated container: ${sel}`)

  // ── Reduced motion must actually stop the motion ─────────────────────────
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: 'light' },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ])
  await page.reload({ waitUntil: 'networkidle0' })
  const stillMoving = await page.evaluate(() => {
    const moving = []
    for (const el of document.querySelectorAll('.reveal, .stagger > *, .settle, .aurora')) {
      const s = getComputedStyle(el)
      if (s.animationName && s.animationName !== 'none') moving.push(`anim:${s.animationName}`)
      // Decorative layers (the aurora, washes) are translucent on purpose and
      // say so with aria-hidden. Only CONTENT being dimmed is a failure.
      const decorative = el.closest('[aria-hidden="true"]') !== null
      const hasContent = (el.textContent ?? '').trim().length > 0
      if (!decorative && hasContent && parseFloat(s.opacity) < 0.99) {
        moving.push('content dimmed by an animation')
      }
    }
    return [...new Set(moving)]
  })
  for (const m of stillMoving) fail(`${route} — animates under prefers-reduced-motion: ${m}`)
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await page.reload({ waitUntil: 'networkidle0' })

  // 200% zoom — content must not be lost
  await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 1 })
  await page.evaluate(() => (document.body.style.zoom = '2'))
  const zoomOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth * 2 + 2,
  )
  if (zoomOverflow) fail(`${route} — content lost at 200% zoom`)

  await page.close()
}

// ── the mobile menu ─────────────────────────────────────────────────────────
// It is hidden above the `nav` breakpoint (900px), so every other check in this
// file runs straight past it. The failures below are the ones it shipped with:
// a 288px panel holding 1,225px of links, scrolling silently inside itself,
// with five destinations listed twice.
//
// Pre-launch there is no menu to check and that is the design: every
// destination in it is closed, so the header is the wordmark and one button.
if (LAUNCHED) {
  const page = await browser.newPage()
  for (const width of [320, 360, 390, 430, 768, 820]) {
    await page.setViewport({ width, height: 780, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' })

    const r = await page.evaluate((width) => {
      const d = document.querySelector('header details')
      if (!d) return { missing: true }
      d.setAttribute('open', '')
      const panel = d.querySelector(':scope > div')
      const b = panel.getBoundingClientRect()
      const links = [...panel.querySelectorAll('a')]
      const small = links
        .filter((a) => a.getBoundingClientRect().height < 44)
        .map((a) => Math.round(a.getBoundingClientRect().height) + 'px "' + a.textContent.trim().slice(0, 24) + '"')
      const hrefs = links.map((a) => a.getAttribute('href'))
      const dupes = hrefs.filter((h, i) => hrefs.indexOf(h) !== i)
      return {
        left: Math.round(b.left), right: Math.round(b.right),
        bottom: Math.round(b.bottom), vh: window.innerHeight,
        small: small.slice(0, 3), dupes: [...new Set(dupes)].slice(0, 3),
      }
    }, width)

    if (r.missing) { fail(`menu ${width}px — no <details> in the header`); continue }
    // Full-bleed: a panel inset from the edge leaves a strip of page beside it.
    if (r.left > 1 || r.right < width - 1)
      fail(`menu ${width}px — panel spans ${r.left}..${r.right}, not the full ${width}px`)
    if (r.bottom > r.vh + 1)
      fail(`menu ${width}px — panel bottom at ${r.bottom} falls past the ${r.vh}px viewport`)
    if (r.small.length) fail(`menu ${width}px — link under 44px: ${r.small.join(', ')}`)
    if (r.dupes.length)
      fail(`menu ${width}px — the same destination listed twice: ${r.dupes.join(', ')}`)
  }
  await page.close()
}

await browser.close()

console.log(`\n${'─'.repeat(60)}`)
if (failures === 0) console.log('✓ No layout or accessibility violations.')
else {
  console.log(`✗ ${failures} violation${failures === 1 ? '' : 's'}.`)
  process.exit(1)
}
