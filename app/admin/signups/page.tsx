/**
 * Launch signups — internal dashboard.
 *
 * Behind HTTP Basic auth (see middleware.ts), noindex, never cached. It lists
 * real email addresses, so it is treated as personal data throughout: nothing
 * is sent to the client beyond what is rendered, and the Resend key stays on
 * the server.
 *
 * Chart decisions, deliberate:
 *  - Headline numbers are stat tiles, not a chart. A single number does not
 *    need a plot to be read.
 *  - Signups per day is ONE series, so there is no legend and no categorical
 *    palette — the title names the series. Colour validated against the light
 *    surface before use.
 *  - Every day in the window gets a bucket, including zeros. A bar chart that
 *    silently skips empty days makes sporadic signups look steady.
 *  - The table below is the accessible view of the same data, not an extra.
 */
import type { Metadata } from 'next'
import { Section, Eyebrow, TwoTone, Stat, StatRow, Button, Card } from '@/components/ui'
import { getSignups } from '@/content/signups'
import { TriangleAlert, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Launch signups',
  robots: { index: false, follow: false, nocache: true },
}

const fmtDay = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })
const fmtFull = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function SignupsPage() {
  const r = await getSignups(30)

  if (!r.ok) {
    return (
      <Section tone="ground" space="normal">
        <Eyebrow>Launch signups</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Cannot reach the signup list."
          rest="The site itself is unaffected."
          className="mt-4"
        />
        <Card className="mt-8 p-6">
          <p className="text-body flex items-start gap-3 text-ink">
            <TriangleAlert className="mt-1 size-5 shrink-0 text-triage-warn" aria-hidden="true" />
            <span>{r.error}</span>
          </p>
          <p className="text-small mt-4 text-ink-mute">
            Run <code className="rounded-xs bg-sunk px-1.5 py-0.5">npm run check:resend</code>{' '}
            locally to see which part is wrong. Signups are still written to the server log
            meanwhile, so nothing is being lost.
          </p>
        </Card>
      </Section>
    )
  }

  // Bar geometry. A fixed 4px minimum on non-zero days keeps a single signup
  // visible; without it, one signup against a tall peak renders as nothing.
  const H = 150
  const scale = (n: number) => (r.peakDay === 0 ? 0 : Math.max(n === 0 ? 0 : 4, (n / r.peakDay) * H))

  const csv = [
    'email,created_at,unsubscribed',
    ...r.signups.map((s) => `${s.email},${s.createdAt.toISOString()},${s.unsubscribed}`),
  ].join('\n')

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Launch signups."
          rest={r.audienceName ? `Resend audience “${r.audienceName}”.` : undefined}
          className="mt-4"
        />

        <div className="mt-10">
          <StatRow>
            <Stat value={r.total} label="Total signups" emphasis />
            <Stat value={r.last24h} label="In the last 24 hours" />
            <Stat value={r.last7d} label="In the last 7 days" />
            <Stat value={r.unsubscribed} label="Unsubscribed" />
          </StatRow>
        </div>
      </Section>

      {/* ── Signups per day ─────────────────────────────────────────────── */}
      <Section tone="sunk" space="tight">
        <h2 className="text-h2 font-bold text-ink">Signups per day</h2>
        <p className="text-small mt-2 text-ink-mute">
          Last 30 days. Days with no signups are shown as gaps, not skipped.
        </p>

        <Card className="mt-6 p-6 md:p-8">
          {r.total === 0 ? (
            <p className="text-body text-ink-soft">
              No signups yet. The form is live; this fills in as people use it.
            </p>
          ) : (
            <>
              <div
                className="flex h-[150px] items-end gap-[2px]"
                role="img"
                aria-label={`Bar chart of signups per day over the last 30 days. Peak ${r.peakDay} in a day. ${r.last30d} signups in the period. The table below lists every signup.`}
              >
                {r.daily.map((d) => (
                  <div
                    key={d.date.toISOString()}
                    className="group relative flex flex-1 items-end"
                    style={{ height: `${H}px` }}
                  >
                    <div
                      className="w-full rounded-t-[4px] bg-accent transition-safe group-hover:bg-accent-hover"
                      style={{ height: `${scale(d.count)}px` }}
                    />
                    {/* Hover detail. An HTML chart is interactive by default. */}
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-small text-white group-hover:block">
                      {d.count} on {fmtDay.format(d.date)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between border-t border-rule pt-3">
                <span className="text-small text-ink-mute">
                  {fmtDay.format(r.daily[0].date)}
                </span>
                <span className="text-small text-ink-mute">
                  peak <span className="tnum font-semibold text-ink">{r.peakDay}</span> in a day
                </span>
                <span className="text-small text-ink-mute">
                  {fmtDay.format(r.daily[r.daily.length - 1].date)}
                </span>
              </div>
            </>
          )}
        </Card>
      </Section>

      {/* ── The list ────────────────────────────────────────────────────── */}
      <Section tone="ground" space="tight">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-h2 font-bold text-ink">Every signup</h2>
            <p className="text-small mt-2 text-ink-mute">
              Newest first. This is personal data: do not paste it anywhere, and do not export it
              except to run the launch email.
            </p>
          </div>
          {r.total > 0 && (
            <Button
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
              variant="secondary"
              icon={Download}
            >
              Download CSV
            </Button>
          )}
        </div>

        <div className="mt-6 w-full min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-body">
            <caption className="sr-only">
              Every launch signup, newest first, with the date it was received.
            </caption>
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="pb-3 font-semibold text-ink">Email</th>
                <th scope="col" className="pb-3 font-semibold text-ink">Received</th>
                <th scope="col" className="pb-3 text-right font-semibold text-ink">Status</th>
              </tr>
            </thead>
            <tbody>
              {r.signups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-ink-mute">
                    Nothing yet.
                  </td>
                </tr>
              ) : (
                r.signups.map((s) => (
                  <tr key={s.id} className="border-b border-rule">
                    <td className="py-3.5 text-ink">{s.email}</td>
                    <td className="tnum py-3.5 text-ink-soft">{fmtFull.format(s.createdAt)}</td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`text-small font-medium ${
                          s.unsubscribed ? 'text-ink-mute' : 'text-triage-safe'
                        }`}
                      >
                        {s.unsubscribed ? 'Unsubscribed' : 'Subscribed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-small measure-wide mt-8 text-ink-mute">
          Under the NDPR these addresses are held on the basis of consent given at signup.{' '}
          <strong className="font-semibold text-ink">
            /privacy commits to deleting the whole list within 30 days of launch
          </strong>
          , and to deleting any single address on request. That promise is only true if someone
          actually does it.
        </p>
      </Section>
    </>
  )
}
