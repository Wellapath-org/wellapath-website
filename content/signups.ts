/**
 * Signup data for the admin dashboard.
 *
 * Server-only. Neither the Resend key nor the database URL crosses to the
 * client: the page is a server component and renders only derived numbers and
 * the list itself.
 *
 * ── Two sources, deliberately ──────────────────────────────────────────────
 *
 * Postgres is the source of truth. It is the only store that can hold a
 * WhatsApp-only signup, and it is the single place /privacy's deletion promise
 * has to be honoured.
 *
 * Resend is still read, and merged in, because contacts collected before the
 * database existed live only there. Dropping them silently would mean a
 * dashboard that under-reports the real list, which is the one failure mode
 * this file already learned the hard way. Anything present in both is matched
 * on email and counted once, with the Postgres row winning.
 */
import 'server-only'
import { Resend } from 'resend'
import { listSignups as listDbSignups, dbConfigured, type SignupRow } from './db'

/**
 * Contacts are fetched over REST, not through `resend.contacts.list()`.
 *
 * In resend@6.18.x that SDK method resolves against a /segments/{id}/contacts
 * path and returns an empty list for a perfectly valid audience — it reported
 * zero while the audience actually held three contacts, and separately reported
 * success for an audience id that did not exist. Both are silent wrong answers,
 * which is the worst failure mode for a list people are counting on.
 *
 * The documented /audiences/{id}/contacts endpoint returns the real data, so
 * that is what this uses. The SDK is still used for `audiences.list()`, which
 * behaves correctly.
 */
type RawContact = {
  id: string
  email: string
  created_at: string
  unsubscribed: boolean
}

async function fetchContacts(key: string, audienceId: string): Promise<RawContact[]> {
  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }
  const json = (await res.json()) as { data?: RawContact[] }
  return json.data ?? []
}

/**
 * Resend returns "2026-07-31 18:39:46.993256+00", which is not ISO-8601 twice
 * over: the separator is a space, and the offset has no minutes. `new Date()`
 * returns Invalid Date for it.
 *
 * That mattered more than it looks. The mapping below filters out unparseable
 * dates, so an invalid parse did not surface as an error — it silently produced
 * a dashboard reporting zero signups while the audience held three. A wrong
 * number shown confidently is worse than an error.
 */
function parseResendDate(value: string): Date {
  return new Date(
    String(value)
      .trim()
      .replace(' ', 'T')
      .replace(/([+-]\d{2})$/, '$1:00'),
  )
}

export type Signup = {
  id: string
  email: string | null
  /** E.164, +234XXXXXXXXXX. Null when the person signed up by email only. */
  whatsapp: string | null
  /** 0803 123 4567. Null when there is no number. */
  whatsappDisplay: string | null
  createdAt: Date
  unsubscribed: boolean
  /** Where the row came from, so a stale Resend-only contact is visible as one. */
  store: 'db' | 'resend'
  source: string | null
}

export type SignupReport = {
  ok: boolean
  error?: string
  /** Non-fatal problems: one store answered, the other did not. */
  warnings: string[]
  audienceName?: string
  signups: Signup[]
  total: number
  withEmail: number
  withWhatsapp: number
  whatsappOnly: number
  unsubscribed: number
  last24h: number
  last7d: number
  last30d: number
  /** Oldest → newest, one entry per day, gaps filled with zero. */
  daily: { date: Date; email: number; whatsapp: number; total: number }[]
  peakDay: number
}

const DAY = 24 * 60 * 60 * 1000

function fromDb(r: SignupRow): Signup {
  return {
    id: `db-${r.id}`,
    email: r.email,
    whatsapp: r.whatsapp,
    whatsappDisplay: r.whatsappDisplay,
    createdAt: r.createdAt,
    unsubscribed: false,
    store: 'db',
    source: r.source,
  }
}

export async function getSignups(days = 30): Promise<SignupReport> {
  const empty: SignupReport = {
    ok: false,
    warnings: [],
    signups: [],
    total: 0,
    withEmail: 0,
    withWhatsapp: 0,
    whatsappOnly: 0,
    unsubscribed: 0,
    last24h: 0,
    last7d: 0,
    last30d: 0,
    daily: [],
    peakDay: 0,
  }

  const warnings: string[] = []

  // ── Postgres ────────────────────────────────────────────────────────────
  let dbRows: SignupRow[] = []
  let dbOk = false
  if (dbConfigured()) {
    try {
      dbRows = await listDbSignups()
      dbOk = true
    } catch (e) {
      warnings.push(
        `The database could not be read: ${e instanceof Error ? e.message : 'unknown error'}`,
      )
    }
  } else {
    warnings.push('DATABASE_URL is not set, so no signups are being stored. Set it and redeploy.')
  }

  // ── Resend, for anything collected before the database existed ──────────
  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  let resendRows: RawContact[] = []
  let resendOk = false
  let audienceName: string | undefined

  if (key && audienceId) {
    try {
      const resend = new Resend(key)
      const [raw, audiencesRes] = await Promise.all([
        fetchContacts(key, audienceId),
        resend.audiences.list(),
      ])
      resendRows = raw
      audienceName = audiencesRes.data?.data?.find((a) => a.id === audienceId)?.name
      resendOk = true
    } catch (e) {
      warnings.push(
        `Resend could not be read: ${e instanceof Error ? e.message : 'unknown error'}`,
      )
    }
  } else {
    warnings.push('RESEND_API_KEY or RESEND_AUDIENCE_ID is not set, so the launch email has no list.')
  }

  if (!dbOk && !resendOk) {
    return {
      ...empty,
      warnings,
      error: 'Neither the database nor Resend could be reached, so there is nothing to show.',
    }
  }

  // ── Merge, email-matched, Postgres winning ──────────────────────────────
  const merged: Signup[] = dbRows.map(fromDb)
  const known = new Set(merged.map((s) => s.email).filter(Boolean) as string[])
  const unsubscribedIn = new Set(
    resendRows.filter((c) => c.unsubscribed).map((c) => String(c.email).toLowerCase()),
  )

  for (const s of merged) {
    if (s.email && unsubscribedIn.has(s.email)) s.unsubscribed = true
  }

  for (const c of resendRows) {
    const email = String(c.email).toLowerCase()
    if (known.has(email)) continue
    const createdAt = parseResendDate(c.created_at)
    if (Number.isNaN(createdAt.getTime())) continue
    merged.push({
      id: `resend-${c.id}`,
      email,
      whatsapp: null,
      whatsappDisplay: null,
      createdAt,
      unsubscribed: Boolean(c.unsubscribed),
      store: 'resend',
      source: null,
    })
  }

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const now = Date.now()
  const since = (ms: number) => merged.filter((s) => now - s.createdAt.getTime() <= ms).length

  // One bucket per day so the axis is continuous. A bar chart that silently
  // skips empty days overstates how steady the signups are.
  const start = new Date(now - (days - 1) * DAY)
  start.setHours(0, 0, 0, 0)
  const buckets = new Map<number, { email: number; whatsapp: number }>()
  for (let i = 0; i < days; i++) buckets.set(start.getTime() + i * DAY, { email: 0, whatsapp: 0 })
  for (const s of merged) {
    const d = new Date(s.createdAt)
    d.setHours(0, 0, 0, 0)
    const b = buckets.get(d.getTime())
    if (!b) continue
    // Each signup lands in exactly one series, so the stack totals the day.
    // WhatsApp wins the tie because that is the channel being measured.
    if (s.whatsapp) b.whatsapp++
    else b.email++
  }
  const daily = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({ date: new Date(t), ...v, total: v.email + v.whatsapp }))

  return {
    ok: true,
    warnings,
    audienceName,
    signups: merged,
    total: merged.length,
    withEmail: merged.filter((s) => s.email).length,
    withWhatsapp: merged.filter((s) => s.whatsapp).length,
    whatsappOnly: merged.filter((s) => s.whatsapp && !s.email).length,
    unsubscribed: merged.filter((s) => s.unsubscribed).length,
    last24h: since(DAY),
    last7d: since(7 * DAY),
    last30d: since(30 * DAY),
    daily,
    peakDay: Math.max(0, ...daily.map((d) => d.total)),
  }
}
