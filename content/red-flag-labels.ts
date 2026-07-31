/**
 * Plain-language labels for danger signs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THIS FILE IS CLINICAL COPY. IT NEEDS A CLINICIAN, NOT A COPYWRITER.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The 50 condition files reference 47 distinct red-flag tokens.
 * `mobile_handoff/red_flag_display_map.json` supplies a display name for only 12.
 * The other 36 are drafted here and marked `reviewed: false`.
 *
 * Why this matters more than any other string on the site: these sentences sit at
 * the top of every condition page, and they are what a frightened person reads at
 * 2am to decide whether to leave the house. Rendering the raw token would print
 * "Haemoglobinuria" — jargon, far above the reading age of 12 that WEBSITE_GUIDE §4
 * requires, in the one place where comprehension is a clinical safety property.
 * "Urine the colour of Coca-Cola" is the sentence that actually moves someone.
 *
 * Unreviewed entries render with a visible marker in development and fail the
 * production build (see `assertRedFlagsReviewed`). Nothing here ships unsigned.
 */

export type RedFlagLabel = {
  /** Plain-language sentence shown to the user. */
  label: string
  /** True only when a named clinician has signed this exact wording off. */
  reviewed: boolean
  /** Where the wording came from. */
  source: 'red_flag_display_map.json' | 'draft'
}

/** The 12 signed-off strings, lifted verbatim from the mobile handoff artifact. */
const OFFICIAL: Record<string, string> = {
  inability_to_drink: 'Not able to drink or feed at all',
  altered_consciousness: 'Confusion or unresponsiveness (not their normal self)',
  breathlessness_at_rest: 'Struggling to breathe even while sitting still',
  circulatory_collapse: 'Collapsed, with cold clammy skin, very weak or fainting',
  prostration: 'Too weak to stand, sit up, or feed without help',
  abnormal_bleeding: 'Heavy or uncontrolled bleeding',
  blue_lips_face: 'Blue or grey lips, tongue, or face',
  severe_dehydration:
    'Severe dehydration: sunken eyes, no tears, not passing urine, very drowsy',
  impaired_consciousness: 'Hard to wake, very drowsy, or not responding normally',
  respiratory_distress:
    "Working very hard to breathe: nostrils flaring, chest pulling in, or can't speak a full sentence",
  shock: 'Cold hands and feet, fast weak pulse, very drowsy or fainting',
  anaphylaxis_signs:
    'Severe allergic reaction: face or throat swelling, widespread hives, and trouble breathing together',
}

/**
 * The 36 gaps. Every one of these is a DRAFT written to the §4 voice
 * (reading age 12, Nigerian Standard English, no Americanisms) and every one
 * needs sign-off before it can be published.
 */
const DRAFT: Record<string, string> = {
  abdominal_rigidity_board: 'A hard, board-like belly that hurts to touch',
  bat_exposure: 'Touched, bitten or scratched by a bat',
  bilateral_oedema_lethargy: 'Swelling in both feet, with unusual tiredness',
  black_wound: 'A wound turning black, or the skin around it dying',
  cardiac_chest_pain: 'Crushing or heavy chest pain, like a weight pressing down',
  chest_indrawing_severe: 'The skin between or below the ribs pulls in sharply with each breath',
  cold_clammy_skin: 'Cold, damp skin with sweating',
  cyanosis: 'Blue or grey colour in the lips, tongue, fingers or toes',
  danger_signs_imci:
    'Any general danger sign in a child: not able to drink, vomiting everything, fits, or unusually sleepy',
  facial_space_swelling: 'Swelling in the face, jaw, or under the tongue',
  facial_weakness: 'One side of the face droops or cannot move',
  fast_breathing_danger: 'Breathing much faster than usual, or too fast to speak or feed',
  flank_pain_kidney: 'Severe pain in the side or back, below the ribs',
  haemoglobinuria: 'Urine the colour of Coca-Cola or strong tea',
  heavy_vaginal_bleeding: 'Heavy bleeding from the vagina, soaking a pad in an hour or less',
  hydrophobia: 'Fear of water, or not able to swallow, after an animal bite',
  hypoglycaemia: 'Very low blood sugar: shaking, sweating, confused, or hard to wake',
  inability_pass_stool_gas: 'Not able to pass stool or gas at all',
  irregular_pulse: 'A heartbeat that is very fast, very slow, or uneven',
  neck_stiffness_fever: 'A stiff neck with fever, cannot bend the chin down to the chest',
  neonatal_not_feeding: 'A baby under 1 month who will not feed',
  neurological_signs: 'New weakness, numbness, trouble speaking, or trouble seeing',
  not_eating_drinking_child: 'A child who refuses to eat or drink anything',
  paralysis: 'Not able to move a part of the body',
  ptosis_snakebite: 'Drooping eyelids or blurred vision after a snake bite',
  radiating_arm_jaw_pain: 'Chest pain spreading to the arm, jaw, neck or back',
  seizures: 'A fit or convulsion, with shaking that cannot be stopped',
  severe_anaemia: 'Very pale palms, inner eyelids or tongue, with breathlessness',
  severe_headache_vomiting: 'A sudden, very severe headache with vomiting',
  severe_jaundice: 'Deep yellow eyes or skin',
  stridor_airway: 'A harsh, noisy sound when breathing in',
  stroke_signs: 'Sudden face drooping, arm weakness, or slurred speech',
  sunken_eyes: 'Eyes that look sunken, with no tears when crying',
  vision_changes_pregnancy: 'Blurred vision, flashing lights, or spots during pregnancy',
  vomiting_blood: 'Vomiting blood, or vomit that looks like coffee grounds',
  widespread_spreading_infection: 'Redness or swelling spreading quickly across the skin',
}

export const RED_FLAG_LABELS: Record<string, RedFlagLabel> = {
  ...Object.fromEntries(
    Object.entries(OFFICIAL).map(([k, label]) => [
      k,
      { label, reviewed: true, source: 'red_flag_display_map.json' as const },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(DRAFT).map(([k, label]) => [
      k,
      { label, reviewed: false, source: 'draft' as const },
    ]),
  ),
}

/**
 * Never renders a raw token. An unknown token is a content bug, not a display
 * problem, so it surfaces loudly rather than printing snake_case at a user.
 */
export function redFlagLabel(token: string): RedFlagLabel {
  return (
    RED_FLAG_LABELS[token] ?? {
      label: token.replace(/_/g, ' '),
      reviewed: false,
      source: 'draft',
    }
  )
}

export const redFlagReviewStatus = () => {
  const all = Object.values(RED_FLAG_LABELS)
  return {
    total: all.length,
    reviewed: all.filter((r) => r.reviewed).length,
    unreviewed: all.filter((r) => !r.reviewed).length,
  }
}

/**
 * Called from the condition page. In production this is a hard stop: the site
 * will not build while a danger sign is unsigned.
 */
export function assertRedFlagsReviewed() {
  const { unreviewed, total } = redFlagReviewStatus()
  if (unreviewed === 0) return
  const message =
    `${unreviewed} of ${total} danger-sign labels are unreviewed. ` +
    `A clinician must sign off content/red-flag-labels.ts before launch.`
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_UNREVIEWED_RED_FLAGS !== 'true') {
    throw new Error(
      `${message}\n\nTo build a preview anyway: ALLOW_UNREVIEWED_RED_FLAGS=true npm run build`,
    )
  }
  console.warn(`⚠ ${message}`)
}
