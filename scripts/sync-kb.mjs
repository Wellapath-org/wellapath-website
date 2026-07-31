#!/usr/bin/env node
/**
 * Copies the shipped clinical artifacts from ../wellapath-knowledge-base into
 * content/artifacts/ and stamps the versions taken.
 *
 * The site deliberately commits its own copies rather than importing across repos:
 * it builds standalone on CI, and a knowledge-base release becomes a reviewable diff
 * instead of a silent change to a published figure.
 *
 *   npm run sync:kb
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KB = process.env.KB_PATH ?? resolve(ROOT, '..', 'wellapath-knowledge-base')
const OUT = join(ROOT, 'content', 'artifacts')

if (!existsSync(KB)) {
  console.error(`✗ Knowledge base not found at ${KB}`)
  console.error('  Set KB_PATH, or clone wellapath-knowledge-base beside this repo.')
  process.exit(1)
}

const FILES = {
  'rules.json': 'rules.ng.v2.2.json',
  'facilities.json': 'facilities.ng.v1.1.json',
  'tokens.json': 'token_dictionary.ng.v1.1.json',
  'red-flag-display.json': 'mobile_handoff/red_flag_display_map.json',
}

mkdirSync(OUT, { recursive: true })
rmSync(join(OUT, 'conditions'), { recursive: true, force: true })
mkdirSync(join(OUT, 'conditions'), { recursive: true })

const stamp = { syncedFrom: KB, artifacts: {} }

for (const [dest, src] of Object.entries(FILES)) {
  const raw = readFileSync(join(KB, src), 'utf8')
  writeFileSync(join(OUT, dest), raw)
  const meta = JSON.parse(raw)._metadata
  stamp.artifacts[dest] = {
    source: src,
    version: meta?.version ?? null,
    release_date: meta?.release_date ?? null,
  }
  console.log(`  ${dest.padEnd(24)} ← ${src}${meta?.version ? `  v${meta.version}` : ''}`)
}

const conditionFiles = readdirSync(join(KB, 'conditions')).filter((f) => f.endsWith('.json')).sort()
for (const f of conditionFiles) {
  writeFileSync(join(OUT, 'conditions', f.replace(/\.ng\.v[\d.]+\.json$/, '.json')), readFileSync(join(KB, 'conditions', f)))
}
stamp.artifacts['conditions/'] = { source: 'conditions/*.ng.v2.0.json', count: conditionFiles.length }
console.log(`  conditions/              ← ${conditionFiles.length} files`)

// The receipts in §3 of the guide. Derived here, never hand-typed into a page.
const facilities = JSON.parse(readFileSync(join(OUT, 'facilities.json'), 'utf8')).facilities
const rules = JSON.parse(readFileSync(join(OUT, 'rules.json'), 'utf8'))._metadata

const byState = {}
for (const f of facilities) byState[f.state] = (byState[f.state] ?? 0) + 1

stamp.receipts = {
  conditions: conditionFiles.length,
  rules: rules.total_rules,
  rulesGlobal: rules.total_global_rules,
  rulesConditionSpecific: rules.total_condition_specific_rules,
  facilities: facilities.length,
  emergencyCapable: facilities.filter((f) => f.emergency_capable).length,
  withPhone: facilities.filter((f) => f.phone).length,
  byState,
  urgencyLevelsShown: 3,
}

writeFileSync(join(OUT, 'stamp.json'), JSON.stringify(stamp, null, 2) + '\n')

console.log('\n  Receipts derived from the artifacts:')
for (const [k, v] of Object.entries(stamp.receipts)) {
  console.log(`    ${k.padEnd(24)} ${typeof v === 'object' ? JSON.stringify(v) : v}`)
}
console.log('\n✓ Synced. Any change to these numbers will show up as a diff in stamp.json.')
