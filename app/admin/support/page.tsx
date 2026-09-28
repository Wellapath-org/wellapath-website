import type { Metadata } from 'next'

import { Eyebrow, Section, TwoTone } from '@/components/ui'
import { FactPanel, InactiveSection } from '@/components/admin'
import { MANUAL_FACTS } from '@/content/admin/register'
import { aged, type LabelledFact } from '@/content/admin/facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Support',
  robots: { index: false, follow: false, nocache: true },
}

export default function SupportPage() {
  const now = new Date()

  const published: LabelledFact[] = [
    { label: 'Support contact', ...aged(MANUAL_FACTS.supportContact, now) },
    { label: 'Privacy policy', ...aged(MANUAL_FACTS.privacyPolicy, now) },
  ]

  return (
    <>
      <Section tone="ground" space="tight">
        <Eyebrow>Internal · not indexed</Eyebrow>
        <TwoTone
          as="h1"
          size="display"
          lead="Support."
          rest="A published contact exists. In-app support chat does not."
          className="mt-4"
        />
      </Section>

      <Section tone="sunk" space="tight">
        <div className="max-w-[640px]">
          <InactiveSection
            what="In-app support chat"
            why="The interface is designed and unreachable. It stays off until there is both a backend and a staffed process with published hours, because an entry point that looks live and answers nobody is worse than no entry point."
            whenActive="When it is enabled, this section will show conversations. There is no chat service, no queue and no transcript store, and none is built in this phase."
          />
        </div>
      </Section>

      <Section tone="ground" space="tight">
        <div className="max-w-[640px]">
          <FactPanel title="What is published today" facts={published}>
            The route people actually have. Both are live on this site and were verified for store
            review.
          </FactPanel>
          <p className="text-small mt-4 text-ink-soft">
            The published line is that a reply is aimed for within two working days. It is
            deliberately an aim rather than a guarantee, and the contact is not a named Data
            Protection Officer and must not be described as one until someone is formally
            appointed.
          </p>
        </div>
      </Section>
    </>
  )
}
