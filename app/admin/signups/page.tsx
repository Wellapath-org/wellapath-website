/**
 * Launch signups — internal dashboard.
 *
 * Behind HTTP Basic auth (see middleware.ts), noindex, never cached. It lists
 * real email addresses and phone numbers, so it is treated as personal data
 * throughout: nothing reaches the client beyond what is rendered, and neither
 * the Resend key nor the database URL leaves the server.
 *
 * Chart decisions, deliberate:
 *  - Headline numbers are stat tiles, not a chart. A single number does not
 *    need a plot to be read.
 *  - Signups per day is a stacked bar of two series, so a legend is present and
 *    both series are named. Identity is never colour alone. The two hues were
 *    validated against the card surface before use, not chosen by eye.
 *  - Each signup lands in exactly one series, so a stacked column equals that
 *    day's total. A person who gave both routes counts as WhatsApp, because
 *    the WhatsApp channel is the thing being measured.
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

const SERIES = [
  { key: 'whatsapp' as const, label: 'WhatsApp', className: 'bg-series-whatsapp' },
  { key: 'email' as const, label: 'Email only', className: 'bg-series-email' },
]

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
          {r.warnings.length > 0 && (
            <ul className="text-small mt-4 space-y-2 text-ink-mute">
              {r.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <p className="text-small mt-4 text-ink-mute">
            Run <code className="rounded-xs bg-sunk px-1.5 py-0.5">npm run check:resend</code>{' '}
            locally to see which part is wrong. Signups are still written to the server log
            meanwhile, so nothing is being lost.
          </p>
        </Card>
      </Section>
    )
  }

  // Bar geometry. A fixed 4px minimum on a non-zero segment keeps a single
  // signup visible; without it, one signup against a tall peak renders as
  // nothing. The 2px gap between stacked segments is a surface spacer, so two
  // adjacent fills never read as one block.
  const H = 150
  const seg = (n: number) => (r.peakDay === 0 || n === 0 ? 0 : Math.max(4, (n / r.peakDay) * H))

  const csv = [
    'email,whatsapp,received_at,unsubscribed,source,store',
    ...r.signups.map((s) =>
      [
        s.email ?? '',
        s.whatsapp ?? '',
        s.createdAt.toISOString(),
        s.unsubscribed,
        s.source ?? '',
        s.store,
      ].join(','),
    ),
  ].join('\n')

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Launch signups."
          rest={
            r.whatsappOnly > 0
              ? `${r.whatsappOnly} of them are reachable only on WhatsApp.`
              : 'Email and WhatsApp, in one list.'
          }
          className="mt-4"
        />

        {r.warnings.length > 0 && (
          <Card className="mt-8 p-6">
            <p className="text-body flex items-start gap-3 font-semibold text-ink">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-triage-warn" aria-hidden="true" />
              <span>The numbers below are real, but one part of the setup is incomplete.</span>
            </p>
            <ul className="text-small mt-3 space-y-2 pl-8 text-ink-soft">
              {r.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-10">
          <StatRow>
            <Stat value={r.total} label="Total signups" emphasis />
            <Stat value={r.withWhatsapp} label="Gave a WhatsApp number" />
            <Stat value={r.whatsappOnly} label="WhatsApp only, no email" />
            <Stat value={r.last7d} label="In the last 7 days" />
          </StatRow>
        </div>
      </Section>

      {/* ── Signups per day ─────────────────────────────────────────────── */}
      <Section tone="sunk" space="tight">
        <h2 className="text-h2 font-bold text-ink">Signups per day, by channel</h2>
        <p className="text-small mt-2 text-ink-mute">
          Last 30 days. Days with no signups are shown as gaps, not skipped. Anyone who gave a
          number counts under WhatsApp, even if they also gave an address.
        </p>

        <Card className="mt-6 p-6 md:p-8">
          {r.total === 0 ? (
            <p className="text-body text-ink-soft">
              No signups yet. The form is live; this fills in as people use it.
            </p>
          ) : (
            <>
              {/* Legend. Two series, so it is never optional. */}
              <ul className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
                {SERIES.map((s) => (
                  <li key={s.key} className="text-small flex items-center gap-2 text-ink-soft">
                    <span className={`size-3 rounded-xs ${s.className}`} aria-hidden="true" />
                    {s.label}
                    <span className="tnum font-semibold text-ink">
                      {s.key === 'whatsapp' ? r.withWhatsapp : r.total - r.withWhatsapp}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className="flex h-[150px] items-end gap-[2px]"
                role="img"
                aria-label={`Stacked bar chart of signups per day over the last 30 days, split into WhatsApp and email only. Peak ${r.peakDay} in a day. ${r.last30d} signups in the period. The table below lists every signup.`}
              >
                {r.daily.map((d) => (
                  <div
                    key={d.date.toISOString()}
                    className="group relative flex flex-1 flex-col justify-end gap-[2px]"
                    style={{ height: `${H}px` }}
                  >
                    <div
                      className="w-full rounded-t-[4px] bg-series-whatsapp"
                      style={{ height: `${seg(d.whatsapp)}px` }}
                    />
                    <div
                      className={`w-full bg-series-email ${d.whatsapp === 0 ? 'rounded-t-[4px]' : ''}`}
                      style={{ height: `${seg(d.email)}px` }}
                    />
                    {/* Hover detail. An HTML chart is interactive by default. */}
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-small text-white group-hover:block">
                      {fmtDay.format(d.date)}: {d.whatsapp} WhatsApp, {d.email} email
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between border-t border-rule pt-3">
                <span className="text-small text-ink-mute">{fmtDay.format(r.daily[0].date)}</span>
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
              except to run the launch message.
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
              Every launch signup, newest first, with the contact routes given and the date received.
            </caption>
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="pb-3 font-semibold text-ink">Email</th>
                <th scope="col" className="pb-3 font-semibold text-ink">WhatsApp</th>
                <th scope="col" className="pb-3 font-semibold text-ink">Received</th>
                <th scope="col" className="pb-3 text-right font-semibold text-ink">Status</th>
              </tr>
            </thead>
            <tbody>
              {r.signups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-ink-mute">
                    Nothing yet.
                  </td>
                </tr>
              ) : (
                r.signups.map((s) => (
                  <tr key={s.id} className="border-b border-rule">
                    <td className="py-3.5 text-ink">
                      {s.email ?? <span className="text-ink-mute">not given</span>}
                    </td>
                    <td className="tnum py-3.5 text-ink">
                      {s.whatsappDisplay ?? <span className="text-ink-mute">not given</span>}
                    </td>
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
          Under the NDPR these details are held on the basis of consent given at signup.{' '}
          <strong className="font-semibold text-ink">
            /privacy commits to deleting the whole list within 30 days of launch
          </strong>
          , and to deleting any single entry on request. That promise is only true if someone
          actually does it.
        </p>
      </Section>
    </>
  )
}
