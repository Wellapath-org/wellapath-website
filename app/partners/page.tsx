/**
 * B2B. Different reader — a clinician or a procurement officer — so precision
 * beats simplicity here (§7). Primary action is a conversation, not an install.
 *
 * §14 flags that an empty B2B page is worse than none. This ships with a real
 * form and a concrete description of what a partnership involves; if the offer
 * behind it is not ready, remove the route from NAV rather than softening it.
 */
import type { Metadata } from 'next'
import { PageHeader, Section, SectionHeader, Card, Button } from '@/components/ui'
import { RECEIPTS } from '@/content/site'

export const metadata: Metadata = {
  title: 'For clinics, employers & NGOs',
  description:
    'WellaPath for organisations: triage guidance built on Nigerian clinical guidance, an on-device architecture, and a facility directory covering Lagos, Kano and the FCT.',
}

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Partners"
        lead="For clinics, employers and NGOs."
        rest="WellaPath reduces late presentation by telling people how urgently to act. If you carry responsibility for a population's health outcomes, that is the number you care about."
      />

      <Section tone="ground">
        <SectionHeader lead="What we can offer" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Clinics & hospital groups</h3>
            <p className="text-body mt-2 text-ink-soft">
              Directing patients to the right level of care at the right time, and reducing
              inappropriate emergency presentations. Listing accuracy in the directory for your
              facilities.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">Employers</h3>
            <p className="text-body mt-2 text-ink-soft">
              A triage layer for staff and their dependants that does not require a clinician on
              call, and does not put employee health data in your hands. The assessment runs on the
              employee&apos;s own device.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">NGOs & public health</h3>
            <p className="text-body mt-2 text-ink-soft">
              Community-level triage guidance aligned to Nigerian treatment guidance, with seasonal
              and demographic escalation already modelled across{' '}
              <span className="tnum">{RECEIPTS.conditions}</span> conditions.
            </p>
          </Card>
        </div>
      </Section>

      <Section tone="sunk">
        <SectionHeader
          eyebrow="The technical position"
          lead="Facts a procurement review will ask for."
        />
        <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
          {[
            ['Clinical content', `${RECEIPTS.conditions} conditions and ${RECEIPTS.rules} triage rules (${RECEIPTS.rulesGlobal} global danger signs, ${RECEIPTS.rulesConditionSpecific} condition-specific), shipped as versioned, reviewable artifacts.`],
            ['Data residency', 'Symptom data does not leave the device. There is no server-side symptom store to reside anywhere.'],
            ['Facility coverage', `${RECEIPTS.facilities.toLocaleString('en-NG')} mapped facilities across Lagos, Kano and the FCT; ${RECEIPTS.emergencyCapable} flagged emergency-capable.`],
            ['Regulatory position', 'Clinical decision support, not a diagnostic device. No diagnostic claim is made anywhere in the product or the marketing.'],
            ['Offline behaviour', 'The assessment runs without a network connection once the artifacts are on the device.'],
            ['Data protection', 'NDPR-aligned. No third-party advertising or analytics on health content.'],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-rule pt-4">
              <dt className="text-body font-semibold text-ink">{t}</dt>
              <dd className="text-body mt-1 text-ink-soft">{d}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section tone="ground">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeader
              lead="Book a conversation."
              rest="Tell us what population you are responsible for and what you are trying to change. We will tell you honestly whether we can help yet."
            />
            <p className="text-body measure text-ink-soft">
              We would rather say &ldquo;not yet, and here is why&rdquo; than sell you something that
              does not fit. Coverage is 3 states today, and that is a real constraint for a national
              programme.
            </p>
          </div>

          <form
            action="/api/partners"
            method="POST"
            className="rounded-xl bg-card ring ring-ink/8 p-6"
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="p-name" className="text-body block font-semibold text-ink">
                  Your name
                </label>
                <input
                  id="p-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="mt-2 min-h-12 w-full rounded-md bg-card ring ring-field-border px-3 text-body text-ink"
                />
              </div>

              <div>
                <label htmlFor="p-org" className="text-body block font-semibold text-ink">
                  Organisation
                </label>
                <input
                  id="p-org"
                  name="organisation"
                  type="text"
                  required
                  autoComplete="organization"
                  className="mt-2 min-h-12 w-full rounded-md bg-card ring ring-field-border px-3 text-body text-ink"
                />
              </div>

              <div>
                <label htmlFor="p-email" className="text-body block font-semibold text-ink">
                  Email address
                </label>
                <input
                  id="p-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 min-h-12 w-full rounded-md bg-card ring ring-field-border px-3 text-body text-ink"
                />
              </div>

              <div>
                <label htmlFor="p-phone" className="text-body block font-semibold text-ink">
                  Phone <span className="font-normal text-ink-mute">(optional)</span>
                </label>
                {/* Accepts 0803…, +234803…, and spaced variants. Never reject a
                    valid Nigerian number on formatting (§8.3). */}
                <input
                  id="p-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+\s()\-]{7,20}"
                  placeholder="0803 123 4567 or +234 803 123 4567"
                  className="mt-2 min-h-12 w-full rounded-md bg-card ring ring-field-border px-3 text-body text-ink placeholder:text-ink-mute"
                />
              </div>

              <div>
                <label htmlFor="p-message" className="text-body block font-semibold text-ink">
                  What are you trying to change?
                </label>
                <textarea
                  id="p-message"
                  name="message"
                  rows={4}
                  required
                  className="mt-2 w-full rounded-md bg-card ring ring-field-border px-3 py-2 text-body text-ink"
                />
              </div>

              <Button type="submit" full>
                Book a conversation
              </Button>

              <p className="text-small text-ink-mute">
                We will reply to the address above. We do not add partner enquiries to any marketing
                list.
              </p>
            </div>
          </form>
        </div>
      </Section>
    </>
  )
}
