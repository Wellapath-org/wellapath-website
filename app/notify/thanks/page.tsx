/**
 * The page the signup form lands on.
 *
 * A real page rather than an in-place message, so the whole flow works with
 * JavaScript disabled (§9). It also gives room to state the NDPR position
 * plainly at the moment consent is actually given, which is where it means
 * something — rather than only on /privacy where nobody is looking.
 */
import type { Metadata } from 'next'
import { Section, TwoTone, Eyebrow, Button, Prose } from '@/components/ui'
import { Disclaimer } from '@/components/clinical'
import { EMERGENCY } from '@/content/site'
import { LAUNCHED } from '@/content/launch'
import { Check, TriangleAlert, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thanks',
  description: 'You are on the list for the WellaPath launch.',
  robots: { index: false, follow: true },
}

type Status = 'ok' | 'nothing' | 'invalid-email' | 'invalid-phone' | 'error'

const STATUSES: Status[] = ['ok', 'nothing', 'invalid-email', 'invalid-phone', 'error']

const COPY: Record<Status, { eyebrow: string; lead: string; rest: string; fix: string }> = {
  ok: {
    eyebrow: 'You are on the list',
    lead: 'We will reach you once.',
    rest: 'On the day the app is live, and not before.',
    fix: '',
  },
  nothing: {
    eyebrow: 'The form was empty',
    lead: 'We need one way to reach you.',
    rest: 'An email address or a WhatsApp number. Either on its own is enough.',
    fix: 'Nothing was saved. Go back and fill in whichever of the two suits you.',
  },
  'invalid-email': {
    eyebrow: 'Check the address',
    lead: 'That email address did not look right.',
    rest: 'Go back and try again.',
    fix: 'Nothing was saved. Head back and check the address for a typo.',
  },
  'invalid-phone': {
    eyebrow: 'Check the number',
    lead: 'That did not look like a Nigerian mobile number.',
    rest: 'We accept 0803 123 4567, +234 803 123 4567, and anything close.',
    fix: 'Nothing was saved. Head back and check the digits. Spaces and brackets are fine.',
  },
  error: {
    eyebrow: 'Something went wrong',
    lead: 'We could not save your details.',
    rest: 'This one is on us, not on you.',
    fix: 'Nothing was saved, and the fault is at our end. Please try again in a moment.',
  },
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const s: Status = STATUSES.includes(status as Status) ? (status as Status) : 'error'
  const c = COPY[s]
  const good = s === 'ok'

  return (
    <>
      <section className="relative overflow-hidden bg-ground">
        <div className="aurora-soft" aria-hidden="true" />
        <div className="rails relative mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
          <div className="relative z-1 measure-wide">
            <span
              className={`inline-flex size-11 items-center justify-center rounded-full ${
                good ? 'bg-accent-wash text-accent-ink' : 'bg-triage-warn-wash text-triage-warn'
              }`}
            >
              {good ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                <TriangleAlert className="size-5" aria-hidden="true" />
              )}
            </span>

            <div className="mt-6">
              <Eyebrow>{c.eyebrow}</Eyebrow>
            </div>
            <TwoTone as="h1" size="display" lead={c.lead} rest={c.rest} className="mt-4" />

            {/* Before launch /how-it-works is closed and would bounce the
                visitor straight back here. Offering one link that works beats
                two where the first is a round trip. */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {LAUNCHED && <Button href="/how-it-works">See how it works</Button>}
              <Button href="/" variant={LAUNCHED ? 'secondary' : 'primary'}>
                {LAUNCHED ? 'Back to the site' : 'Back to the waitlist'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Section tone="sunk" space="normal">
        <Prose>
          {good ? (
            <>
              <p>
                <strong>What happens now: nothing, until launch.</strong> We will send exactly one
                message, on the day the app is live, to whichever route you gave us. No newsletter,
                no product updates, no &ldquo;we miss you&rdquo;.
              </p>
              <p>
                What you gave us is stored on its own. It is not linked to any symptom data, because
                there is none to link it to. The assessment runs on your phone and never reaches
                us.
              </p>
              <p>
                Under the NDPR our lawful basis is your consent, given when you submitted the form.
                You can withdraw it at any time and we will delete your details. We delete the whole
                list within 30 days of launch either way. See <a href="/privacy">privacy</a>.
              </p>
            </>
          ) : (
            <>
              <p>{c.fix}</p>
              <p>
                If you need care now, do not wait on us. Call{' '}
                <a href={`tel:${EMERGENCY.national}`}>{EMERGENCY.national}</a> in an emergency
                {LAUNCHED ? (
                  <>
                    , or read the <a href="/conditions">condition guides</a>, which need no app and
                    no sign-up.
                  </>
                ) : (
                  '.'
                )}
              </p>
            </>
          )}
        </Prose>

        {!good && (
          <div className="mt-8">
            <Button href={`tel:${EMERGENCY.national}`} variant="emergency" icon={Phone}>
              Call emergency: {EMERGENCY.national}
            </Button>
          </div>
        )}

        <Disclaimer className="mt-12" />
      </Section>
    </>
  )
}
