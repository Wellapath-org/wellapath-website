/**
 * A condition page.
 *
 * The order below is WEBSITE_GUIDE §6.3, and it is not negotiable:
 *   1. Danger signs — go now      (before anything else; no scrolling required)
 *   2. What it is
 *   3. Common symptoms
 *   4. Who is most at risk
 *   5. When it's most common
 *   6. What to do next → disclaimer → app CTA
 *
 * Structured as "symptoms → how urgently to act", never "symptoms → likely
 * diagnosis". There is deliberately no field on this page for a diagnosis to go
 * in, which is the cheapest way to stop one appearing later.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Section, Card, Button } from '@/components/ui'
import { GetTheApp } from '@/components/chrome'
import { DangerSigns, Disclaimer, UrgencyBadge, UrgencyCard } from '@/components/clinical'
import { getAllConditions, getCondition } from '@/content/conditions'
import { assertRedFlagsReviewed } from '@/content/red-flag-labels'
import { URGENCY_COPY } from '@/content/urgency'
import { SITE, RECEIPTS } from '@/content/site'

export function generateStaticParams() {
  return getAllConditions().map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = getCondition(slug)
  if (!c) return {}

  // §12: target symptom language, not clinical names.
  const symptomWords = c.symptoms.slice(0, 4).map((s) => s.label.toLowerCase()).join(', ')

  return {
    title: `${c.name}: symptoms and how urgently to act`,
    description: `${c.name} in Nigeria: the danger signs that mean go now, common symptoms (${symptomWords}), who is most at risk, and how urgently to seek care. Not a diagnosis.`,
    keywords: [
      c.name.toLowerCase(),
      `${c.name.toLowerCase()} symptoms Nigeria`,
      ...c.localExpressions,
    ],
    alternates: { canonical: `/conditions/${c.slug}` },
  }
}

export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getCondition(slug)
  if (!c) notFound()

  // Hard stop in production while any danger sign on this page is unsigned.
  assertRedFlagsReviewed()

  const copy = URGENCY_COPY[c.urgency]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${c.name}: symptoms and how urgently to act`,
    url: `${SITE.url}/conditions/${c.slug}`,
    inLanguage: 'en-NG',
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    about: {
      '@type': 'MedicalCondition',
      name: c.name,
      alternateName: c.localExpressions,
      signOrSymptom: c.symptoms.map((s) => ({ '@type': 'MedicalSignOrSymptom', name: s.label })),
      typicalTest: undefined,
    },
    // The site never claims to diagnose; the page's purpose is triage guidance.
    mainContentOfPage: { '@type': 'WebPageElement', cssSelector: '#main' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="relative overflow-hidden border-b border-rule bg-ground">
        <div className="aurora-soft" aria-hidden="true" />
        <div className="relative z-1 mx-auto w-full max-w-4xl px-6 py-12 md:px-10 md:py-16">
          <nav aria-label="Breadcrumb" className="text-small mb-6">
            <Link href="/conditions" className="inline-flex min-h-12 items-center text-accent-ink underline underline-offset-2">
              All conditions
            </Link>
            <span className="mx-2 text-ink-mute" aria-hidden="true">
              /
            </span>
            <span className="text-ink-mute">{c.name}</span>
          </nav>

          <UrgencyBadge urgency={c.urgency} />
          <h1 className="text-display mt-4 font-bold text-ink">{c.name}</h1>
          <p className="text-h2 measure mt-3 font-normal text-ink-soft">{copy.headline}</p>

          {c.localExpressions.length > 0 && (
            <p className="text-body mt-5 text-ink-soft">
              <span className="font-semibold text-ink">You might call this:</span>{' '}
              {c.localExpressions.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* 1. DANGER SIGNS — first, always, never behind an interaction. */}
      <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8">
        <DangerSigns signs={c.dangerSigns} conditionName={c.name} />
      </div>

      <div className="mx-auto w-full max-w-4xl px-5 pb-16 md:px-8">
        {/* 2. What it is */}
        <section className="border-t border-rule pt-10">
          <h2 className="text-h2 font-bold text-ink">What this means</h2>
          <p className="text-body measure mt-4 text-ink-soft">{c.explanation}</p>
          <div className="mt-6">
            <UrgencyCard urgency={c.urgency} />
          </div>
        </section>

        {/* 3. Common symptoms */}
        {c.symptoms.length > 0 && (
          <section className="mt-12 border-t border-rule pt-10">
            <h2 className="text-h2 font-bold text-ink">Common symptoms</h2>
            <p className="text-body measure mt-3 text-ink-soft">
              In everyday words. Not everyone has all of these, and having them does not confirm
              anything on its own.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {c.symptoms.map((s) => (
                <li
                  key={s.token}
                  className="text-body rounded-md bg-card ring ring-ink/8 px-3 py-2 text-ink"
                >
                  {s.label}
                </li>
              ))}
            </ul>

            {(c.severity.severe.length > 0 || c.severity.moderate.length > 0) && (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {(['mild', 'moderate', 'severe'] as const).map((level) =>
                  c.severity[level].length > 0 ? (
                    <Card key={level} className="p-7">
                      <h3 className="text-label font-semibold uppercase text-ink-mute">
                        {level}
                      </h3>
                      <ul className="mt-3 space-y-1">
                        {c.severity[level].map((s) => (
                          <li key={s} className="text-body text-ink-soft">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null,
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. Who is most at risk */}
        {c.whoIsMostAtRisk.length > 0 && (
          <section className="mt-12 border-t border-rule pt-10">
            <h2 className="text-h2 font-bold text-ink">Who is most at risk</h2>
            <p className="text-body measure mt-3 text-ink-soft">
              For these groups, WellaPath raises the urgency, so the same symptoms get a more urgent
              answer, because these groups get worse faster.
            </p>
            <ul className="mt-6 space-y-4">
              {c.whoIsMostAtRisk.map((m) => (
                <li key={m.modifier} className="border-l border-rule pl-5">
                  <h3 className="text-body font-semibold text-ink">{m.label}</h3>
                  <p className="text-body mt-1 text-ink-soft">{m.note}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. When it's most common */}
        {c.seasonal.length > 0 && (
          <section className="mt-12 border-t border-rule pt-10">
            <h2 className="text-h2 font-bold text-ink">When it&apos;s most common</h2>
            <ul className="mt-6 space-y-4">
              {c.seasonal.map((s) => (
                <li key={s.season} className="rounded-xl bg-card ring ring-ink/8 p-5">
                  <h3 className="text-body font-semibold text-ink">{s.label}</h3>
                  <p className="text-body mt-1 text-ink-soft">{s.note}</p>
                </li>
              ))}
            </ul>
            <p className="text-small mt-4 text-ink-mute">
              WellaPath adjusts its assessment by season. {RECEIPTS.conditions} conditions are in the
              knowledge base;{' '}
              <Link
                href="/conditions?seasonal=true"
                className="text-accent-ink underline underline-offset-2"
              >
                see all the seasonal ones
              </Link>
              .
            </p>
          </section>
        )}

        {/* 6. What to do next → disclaimer → CTA */}
        <section className="mt-12 border-t border-rule pt-10">
          <h2 className="text-h2 font-bold text-ink">What to do next</h2>
          <p className="text-body measure mt-4 text-ink-soft">{copy.body}</p>
          <p className="text-small mt-3 text-ink-mute">
            Usual level of care for this: {c.careLevel}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href={`#get-the-app-${c.slug}`}>Get the app to find care</Button>
            <Button href="/how-it-works" variant="secondary">
              How WellaPath decides
            </Button>
          </div>
        </section>

        <Disclaimer className="mt-10" />

        <div className="mt-10">
          <GetTheApp id={`get-the-app-${c.slug}`} />
        </div>
      </div>
    </>
  )
}
