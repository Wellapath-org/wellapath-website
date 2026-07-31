/**
 * Launch-notification signup.
 *
 * ── Design notes that are not obvious from the code ────────────────────────
 *
 * 1. NO CONFIRMATION EMAIL IS SENT, and that is deliberate. The form copy says
 *    "One email, at launch. Nothing else, ever." A confirmation would be a
 *    second email and would make published copy untrue on day one. For a brand
 *    whose whole position is that it does not overclaim, that trade is not
 *    close. See the note in docs/PLAN.md if you want double opt-in instead —
 *    it is a real NDPR argument, but it needs the copy changed first.
 *
 * 2. It works with JavaScript disabled. The form is a plain POST and this
 *    replies with a 303 to a real page, so the whole flow is server-side.
 *    §9 requires every page to work without JS; a signup that silently fails
 *    for those visitors would be worse than not offering one.
 *
 * 3. A missing or broken API key must never swallow the address. If Resend is
 *    unreachable the visitor is told plainly and the address is logged to the
 *    server so it can be recovered, rather than disappearing into a success
 *    page that lied.
 *
 * 4. NDPR: the lawful basis is consent, given by submitting this form. Resend
 *    records the contact with a timestamp, which is the consent evidence.
 *    /privacy commits to deleting these within 30 days of launch.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

/** Deliberately permissive: the only job is to reject obvious rubbish. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function back(req: NextRequest, params: Record<string, string>) {
  const url = new URL('/notify/thanks', req.nextUrl.origin)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  // 303 so the browser follows with a GET and a refresh cannot resubmit.
  return NextResponse.redirect(url, 303)
}

export async function POST(req: NextRequest) {
  let email = ''
  let trap = ''

  try {
    const form = await req.formData()
    email = String(form.get('email') ?? '').trim().toLowerCase()
    trap = String(form.get('company') ?? '').trim()
  } catch {
    return back(req, { status: 'error' })
  }

  // Honeypot. A real person never sees this field, so anything in it is a bot.
  // Answer as if it worked: telling a bot it failed only invites a retry.
  if (trap) return back(req, { status: 'ok' })

  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return back(req, { status: 'invalid' })
  }

  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!key || !audienceId) {
    // Configuration failure, not the visitor's. Log it so the address survives.
    console.error(
      `[notify] RESEND_API_KEY or RESEND_AUDIENCE_ID missing. Unsaved signup: ${email}`,
    )
    return back(req, { status: 'error' })
  }

  try {
    const resend = new Resend(key)
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId,
    })

    if (error) {
      // Resend returns an error object rather than throwing for API-level
      // problems. Already-subscribed is a success from the visitor's side.
      const message = String(error.message ?? '').toLowerCase()
      if (message.includes('already')) return back(req, { status: 'ok' })

      console.error(`[notify] Resend rejected ${email}: ${error.message}`)
      return back(req, { status: 'error' })
    }

    return back(req, { status: 'ok' })
  } catch (e) {
    console.error(`[notify] Unhandled failure for ${email}:`, e)
    return back(req, { status: 'error' })
  }
}

/** A GET here means someone followed the action URL directly. Send them on. */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/#get-the-app', req.nextUrl.origin), 303)
}
