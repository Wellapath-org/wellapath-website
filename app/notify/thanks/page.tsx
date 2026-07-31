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
import { Check, TriangleAlert, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thanks',
  description: 'You are on the list for the WellaPath launch.',
  robots: { index: false, follow: true },
}

type Status = 'ok' | 'invalid' | 'error'

const COPY: Record<Status, { eyebrow: string; lead: string; rest: string }> = {
  ok: {
    eyebrow: 'You are on the list',
    lead: 'We will email you once.',
    rest: 'On the day the app is live, and not before.',
  },
  invalid: {
    eyebrow: 'Check the address',
    lead: 'That email address did not look right.',
    rest: 'Go back and try again.',
  },
  error: {
    eyebrow: 'Something went wrong',
    lead: 'We could not save your address.',
    rest: 'This one is on us, not on you.',
  },
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const s: Status = status === 'ok' || status === 'invalid' ? status : 'error'
  const c = COPY[s]
  const good = s === 'ok'

  return (
    <>
      <section className="relative overflow-hidden bg-ground">
        <div className="aurora-soft" aria-hidden="true" />
        <div className="rails relative mx-auto w-full max-w-[1120px] px-6 py-24 md:px-10 md:py-32">
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/how-it-works">See how it works</Button>
              <Button href="/" variant="secondary">
                Back to the site
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
                email, on the day the app is live. No newsletter, no product updates, no
                &ldquo;we miss you&rdquo;.
              </p>
              <p>
                Your address is stored on its own. It is not linked to any symptom data, because
                there is none to link it to. The assessment runs on your phone and never reaches
                us.
              </p>
              <p>
                Under the NDPR our lawful basis is your consent, given when you submitted the form.
                You can withdraw it at any time and we will delete the address. We delete the whole
                list within 30 days of launch either way. See <a href="/privacy">privacy</a>.
              </p>
            </>
          ) : (
            <>
              <p>
                {s === 'invalid'
                  ? 'Nothing was saved. Head back and check the address for a typo.'
                  : 'Nothing was saved, and the fault is at our end. Please try again in a moment.'}
              </p>
              <p>
                If you need care now, do not wait on us. Call{' '}
                <a href={`tel:${EMERGENCY.national}`}>{EMERGENCY.national}</a> in an emergency, or
                read the <a href="/conditions">condition guides</a>, which need no app and no
                sign-up.
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
