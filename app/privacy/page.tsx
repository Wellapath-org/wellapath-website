import type { Metadata } from 'next'
import { PageHeader, Section, SectionHeader, Card, Prose } from '@/components/ui'
import { PrivacyDiagram, Disclaimer } from '@/components/clinical'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What WellaPath collects, what it never collects, and why the symptom assessment runs entirely on your phone. Plain language first, legal text second.',
}

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        lead="Nothing you enter leaves your phone."
        rest="Plain language first. This is not a policy we wrote around a product. It is how the product is built, and it is the part competitors cannot copy without rebuilding their architecture."
      />

      <Section tone="ground">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Prose>
            <p>
              The symptom assessment runs on your device. The clinical rules are downloaded to your
              phone; your symptoms are never uploaded. There is no path for them to reach us.
            </p>
            <p>
              That means we cannot show you your history across devices, and we cannot recover an
              assessment if you lose your phone. We think that is the right trade.
            </p>
          </Prose>
          <div className="flex justify-center">
            <PrivacyDiagram />
          </div>
        </div>
      </Section>

      <Section tone="sunk">
        <SectionHeader lead="The short version" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-7">
            {/* Not triage green: §2.2 reserves the triage palette for urgency.
                If green means "non-urgent" everywhere except here, it means
                nothing anywhere. */}
            <h3 className="text-h3 font-bold text-ink">What we never collect</h3>
            <ul className="mt-4 space-y-2">
              {[
                'Your symptoms, or any assessment you run',
                'Your assessment results or urgency levels',
                'Your name, date of birth or NIN',
                'Your precise location',
                'Your contacts, photos, messages or files',
                'Anything at all that would identify you as a person with a health concern',
              ].map((x) => (
                <li key={x} className="text-body flex gap-3 text-ink-soft">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">What we do handle</h3>
            <ul className="mt-4 space-y-2">
              {[
                'Your email address or WhatsApp number, only if you give it to us for launch notification',
                'Anonymous, aggregate counts of app downloads',
                'Crash reports, if your device is set to send them. These contain no symptom data',
              ].map((x) => (
                <li key={x} className="text-body flex gap-3 text-ink-soft">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
            <p className="text-small mt-4 text-ink-mute">
              This website sets no cookies and runs no third-party analytics or advertising scripts.
              There is no cookie banner because there is nothing to consent to.
            </p>
          </Card>
        </div>
      </Section>

      <Section tone="ground">
        <SectionHeader
          eyebrow="NDPR"
          lead="Nigeria Data Protection Regulation"
          rest="Our obligations under the NDPR, stated plainly."
        />
        <Prose>
          <p>
            <strong>Lawful basis.</strong> Where we process personal data at all, it is on the basis
            of your consent, given when you enter your email address or WhatsApp number, and withdrawable at
            any time.
            The symptom assessment itself processes no personal data on our side, because it never
            reaches our side.
          </p>
          <p>
            <strong>Your rights.</strong> You may ask what we hold about you, ask us to correct it,
            or ask us to delete it. Because the only thing we are likely to hold is an email address
            or a phone number, these requests are usually resolved in one step.
          </p>
          <p>
            <strong>Retention.</strong> Email addresses and WhatsApp numbers collected for launch
            notification are deleted within 30 days of launch, or immediately on request. A WhatsApp
            number is used to send the launch message and nothing else. We do not add you to any
            group, and we do not pass the number to anyone.
          </p>
          <p>
            <strong>Analytics restraint.</strong> If we ever add analytics, it will be a cookieless,
            privacy-respecting tool, it will be genuinely opt-in and never pre-checked, and it will
            never run on a condition page. Condition-page browsing is the most sensitive category of
            data on this site and we will not send it to a third party.
          </p>
          <p>
            <strong>Contact for data requests.</strong> A named data protection contact will be
            published here before launch.
          </p>
        </Prose>

        <div className="mt-10 rounded-xl bg-accent-wash ring ring-accent/15 p-6">
          <h2 className="text-h3 font-bold text-ink">Full legal text</h2>
          <p className="text-body measure mt-2 text-ink-soft">
            The formal privacy policy is being finalised with counsel and will be published here
            before launch. It will not contradict anything above. The plain-language summary is the
            binding description of what we do.
          </p>
        </div>

        <Disclaimer className="mt-10" />
      </Section>
    </>
  )
}
