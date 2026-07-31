/**
 * Typed loader over the 50 shipped condition artifacts.
 *
 * Everything here runs at build time — condition pages are static and carry no
 * client JavaScript (WEBSITE_GUIDE §9: a condition page must be readable with
 * JavaScript disabled or failed).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { toDisplayUrgency, type DisplayUrgency } from './urgency'
import { redFlagLabel, type RedFlagLabel } from './red-flag-labels'

const DIR = join(process.cwd(), 'content', 'artifacts', 'conditions')

type RawCondition = {
  condition_id: string
  condition_name: string
  version: string
  urgency_default: string
  base_weight: number
  symptoms: { token: string; weight: number }[]
  red_flags: string[]
  severity_levels?: Record<string, string[]>
  demographic_modifiers?: { modifier: string; effect: string; note: string }[]
  seasonal_modifiers?: { season: string; effect: string; note: string }[]
  explanation_template: string
  care_level: string
  local_expressions?: string[]
  duration_note?: string | null
}

export type Condition = {
  slug: string
  id: string
  name: string
  urgency: DisplayUrgency
  /** The raw artifact value, kept so the self_care question stays answerable. */
  rawUrgency: string
  symptoms: { token: string; label: string; weight: number }[]
  dangerSigns: (RedFlagLabel & { token: string })[]
  severity: { mild: string[]; moderate: string[]; severe: string[] }
  whoIsMostAtRisk: { modifier: string; label: string; note: string }[]
  seasonal: { season: string; label: string; note: string }[]
  explanation: string
  careLevel: string
  /** "body hot", "fever dey" — the best organic-search asset in the repo (§12). */
  localExpressions: string[]
  durationNote: string | null
}

/**
 * Em-dashes, removed at the display layer.
 *
 * The shipped clinical artifacts use em-dashes heavily: 45 of the 50 condition
 * files, 92 distinct strings across explanation templates, demographic notes and
 * seasonal notes. Heavy em-dash use now reads as machine-written, so it does not
 * belong in published copy.
 *
 * This is done on the way OUT rather than by editing the artifacts, because the
 * artifacts are the source of truth shared with the Flutter app. Rewriting them
 * here would silently diverge the two surfaces and change clinical text without
 * review. The proper fix is in `wellapath-knowledge-base`; this keeps the website
 * clean until that lands.
 *
 * Two rules, both checked against all 92 strings:
 *   - a matched pair (a parenthetical aside) becomes commas
 *   - a single dash becomes a full stop when it joins two complete clauses,
 *     and a colon when it introduces a short elaboration
 */
export function deDash(input: string): string {
  if (!input.includes('—')) return input
  const count = (input.match(/—/g) ?? []).length
  if (count >= 2) return input.replace(/\s*—\s*/g, ', ').replace(/,\s*,/g, ',')

  const left = input.split('—')[0].trim()
  const complete =
    left.split(/\s+/).length >= 5 && !/\b(and|or|with|of|for|to|in|the|a)$/i.test(left)

  return input.replace(/\s*—\s*(.)/, (_m, c: string) =>
    complete ? `. ${c.toUpperCase()}` : `: ${c}`,
  )
}

/** snake_case token → human words. Only ever used for symptom tokens, which are
 *  already plain ("dark_urine", "fast_breathing"). Danger signs never come
 *  through here — they go through the reviewed label layer instead. */
export function humanise(token: string): string {
  const s = token.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const DEMOGRAPHIC_LABELS: Record<string, string> = {
  children_under_5: 'Children under 5',
  pregnancy: 'Pregnancy',
  elderly: 'Older adults',
  infants: 'Infants',
  immunocompromised: 'People with weakened immunity',
  neonates: 'Newborns',
  chronic_illness: 'People with a long-term illness',
  malnourished: 'People who are malnourished',
}

const SEASON_LABELS: Record<string, string> = {
  rainy_season: 'Rainy season (May–October)',
  dry_season: 'Dry season (November–April)',
  harmattan: 'Harmattan (December–February)',
  meningitis_belt_season: 'Meningitis season (December–June)',
}

function parse(file: string): Condition {
  const raw: RawCondition = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
  const slug = raw.condition_id.replace(/_/g, '-')

  return {
    slug,
    id: raw.condition_id,
    name: raw.condition_name,
    urgency: toDisplayUrgency(raw.urgency_default),
    rawUrgency: raw.urgency_default,
    symptoms: (raw.symptoms ?? [])
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .map((s) => ({ token: s.token, label: humanise(s.token), weight: s.weight })),
    dangerSigns: (raw.red_flags ?? []).map((t) => ({ token: t, ...redFlagLabel(t) })),
    severity: {
      mild: (raw.severity_levels?.mild ?? []).map(humanise),
      moderate: (raw.severity_levels?.moderate ?? []).map(humanise),
      severe: (raw.severity_levels?.severe ?? []).map(humanise),
    },
    whoIsMostAtRisk: (raw.demographic_modifiers ?? [])
      .filter((m) => m.effect === 'increase_urgency')
      .map((m) => ({
        modifier: m.modifier,
        label: DEMOGRAPHIC_LABELS[m.modifier] ?? humanise(m.modifier),
        note: deDash(m.note),
      })),
    seasonal: (raw.seasonal_modifiers ?? []).map((s) => ({
      season: s.season,
      label: SEASON_LABELS[s.season] ?? humanise(s.season),
      note: deDash(s.note),
    })),
    explanation: deDash(raw.explanation_template),
    careLevel: raw.care_level,
    localExpressions: raw.local_expressions ?? [],
    durationNote: raw.duration_note ?? null,
  }
}

let cache: Condition[] | null = null

export function getAllConditions(): Condition[] {
  if (cache) return cache
  cache = readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map(parse)
    .sort((a, b) => a.name.localeCompare(b.name))
  return cache
}

export function getCondition(slug: string): Condition | undefined {
  return getAllConditions().find((c) => c.slug === slug)
}

export const getSeasonalConditions = () => getAllConditions().filter((c) => c.seasonal.length > 0)

/** Filters for the index. Links, not JavaScript. */
export type ConditionFilter = { urgency?: string; seasonal?: string }

export function filterConditions(all: Condition[], f: ConditionFilter): Condition[] {
  let out = all
  if (f.urgency) out = out.filter((c) => c.urgency === f.urgency)
  if (f.seasonal === 'true') out = out.filter((c) => c.seasonal.length > 0)
  return out
}
