/**
 * Coverage.
 *
 * This replaces the working facility search that used to live at /find-care.
 * The directory is a service, and services live in the app — the same split
 * Stripe and Anthropic run, where the website sells and the product delivers.
 *
 * The page's job is therefore proof, not utility: show that the directory is
 * real and specific, be honest about where it stops, and route to the app.
 * WEBSITE_GUIDE §3 still governs — name the 3 states, never claim the country.
 */
import type { Metadata } from 'next'
import {
  Section,
  SectionHeader,
  Eyebrow,
  TwoTone,
  Split,
  Button,
  Card,
  FeatureRow,
  Stat,
  StatRow,
} from '@/components/ui'
import { Phone, Globe as GlobeIcon, Clock } from 'lucide-react'
import { GetTheApp } from '@/components/chrome'
import { Disclaimer, EmergencyCard } from '@/components/clinical'
import { PhoneShell, FacilityListMock, MockFrame } from '@/components/product'
import { CoverageMap } from '@/components/coverage-map'
import { Globe } from '@/components/globe'
import { Spotlight } from '@/components/effects'
import { RECEIPTS, COVERAGE } from '@/content/site'

export const metadata: Metadata = {
  title: 'Coverage',
  description: `WellaPath maps ${RECEIPTS.facilities.toLocaleString('en-NG')} health facilities across Lagos, Kano and the FCT, of which ${RECEIPTS.emergencyCapable} are flagged emergency-capable. Three states, named, not "across Nigeria".`,
}

export default function CoveragePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ground">
        <div className="aurora-soft" aria-hidden="true" />
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 py-14 sm:px-6 sm:py-16 md:px-10 md:py-24">
          <div className="relative z-1 grid min-w-0 items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-14">
            <div className="min-w-0 md:col-span-7">
              <Eyebrow>Coverage</Eyebrow>
              <div className="h-5" />
              <h1 className="text-display font-bold text-ink">
                3 states. Named.
                <span className="font-normal text-ink-soft">
                  {' '}
                  Not &ldquo;across Nigeria&rdquo;.
                </span>
              </h1>
              <p className="text-body-lg measure mt-6 text-ink-soft">
                The directory in the app holds{' '}
                <span className="tnum font-semibold text-ink">
                  {RECEIPTS.facilities.toLocaleString('en-NG')}
                </span>{' '}
                mapped health facilities across Lagos, Kano and the Federal Capital Territory, each
                with real coordinates, and{' '}
                <span className="tnum font-semibold text-ink">{RECEIPTS.emergencyCapable}</span> of
                them flagged as emergency-capable.
              </p>
              <p className="text-body measure mt-5 text-ink-soft">
                That is 3 states, not the federation. Saying so is the stronger claim: it sounds
                like a company that has done the fieldwork, and it makes &ldquo;your state
                next&rdquo; a promise rather than a retraction.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="#get-the-app">Get the app</Button>
                <Button href="/how-it-works" variant="secondary">
                  See how it works
                </Button>
              </div>
            </div>

            {/* The globe if the browser can afford it, the phone screen if not.
                Both say the same thing; only one costs 84 KB. */}
            <div className="mx-auto w-full max-w-[380px] md:col-span-5 md:ml-auto md:mr-0">
              <Globe>
                <div className="mx-auto w-full max-w-[320px]">
                  <PhoneShell label="The WellaPath app listing nearby facilities in Lagos by distance, with one marked emergency-capable.">
                    <FacilityListMock />
                  </PhoneShell>
                </div>
              </Globe>
            </div>
          </div>
        </div>
      </section>

      {/* ── The numbers ───────────────────────────────────────────────── */}
      <section className="relative bg-ground">
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 sm:px-6 md:px-10">
          <div className="reveal relative z-1">
            <StatRow>
              <Stat
                value={RECEIPTS.facilities.toLocaleString('en-NG')}
                label="Mapped facilities with coordinates"
                emphasis
              />
              <Stat value={RECEIPTS.emergencyCapable} label="Flagged emergency-capable" />
              <Stat value={COVERAGE.states.length} label="States covered today" />
              <Stat value={RECEIPTS.withPhone} label="Records carrying a phone number" />
            </StatRow>
          </div>
        </div>
      </section>

      {/* ── The network ──────────────────────────────────────────────────
          The burst is the directory: one point of need, many routes out of it.
          Roughly 1 ray in 6 is drawn in the emergency colour, matching the
          924-of-5,344 share that is flagged emergency-capable.
          ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ground">
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 pt-12 sm:px-6 sm:pt-14 md:px-10 md:pt-20">
          <div className="relative z-1 measure-wide">
            <Eyebrow>The network</Eyebrow>
            <TwoTone
              lead="Every dot is a real facility."
              rest="Plotted at its real coordinates. The empty space is the honest part."
              size="h1"
              className="mt-4"
            />
          </div>
          <Spotlight className="relative z-1 mt-10 rounded-xl">
            <CoverageMap />
          </Spotlight>
        </div>
      </section>

      {/* ── By state ──────────────────────────────────────────────────── */}
      <Section tone="sunk">
        <SectionHeader
          eyebrow="Where we are"
          lead="Lagos, Kano and the FCT."
          rest="With the counts, so you can hold us to them."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {COVERAGE.states.map((s) => (
            <Card key={s.name} wash lift className="reveal p-8">
              <h3 className="text-h3 font-bold text-ink">{s.name}</h3>
              <p className="tnum text-figure mt-4 font-normal text-ink">
                {s.count.toLocaleString('en-NG')}
              </p>
              <p className="text-small mt-3 text-ink-mute">Mapped facilities</p>
            </Card>
          ))}
        </div>

        <p className="text-body measure-wide mt-10 text-ink-soft">
          Every one of those records carries coordinates, a facility type, and whether it is
          emergency-capable. The app sorts them by distance from wherever you are, which is why
          the directory lives there and not here.
        </p>
      </Section>

      {/* ── What we do not have ───────────────────────────────────────── */}
      <Section tone="ground">
        <SectionHeader
          eyebrow="The gaps"
          lead="What the directory does not have."
          rest="Stated here rather than discovered at 2am."
        />

        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-3">
          <FeatureRow icon={Phone} title="Phone numbers, mostly">
            <p>
              Only <span className="tnum font-semibold text-ink">{RECEIPTS.withPhone}</span> of{' '}
              <span className="tnum">{RECEIPTS.facilities.toLocaleString('en-NG')}</span> records
              carry one. The directory was built from mapped coordinates; contact data is sparse.
              We label the gap rather than show you an empty field.
            </p>
          </FeatureRow>

          <FeatureRow icon={GlobeIcon} title="The other 33 states">
            <p>
              Someone in Enugu or Rivers will find nothing today. We are not going to pretend
              otherwise to make a homepage look bigger.
            </p>
          </FeatureRow>

          <FeatureRow icon={Clock} title="Opening hours">
            <p>
              Not yet recorded for most facilities. A facility being on the map does not guarantee
              it is open, which is exactly why the emergency route is a phone call, not a search.
            </p>
          </FeatureRow>
        </div>
      </Section>

      {/* ── Emergency ─────────────────────────────────────────────────── */}
      <Section tone="sunk">
        <EmergencyCard />
      </Section>

      {/* ── Next states ───────────────────────────────────────────────── */}
      <Section tone="ground">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16 md:items-center">
          <div>
            <TwoTone
              lead="Your state next."
              rest="Tell us where you are and we will prioritise it."
            />
            <p className="text-body-lg measure mt-6 text-ink-soft">
              Mapping a state properly means coordinates, facility types and emergency capability.
              the fieldwork is the slow part, and we would rather do it than claim it. Leave your
              email and tell us your state when you reply.
            </p>
          </div>
          <MockFrame
            label="The WellaPath app listing nearby facilities in Lagos, sorted by distance."
            className="overflow-hidden rounded-xl ring ring-ink/8 shadow-lift"
          >
            <FacilityListMock />
          </MockFrame>
        </div>
      </Section>

      <Section tone="sunk">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-start">
          <GetTheApp />
          <Disclaimer />
        </div>
      </Section>
    </>
  )
}
