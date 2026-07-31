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
 * 4. NDPR: the lawful basis is consent, given by submitting this form. The
 *    signups table records the timestamp, which is the consent evidence, and is
 *    the single place to delete from when /privacy's 30-day promise falls due.
 *
 * 5. EITHER an email or a WhatsApp number is enough. Requiring email would
 *    defeat the reason WhatsApp is offered at all: in this market it reaches
 *    people email does not. Postgres is the source of truth; Resend is written
 *    to as well when there is an email, so the launch broadcast stays one action.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { parseNigerianMobile } from '@/content/phone'
import { saveSignup, dbConfigured } from '@/content/db'

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
  let whatsappRaw = ''
  let source = ''
  let trap = ''

  try {
    const form = await req.formData()
    email = String(form.get('email') ?? '').trim().toLowerCase()
    whatsappRaw = String(form.get('whatsapp') ?? '').trim()
    source = String(form.get('source') ?? '').trim().slice(0, 120)
    trap = String(form.get('company') ?? '').trim()
  } catch {
    return back(req, { status: 'error' })
  }

  // Honeypot. A real person never sees this field, so anything in it is a bot.
  // Answer as if it worked: telling a bot it failed only invites a retry.
  if (trap) return back(req, { status: 'ok' })

  // ── Validate whichever channels were given ────────────────────────────
  const emailGiven = email.length > 0
  const phoneGiven = whatsappRaw.length > 0

  if (!emailGiven && !phoneGiven) return back(req, { status: 'nothing' })

  if (emailGiven && (email.length > 254 || !EMAIL.test(email))) {
    return back(req, { status: 'invalid-email' })
  }

  let whatsapp: string | null = null
  if (phoneGiven) {
    const parsed = parseNigerianMobile(whatsappRaw)
    if (!parsed.ok) return back(req, { status: 'invalid-phone' })
    whatsapp = parsed.e164
  }

  const who = [emailGiven ? email : null, whatsapp].filter(Boolean).join(' / ')

  // ── Postgres is the source of truth ────────────────────────────────────
  // It is allowed to be absent. The database and the deployment that uses it
  // do not go live in the same instant, and during that gap an email-only
  // signup can still be stored in Resend, so failing it would throw away a
  // real signup over an ordering detail. A WhatsApp number has nowhere else to
  // go, so that case is still an honest error.
  let stored = false

  if (dbConfigured()) {
    try {
      await saveSignup({ email: emailGiven ? email : null, whatsapp, source: source || null })
      stored = true
    } catch (e) {
      console.error(`[notify] Could not save ${who} to Postgres:`, e)
    }
  } else if (whatsapp) {
    console.error(`[notify] DATABASE_URL missing. Unsaved WhatsApp signup: ${who}`)
  }

  // ── Resend, for the email broadcast ────────────────────────────────────
  // Secondary when Postgres worked, and the only net when it did not.
  let mailed = false

  if (emailGiven) {
    const key = process.env.RESEND_API_KEY
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (!key || !audienceId) {
      console.error(`[notify] Resend is not configured, so ${email} is not on the launch list.`)
    } else {
      try {
        const { error } = await new Resend(key).contacts.create({
          email,
          unsubscribed: false,
          audienceId,
        })
        // Already-subscribed is a success from the visitor's side.
        if (!error || String(error.message ?? '').toLowerCase().includes('already')) mailed = true
        else console.error(`[notify] Resend rejected ${email}: ${error.message}`)
      } catch (e) {
        console.error(`[notify] Resend threw for ${email}:`, e)
      }
    }
  }

  // Success means at least one store kept it. A WhatsApp number that only
  // Resend could not hold is not a success, whatever the email did.
  const kept = stored || mailed
  const numberLost = Boolean(whatsapp) && !stored

  if (!kept || numberLost) {
    console.error(`[notify] Unsaved signup: ${who}`)
    return back(req, { status: 'error' })
  }

  return back(req, { status: 'ok' })
}

/** A GET here means someone followed the action URL directly. Send them on. */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/#get-the-app', req.nextUrl.origin), 303)
}
