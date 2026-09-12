import type { Metadata } from 'next'
import { PageHeader, Section, SectionHeader, Card, Prose } from '@/components/ui'
import { AnalyticsChoice } from '@/components/analytics'
import { PrivacyDiagram, Disclaimer } from '@/components/clinical'
import { SUPPORT } from '@/content/site'

/**
 * The date the policy speaks from. One constant, because it appears twice on
 * the page and the two copies must never disagree.
 */
const EFFECTIVE = '12 September 2026'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What WellaPath collects, what it never collects, and why the symptom assessment runs entirely on your phone. Plain language first, legal text second.',
  alternates: { canonical: '/privacy' },
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
        <div className="grid gap-8 sm:gap-10 md:grid-cols-[1fr_1fr] md:gap-12 md:items-center">
          <Prose>
            <p>
              The symptom assessment runs on your device. The clinical rules are downloaded to your
              phone; your symptoms are never uploaded. There is no path for them to reach us.
            </p>
            <p>
              That means we cannot show you your history across devices, and we cannot recover an
              assessment if you lose your phone. We think that is the right trade.
            </p>
            <p className="text-small text-ink-mute">
              Effective {EFFECTIVE}. This policy covers the WellaPath app and this website,
              wellapath.org. Questions and requests:{' '}
              <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>.
            </p>
          </Prose>
          <div className="flex justify-center">
            <PrivacyDiagram />
          </div>
        </div>
      </Section>

      {/* id="collect": the footer has linked to /privacy#collect since the
          Legal column existed; the anchor now actually exists. */}
      <Section tone="sunk" id="collect">
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
                'Which marketing pages get visited, and only if you say yes when asked. Never a condition page',
              ].map((x) => (
                <li key={x} className="text-body flex gap-3 text-ink-soft">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
            <p className="text-small mt-4 text-ink-mute">
              This website sets no cookies and sends nothing to a third party unless you answer yes
              to the one question we ask. Decline, ignore it, or browse with JavaScript off, and no
              analytics script is ever loaded.
            </p>
          </Card>
        </div>
      </Section>

      <Section tone="ground">
        <SectionHeader
          lead="The app, in detail"
          rest="What each permission is for, and what happens when things go wrong."
        />
        <Prose wide>
          <p>
            <strong>Location permission.</strong> The app asks for location permission for one
            purpose: to sort the facility directory by distance, so the nearest facility that can
            treat the situation is at the top of the list. The sorting happens on your phone,
            against a directory the app has already downloaded. Your precise location is never sent
            to us and never stored by us. You can decline the permission; the symptom assessment
            does not need it.
          </p>
          <p>
            <strong>What stays on the device.</strong> Your symptom answers, your assessment
            results and your precise location remain on your phone. They are not uploaded and not
            backed up to our servers, and we cannot see them. This is not a policy choice we could
            quietly reverse later: the app has no code path that transmits them.
          </p>
          <p>
            <strong>Crash reporting.</strong> If the app crashes, Apple and Google may collect a
            crash report when your device settings allow it, and pass it to us through their
            developer consoles. During testing on TestFlight and Google Play, this is how we learn
            a build is failing. A crash report describes the state of the code, not what was typed
            into it: it carries no symptom answers and no location. The app includes the Sentry
            crash-reporting library as a dependency, but in the current build it is not configured
            and its telemetry is disabled, so it sends nothing to Sentry: no crash data, no
            analytics, no symptom data. If we ever turn it on, this policy changes first.
          </p>
          <p>
            <strong>Third-party services.</strong> For this website: Vercel hosts it, Neon holds
            the launch-list database, Resend sends the one launch email, and Google Analytics runs
            only for visitors who opt in, as described below. For the app: Apple and Google
            distribute it and handle crash reports as above, and Sentry&rsquo;s library is present
            but switched off, receiving nothing. None of these companies receives symptom data,
            because symptom data never leaves your phone.
          </p>
          <p>
            <strong>Sharing.</strong> We do not sell personal data, and we do not share it with
            anyone beyond the providers named above, who process it on our instructions. There is
            no advertising on the app or the site, and no data goes to advertisers.
          </p>
          <p>
            <strong>Security.</strong> Everything between your phone or browser and our servers
            travels over HTTPS. The launch list lives in one database, and access to it is
            password-protected and limited. The strongest protection sits upstream of all of this:
            the most sensitive data never reaches us, so no breach of ours could expose it.
          </p>
          <p>
            <strong>Children.</strong> WellaPath is written for adults. A parent or carer can use
            it to check a child&rsquo;s symptoms, which is why the age questions exist, and those
            answers stay on the phone like everything else. We do not knowingly collect personal
            data from anyone under 18; the only personal data we collect at all is an email address
            or WhatsApp number, typed into the launch form by the person it belongs to.
          </p>
          <p>
            <strong>Deletion.</strong> Delete the app and everything it stored goes with it,
            because it was stored nowhere else; there is no account to close. For anything held by
            us, one email to <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a> removes it.
          </p>
        </Prose>
      </Section>

      <Section tone="sunk">
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
            <strong>Analytics.</strong> We use Google Analytics on the marketing pages, and only
            for people who choose it. We said this would be opt-in and never pre-checked, and never
            on a condition page. Both hold. The banner has two buttons of equal weight and neither
            is preselected; nothing loads until you press Accept. Declining, ignoring it, or
            browsing with JavaScript off all mean no request reaches Google at all.
          </p>
          <p>
            <strong>Condition pages are never counted.</strong> Nothing under{' '}
            <a href="/conditions">/conditions</a> is reported, whatever you chose, and the banner
            does not appear there either. What you are worried about is the most sensitive thing
            this site could know, and we would rather not know it. One honest limit: Google&rsquo;s
            script cannot be unloaded once it is running, so if you accept on a marketing page and
            then open a condition guide, it is still in memory. It is told nothing. Every visit we
            report is sent by hand, and condition pages are not on the list.
          </p>
          <p>
            <strong>What Google receives, if you accept.</strong> The page you visited, roughly
            where you are, and what kind of device you used. Google sets its own cookies at that
            point. It never receives symptoms, because the assessment runs on your phone and there
            is no path for that data to reach us, let alone them.
          </p>
          <p>
            <strong>Contact for data requests.</strong> Email{' '}
            <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>. We aim to respond within{' '}
            {SUPPORT.responseTime}. A named data protection contact will be published here before
            public launch.
          </p>
        </Prose>

        {/* Consent that cannot be withdrawn is not consent, which is the NDPR
            basis this whole page rests on. The control is here rather than in a
            footer link because this is the page someone reads when they want to
            change their mind. */}
        <div className="mt-10">
          <AnalyticsChoice />
        </div>

        <div className="mt-10 rounded-xl bg-accent-wash ring ring-accent/15 p-6">
          <h2 className="text-h3 font-bold text-ink">This document is the policy</h2>
          <p className="text-body measure mt-2 text-ink-soft">
            This plain-language text is WellaPath&rsquo;s privacy policy, effective {EFFECTIVE},
            and the binding description of what we do. When our practices change, this page and its
            date change with them, before the practice does.
          </p>
        </div>

        <Disclaimer className="mt-10" />
      </Section>
    </>
  )
}
