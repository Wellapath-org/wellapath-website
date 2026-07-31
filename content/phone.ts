/**
 * Nigerian mobile numbers.
 *
 * §8.3 is unusually specific here, and it is right to be: "Nigerian phone
 * formats accepted in every common shape — 0803…, +234803…, with spaces. Never
 * reject a valid number on formatting."
 *
 * Someone giving a WhatsApp number instead of an email is, by definition, the
 * person with fewer routes to us. Bouncing them because they typed a space is
 * the exact failure this project cannot afford. So the parser is permissive
 * about shape and strict only about whether the digits could be a real Nigerian
 * mobile.
 *
 * Everything is normalised to E.164 (+234XXXXXXXXXX) on the way in, so the
 * stored value is one shape regardless of how it was typed. Two people entering
 * the same number in different formats are one contact, not two.
 */

/** Nigerian mobile network codes begin 70, 71, 80, 81, 90, 91. */
const MOBILE_PREFIX = /^[789][01]\d{8}$/

export type ParsedPhone =
  | { ok: true; e164: string; display: string }
  | { ok: false; reason: string }

export function parseNigerianMobile(input: string): ParsedPhone {
  const raw = String(input ?? '').trim()
  if (!raw) return { ok: false, reason: 'empty' }

  // Keep digits only. Brackets, dashes, spaces, dots and a leading + are all
  // shapes people actually type; none of them change the number.
  const digits = raw.replace(/\D/g, '')
  if (!digits) return { ok: false, reason: 'no digits' }

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
