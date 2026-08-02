import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader, Section, SectionHeader, Card, Prose } from '@/components/ui'
import { Disclaimer } from '@/components/clinical'
import { RECEIPTS, ARTIFACT_VERSIONS } from '@/content/site'
import { redFlagReviewStatus } from '@/content/red-flag-labels'
import { getAllConditions } from '@/content/conditions'

export const metadata: Metadata = {
  title: 'Clinical safety',
  description:
    'Where WellaPath’s clinical content comes from, how it is versioned and reviewed, and the limitations we state before anyone states them for us.',
  alternates: { canonical: '/clinical-safety' },
}

export default function ClinicalSafetyPage() {
  const conditions = getAllConditions()
  const review = redFlagReviewStatus()
  const selfCare = conditions.filter((c) => c.rawUrgency === 'self_care').length

  return (
    <>
      <PageHeader
        eyebrow="Clinical safety"
        lead="What the assessment is built on, and where it stops."
        rest="This page is for clinicians, health authorities, journalists and anyone evaluating whether to trust WellaPath. It states the sources, the review process, and the limitations."
      />

      <Section tone="ground">
        <SectionHeader eyebrow="The artifacts" lead="What ships, and at what version." />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Knowledge base</h3>
            <p className="text-body mt-2 text-ink-soft">
              <span className="tnum font-semibold text-ink">{RECEIPTS.conditions}</span> conditions,
              each with weighted symptoms, red flags, severity bands, demographic modifiers and, for{' '}
              <span className="tnum">{conditions.filter((c) => c.seasonal.length > 0).length}</span>{' '}
              of them, seasonal modifiers.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Triage rules</h3>
            <p className="text-body mt-2 text-ink-soft">
              <span className="tnum font-semibold text-ink">{RECEIPTS.rules}</span> rules:{' '}
              <span className="tnum">{RECEIPTS.rulesGlobal}</span> global danger signs that halt the
              pass on their own, and <span className="tnum">{RECEIPTS.rulesConditionSpecific}</span>{' '}
              condition-specific rules.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Facility directory</h3>
            <p className="text-body mt-2 text-ink-soft">
              <span className="tnum font-semibold text-ink">
                {RECEIPTS.facilities.toLocaleString('en-NG')}
              </span>{' '}
              facilities with coordinates across Lagos, Kano and the FCT.{' '}
              <span className="tnum">{RECEIPTS.emergencyCapable}</span> flagged emergency-capable;
              only <span className="tnum">{RECEIPTS.withPhone}</span> carry a phone number.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Versions on this site</h3>
            <ul className="mt-2 space-y-1">
              {Object.entries(ARTIFACT_VERSIONS).map(([name, meta]) => (
                <li key={name} className="text-body flex justify-between gap-4 text-ink-soft">
                  <span>{name.replace(/\.json$/, '').replace(/\/$/, '')}</span>
                  <span className="tnum text-ink">
                    {'version' in meta && meta.version
                      ? `v${meta.version}`
                      : 'count' in meta
                        ? `${meta.count} files`
                        : '\u2013'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section tone="sunk">
        <SectionHeader
          eyebrow="Safety logic"
          lead="Danger signs are evaluated before the score."
        />
        <Prose>
          <p>
            The assessment does not simply rank conditions by score. It first evaluates{' '}
            {RECEIPTS.rulesGlobal} global red-flag rules: impaired consciousness, circulatory
            collapse, respiratory distress, abnormal bleeding, inability to drink, and others. Any
            one of these returns <strong>emergency</strong> and stops the pass.
          </p>
          <p>
            This ordering is deliberate and it is the property most worth auditing: it means a
            low-scoring but dangerous presentation cannot be talked down by a high-scoring benign
            one. It is also why the site can describe the reasoning openly rather than treating the
            engine as a black box.
          </p>
          <p>
            Demographic modifiers (under 5, pregnancy, elderly) escalate urgency rather than adjust
            likelihood, on the basis that these groups decompensate faster. Seasonal modifiers adjust
            base weighting only. They never, on their own, produce an emergency.
          </p>
        </Prose>
      </Section>

      {/* ── Limitations, stated by us first (§7) ─────────────────────── */}
      <Section tone="ground">
        <SectionHeader
          eyebrow="Limitations"
          lead="What we would want to know if we were evaluating us."
          rest="Stated here before anyone states it for us."
        />
        <ul className="space-y-4">
          {[
            {
              t: 'It is not a diagnostic device and has not been validated as one.',
              b: 'No sensitivity or specificity figures are published, because no clinical validation study has been run. We will not publish an accuracy percentage in its absence.',
            },
            {
              t: 'Coverage is 3 states, not the federation.',
              b: 'Lagos, Kano and the FCT. Someone in Enugu will find no facilities, and we say so on the page rather than letting them discover it.',
            },
            {
              t: `${RECEIPTS.withPhone} of ${RECEIPTS.facilities.toLocaleString('en-NG')} facilities have a phone number.`,
              b: 'The directory is built from mapped coordinates. Contact data is sparse and we label the gap rather than hiding it.',
            },
            {
              t: `${RECEIPTS.conditions} conditions is not all conditions.`,
              b: 'The knowledge base covers the conditions that carry the highest burden in Nigeria. Symptoms may be caused by something outside it, which is exactly what the disclaimer says.',
            },
            {
              t: 'Self-reported symptoms are the input.',
              b: 'The assessment can only weigh what a person recognises and reports. It cannot examine, measure or test.',
            },
            {
              t: 'English only at launch.',
              b: 'Hausa, Yoruba and Igbo would widen reach considerably, and Kano coverage argues particularly for Hausa. Not yet available.',
            },
          ].map((l) => (
            <li key={l.t} className="border-l border-rule pl-5">
              <h3 className="text-body font-semibold text-ink">{l.t}</h3>
              <p className="text-body measure mt-1 text-ink-soft">{l.b}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── The honest open items ────────────────────────────────────── */}
      <Section tone="sunk">
        <SectionHeader
          eyebrow="Open items"
          lead="Work in progress, published rather than buried."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Named clinical review</h3>
            <p className="text-body mt-2 text-ink-soft">
              The strongest trust signal this page can carry is the name and credentials of the
              clinician who reviews the knowledge base. That is not yet published here, and this
              page is incomplete until it is.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Danger-sign wording</h3>
            <p className="text-body mt-2 text-ink-soft">
              <span className="tnum">{review.reviewed}</span> of{' '}
              <span className="tnum">{review.total}</span> danger-sign descriptions carry signed-off
              plain-language wording. The remainder are drafts awaiting clinical review before
              launch.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Urgency levels</h3>
            <p className="text-body mt-2 text-ink-soft">
              The knowledge base distinguishes a{' '}
              <code className="rounded-xs bg-sunk px-1">self_care</code> band on{' '}
              <span className="tnum">{selfCare}</span> conditions. The app and this site show 3
              levels, folding it into non-urgent. Whether it should be a distinct fourth level is
              under review.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Emergency numbers</h3>
            <p className="text-body mt-2 text-ink-soft">
              We publish 112, the national line. State-level emergency services differ and we are
              verifying the correct number for each covered state.
            </p>
          </Card>
        </div>

        <p className="text-body measure mt-8 text-ink-soft">
          If you are a clinician and something on this site is wrong, we want to hear it before a
          user does.{' '}
          <Link href="/partners" className="text-accent-ink underline underline-offset-2">
            Get in touch
          </Link>
          .
        </p>

        <Disclaimer className="mt-10" />
      </Section>
    </>
  )
}
