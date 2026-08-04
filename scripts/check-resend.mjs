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

    // List the audiences and check membership explicitly.
    //
    // An earlier version used `contacts.list({ audienceId })` and reported a
    // PASS for an audience that did not exist — that call resolves against a
    // /segments/ path and returns success for an unknown id. A preflight that
    // says "correctly wired" when it is not is worse than no preflight, so this
    // now compares against the real list and prints it.
    const { data, error } = await resend.audiences.list()

    if (error) {
      const msg = String(error.message ?? '')
      if (/api key/i.test(msg)) {
        fail('Resend rejected the API key', msg, 'Regenerate it at resend.com/api-keys.')
      } else {
        fail('Resend returned an error', msg, 'See https://resend.com/docs.')
      }
    } else {
      const list = data?.data ?? []
      const match = list.find((a) => a.id === audienceId)

      if (!match) {
        console.log('\n  Audiences on this account:')
        if (list.length === 0) console.log('    (none — create one at resend.com/audiences)')
        for (const a of list) console.log(`    ${a.id}  ${a.name}`)
        fail(
          'RESEND_AUDIENCE_ID does not match any audience on this account',
          `Configured ${audienceId}, which is not in the list above.`,
          list.length === 1
            ? `Use ${list[0].id} (${list[0].name}), or create a dedicated launch audience.`
            : 'Copy an ID from the list above, or check the key belongs to the right account.',
        )
      } else {
        // REST, not resend.contacts.list(): that method hits a /segments/ path
        // and returned 0 for an audience that held 3 contacts.
        const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
          headers: { Authorization: `Bearer ${key}` },
        })
        const n = res.ok ? ((await res.json()).data ?? []).length : 0
        console.log(
          `\n  ✓ Key valid. Audience "${match.name}" found, ${n} contact${n === 1 ? '' : 's'} on it.`,
        )
      }
    }
  } catch (e) {
    fail('Could not reach Resend', String(e?.message ?? e), 'Check network access.')
  }
}

// ── The database ────────────────────────────────────────────────────────
// Postgres is the source of truth now: without it, nothing is stored at all,
// and a WhatsApp-only signup has nowhere to go. Checked after Resend because
// this is the one that actually loses data.
console.log('\n' + '─'.repeat(60))
console.log('Database\n')

// Same order as content/db.ts. The Neon integration on Vercel sets POSTGRES_URL
// and never DATABASE_URL, so checking only the latter reports a working
// database as missing.
const dbUrl =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
if (!dbUrl) {
  fail(
    'No Postgres URL is set (DATABASE_URL or POSTGRES_URL)',
    'Nothing is being stored. Every signup is logged to the server console and lost on restart.',
    'Create a Postgres database (Vercel > Storage > Neon). The integration sets POSTGRES_URL\n' +
      '  on the project itself; for local use copy the pooled string into .env.local as DATABASE_URL.',
  )
} else {
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(dbUrl)
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM signups`
    console.log(`  ✓ Connected. ${n} signup${n === 1 ? '' : 's'} stored.`)
  } catch (e) {
    const msg = String(e?.message ?? e)
    if (/relation "signups" does not exist/i.test(msg)) {
      console.log('  ✓ Connected. The signups table does not exist yet; the first signup creates it.')
    } else {
      fail('Could not reach the database', msg, 'Check the connection string is the pooled one.')
    }
  }
}

console.log('\n' + '─'.repeat(60))
if (failed) {
  console.log('✗ Signups will fail until the above is fixed.')
  console.log('  Addresses are still written to the server log, so nothing is lost meanwhile.\n')
  process.exit(1)
}
console.log('✓ Launch signup is wired up correctly.\n')
