import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader, Section } from '@/components/ui'
import { UrgencyBadge, Disclaimer } from '@/components/clinical'
import { getAllConditions, filterConditions } from '@/content/conditions'
import { URGENCY_COPY, URGENCY_ORDER } from '@/content/urgency'
import { RECEIPTS } from '@/content/site'

export const metadata: Metadata = {
  title: `All ${RECEIPTS.conditions} conditions`,
  description: `The ${RECEIPTS.conditions} conditions in WellaPath's Nigerian knowledge base. Every page leads with the danger signs and what to do next, never with a diagnosis.`,
}

/** Filters are links, not JavaScript. The page works with scripting disabled. */
function FilterBar({ active }: { active: { urgency?: string; seasonal?: string } }) {
  const chip =
    'transition-safe inline-flex min-h-12 items-center rounded-md border px-3.5 text-body'
  const on = 'border-accent-ink bg-accent-wash font-semibold text-accent-ink'
  const off = 'border-rule bg-card text-ink-soft hover:border-field-border hover:text-ink'
  const isAll = !active.urgency && !active.seasonal

  return (
    <nav aria-label="Filter conditions" className="flex flex-wrap gap-2">
      <Link href="/conditions" className={`${chip} ${isAll ? on : off}`}>
        All {RECEIPTS.conditions}
      </Link>
      {URGENCY_ORDER.map((u) => (
        <Link
          key={u}
          href={`/conditions?urgency=${u}`}
          className={`${chip} ${active.urgency === u ? on : off}`}
        >
          {URGENCY_COPY[u].label}
        </Link>
      ))}
      <Link
        href="/conditions?seasonal=true"
        className={`${chip} ${active.seasonal === 'true' ? on : off}`}
      >
        Seasonal
      </Link>
    </nav>
  )
}

export default async function ConditionsIndex({
  searchParams,
}: {
  searchParams: Promise<{ urgency?: string; seasonal?: string }>
}) {
  const params = await searchParams
  const all = getAllConditions()
  const shown = filterConditions(all, params)

  return (
    <>
      <PageHeader
        eyebrow="Conditions"
        lead={`${RECEIPTS.conditions} conditions, written for Nigeria.`}
        rest="Each page starts with the danger signs that mean go now, then explains what the symptoms could mean and how urgently to act. None of them tells you what you have."
      />

      <Section tone="ground">
        <FilterBar active={params} />

        <p className="text-small tnum mt-6 text-ink-mute" role="status">
          Showing {shown.length} of {all.length} conditions
        </p>

        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/conditions/${c.slug}`}
                className="transition-safe flex h-full flex-col rounded-xl bg-card ring ring-ink/8 p-5 hover:border-field-border"
              >
                <UrgencyBadge urgency={c.urgency} />
                <h2 className="text-h3 mt-3 font-bold text-ink">{c.name}</h2>
                {c.localExpressions.length > 0 && (
                  <p className="text-small mt-2 text-ink-mute">
                    Also called: {c.localExpressions.slice(0, 3).join(', ')}
                  </p>
                )}
                <p className="text-small mt-auto pt-4 text-ink-soft">
                  <span className="tnum">{c.dangerSigns.length}</span> danger sign
                  {c.dangerSigns.length === 1 ? '' : 's'}
                  {c.seasonal.length > 0 && ' · Seasonal'}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {shown.length === 0 && (
          <p className="text-body mt-6 text-ink-soft">
            No conditions match that filter.{' '}
            <Link href="/conditions" className="text-accent-ink underline underline-offset-2">
              Show all {all.length}
            </Link>
            .
          </p>
        )}

        <Disclaimer className="mt-12" />
      </Section>
    </>
  )
}
