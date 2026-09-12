import type { Metadata } from 'next'
import { PageHeader, Section, SectionHeader, Card, FeatureRow, TextLink } from '@/components/ui'
import { EmergencyCard, Disclaimer } from '@/components/clinical'
import { COVERAGE, SUPPORT } from '@/content/site'
import { Mail, Bug, MapPin, Smartphone, Trash2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support',
  description:
    'How to reach the WellaPath team: report a bug, correct a facility listing, or ask about your data. One address, and an answer within two working days.',
  alternates: { canonical: '/support' },
}

/**
 * The support page the app stores point at.
 *
 * Written for two readers at once: a tester mid-bug, and an app-store reviewer
 * checking that a support channel, a deletion route and the medical
 * disclaimers actually exist. Everything here states what to send us, because
 * a report we can act on first time is the fastest reply we can give anyone.
 */
export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Support"
        lead="We answer every message."
        rest={`Bugs, wrong facility details, data questions and anything else: one address, and an answer within ${SUPPORT.responseTime}.`}
      >
        <a
          href={`mailto:${SUPPORT.email}`}
          className="transition-safe inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent-wash px-5 text-body font-semibold text-accent-ink ring ring-accent/20 hover:ring-accent/40"
        >
          <Mail className="size-4" aria-hidden="true" />
          {SUPPORT.email}
        </a>
      </PageHeader>

      {/* §11: the emergency route comes before the support route. Someone who
          reached this page mid-emergency must meet 112 before a mailto. */}
      <Section tone="sunk" space="tight">
        <EmergencyCard />
        <p className="text-body measure-wide mt-6 text-ink-soft">
          WellaPath does not replace a doctor, a nurse or any other healthcare professional. It
          tells you how urgently to seek care and where, and support can answer questions about the
          app. Neither is medical advice about your situation.
        </p>
      </Section>

      <Section tone="ground">
        <SectionHeader
          lead="Help us fix it first time."
          rest="A report with these details in it usually gets resolved in one reply."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-7">
            <FeatureRow icon={Bug} title="Report a bug">
              <p>
                Email <a href={`mailto:${SUPPORT.email}`} className="text-accent-ink underline underline-offset-2">{SUPPORT.email}</a>{' '}
                with the subject line <strong className="font-semibold text-ink">Bug report</strong> and:
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  'What you did, what happened, and what you expected instead',
                  'Your phone model and its Android or iOS version',
                  'The app version and build number (how to find it is below)',
                  'A screenshot or screen recording, if the problem is visible',
                ].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {x}
                  </li>
                ))}
              </ul>
            </FeatureRow>
          </Card>

          <Card className="p-7">
            <FeatureRow icon={MapPin} title="Report incorrect facility information">
              <p>
                The facility directory covers {COVERAGE.states.map((s) => s.name).join(', ')}. If a
                listing is wrong, closed, moved, or offers different services than we say, email{' '}
                <a href={`mailto:${SUPPORT.email}`} className="text-accent-ink underline underline-offset-2">{SUPPORT.email}</a>{' '}
                with the subject line <strong className="font-semibold text-ink">Facility correction</strong> and:
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  'The facility name and its state, as the app shows them',
                  'What is wrong, and the correct information if it is known to you',
                  'How you know, if you can say (you work there, you visited, it was closed)',
                ].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {x}
                  </li>
                ))}
              </ul>
            </FeatureRow>
          </Card>
        </div>
      </Section>

      <Section tone="sunk">
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <FeatureRow icon={Smartphone} title="Finding the app version and build number">
            <ul className="space-y-3">
              <li>
                <strong className="font-semibold text-ink">iPhone, via TestFlight.</strong> Open the
                TestFlight app. The version and build appear under WellaPath, written like 1.0 (12).
              </li>
              <li>
                <strong className="font-semibold text-ink">Android.</strong> Open your phone&rsquo;s
                Settings, then Apps, then WellaPath: the version is at the bottom of the screen. The
                Play Store listing shows it too, under About this app.
              </li>
            </ul>
          </FeatureRow>

          <FeatureRow
            icon={Trash2}
            title="Deleting your data"
            action={<TextLink href="/privacy">The privacy policy, in full</TextLink>}
          >
            <ul className="space-y-3">
              <li>
                <strong className="font-semibold text-ink">In the app.</strong> There is no
                WellaPath account and no sign-in. Symptom answers and results are stored on your
                phone only, so deleting the app deletes them. There is nothing on our side to ask
                us to remove.
              </li>
              <li>
                <strong className="font-semibold text-ink">On this website.</strong> If you joined
                the launch list, email{' '}
                <a href={`mailto:${SUPPORT.email}`} className="text-accent-ink underline underline-offset-2">{SUPPORT.email}</a>{' '}
                from the address you signed up with, or name the WhatsApp number, and we delete it.
              </li>
            </ul>
          </FeatureRow>
        </div>
      </Section>

      <Section tone="ground">
        <SectionHeader
          eyebrow="Coverage"
          lead="Where WellaPath works today."
          rest="The facility directory covers three states. Not yet national, and we say so rather than round up."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {COVERAGE.states.map((s) => (
            <Card key={s.name} className="p-6">
              <div className="tnum text-figure font-normal text-ink">{s.count.toLocaleString('en-NG')}</div>
              <div className="text-body mt-1 text-ink-soft">facilities in {s.name}</div>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <TextLink href="/coverage">See the full coverage picture</TextLink>
        </div>

        <Disclaimer className="mt-12" />
      </Section>
    </>
  )
}
