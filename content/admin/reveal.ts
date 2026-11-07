/**
 * Whether /admin/signups may show contact details in full.
 *
 * Production: always, so nothing changes for the people running the launch.
 *
 * Anywhere else (`next dev`, tests, a preview someone runs on a laptop): masked,
 * and the CSV export is left out, unless ADMIN_REVEAL_CONTACTS=true is set. On
 * 2026-09-28 a local dev server holding the production Resend key rendered the
 * real waitlist, which then turned up in a screenshot. A local server is where
 * screenshots are taken, so that is where the safe default has to be.
 *
 * Note that `next start` sets NODE_ENV=production, so a production build run
 * locally still reveals. Keep live keys out of .env.local.
 */
export function revealContacts(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.ADMIN_REVEAL_CONTACTS === 'true'
}

/** `jane.doe@example.com` -> `j•••@•••.com`. Keeps only the shape. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '•••'
  const domain = email.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  const tld = dot >= 0 ? domain.slice(dot) : ''
  return `${email[0]}•••@•••${tld}`
}

/** `0803 123 4567` -> `••• ••• ••67`; a `+234` prefix is kept. Last two digits only. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '•••'
  const country = phone.trim().startsWith('+234') ? '+234 ' : ''
  return `${country}••• ••• ••${digits.slice(-2)}`
}
