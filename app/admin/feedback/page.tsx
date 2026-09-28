import type { Metadata } from 'next'

import { AdminHeader, InactiveSection } from '@/components/admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Feedback',
  robots: { index: false, follow: false, nocache: true },
}

export default function FeedbackPage() {
  return (
    <>
      <AdminHeader
        title="Feedback"
        summary="Designed in the app, switched off, and with nowhere to arrive."
      />

          <InactiveSection
            what="In-app feedback"
            why="The interface exists in the mobile app behind a compile-time flag that is false in every build, so the control strings are removed from the binary entirely. There is no submission endpoint and no store, so no feedback has ever been sent or received."
            before="When it is enabled, this section will list submissions. Until then it stays empty on purpose: a table with no rows would suggest feedback is being collected and that nobody has sent any, and neither is true."
          />

      <p className="text-small mt-5 max-w-[70ch] text-ink-soft">
            Enabling the flag alone would not be enough. The app ships a submitter that sends
            nothing, so turning the feature on without a real backend would show a person a
            confirmation for a message that went nowhere. Both halves have to land together.
      </p>
    </>
  )
}
