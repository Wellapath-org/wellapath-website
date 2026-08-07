import type { Metadata } from 'next'
import Link from 'next/link'
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
  Badge,
  Stat,
  StatRow,
} from '@/components/ui'
import { GetTheApp } from '@/components/chrome'
import { Spotlight } from '@/components/effects'
import { FlowRibbon } from '@/components/visuals'
import { AuroraLayer } from '@/components/aurora'
import { UrgencyMorph } from '@/components/urgency-morph'
import { UrgencyCard, Disclaimer, PrivacyDiagram } from '@/components/clinical'
import {
  PhoneShell,
  ResultCard,
  SymptomPickerMock,
  BodyAreaMock,
  FacilityListMock,
  SeverityMock,
  MockFrame,
} from '@/components/product'
import { Waitlist } from '@/components/waitlist'
import { LAUNCHED } from '@/content/launch'
import { RECEIPTS, COVERAGE, AUDIENCES, SITE } from '@/content/site'
import { getSeasonalConditions, getAllConditions } from '@/content/conditions'
import { URGENCY_ORDER } from '@/content/urgency'
import {
  CloudRain,
  UserRoundCheck,
  ShieldCheck,
  Waypoints,
  MapPin,
  Lock,
} from 'lucide-react'

/**
 * The home page inherits its title and description from the root layout, which
 * is correct: they are the site's own. It needs the canonical stated anyway.
 * Without it the origin is reachable at several URLs a crawler treats as
 * separate pages, and the one that gets indexed is chosen for us.
 *
 * Before launch this route is the waitlist instead, so the title and
 * description have to be the waitlist's: the layout's default describes a
 * product a visitor cannot get yet, and that description is what shows in a
 * search result and in a WhatsApp preview, which is where most of this traffic
 * will come from.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  ...(LAUNCHED
    ? {}
    : {
        title: `Join the waitlist · ${SITE.name}`,
        description:
          'Feeling sick but not sure how bad it is? WellaPath tells you how urgently to seek care, and where. Join the waitlist for early access.',
        openGraph: {
          title: `Join the waitlist · ${SITE.name}`,
          description:
            'Feeling sick but not sure how bad it is? WellaPath tells you how urgently to seek care, and where. Join the waitlist for early access.',
        },
      }),
}

export default function RootPage() {
  // The site is written and deployed; it is simply not open yet. See
  // content/launch.ts for what flips this and what stays reachable meanwhile.
  if (!LAUNCHED) return <Waitlist />
  return <HomePage />
}

function HomePage() {
  const seasonal = getSeasonalConditions()
  const conditions = getAllConditions()

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────
          Asymmetric 7/5, left-aligned. Not centred, no pill badge above the
          headline — both are documented tells and both cost nothing to avoid.
          ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ground">
        <AuroraLayer />
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12 md:px-10 md:pb-28 md:pt-20">
          <div className="relative z-1 grid min-w-0 items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-14">
            <div className="min-w-0 md:col-span-7">
              <Eyebrow>Clinical decision support · Nigeria</Eyebrow>

              <h1 className="text-hero mt-6 font-bold text-ink">Know how urgently to act.</h1>
              <p className="text-h1 mt-4 max-w-[19ch] font-normal text-ink-soft">
                Built on Nigerian clinical guidance. Not on a guess.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="#get-the-app">
                  Get the app
                </Button>
                <Button href="/for/health-facilities" variant="secondary">
                  For partners
                </Button>
              </div>

              <p className="text-small mt-7 text-ink-mute">
                Free. No account needed. Nothing you enter leaves your phone.
              </p>
            </div>

            <div className="settle mx-auto w-full max-w-[320px] md:col-span-5 md:ml-auto md:mr-0">
              <PhoneShell label="The WellaPath assessment result screen, showing an urgent recommendation and the conditions the symptoms are consistent with.">
                <ResultCard
                  urgency="urgent"
                  conditions={[
                    { name: 'Malaria', match: 4 },
                    { name: 'Typhoid fever', match: 3 },
                  ]}
                />
              </PhoneShell>
            </div>
          </div>
        </div>
      </section>

      {/* ── The receipts ─────────────────────────────────────────────── */}
      <section className="relative bg-ground">
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 sm:px-6 md:px-10">
          <div className="relative z-1">
            <StatRow>
              <Stat value={RECEIPTS.conditions} label="Conditions in the Nigerian knowledge base" emphasis />
              <Stat
                value={RECEIPTS.rules}
                label={`Clinical triage rules. ${RECEIPTS.rulesGlobal} global, ${RECEIPTS.rulesConditionSpecific} condition-specific`}
              />
              <Stat
                value={RECEIPTS.facilities.toLocaleString('en-NG')}
                label="Mapped health facilities with coordinates"
              />
              <Stat value={RECEIPTS.emergencyCapable} label="Of those flagged emergency-capable" />
            </StatRow>
          </div>
        </div>
      </section>

      {/* ── Who it is for ────────────────────────────────────────────────
          One platform, four audiences. Nav stays task-based; this is where
          each audience finds its own page (NN/g: every segment needs a real
          landing page, not just a menu entry).
          ─────────────────────────────────────────────────────────────── */}
      <Section tone="sunk" space="normal">
        <SectionHeader
          eyebrow="Who it is for"
          lead="One clinical engine. Four different jobs."
          rest="Households decide. Everyone else reaches people earlier."
        />

        <Spotlight className="overflow-hidden rounded-xl ring ring-ink/8">
          <ul className="stagger grid gap-px bg-rule md:grid-cols-2">
          {AUDIENCES.map((a) => (
            <li key={a.href} className="bg-card">
              <Link
                href={a.href}
                className="transition-safe group flex h-full flex-col p-8 hover:bg-sunk"
              >
                <Badge tone={a.primary ? 'accent' : 'neutral'}>{a.kind}</Badge>
                <h3 className="text-h3 mt-5 font-bold text-ink">{a.title}</h3>
                <p className="text-body measure mt-2 grow text-ink-soft">{a.blurb}</p>
                <span className="text-body mt-5 font-semibold text-accent-ink">
                  {a.cta} →
                </span>
              </Link>
            </li>
          ))}
          </ul>
        </Spotlight>
      </Section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <Section tone="ground" id="how" space="loose">
        <SectionHeader
          eyebrow="How it works"
          lead="Symptoms in. Urgency and a route out."
          rest="A method you can follow, in four steps, in this order."
        />

        {/* A hairline that fills as you read down the four steps. Scroll-linked
            via a named scroll-timeline, so it costs no JavaScript and marks
            reading position rather than decorating. */}
        <div className="rail-track relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-6 top-0 hidden h-full w-px bg-rule md:block"
          >
            <div className="rail-fill h-full w-px bg-accent" />
          </div>

          <ol className="stagger grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
          {[
            {
              n: 1,
              title: 'Tell it where it hurts.',
              body: 'Pick a body area, then the symptoms relevant to it. Not a list of 400 checkboxes.',
              mock: <BodyAreaMock />,
              alt: 'The WellaPath app asking which body area is affected, listing head, chest, abdomen, back, skin and legs.',
            },
            {
              n: 2,
              title: 'It weighs what you said.',
              body: `Against ${RECEIPTS.conditions} conditions and ${RECEIPTS.rules} clinical rules, adjusted for age, pregnancy and season.`,
              mock: <SymptomPickerMock />,
              alt: 'The symptom picker for the chest, with fast breathing, weakness and chest pain selected.',
            },
            {
              n: 3,
              title: 'It checks for danger signs first.',
              body: 'Red flags override everything else. Confusion, convulsions, difficulty breathing, dark urine. These go straight to emergency, whatever the score says.',
              mock: <SeverityMock />,
              alt: 'A severity question in the app: how severe is the fast breathing, on a scale from mild to unbearable.',
            },
            {
              n: 4,
              title: 'It tells you what to do and where to go.',
              body: 'One of 3 urgency levels, plus the nearest facilities that can actually treat it.',
              mock: <FacilityListMock />,
              alt: 'Nearby facilities in Lagos listed by distance, with one marked emergency-capable.',
            },
          ].map((step) => (
            <Card as="li" key={step.n} wash lift className="p-8">
              <h3 className="text-h3 flex items-baseline gap-3 font-bold text-ink">
                <span className="tnum text-small font-mono font-medium text-ink-mute">
                  0{step.n}
                </span>
                {step.title}
              </h3>
              <p className="text-body measure mt-3 text-ink-soft">{step.body}</p>
              <MockFrame
                label={step.alt}
                className="mx-auto mt-8 w-full max-w-[280px] overflow-hidden rounded-t-xl shadow-raise ring ring-ink/8"
              >
                {step.mock}
              </MockFrame>
            </Card>
          ))}
          </ol>
        </div>

        <div className="mt-10">
          <TextLink href="/how-it-works">See a worked example: one fever in July</TextLink>
        </div>
      </Section>

      {/* ── Red flags override the score — the one dark moment ────────── */}
      <section className="relative overflow-hidden bg-navy">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(40% 60% at 78% 22%, #4a2fd6 0%, transparent 62%), radial-gradient(46% 52% at 92% 72%, #7c5cff 0%, transparent 64%), radial-gradient(38% 44% at 62% 92%, #b06bff 0%, transparent 64%)',
            filter: 'blur(52px)',
          }}
        />
        {/* Lower band only, and faded out on the left so it never crosses the
            headline. Legibility outranks the graphic. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] opacity-60"
          style={{
            maskImage: 'linear-gradient(100deg, transparent 4%, rgb(0 0 0 / .5) 34%, #000 62%)',
            WebkitMaskImage:
              'linear-gradient(100deg, transparent 4%, rgb(0 0 0 / .5) 34%, #000 62%)',
          }}
        >
          <FlowRibbon />
        </div>
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-36">
          <div className="relative z-1 grid gap-10 md:grid-cols-12 md:items-center md:gap-12 lg:gap-16">
            <div className="min-w-0 md:col-span-7">
              <p className="text-eyebrow font-mono font-medium uppercase text-ink-on-navy">
                Safety logic
              </p>
              <h2 className="text-display mt-5 font-bold text-white">
                Red flags override the score.
                <span className="font-normal text-ink-on-navy">
                  {' '}
                  The dangerous thing does not have to score highest.
                </span>
              </h2>

              <p className="text-body-lg measure mt-7 text-ink-on-navy">
                WellaPath evaluates danger signs{' '}
                <strong className="font-semibold text-white">before</strong> it scores anything. Any
                one of them returns emergency immediately, whatever the rest of the assessment says.
              </p>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
                <Stat value={RECEIPTS.rules} label="Clinical rules" gradient />
                <Stat value={RECEIPTS.rulesGlobal} label="Global danger signs" gradient />
                <Stat value="0" label="Can be overridden by a score" gradient />
              </div>
            </div>

            <div className="min-w-0 space-y-4 md:col-span-5">
              {URGENCY_ORDER.map((u) => (
                <UrgencyCard key={u} urgency={u} />
              ))}
              <p className="text-small text-ink-on-navy">
                Every urgency state carries a text label as well as a colour. Colour never carries
                the meaning on its own.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy ──────────────────────────────────────────────────── */}
      <Section tone="ground" space="loose">
        <Split
          ratio="6/6"
          aside={
            <Card wash className="reveal flex justify-center p-8 md:p-10">
              <PrivacyDiagram />
            </Card>
          }
        >
          <div className="reveal">
            <Eyebrow>Private by design</Eyebrow>
            <TwoTone
              lead="Nothing you enter leaves your phone."
              rest="The scoring engine runs on the device."
              className="mt-5"
            />
            <p className="text-body-lg measure mt-6 text-ink-soft">
              <strong className="font-semibold text-ink">0 symptom records</strong> are stored on
              our servers, because there is no path for them to arrive. It is not a policy promise. It is the architecture.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge icon={Lock}>On-device scoring</Badge>
              <Badge icon={ShieldCheck}>NDPR-aligned</Badge>
              <Badge icon={Waypoints}>No third-party trackers</Badge>
            </div>
            <div className="mt-8">
              <Button href="/privacy" variant="secondary">
                What we collect
              </Button>
            </div>
          </div>
        </Split>
      </Section>

      {/* ── Built for here ───────────────────────────────────────────── */}
      <Section tone="sunk" space="normal">
        <SectionHeader
          eyebrow="Built for here"
          lead="A fever in July is not a fever in January."
          rest="Two things a search engine cannot do."
        />

        <Split ratio="5/7" align="start" aside={<UrgencyMorph />}>
          <div className="grid gap-y-10">
            <FeatureRow
              icon={CloudRain}
              title="Seasonal intelligence"
              action={
                <TextLink href="/conditions?seasonal=true">
                  See the {seasonal.length} seasonal conditions
                </TextLink>
              }
            >
              <p>
                The engine raises malaria&apos;s weighting during the May–October rainy season, when
                transmission peaks in Nigeria. It is not only malaria:{' '}
                <strong className="font-semibold text-ink">
                  {seasonal.length} of the {RECEIPTS.conditions} conditions
                </strong>{' '}
                carry a seasonal adjustment.
              </p>
            </FeatureRow>

            <FeatureRow
              icon={UserRoundCheck}
              title="Who you are changes the urgency"
              action={<TextLink href="/how-it-works">See the full worked example</TextLink>}
            >
              <p>
                Being under 5, pregnant, or elderly escalates the recommendation, because those
                groups decompensate faster.
              </p>
            </FeatureRow>
          </div>
        </Split>
      </Section>

      {/* ── Conditions ───────────────────────────────────────────────── */}
      <Section tone="ground" space="normal">
        <SectionHeader
          eyebrow="Conditions we cover"
          lead={`${RECEIPTS.conditions} conditions, written for Nigeria.`}
          rest="Every page leads with the danger signs."
        />
        <ul className="stagger flex flex-wrap gap-2">
          {conditions.slice(0, 28).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/conditions/${c.slug}`}
                className="transition-safe inline-flex min-h-12 items-center rounded-md bg-card px-4 text-body text-ink-soft ring ring-ink/10 hover:bg-sunk hover:text-ink hover:ring-ink/25"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button href="/conditions" variant="secondary">
            Browse all {RECEIPTS.conditions} conditions
          </Button>
        </div>
      </Section>

      {/* ── Coverage ─────────────────────────────────────────────────── */}
      <Section tone="sunk" space="normal">
        <Split
          ratio="6/6"
          align="start"
          aside={
            <Card className="reveal p-8">
              <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <caption className="sr-only">Mapped facilities by state</caption>
                <thead>
                  <tr className="border-b border-rule text-left">
                    <th scope="col" className="pb-3 font-semibold text-ink">
                      State
                    </th>
                    <th scope="col" className="pb-3 text-right font-semibold text-ink">
                      Facilities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COVERAGE.states.map((s) => (
                    <tr key={s.name} className="border-b border-rule">
                      <td className="py-4 text-ink-soft">{s.name}</td>
                      <td className="tnum py-4 text-right font-semibold text-ink">
                        {s.count.toLocaleString('en-NG')}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-4 font-semibold text-ink">Total</td>
                    <td className="tnum py-4 text-right font-bold text-ink">
                      {RECEIPTS.facilities.toLocaleString('en-NG')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
              <p className="text-small mt-5 border-t border-rule pt-4 text-ink-mute">
                Only {RECEIPTS.withPhone} records currently carry a phone number. We label that gap
                rather than hide it.
              </p>
            </Card>
          }
        >
          <div>
            <Eyebrow>Coverage</Eyebrow>
            <TwoTone
              lead="3 states. We will not say “across Nigeria”."
              rest="Naming the 3 is the stronger claim anyway."
              className="mt-5"
            />
            <p className="text-body-lg measure mt-6 text-ink-soft">
              The directory covers Lagos, Kano and the Federal Capital Territory:{' '}
              <span className="tnum">{RECEIPTS.facilities.toLocaleString('en-NG')}</span> mapped
              facilities, of which <span className="tnum">{RECEIPTS.emergencyCapable}</span> are
              flagged emergency-capable.
            </p>
            <div className="mt-8">
              <Button href="/coverage" variant="secondary" icon={MapPin}>
                See where we work
              </Button>
            </div>
          </div>
        </Split>
      </Section>

      {/* ── Install ──────────────────────────────────────────────────── */}
      <Section tone="ground" space="normal">
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          <div className="min-w-0 md:col-span-7">
            <GetTheApp />
          </div>
          <div className="min-w-0 md:col-span-5">
            <Disclaimer />
          </div>
        </div>
      </Section>
    </>
  )
}
