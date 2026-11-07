import { api } from '@/content/admin/auth/backend'
import { COOKIE, encodeJson } from '@/content/admin/auth/cookies'
import { formRoute, seeOther, withQuery } from '@/content/admin/auth/handler'
import { safeNext } from '@/content/admin/auth/paths'

export const dynamic = 'force-dynamic'

/**
 * Step one of sign-in: ask the backend to email a one-time code (contract A1).
 *
 * The backend answers 202 whatever the address, so this page cannot be used
 * to learn who has an account, and neither can this handler: it says the same
 * thing either way. The address is held for five minutes in an httpOnly cookie
 * for step two. It is never logged and never rendered back.
 */
export const POST = formRoute(async ({ req, field }) => {
  const email = field('email').trim().toLowerCase()
  const next = safeNext(field('next'))
  const back = next === '/admin' ? '/admin/sign-in' : `/admin/sign-in?next=${encodeURIComponent(next)}`

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return seeOther(req, withQuery(back, 'error', 'invalid_email'))
  }

  const r = await api.otpRequest(email)
  if (!r.ok) {
    const error =
      r.error.status === 429 ? 'rate_limited' : r.error.status === 400 ? 'invalid_email' : 'unavailable'
    return seeOther(req, withQuery(back, 'error', error))
  }

  return seeOther(
    req,
    next === '/admin' ? '/admin/sign-in/code' : `/admin/sign-in/code?next=${encodeURIComponent(next)}`,
    [{ name: COOKIE.otp, value: encodeJson({ e: email }), maxAge: 300 }],
  )
})
