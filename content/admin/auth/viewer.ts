import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { adminAuthMode } from './mode'
import { api, isPrivileged, normaliseRole, type Me, type Role } from './backend'
import { COOKIE, decodeMeta, type SessionMeta } from './cookies'
import { FORBIDDEN, SIGN_IN, TOTP, TOTP_ENROL } from './paths'

/**
 * Who is looking at this page, asked of the backend.
 *
 * The server-component half of the individual-mode lock. Middleware runs
 * first and does the same checks; this repeats them inside the React tree for
 * the same reason `assertAdmin()` does in basic mode: a matcher regression
 * should fail the render, not serve the page. It never trusts a header to say
 * who someone is. The access token it forwards is checked by the backend on
 * every call, so a forged one gets a 401 and nothing else.
 */

export type Viewer = {
  me: Me
  role: Role
  /** The access token, for server-side backend calls only. Never render it. */
  access: string
  meta: SessionMeta | null
  displayName: string | null
}

async function accessToken(): Promise<string | null> {
  const h = await headers()
  return h.get('x-wpa-access') ?? (await cookies()).get(COOKIE.access)?.value ?? null
}

async function sessionMeta(): Promise<SessionMeta | null> {
  const h = await headers()
  return decodeMeta(h.get('x-wpa-meta') ?? (await cookies()).get(COOKIE.meta)?.value)
}

/** The CSRF token to render into this page's forms. */
export async function csrfToken(): Promise<string> {
  const h = await headers()
  return h.get('x-wpa-csrf') ?? (await cookies()).get(COOKIE.csrf)?.value ?? ''
}

/** 404 unless this deployment runs individual sign-in. Every page and route
 *  that exists only for individual mode calls this first. */
export function assertIndividualMode() {
  if (adminAuthMode() !== 'individual') notFound()
}

/**
 * A signed-in moderator or admin, or a redirect. `stepUp` (the default) also
 * proves, against the backend, that this session holds a fresh TOTP step-up:
 * the cheapest privileged read is made and its refusal is believed.
 */
export const requireViewer = cache(async (stepUp: boolean = true): Promise<Viewer> => {
  assertIndividualMode()
  const access = await accessToken()
  if (!access) redirect(`${SIGN_IN}?reason=session_ended`)

  const me = await api.me(access)
  if (!me.ok) redirect(`${SIGN_IN}?reason=${me.error.status === 401 ? 'session_ended' : 'unavailable'}`)

  const role = normaliseRole(me.data.role)
  if (!isPrivileged(role) || me.data.status === 'suspended') redirect(FORBIDDEN)

  if (stepUp) {
    if (!me.data.two_factor_enabled) redirect(TOTP_ENROL)
    const probe = await api.actions(access, { limit: 1 })
    if (!probe.ok) {
      if (probe.error.code === 'mfa_enrollment_required') redirect(TOTP_ENROL)
      if (probe.error.code === 'mfa_step_up_required') redirect(TOTP)
      if (probe.error.status === 401) redirect(`${SIGN_IN}?reason=session_ended`)
      if (probe.error.status === 403) redirect(FORBIDDEN)
      redirect(`${SIGN_IN}?reason=unavailable`)
    }
  }

  return {
    me: me.data,
    role,
    access,
    meta: await sessionMeta(),
    displayName: me.data.profile?.display_name ?? null,
  }
})

/** For pages that need more than moderator, today only the waitlist. */
export async function requireRole(min: Role): Promise<Viewer> {
  const v = await requireViewer(true)
  if (min === 'admin' && v.role !== 'admin') redirect(FORBIDDEN)
  return v
}
