/**
 * Segment landing pages: /for/households · /for/health-facilities ·
 * /for/clinicians · /for/public-health
 *
 * Prefixed "for" deliberately — NN/g's fix for the ambiguity between content
 * *about* a group and content *for* them. One global header stays on every
 * page; only the content and the CTA emphasis change, never the chrome.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  Section,
  SectionHeader,
  Eyebrow,
  TwoTone,
  Split,
  Button,
  TextLink,
  Card,
  FeatureRow,
  Prose,
} from '@/components/ui'
import { GetTheApp } from '@/components/chrome'
import { Disclaimer } from '@/components/clinical'
import { PhoneShell, ResultCard, FacilityListMock } from '@/components/product'
import { SEGMENTS, SEGMENT_SLUGS } from '@/content/segments'
import { breadcrumbSchema, jsonLd } from '@/content/schema'
import { AUDIENCES } from '@/content/site'
import Link from 'next/link'
import {
  Waypoints,
  TriangleAlert,
  CloudRain,
  Lock,
  Hospital,
  MapPin,
  ClipboardList,
  Stethoscope,
  FileText,
  UserRoundCheck,
  Globe,
  Database,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Waypoints,
  TriangleAlert,
  CloudRain,
  Lock,
  Hospital,
  MapPin,
  ClipboardList,
  Stethoscope,
  FileText,
  UserRoundCheck,
  Globe,
  Database,
}

export function generateStaticParams() {
  return SEGMENT_SLUGS.map((segment) => ({ segment }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segment: string }>
}): Promise<Metadata> {
  const { segment } = await params
  const s = SEGMENTS[segment]
  if (!s) return {}
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: { canonical: `/for/${s.slug}` },
  }
}

export default async function SegmentPage({
  params,
}: {
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params
  const s = SEGMENTS[segment]
  if (!s) notFound()

  const isConsumer = s.slug === 'households'
  const others = AUDIENCES.filter((a) => !a.href.endsWith(s.slug))

  return (
    <>
      {/* Two levels deep, so breadcrumbs replace the raw URL in a result. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            ...breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: s.eyebrow, path: `/for/${s.slug}` },
            ]),
          }),
        }}
      />
      <section className="relative overflow-hidden bg-ground">
        <div className="aurora-soft" aria-hidden="true" />
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 py-14 sm:px-6 sm:py-16 md:px-10 md:py-24">
          <div className="relative z-1 grid min-w-0 items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-14">
            <div className="min-w-0 md:col-span-7">
              <Eyebrow>{s.eyebrow}</Eyebrow>
              <TwoTone
                as="h1"
                size="display"
                lead={s.lead}
                rest={s.rest}
                className="mt-5 measure-wide"
              />
              <p className="text-body-lg measure mt-6 text-ink-soft">{s.intro}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href={s.primaryCta.href}>{s.primaryCta.label}</Button>
                <Button href={s.secondaryCta.href} variant="secondary">
                  {s.secondaryCta.label}
                </Button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[300px] md:col-span-5 md:ml-auto md:mr-0">
              <PhoneShell
                label={
                  isConsumer
                    ? 'The WellaPath result screen showing an urgent recommendation.'
                    : 'The WellaPath app listing nearby facilities in Lagos by distance.'
                }
              >
                {isConsumer ? (
                  <ResultCard
                    urgency="urgent"
                    conditions={[
                      { name: 'Malaria', match: 4 },
                      { name: 'Typhoid fever', match: 3 },
                    ]}
                  />
                ) : (
                  <FacilityListMock />
                )}
              </PhoneShell>
            </div>
          </div>
        </div>
      </section>

      {/* ── Facts strip ──────────────────────────────────────────────── */}
      <section className="relative bg-ground">
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 sm:px-6 md:px-10">
          <dl className="relative z-1 grid grid-cols-2 gap-x-8 gap-y-8 border-y border-rule py-10 md:grid-cols-4">
            {s.facts.map((f) => (
              <div key={f.label}>
                <dt className="text-small text-ink-mute">{f.label}</dt>
                <dd className="text-h3 tnum mt-1 font-semibold text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── What matters to this audience ────────────────────────────── */}
      <Section tone="sunk" space="normal">
        <SectionHeader
          eyebrow="What it does"
          lead={isConsumer ? 'What you get.' : 'What it changes.'}
          rest={
            isConsumer
              ? 'Four things, and no more than four.'
              : 'Specifics, not adjectives.'
          }
        />
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-2 md:gap-y-12">
          {s.points.map((p) => {
            const Icon = ICONS[p.icon] ?? Waypoints
            return (
              <FeatureRow key={p.title} icon={Icon} title={p.title}>
                <p>{p.body}</p>
              </FeatureRow>
            )
          })}
        </div>
      </Section>

      {/* ── Limits ───────────────────────────────────────────────────────
          Every segment page states its own limits. Saying what we will not
          claim is the most persuasive thing we own in this category.
          ─────────────────────────────────────────────────────────────── */}
      <Section tone="ground" space="normal">
        <Split
          ratio="5/7"
          align="start"
          aside={
            <Card className="p-8">
              <ul className="space-y-5">
                {s.limits.map((l) => (
                  <li key={l} className="text-body flex gap-3 text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-mute"
                    />
                    {l}
                  </li>
                ))}
              </ul>
            </Card>
          }
        >
          <div>
            <Eyebrow>Limits</Eyebrow>
            <TwoTone
              lead="What we will not claim."
              rest="Stated here before anyone states it for us."
              size="h1"
              className="mt-5"
            />
            <Prose>
              <p className="mt-6">
                A symptom app that refuses to guess is more credible than one that pretends to know.
                The same applies to everything else on this site.
              </p>
            </Prose>
            <div className="mt-6">
              <TextLink href="/clinical-safety">Read the full limitations</TextLink>
            </div>
          </div>
        </Split>
      </Section>

      {/* ── Cross-links: recovery for the wrong segment ──────────────── */}
      <Section tone="sunk" space="tight">
        <h2 className="text-h3 font-bold text-ink">Not what you were looking for?</h2>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-xl bg-rule ring ring-ink/8 md:grid-cols-3">
          {others.map((a) => (
            <li key={a.href} className="bg-card">
              <Link
                href={a.href}
                className="transition-safe flex min-h-full flex-col p-6 hover:bg-sunk"
              >
                <span className="text-eyebrow font-mono uppercase text-ink-mute">{a.kind}</span>
                <span className="text-body mt-2 font-semibold text-ink">{a.title}</span>
                <span className="text-body mt-3 font-semibold text-accent-ink">{a.cta} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="ground" space="normal">
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          <div className="min-w-0 md:col-span-7">
            <GetTheApp id={`get-the-app-${s.slug}`} />
          </div>
          <div className="min-w-0 md:col-span-5">
            <Disclaimer />
          </div>
        </div>
      </Section>
    </>
  )
}
