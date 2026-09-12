/**
 * The waitlist, which is what wellapath.org is until the app ships.
 *
 * Content is the marketing lead's, from the Canva mock. The treatment is this
 * site's own: `navy` sections, `navy` cards and the `onNavy` button variant all
 * already existed for the dark bands on /how-it-works, so the mock's dark look
 * is reachable without inventing a second theme.
 *
 * ── Where this deviates from the mock, and why ─────────────────────────────
 *
 * 1. NO "LIMITED SPOTS". The mock says it twice. There is no cap, so it is a
 *    claim we could not stand behind, and §8.1 rules out pressure patterns for
 *    the same reason the form has no pre-checked consent. "Early access" is
 *    kept, because that part is true.
 *
 * 2. THE WHATSAPP LINE LOST THE WORD "diagnosis". check-copy bans it outright,
 *    everywhere, with no audience exemption. "their own answer" carries the
 *    same joke and does not put a regulated word in a headline block.
 *
 * 3. "Verified Access" NAMES THE THREE STATES. The mock promises "real, nearby
 *    clinics you can trust", which reads as national coverage of a directory
 *    the website does not have. Lagos, Kano and the FCT is the true version.
 *
 * 4. EM-DASHES ARE GONE, in the three feature cards and the closing line.
 *    check-copy fails the build on any of them.
 *
 * 5. IT CARRIES 112 AND THE DISCLAIMER, by way of the footer. A page whose
 *    headline asks "not sure how bad it is?" is precisely the page that must
 *    not be the one surface where the emergency number is missing.
 *
 * The form is `GetTheApp`, unchanged and posting to the same /api/notify. One
 * waitlist, one table, one promise. Only its wording is passed in.
 */
import { Section, Card, Button } from './ui'
import { GetTheApp } from './chrome'
import { SITE } from '@/content/site'
import { Zap, MapPin, HeartPulse, ChevronDown } from 'lucide-react'

/* ── Copy ─────────────────────────────────────────────────────────────────
   Kept as data at the top so the marketing lead can read and change it
   without reading JSX.
   ───────────────────────────────────────────────────────────────────────── */

const FAMILIAR = [
  'You ask the family WhatsApp group, and suddenly everyone is a doctor with their own answer, but nobody is actually sure what is wrong.',
  'So you wait it out until you cannot anymore.',
]

const PILLARS = [
  {
    icon: Zap,
    title: 'Instant clarity',
    body: 'Answer a few quick questions about your symptoms, then get a clear urgency level, not a list of possible illnesses to panic over.',
  },
  {
    icon: MapPin,
    title: 'Verified access',
    body: 'See real clinics near you in Lagos, Kano and the FCT, so there is no guessing about which one to walk into.',
  },
  {
    icon: HeartPulse,
    title: 'Built for Nigerians',
    body: 'Grounded in the conditions Nigerians actually deal with, not in another country’s healthcare system.',
  },
]

const FAQ = [
  {
    q: 'When does WellaPath launch?',
    a: 'We are in final testing now. Waitlist members get access first, ahead of the public launch.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. Joining the waitlist and early access are both free.',
  },
  {
    q: 'Is my information safe?',
    a: 'We collect the minimum needed to reach you once: an email address or a WhatsApp number, and nothing else. The symptom assessment runs on your phone, so your symptoms never reach us and there is nothing to attach your details to.',
  },
  {
    q: 'Do I need to be sick to join the waitlist?',
    a: 'No. Join now and you are already in when we launch. You will use it whenever you need it.',
  },
]

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function Waitlist() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────
          The one h1 on the page. `text-hero` rather than TwoTone, because
          TwoTone sets `text-ink` and this band is navy. */}
      <Section tone="navy" space="loose">
        <div className="measure-wide mx-auto text-center">
          <p className="text-eyebrow font-mono font-medium uppercase text-ink-on-navy">
            Early access
          </p>
          <h1 className="text-hero mt-5 font-bold text-white">
            Feeling sick but not sure how bad it is?{' '}
            <span className="font-normal text-ink-on-navy">What do you do?</span>
          </h1>
          <p className="text-body measure mx-auto mt-6 text-ink-on-navy">
            WellaPath helps you understand what is going on, and what to do next, in simple and
            clear steps.
          </p>

          <div className="mt-9 flex justify-center">
            <Button href="#get-the-app" variant="onNavy" showIcon={false}>
              Get early access. It is free
            </Button>
          </div>
          <p className="text-small mt-4 text-ink-on-navy/80">
            Takes 10 seconds. Be one of the first to try it.
          </p>
        </div>
      </Section>

      {/* ── The problem, in the reader's own words ───────────────────────── */}
      <Section tone="navy" space="normal" className="border-t border-white/10">
        <h2 className="text-h1 text-center font-bold text-white">Does this sound familiar?</h2>

        <div className="measure-wide mx-auto mt-10 flex flex-col gap-4">
          {FAMILIAR.map((line) => (
            <Card key={line} tone="navy" className="p-6 md:p-7">
              <p className="text-body text-ink-on-navy">{line}</p>
            </Card>
          ))}
        </div>

        <p className="text-body measure-wide mx-auto mt-10 text-center text-white">
          When something feels wrong and you do not know what to do next, think {SITE.name}.
        </p>
      </Section>

      {/* ── What it actually does ────────────────────────────────────────── */}
      <Section space="normal">
        <ul className="grid gap-5 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <Card key={title} as="li" className="p-7 md:p-8">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent-wash text-accent-ink">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-h3 mt-5 font-bold text-ink">{title}</h2>
              <p className="text-body mt-3 text-ink-soft">{body}</p>
            </Card>
          ))}
        </ul>
      </Section>

      {/* ── Why join before there is anything to use ─────────────────────── */}
      <Section tone="sunk" space="normal">
        <div className="measure-wide mx-auto text-center">
          <p className="text-eyebrow font-mono font-medium uppercase text-ink-mute">Why join now</p>
          <h2 className="text-display mt-4 font-bold text-ink">More than early access</h2>
          <p className="text-body mt-6 text-ink-soft">
            As one of the first people to use {SITE.name}, you get to tell us what worked and what
            did not. Your feedback goes straight into the product that thousands of Nigerians will
            use next.
          </p>
          <div className="mt-9 flex justify-center">
            <Button href="#get-the-app" showIcon={false}>
              Be among the first to try {SITE.name}
            </Button>
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────
          <details>, so it opens with no JavaScript and is announced as a
          disclosure widget. §9: the page has to work with scripting off. */}
      <Section space="normal">
        <h2 className="text-display text-center font-bold text-ink">Quick FAQ</h2>

        <div className="measure-wide mx-auto mt-10 flex flex-col gap-3">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl bg-card ring ring-ink/8 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 p-6 text-body font-semibold text-ink">
                {q}
                <ChevronDown
                  className="size-4 shrink-0 text-ink-mute transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="text-body px-6 pb-6 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ── The ask ──────────────────────────────────────────────────────
          GetTheApp is the site's existing capture form, posting to the same
          /api/notify. Only the wording around the two fields changes. */}
      <Section tone="sunk" space="loose">
        <div className="measure-wide mx-auto text-center">
          <h2 className="text-display font-bold text-ink">
            Your next symptom deserves a clear answer, not another guessing game.
          </h2>
          <p className="text-body mt-6 text-ink-soft">
            Join the waitlist today. Members get first access before we open it to everyone else.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <GetTheApp
            heading="Join the waitlist."
            headingRest="It is free, and no account is needed."
            intro="Leave an email address or a WhatsApp number. We will tell you once, on the day your early access opens. Nothing else, ever."
            promise="One message, when early access opens."
            submitLabel="Join the waitlist"
          />
        </div>
      </Section>
    </>
  )
}
