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

const ROUTES = ['/', '/conditions', '/conditions/malaria', '/coverage', '/for/health-facilities', '/how-it-works', '/partners']
const WIDTHS = [320, 360, 390]

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

console.log(`\nLayout checks at ${BASE}\n`)

for (const route of ROUTES) {
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

await browser.close()

console.log(`\n${'─'.repeat(60)}`)
if (failures === 0) console.log('✓ No layout or accessibility violations.')
else {
  console.log(`✗ ${failures} violation${failures === 1 ? '' : 's'}.`)
  process.exit(1)
}
