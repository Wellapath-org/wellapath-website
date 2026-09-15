/**
 * Mobile parser checks.
 *
 * This parser decides whether a person can sign up at all. §8.3 says "never
 * reject a valid number on formatting", and the only way to keep that promise
 * is to list the shapes people actually type and assert on every one of them.
 *
 * A rejection here is not a cosmetic bug. Someone giving a number instead of an
 * email is, by definition, the person with fewer routes to us.
 *
 * Nigeria is the default and keeps its strict carrier rules; a number carrying
 * its own country code (+44…, +1…, 00…) is accepted from any country on E.164
 * shape alone.
 *
 *   npm run check:phone
 */
import { parseMobile } from '../content/phone.ts'

const E164 = '+2348031234567'

/** Every shape of ONE number, all of which must normalise identically. */
const SAME_NUMBER = [
  '08031234567',
  '0803 123 4567',
  '0803-123-4567',
  '0803.123.4567',
  '(0803) 123 4567',
  '+2348031234567',
  '+234 803 123 4567',
  '+234-803-123-4567',
  '234 803 123 4567',
  '8031234567',
  '803 123 4567',
  '2340803123 4567', // country code AND the trunk zero, a real paste artefact
  '  0803  123  4567  ',
]

/** One per network code block, so a whole carrier is never locked out. */
const VALID_PREFIXES = [
  ['0701 234 5678', '+2347012345678'],
  ['0711 234 5678', '+2347112345678'],
  ['0802 345 6789', '+2348023456789'],
  ['0812 345 6789', '+2348123456789'],
  ['0902 345 6789', '+2349023456789'],
  ['0912 345 6789', '+2349123456789'],
]

/** Numbers that told us their country. Any country is welcome. */
const INTERNATIONAL = [
  ['+1 415 555 0132', '+14155550132', 'United States'],
  ['+44 7911 123456', '+447911123456', 'United Kingdom'],
  ['+233 24 123 4567', '+233241234567', 'Ghana'],
  ['+27 82 123 4567', '+27821234567', 'South Africa'],
  ['0044 7911 123456', '+447911123456', '00 as the international prefix'],
  ['+91 98765 43210', '+919876543210', 'India'],
]

const REJECT = [
  ['', 'nothing typed'],
  ['   ', 'whitespace only'],
  ['abc', 'letters only'],
  ['0803123', 'too short'],
  ['080312345678901', 'too long'],
  ['1 415 555 0132', 'foreign number without its + or 00, so read as Nigerian'],
  ['0603 123 4567', 'landline-style prefix, not a mobile'],
  ['0123456789', 'not a mobile prefix'],
  ['+1234', 'country code alone, far too short'],
  ['+1 234 567 8901 2345 6', 'longer than E.164 allows'],
  ['+0 803 123 4567', 'a country code cannot begin with 0'],
  ['+234 603 123 4567', 'Nigerian code, so Nigerian carrier rules still apply'],
]

let failed = 0
const fail = (msg) => {
  failed++
  console.log(`  ✗ ${msg}`)
}

console.log('\nMobile parser\n')

for (const input of SAME_NUMBER) {
  const r = parseMobile(input)
  if (!r.ok) fail(`${JSON.stringify(input)} was rejected: ${r.reason}`)
  else if (r.e164 !== E164) fail(`${JSON.stringify(input)} became ${r.e164}, expected ${E164}`)
}
console.log(`  ✓ ${SAME_NUMBER.length} written forms of one number all normalise to ${E164}`)

for (const [input, want] of VALID_PREFIXES) {
  const r = parseMobile(input)
  if (!r.ok) fail(`${JSON.stringify(input)} was rejected: ${r.reason}`)
  else if (r.e164 !== want) fail(`${JSON.stringify(input)} became ${r.e164}, expected ${want}`)
}
console.log(`  ✓ ${VALID_PREFIXES.length} network prefixes accepted`)

for (const [input, want, where] of INTERNATIONAL) {
  const r = parseMobile(input)
  if (!r.ok) fail(`${JSON.stringify(input)} (${where}) was rejected: ${r.reason}`)
  else if (r.e164 !== want) fail(`${JSON.stringify(input)} became ${r.e164}, expected ${want}`)
}
console.log(`  ✓ ${INTERNATIONAL.length} international numbers accepted`)

for (const [input, why] of REJECT) {
  const r = parseMobile(input)
  if (r.ok) fail(`${JSON.stringify(input)} (${why}) was accepted as ${r.e164}`)
}
console.log(`  ✓ ${REJECT.length} invalid inputs rejected`)

// The display form is what a Nigerian reader recognises as their own number.
const display = parseMobile(E164)
if (!display.ok || display.display !== '0803 123 4567') {
  fail(`display form is ${display.ok ? display.display : 'n/a'}, expected "0803 123 4567"`)
} else {
  console.log(`  ✓ display form reads 0803 123 4567, not ${E164}`)
}

console.log('\n' + '─'.repeat(60))
if (failed) {
  console.log(`✗ ${failed} failure${failed === 1 ? '' : 's'}. People will be turned away at signup.\n`)
  process.exit(1)
}
console.log('✓ Every accepted shape normalises, every invalid one is refused.\n')
