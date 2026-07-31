#!/usr/bin/env node
/**
 * Preflight for the launch-signup integration.
 *
 * Submitting the form to find out whether Resend is wired up is a slow and
 * ambiguous test: every failure looks identical to the visitor, by design. This
 * checks each precondition separately and says which one is wrong.
 *
 *   npm run check:resend
 *
 * Reads .env.local if present, otherwise the ambient environment (so it also
 * works in CI, or on Vercel via `vercel env pull`). Never prints the key.
 */
import { readFileSync, existsSync } from 'node:fs'
import { Resend } from 'resend'

// Minimal .env.local reader — no dependency needed for five lines of parsing.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const key = process.env.RESEND_API_KEY
const audienceId = process.env.RESEND_AUDIENCE_ID
const mask = (v) => (v ? `${v.slice(0, 6)}…${v.slice(-4)} (${v.length} chars)` : '(unset)')

let failed = false
const fail = (what, why, fix) => {
  failed = true
  console.log(`\n  ✗ ${what}\n    ${why}\n    → ${fix}`)
}

console.log('\nResend preflight\n' + '─'.repeat(60))
console.log(`  RESEND_API_KEY      ${mask(key)}`)
console.log(`  RESEND_AUDIENCE_ID  ${audienceId ?? '(unset)'}`)

if (!key) {
  fail(
    'RESEND_API_KEY is not set',
    'The route cannot reach Resend, so every signup returns an honest error.',
    'Add it to .env.local for local dev, and to Vercel → Settings → Environment Variables.',
  )
}
if (!audienceId) {
  fail(
    'RESEND_AUDIENCE_ID is not set',
    'There is nowhere to put the contact.',
    'Create an audience at resend.com/audiences and copy its ID.',
  )
}
if (key && !key.startsWith('re_')) {
  fail(
    'RESEND_API_KEY does not look like a Resend key',
    'Resend keys begin with "re_".',
    'Check you copied the API key and not the audience ID or a webhook secret.',
  )
}
if (audienceId && !/^[0-9a-f-]{36}$/i.test(audienceId)) {
  fail(
    'RESEND_AUDIENCE_ID is not a UUID',
    `Got "${audienceId}". Audience IDs look like 78261eea-8f8b-4381-83c6-79fa7120f1cf.`,
    'Copy the ID from resend.com/audiences, not the audience name.',
  )
}

if (!failed) {
  try {
    const resend = new Resend(key)
    // Read-only: proves the key works AND the audience exists, without writing.
    const { data, error } = await resend.contacts.list({ audienceId })

    if (error) {
      const msg = String(error.message ?? '')
      if (/api key/i.test(msg)) {
        fail('Resend rejected the API key', msg, 'Regenerate it at resend.com/api-keys.')
      } else if (/not found/i.test(msg)) {
        fail(
          'That audience does not exist on this account',
          msg,
          'Check the ID, and that the key belongs to the same Resend account.',
        )
      } else {
        fail('Resend returned an error', msg, 'See https://resend.com/docs.')
      }
    } else {
      const n = data?.data?.length ?? 0
      console.log(`\n  ✓ Key valid, audience reachable. ${n} contact${n === 1 ? '' : 's'} on it.`)
    }
  } catch (e) {
    fail('Could not reach Resend', String(e?.message ?? e), 'Check network access.')
  }
}

console.log('\n' + '─'.repeat(60))
if (failed) {
  console.log('✗ Signups will fail until the above is fixed.')
  console.log('  Addresses are still written to the server log, so nothing is lost meanwhile.\n')
  process.exit(1)
}
console.log('✓ Launch signup is wired up correctly.\n')
