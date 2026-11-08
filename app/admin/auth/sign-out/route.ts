import { api } from '@/content/admin/auth/backend'
import { clearSessionOps } from '@/content/admin/auth/cookies'
import { formRoute, seeOther } from '@/content/admin/auth/handler'
import { SIGN_IN } from '@/content/admin/auth/paths'
import { resumeSession } from '@/content/admin/auth/session'

export const dynamic = 'force-dynamic'

/**
 * Sign out (A4): revoke the backend family, then clear every session cookie
 * whatever the backend said. A failed revoke must not leave the browser
 * signed in; the family then dies at its idle limit. If the access token has
 * already expired, one refresh is made first so the revoke can be sent (an
 * ended session is revoked inside resumeSession itself).
 */
export const POST = formRoute(async ({ req, cookie }) => {
  const s = await resumeSession({ get: cookie })
  if (s.kind === 'ok') await api.logout(s.access, s.refresh).catch(() => undefined)
  return seeOther(req, `${SIGN_IN}?reason=signed_out`, clearSessionOps())
})
