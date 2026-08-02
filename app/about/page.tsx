import type { Metadata } from 'next'
import { PageHeader, Section, SectionHeader, Card, Prose, Button } from '@/components/ui'
import { Disclaimer } from '@/components/clinical'
import { RECEIPTS } from '@/content/site'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who builds WellaPath, why Nigeria, and why a symptom app that refuses to guess is more useful than one that pretends to know.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        lead="Who is behind this."
        rest="In health, this is the decisive question, and anonymous health brands do not get trusted, nor should they."
      />

      <Section tone="ground">
        <SectionHeader eyebrow="Why" lead="The enemy is waiting." />
        <Prose>
          <p>
            WellaPath is not really competing with other apps. The real alternatives, when someone
            falls ill at 11pm, are: ask a relative, ask a pharmacist over the counter, search the
            symptoms and land on American content that has never heard of Lassa fever, or wait and
            see if it gets worse.
          </p>
          <p>
            <strong>That last one is what kills.</strong> Late presentation, meaning arrival at a facility
            after the window in which treatment was straightforward, is the failure mode that runs
            through malaria, meningitis, snake bite, neonatal infection and most of the other{' '}
            {RECEIPTS.conditions} conditions in our knowledge base.
          </p>
          <p>
            So the product does not try to be clever about what you have. It tries to be right about
            how fast you need to move, and specific about where to go. A symptom app that refuses to
            guess is more credible than one that pretends to know, and more useful, because
            &ldquo;go tonight&rdquo; is actionable in a way that a probability is not.
          </p>
        </Prose>
      </Section>

      <Section tone="sunk">
        <SectionHeader
          eyebrow="Why Nigeria first"
          lead="Because generic health content is wrong here."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">The conditions differ</h3>
            <p className="text-body mt-2 text-ink-soft">
              Lassa fever, cerebrospinal meningitis, cholera, yellow fever, snake bite. A symptom
              checker built for another market does not carry them, and will confidently route around
              them.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">The seasons matter</h3>
            <p className="text-body mt-2 text-ink-soft">
              Malaria transmission peaks May–October. Meningitis has its own season. A fever in July
              is not a fever in January, and only a system that knows where it is can act on that.
            </p>
          </Card>
          <Card className="p-7">
            <h3 className="text-h3 font-bold text-ink">The language differs</h3>
            <p className="text-body mt-2 text-ink-soft">
              &ldquo;Body hot&rdquo;. &ldquo;Fever dey&rdquo;. Every condition in the knowledge base
              carries the everyday expressions people actually use, because that is what someone
              types at 2am.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Team ────────────────────────────────────────────────────────
          §7 asks for real names, real faces, real credentials. This section
          is deliberately built as a structured placeholder rather than filled
          with stock portraits. See the note.
          ──────────────────────────────────────────────────────────── */}
      <Section tone="ground">
        <SectionHeader
          eyebrow="The team"
          lead="Real names, real credentials."
          rest="This section is not yet filled in, and that is a gap rather than a style choice."
        />
        <div className="rounded-xl bg-accent-wash ring ring-accent/15 p-6">
          <h3 className="text-h3 font-bold text-ink">To be published before launch</h3>
          <p className="text-body measure mt-3 text-ink-soft">
            Founders and their backgrounds. The clinician who reviews the knowledge base, named, with
            credentials. Anyone else whose judgement shapes what the app tells people.
          </p>
          <p className="text-body measure mt-3 text-ink-soft">
            We will not fill this with stock photography or unattributed job titles. In this
            category, an anonymous team page is worse than no team page. It reads exactly like the
            things we are trying to be distinguished from.
          </p>
        </div>
      </Section>

      <Section tone="sunk">
        <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-start">
          <Card className="p-7">
            <h2 className="text-h2 font-bold text-ink">Talk to us</h2>
            <p className="text-body measure mt-3 text-ink-soft">
              If you are a clinician, a health authority, a journalist, or someone who found
              something on this site that is wrong, we would rather hear it from you than from a
              user.
            </p>
            <div className="mt-6">
              <Button href="/partners">Get in touch</Button>
            </div>
          </Card>
          <Disclaimer />
        </div>
      </Section>
    </>
  )
}
