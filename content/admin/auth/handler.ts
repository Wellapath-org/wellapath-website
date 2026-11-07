import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'

import { adminAuthMode } from './mode'
import { COOKIE, applyOps, clearSessionOps, type CookieOp } from './cookies'
import { CSRF_FIELD, csrfValid } from './csrf'
import { resumeSession } from './session'
import { SIGN_IN } from './paths'

/**
 * The shape every individual-mode POST route shares: plain HTML form posts,
 * answered with 303 See Other, so the panel needs no client JavaScript and a
 * refresh never resubmits anything.
 *
 * In order: 404 outside individual mode; CSRF (same origin, then the
 * double-submit token) before the body is looked at; then the handler.
 */

export type FormContext = {
  req: NextRequest
  form: FormData
  field: (name: string) => string
  cookie: (name: string) => string | undefined
}

export function seeOther(req: NextRequest, path: string, ops: readonly CookieOp[] = []) {
  const res = NextResponse.redirect(new URL(path, req.url), 303)
  res.headers.set('Cache-Control', 'no-store, max-age=0')
  applyOps(res, ops)
  return res
}

export function formRoute(fn: (ctx: FormContext) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    if (adminAuthMode() !== 'individual') return new NextResponse('Not found', { status: 404 })

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return new NextResponse('Bad request', { status: 400 })
    }
    const cookie = (n: string) => req.cookies.get(n)?.value
    if (!csrfValid(req, cookie(COOKIE.csrf), form.get(CSRF_FIELD))) {
      return new NextResponse('This form has expired. Go back, reload the page and try again.', {
        status: 403,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }
    const field = (n: string) => {
      const v = form.get(n)
      return typeof v === 'string' ? v : ''
    }
    return fn({ req, form, field, cookie })
  }
}

export type LiveSession = Extract<Awaited<ReturnType<typeof resumeSession>>, { kind: 'ok' }>

/** Resume the session for a POST, or the response that ends the request. */
export async function sessionFor(
  ctx: FormContext,
  returnTo: string,
): Promise<{ ok: true; s: LiveSession } | { ok: false; res: Response }> {
  const s = await resumeSession({ get: ctx.cookie })
  if (s.kind === 'ok') return { ok: true, s }
  if (s.kind === 'race') return { ok: false, res: seeOther(ctx.req, withQuery(returnTo, 'error', 'retry')) }
  if (s.kind === 'none') return { ok: false, res: seeOther(ctx.req, SIGN_IN, s.ops) }
  return { ok: false, res: seeOther(ctx.req, `${SIGN_IN}?reason=${s.reason}`, s.ops) }
}

/** The backend said this session is gone: clear everything and sign in. */
export const signedOut = (req: NextRequest, reason: string) =>
  seeOther(req, `${SIGN_IN}?reason=${reason}`, clearSessionOps())

export function withQuery(path: string, key: string, value: string) {
  const [base, q = ''] = path.split('?')
  const p = new URLSearchParams(q)
  p.set(key, value)
  return `${base}?${p}`
}
