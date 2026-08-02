import type { Metadata } from 'next'
import { Button, Card, PageHeader, Prose, Section, SectionHeader, Split } from '@/components/ui'
import { GetTheApp } from '@/components/chrome'
import { UrgencyMorph } from '@/components/urgency-morph'
import {
  PhoneShell,
  ResultCard,
  SymptomPickerMock,
  BodyAreaMock,
  FacilityListMock,
  SeverityMock,
  MockFrame,
} from '@/components/product'
import { UrgencyCard, Disclaimer, MatchStrength, PrivacyDiagram } from '@/components/clinical'
import { RECEIPTS, ARTIFACT_VERSIONS } from '@/content/site'
import { getSeasonalConditions } from '@/content/conditions'

export const metadata: Metadata = {
  title: 'How it works',
  description: `The method behind WellaPath: ${RECEIPTS.conditions} conditions, ${RECEIPTS.rules} clinical rules, danger signs that override the score, and adjustments for age, pregnancy and season.`,
}

export default function HowItWorksPage() {
  const seasonal = getSeasonalConditions()

  return (
    <>
      <PageHeader
        eyebrow="How it works"
        lead="A method, not a magic answer."
        rest="WellaPath does not guess what you have. It weighs what you told it against Nigerian clinical guidance and tells you how urgently to act. Here is exactly how, including what it deliberately will not do."
      />

      {/* ── The worked example (§7: "this single example does more than any
             feature list") ─────────────────────────────────────────────── */}
      <Section tone="ground">
        <SectionHeader
          eyebrow="A worked example"
          lead="One fever in July."
          rest="The same three symptoms, assessed twice. Only the person and the month change."
        />

        <Split
          ratio="5/7"
          align="start"
          aside={<UrgencyMorph />}
        >
          <div>
            <Prose>
              <p>
                Below is the same assessment run twice. The reported symptoms are pinned and never
                change: fever, headache, body pain. Only the person and the month move.
              </p>
              <p>
                In February, for a healthy adult, nothing escalates and home care may be enough. In
                July, for a child under 5, two modifiers apply at once and the same three symptoms
                come back as urgent.
              </p>
              <p>
                <strong>That gap is the whole product.</strong> It is also what a search engine
                cannot give you, because it knows neither the month in Nigeria nor how old the
                person is.
              </p>
            </Prose>
          </div>
        </Split>

      </Section>

      {/* ── The four beats in depth ──────────────────────────────────── */}
      <Section tone="sunk">
        <SectionHeader eyebrow="The method" lead="Four steps, in order." />

        <div className="space-y-6">
          {[
            {
              n: 1,
              title: 'Tell it where it hurts',
              body: 'You pick a body area, or point on a body map, and then the symptoms relevant to that area. This is deliberately not a list of 400 checkboxes: narrowing by area first is how a clinician takes a history, and it is how you avoid a frightened person scrolling past the symptom that mattered.',
              mock: <BodyAreaMock />,
              alt: 'The WellaPath app asking which body area is affected.',
            },
            {
              n: 2,
              title: 'It weighs what you said',
              body: `Each symptom carries a weight for each of the ${RECEIPTS.conditions} conditions in the knowledge base. Those weights are then adjusted for age, for pregnancy, and for the time of year. ${seasonal.length} of the ${RECEIPTS.conditions} conditions carry a seasonal adjustment.`,
              mock: <SymptomPickerMock />,
              alt: 'The symptom picker for the chest, with several symptoms selected.',
            },
            {
              n: 3,
              title: 'It checks for danger signs first',
              body: `Before any of that scoring counts, the assessment runs the red-flag rules. ${RECEIPTS.rulesGlobal} of the ${RECEIPTS.rules} rules are global danger signs: confusion, convulsions, difficulty breathing, dark urine, collapse. Any one of them returns emergency on its own, halting the pass. The score cannot talk it down.`,
              mock: <ResultCard urgency="emergency" compact />,
              alt: 'The emergency result screen: seek medical care immediately, with a call emergency button.',
            },
            {
              n: 4,
              title: 'It tells you what to do and where to go',
              body: `One of 3 urgency levels, the conditions your symptoms are consistent with, and the nearest facilities that can actually treat it, drawn from ${RECEIPTS.facilities.toLocaleString('en-NG')} mapped facilities, ${RECEIPTS.emergencyCapable} of which are flagged emergency-capable.`,
              mock: <FacilityListMock />,
              alt: 'Nearby facilities in Lagos listed by distance.',
            },
          ].map((s) => (
            <Card key={s.n} className="p-7">
              <div className="grid gap-6 sm:grid-cols-[1fr_260px] sm:items-start">
                <div>
                  <span className="tnum text-small inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-wash font-bold text-accent-ink">
                    {s.n}
                  </span>
                  <h3 className="text-h3 mt-3 font-bold text-ink">{s.title}</h3>
                  <p className="text-body measure mt-3 text-ink-soft">{s.body}</p>
                </div>
                <MockFrame label={s.alt} className="overflow-hidden rounded-t-lg border border-b-0 border-rule shadow-lift">{s.mock}</MockFrame>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Match strength, not percentages ──────────────────────────── */}
      <Section tone="ground">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-[1fr_0.8fr] md:gap-12 md:items-center">
          <div>
            <SectionHeader
              eyebrow="What we will not show you"
              lead="No percentages. Ever."
            />
            <div className="measure space-y-4 text-body text-ink-soft">
              <p>
                It would be easy to print &ldquo;Malaria, 94%&rdquo;. It would also be the single
                most misleading thing we could put on a screen, because that number would describe
                how well your symptoms matched a list, not how likely you are to have the thing.
              </p>
              <p>Instead the app shows match strength, in words as well as bars:</p>
            </div>
            <ul className="mt-6 space-y-3">
              {([4, 3, 2, 1] as const).map((n) => (
                <li key={n}>
                  <MatchStrength filled={n} />
                </li>
              ))}
            </ul>
            <p className="text-small measure mt-6 text-ink-mute">
              Match strength shows how well the symptoms you entered match the symptoms of each
              condition. It is not the likelihood of having the condition.
            </p>
          </div>
          <div className="mx-auto w-full max-w-[330px]">
            <PhoneShell label="The WellaPath result screen, showing match strength as bars with word labels rather than percentages.">
              <ResultCard
                urgency="urgent"
                conditions={[
                  { name: 'Malaria', match: 4 },
                  { name: 'Typhoid fever', match: 3 },
                  { name: 'Gastroenteritis', match: 1 },
                ]}
              />
            </PhoneShell>
          </div>
        </div>
      </Section>

      {/* ── What it deliberately does not do (§7) ────────────────────── */}
      <Section tone="sunk">
        <SectionHeader
          eyebrow="Limits"
          lead="What WellaPath deliberately does not do."
          rest="Stated by us, before anyone states it for us."
        />
        {/* A divided list, not six identical boxes. Six equal cards in a grid is
            the stock generated layout; hairline dividers read as a considered
            list and let the statements sit closer together. */}
        <ul className="grid gap-x-16 border-t border-rule md:grid-cols-2">
          {[
            ['It does not diagnose.', 'It returns urgency and a route to care. It never returns "you have X".'],
            ['It does not prescribe or treat.', 'No medicines, no dosages, no home remedies presented as treatment.'],
            ['It does not replace a clinician.', 'It is a second opinion about how urgently to see one.'],
            ['It does not cover every condition.', `${RECEIPTS.conditions} conditions are in the knowledge base. Your symptoms may be caused by something not in it.`],
            ['It does not cover every state.', 'The facility directory is Lagos, Kano and the FCT only.'],
            ['It does not work as an emergency service.', 'In an emergency, call 112. Do not open an app.'],
          ].map(([title, body]) => (
            <li key={title} className="min-w-0 border-b border-rule py-7">
              <h3 className="text-h3 font-bold text-ink">{title}</h3>
              <p className="text-body measure mt-2 text-ink-soft">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Versioning ──────────────────────────────────────────────── */}
      <Section tone="ground">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:gap-12 [&>*]:min-w-0">
          <div>
            <SectionHeader
              eyebrow="Versioned and reviewed"
              lead="The clinical content ships as versioned artifacts."
            />
            <div className="measure space-y-4 text-body text-ink-soft">
              <p>
                The conditions, the rules and the facility directory are not hardcoded in the app.
                They are versioned files, reviewed before release and shipped to the device. That is
                what makes it possible to say exactly which rules produced a given answer, and to
                correct one without shipping a new app.
              </p>
              <p>These are the versions this website is built against:</p>
            </div>
            <div className="mt-6">
              <Button href="/clinical-safety" variant="secondary">
                Read the clinical safety page
              </Button>
            </div>
          </div>

          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full border-collapse text-body">
            <caption className="sr-only">Clinical artifact versions</caption>
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th scope="col" className="pb-3 font-semibold text-ink">Artifact</th>
                <th scope="col" className="pb-3 text-right font-semibold text-ink">Version</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ARTIFACT_VERSIONS).map(([name, meta]) => (
                <tr key={name} className="border-b border-rule">
                  <td className="py-3 text-ink-soft">{name.replace(/\.json$/, '').replace(/\/$/, '')}</td>
                  <td className="tnum py-3 text-right text-ink">
                    {'version' in meta && meta.version
                      ? `v${meta.version}`
                      : 'count' in meta
                        ? `${meta.count} files`
                        : '\u2013'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        </div>
      </Section>

      {/* ── Privacy ─────────────────────────────────────────────────── */}
      <Section tone="sunk">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:gap-12 md:items-center [&>*]:min-w-0">
          <div>
            <SectionHeader eyebrow="Privacy" lead="And none of it leaves the phone." />
            <div className="measure space-y-4 text-body text-ink-soft">
              <p>
                The engine described on this page runs on your device. The rules come down; your
                symptoms never go up. There are 0 symptom records on our servers, because there is
                no path for them to arrive.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <PrivacyDiagram />
          </div>
        </div>
      </Section>

      <Section tone="ground">
        <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-start">
          <GetTheApp />
          <Disclaimer />
        </div>
      </Section>
    </>
  )
}
