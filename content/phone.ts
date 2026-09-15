/**
 * WhatsApp numbers, from anywhere.
 *
 * §8.3 is unusually specific here, and it is right to be: "Nigerian phone
 * formats accepted in every common shape — 0803…, +234803…, with spaces. Never
 * reject a valid number on formatting."
 *
 * Someone giving a WhatsApp number instead of an email is, by definition, the
 * person with fewer routes to us. Bouncing them because they typed a space is
 * the exact failure this project cannot afford. So the parser is permissive
 * about shape and strict only about whether the digits could be a real number.
 *
 * Nigeria stays the default: a number typed with no country code (0803…,
 * 803…, 234803…) is read as Nigerian and held to the Nigerian carrier rules,
 * exactly as before. What changed is that the form is no longer Nigeria-only.
 * A number that arrives with its own country code (+44…, +1…, or the 00
 * international prefix) is accepted from any country. We cannot know every
 * country's carrier plan, so for those the check is E.164 shape only: a
 * plausible length and no leading zero after the country code.
 *
 * Everything is normalised to E.164 (+<digits>) on the way in, so the stored
 * value is one shape regardless of how it was typed. Two people entering the
 * same number in different formats are one contact, not two.
 */

/** Nigerian mobile network codes begin 70, 71, 80, 81, 90, 91. */
const MOBILE_PREFIX = /^[789][01]\d{8}$/

export type ParsedPhone =
  | { ok: true; e164: string; display: string }
  | { ok: false; reason: string }

export function parseMobile(input: string): ParsedPhone {
  const raw = String(input ?? '').trim()
  if (!raw) return { ok: false, reason: 'empty' }

  // Keep digits only. Brackets, dashes, spaces, dots and a leading + are all
  // shapes people actually type; none of them change the number.
  const digits = raw.replace(/\D/g, '')
  if (!digits) return { ok: false, reason: 'no digits' }

  // A leading + means the person told us their country.
  if (raw.startsWith('+')) {
    return digits.startsWith('234') ? parseNigerian(digits) : parseInternational(digits)
  }

  // No +: read as Nigerian first, exactly as before. Only when that fails is
  // a leading 00 tried as the international prefix, so 008031234567 (a real
  // double-zero typo) stays Nigerian while 0044… reaches the UK.
  const nigerian = parseNigerian(digits)
  if (!nigerian.ok && digits.startsWith('00')) {
    return parseInternational(digits.slice(2))
  }
  return nigerian
}

/** The original Nigerian path, unchanged: strict about carrier prefixes. */
function parseNigerian(digits: string): ParsedPhone {
  let national: string

  if (digits.startsWith('234')) {
    national = digits.slice(3) // +234 803… / 234803…
  } else if (digits.startsWith('0')) {
    national = digits.slice(1) // 0803…
  } else {
    national = digits // 803…
  }

  // A common paste artefact: 2340803… (country code AND the trunk zero).
  if (national.startsWith('0') && national.length === 11) national = national.slice(1)

  if (national.length !== 10) {
    return {
      ok: false,
      reason: `expected 10 digits after the country code, got ${national.length}`,
    }
  }
  if (!MOBILE_PREFIX.test(national)) {
    return { ok: false, reason: 'not a Nigerian mobile number' }
  }

  return {
    ok: true,
    e164: `+234${national}`,
    // 0803 123 4567 — the shape a Nigerian reader recognises as their own.
    display: `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`,
  }
}

/**
 * Any other country. E.164 shape only: 8 to 15 digits including the country
 * code, and the country code never begins with 0. Carrier-level validation for
 * every country on earth is a promise we could not keep, and a wrong guess
 * turns a real person away, which §8.3 forbids.
 */
function parseInternational(digits: string): ParsedPhone {
  if (digits.startsWith('0')) {
    return { ok: false, reason: 'a country code cannot begin with 0' }
  }
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, reason: `expected 8 to 15 digits, got ${digits.length}` }
  }
  return {
    ok: true,
    e164: `+${digits}`,
    // We do not know where the country code ends, so the honest display is the
    // stored shape itself.
    display: `+${digits}`,
  }
}
