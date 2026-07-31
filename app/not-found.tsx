import { PageHeader, Section, Button } from '@/components/ui'

export default function NotFound() {
  return (
    <>
      <PageHeader
        lead="We could not find that page."
        rest="It may have moved. If you were looking for a condition, the full list is below."
      />
      <Section tone="ground">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/conditions">Browse all conditions</Button>
          <Button href="/coverage" variant="secondary">Where we work</Button>
        </div>
      </Section>
    </>
  )
}
