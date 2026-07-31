/**
 * Signup data for the admin dashboard.
 *
 * Server-only. The Resend key is read here and never crosses to the client —
 * the page is a server component and only renders derived numbers and the list.
 */
import 'server-only'
import { Resend } from 'resend'

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
  email: string
  createdAt: Date
  unsubscribed: boolean
}

export type SignupReport = {
  ok: boolean
  error?: string
  audienceName?: string
  signups: Signup[]
  total: number
  subscribed: number
  unsubscribed: number
  last24h: number
  last7d: number
  last30d: number
  /** Oldest → newest, one entry per day, gaps filled with zero. */
  daily: { date: Date; count: number }[]
  peakDay: number
}

const DAY = 24 * 60 * 60 * 1000

export async function getSignups(days = 30): Promise<SignupReport> {
  const empty: SignupReport = {
    ok: false,
    signups: [],
    total: 0,
    subscribed: 0,
    unsubscribed: 0,
    last24h: 0,
    last7d: 0,
    last30d: 0,
    daily: [],
    peakDay: 0,
  }

  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!key || !audienceId) {
    return { ...empty, error: 'RESEND_API_KEY or RESEND_AUDIENCE_ID is not set on this deployment.' }
  }

  try {
    const resend = new Resend(key)

    const [raw, audiencesRes] = await Promise.all([
      fetchContacts(key, audienceId),
      resend.audiences.list(),
    ])

    const audienceName = audiencesRes.data?.data?.find((a) => a.id === audienceId)?.name

    const signups: Signup[] = raw
      .map((c) => ({
        id: String(c.id),
        email: String(c.email),
        createdAt: parseResendDate(c.created_at),
        unsubscribed: Boolean(c.unsubscribed),
      }))
      .filter((s) => !Number.isNaN(s.createdAt.getTime()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const now = Date.now()
    const since = (ms: number) => signups.filter((s) => now - s.createdAt.getTime() <= ms).length

    // One bucket per day so the axis is continuous. A bar chart that silently
    // skips empty days overstates how steady the signups are.
    const start = new Date(now - (days - 1) * DAY)
    start.setHours(0, 0, 0, 0)
    const buckets = new Map<number, number>()
    for (let i = 0; i < days; i++) buckets.set(start.getTime() + i * DAY, 0)
    for (const s of signups) {
      const d = new Date(s.createdAt)
      d.setHours(0, 0, 0, 0)
      const k = d.getTime()
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1)
    }
    const daily = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([t, count]) => ({ date: new Date(t), count }))

    return {
      ok: true,
      audienceName,
      signups,
      total: signups.length,
      subscribed: signups.filter((s) => !s.unsubscribed).length,
      unsubscribed: signups.filter((s) => s.unsubscribed).length,
      last24h: since(DAY),
      last7d: since(7 * DAY),
      last30d: since(30 * DAY),
      daily,
      peakDay: Math.max(0, ...daily.map((d) => d.count)),
    }
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : 'Could not reach Resend.' }
  }
}
