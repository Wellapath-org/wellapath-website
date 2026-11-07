import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

import { adminAuthMode, basicOuterGate, communityApiBase } from '@/content/admin/auth/mode'
import { checkBasic } from '@/content/admin/auth/basic'
import { COOKIE, COOKIE_FLAGS, applyOps, clearSessionOps, decodeMeta, encodeMeta, type SessionMeta } from '@/content/admin/auth/cookies'
import { csrfValid } from '@/content/admin/auth/csrf'
import { MOD_OPS, parseUntil, requestBody, validateReason } from '@/content/admin/auth/moderation'
import { safeNext } from '@/content/admin/auth/paths'
import { PRIVILEGED_IDLE_MS, hasStepUp, resumeSession, tokenPairOps } from '@/content/admin/auth/session'
import { normaliseRole, safeId, type TokenPair } from '@/content/admin/auth/backend'
import { middleware } from '@/middleware'
import { MockBackend } from '../support/mock-backend'

const ENV_KEYS = ['ADMIN_AUTH_MODE', 'ADMIN_BASIC_OUTER_GATE', 'COMMUNITY_API_BASE_URL', 'ADMIN_USER', 'ADMIN_PASSWORD'] as const
const saved: Record<string, string | undefined> = {}
beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
})
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('mode', () => {
  it('defaults to basic and only the exact value selects individual', () => {
    delete process.env.ADMIN_AUTH_MODE
    expect(adminAuthMode()).toBe('basic')
    for (const v of ['', 'Individual', 'individual-x', 'true', 'basic']) {
      process.env.ADMIN_AUTH_MODE = v
      expect(adminAuthMode(), v).toBe('basic')
    }
    process.env.ADMIN_AUTH_MODE = 'individual'
    expect(adminAuthMode()).toBe('individual')
  })

  it('the outer gate is off unless exactly "true"', () => {
    delete process.env.ADMIN_BASIC_OUTER_GATE
    expect(basicOuterGate()).toBe(false)
    process.env.ADMIN_BASIC_OUTER_GATE = 'yes'
    expect(basicOuterGate()).toBe(false)
    process.env.ADMIN_BASIC_OUTER_GATE = 'true'
    expect(basicOuterGate()).toBe(true)
  })

  it('the backend must be https, or http on loopback, with no credentials or query', () => {
    const cases: [string, string | null][] = [
      ['https://api.wellapath.org', 'https://api.wellapath.org'],
      ['https://api.wellapath.org/', 'https://api.wellapath.org'],
      ['http://127.0.0.1:4000', 'http://127.0.0.1:4000'],
      ['http://api.wellapath.org', null],
      ['https://user:pw@api.wellapath.org', null],
      ['https://api.wellapath.org/?x=1', null],
      ['not a url', null],
    ]
    for (const [v, want] of cases) {
      process.env.COMMUNITY_API_BASE_URL = v
      expect(communityApiBase(), v).toBe(want)
    }
  })
})

describe('basic check (unchanged behaviour)', () => {
  it('fails closed when unconfigured, and accepts only the exact pair', () => {
    delete process.env.ADMIN_USER
    expect(checkBasic('Basic ' + btoa('a:b'))).toEqual({ ok: false, message: 'Admin access is not configured on this deployment.' })
    process.env.ADMIN_USER = 'check'
    process.env.ADMIN_PASSWORD = 'pw'
    expect(checkBasic(null).ok).toBe(false)
    expect(checkBasic('Bearer x').ok).toBe(false)
    expect(checkBasic('Basic !!!').ok).toBe(false)
    expect(checkBasic('Basic ' + btoa('check:wrong')).ok).toBe(false)
    expect(checkBasic('Basic ' + btoa('check:pw')).ok).toBe(true)
  })
})

describe('cookies', () => {
  it('every session cookie is httpOnly, Secure, SameSite=Strict, Path=/admin, __Secure- prefixed', () => {
    expect(COOKIE_FLAGS).toEqual({ httpOnly: true, secure: true, sameSite: 'strict', path: '/admin' })
    for (const name of Object.values(COOKIE)) expect(name.startsWith('__Secure-')).toBe(true)
    const res = applyOps(NextResponse.next(), [{ name: COOKIE.access, value: 'tok', maxAge: 900 }, ...clearSessionOps()])
    const lines = res.headers.getSetCookie()
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line).toMatch(/HttpOnly/i)
      expect(line).toMatch(/Secure/i)
      expect(line).toMatch(/SameSite=strict/i)
      expect(line).toMatch(/Path=\/admin/)
    }
  })

  it('the session clock round-trips and rejects anything malformed', () => {
    const m: SessionMeta = { v: 1, abs: 2, last: 1, at: 3, su: 0 }
    expect(decodeMeta(encodeMeta(m))).toEqual(m)
    expect(decodeMeta('garbage')).toBeNull()
    expect(decodeMeta(encodeMeta({ ...m, v: 2 } as unknown as SessionMeta))).toBeNull()
    expect(decodeMeta(encodeMeta({ ...m, abs: 'x' } as unknown as SessionMeta))).toBeNull()
  })
})

describe('csrf', () => {
  const token = 'a'.repeat(43)
  const req = (h: Record<string, string>) => new Request('http://admin.test/admin/auth/sign-out', { method: 'POST', headers: { host: 'admin.test', ...h } })
  it('needs a matching token from the same origin', () => {
    expect(csrfValid(req({ origin: 'http://admin.test' }), token, token)).toBe(true)
    expect(csrfValid(req({}), token, token)).toBe(true)
    expect(csrfValid(req({ origin: 'https://evil.test' }), token, token)).toBe(false)
    expect(csrfValid(req({ origin: 'null' }), token, token)).toBe(false)
    expect(csrfValid(req({ 'sec-fetch-site': 'cross-site' }), token, token)).toBe(false)
    expect(csrfValid(req({ 'sec-fetch-site': 'same-site' }), token, token)).toBe(false)
    expect(csrfValid(req({}), token, 'b'.repeat(43))).toBe(false)
    expect(csrfValid(req({}), undefined, token)).toBe(false)
    expect(csrfValid(req({}), 'short', 'short')).toBe(false)
  })
})

describe('moderation rules', () => {
  it('a reason is required, trimmed, 10–500 characters', () => {
    expect(validateReason(undefined)).toEqual({ ok: false, rule: 'required' })
    expect(validateReason('   ')).toEqual({ ok: false, rule: 'required' })
    expect(validateReason('123456789')).toEqual({ ok: false, rule: 'min_length' })
    expect(validateReason('  1234567890  ')).toEqual({ ok: true, reason: '1234567890' })
    expect(validateReason('x'.repeat(500)).ok).toBe(true)
    expect(validateReason('x'.repeat(501))).toEqual({ ok: false, rule: 'max_length' })
  })

  it('maps each action to its contract path and body', () => {
    expect(MOD_OPS.hide.path('post', 'p1')).toBe('/v1/community/mod/posts/p1/hide')
    expect(MOD_OPS.restore.path('comment', 'c1')).toBe('/v1/community/mod/comments/c1/restore')
    expect(MOD_OPS.dismiss.path('report', 'r1')).toBe('/v1/community/mod/reports/r1/dismiss')
    expect(MOD_OPS.suspend.path('account', 'a1')).toBe('/v1/community/mod/accounts/a1/suspend')
    expect(MOD_OPS.reveal.path('post', 'p1')).toBe('/v1/community/mod/identity/reveal')
    expect(requestBody('reveal', 'post', 'p1', 'reason text')).toEqual({ target_type: 'post', target_id: 'p1', reason: 'reason text' })
    expect(requestBody('restrict', 'account', 'a1', 'reason text', '2027-01-01T00:00:00.000Z')).toEqual({
      reason: 'reason text',
      until: '2027-01-01T00:00:00.000Z',
    })
  })

  it('until must be in the future and within a year', () => {
    const now = Date.parse('2026-11-07T00:00:00Z')
    expect(parseUntil('', now)).toEqual({ ok: true })
    expect(parseUntil('2026-11-08T00:00', now)).toEqual({ ok: true, until: '2026-11-08T00:00:00.000Z' })
    expect(parseUntil('2026-11-06T00:00', now).ok).toBe(false)
    expect(parseUntil('2028-11-06T00:00', now).ok).toBe(false)
    expect(parseUntil('tomorrow', now).ok).toBe(false)
  })

  it('ids and roles fail closed', () => {
    expect(safeId('0194f7a2-0000-7000-8000-000000000001')).not.toBeNull()
    expect(safeId('../etc')).toBeNull()
    expect(safeId('')).toBeNull()
    expect(normaliseRole('superuser')).toBe('member')
    expect(normaliseRole('admin')).toBe('admin')
  })

  it('post-sign-in destinations stay inside /admin', () => {
    expect(safeNext('/admin/moderation')).toBe('/admin/moderation')
    for (const bad of ['https://evil.test', '//evil.test', '/admin\\evil', '/elsewhere', '/admin/sign-in', '/admin/auth/sign-out', 7]) {
      expect(safeNext(bad), String(bad)).toBe('/admin')
    }
  })
})

describe('session clock against the contract mock', () => {
  let mock: MockBackend
  beforeAll(async () => {
    mock = new MockBackend()
    process.env.COMMUNITY_API_BASE_URL = await mock.start()
  })
  afterAll(async () => mock.stop())
  beforeEach(async () => {
    mock.reset()
    process.env.COMMUNITY_API_BASE_URL = `http://127.0.0.1:${mock.port}`
  })

  async function signedIn(email = 'mod@test.invalid') {
    await fetch(`http://127.0.0.1:${mock.port}/v1/auth/otp/request`, { method: 'POST', body: JSON.stringify({ email }) })
    const res = await fetch(`http://127.0.0.1:${mock.port}/v1/auth/otp/verify`, {
      method: 'POST',
      body: JSON.stringify({ email, code: '123456', device_id: '00000000-0000-4000-8000-000000000001' }),
    })
    const pair = (await res.json()) as TokenPair
    const now = Date.now()
    const { meta } = tokenPairOps(pair, now)
    const jar = new Map<string, string>([
      [COOKIE.access, pair.access_token],
      [COOKIE.refresh, pair.refresh_token],
      [COOKIE.device, '00000000-0000-4000-8000-000000000001'],
      [COOKIE.meta, encodeMeta(meta)],
    ])
    return { jar, meta, now, pair }
  }

  it('the absolute limit is never later than 12 hours from sign-in', async () => {
    const { meta, now } = await signedIn()
    expect(meta.abs - now).toBeLessThanOrEqual(12 * 3600 * 1000 + 1000)
    expect(meta.su).toBe(0)
    expect(hasStepUp(meta)).toBe(false)
  })

  it('no cookies is no session; partial cookies are cleared', async () => {
    expect(await resumeSession({ get: () => undefined })).toEqual({ kind: 'none', ops: [] })
    const partial = await resumeSession({ get: (n) => (n === COOKIE.access ? 'x' : undefined) })
    expect(partial.kind).toBe('none')
    expect(partial.kind === 'none' && partial.ops.length).toBeGreaterThan(0)
  })

  it('a fresh access token is used as is, and the idle clock moves', async () => {
    const { jar, now } = await signedIn()
    const later = now + 5 * 60 * 1000
    const s = await resumeSession({ get: (n) => jar.get(n) }, later)
    expect(s.kind).toBe('ok')
    if (s.kind === 'ok') expect(s.meta.last).toBe(later)
    expect(mock.calls.filter((c) => c.path === '/v1/auth/refresh')).toHaveLength(0)
  })

  it('near expiry the token pair is rotated, and the spent refresh token is refused afterwards', async () => {
    const { jar, now, pair } = await signedIn()
    const s = await resumeSession({ get: (n) => jar.get(n) }, Date.parse(pair.access_token_expires_at) - 30_000)
    expect(s.kind).toBe('ok')
    if (s.kind !== 'ok') return
    expect(s.refresh).not.toBe(pair.refresh_token)
    expect(s.meta.abs).toBeLessThanOrEqual(now + 12 * 3600 * 1000 + 1000)
    // Replaying the old refresh token is reuse: the family dies.
    const replay = await resumeSession({ get: (n) => (n === COOKIE.access ? undefined : jar.get(n)) })
    expect(replay).toMatchObject({ kind: 'ended', reason: 'session_ended' })
  })

  it('idle for an hour ends the session and revokes it at the backend', async () => {
    const { jar, now } = await signedIn()
    const s = await resumeSession({ get: (n) => jar.get(n) }, now + PRIVILEGED_IDLE_MS)
    expect(s).toMatchObject({ kind: 'ended', reason: 'idle' })
    expect(mock.calls.some((c) => c.path === '/v1/auth/logout')).toBe(true)
  })

  it('past the absolute deadline the session ends as expired', async () => {
    const { jar, meta } = await signedIn()
    const s = await resumeSession({ get: (n) => jar.get(n) }, meta.abs)
    expect(s).toMatchObject({ kind: 'ended', reason: 'expired' })
  })

  it('a backend outage neither signs anyone in nor clears their cookies', async () => {
    const { jar, pair } = await signedIn()
    process.env.COMMUNITY_API_BASE_URL = 'http://127.0.0.1:1'
    const s = await resumeSession({ get: (n) => jar.get(n) }, Date.parse(pair.access_token_expires_at))
    expect(s).toEqual({ kind: 'ended', reason: 'unavailable', ops: [] })
  })
})

describe('middleware', () => {
  const req = (path: string, headers: Record<string, string> = {}) => new NextRequest(`http://admin.test${path}`, { headers })

  it('basic mode: 401 with a Basic challenge, then 200, and individual routes are not found', async () => {
    delete process.env.ADMIN_AUTH_MODE
    process.env.ADMIN_USER = 'check'
    process.env.ADMIN_PASSWORD = 'pw'
    const denied = await middleware(req('/admin'))
    expect(denied.status).toBe(401)
    expect(denied.headers.get('www-authenticate')).toContain('Basic')
    const auth = { authorization: 'Basic ' + btoa('check:pw') }
    const ok = await middleware(req('/admin', auth))
    expect(ok.status).toBe(200)
    expect(ok.headers.get('x-middleware-rewrite')).toBeNull()
    const signIn = await middleware(req('/admin/sign-in', auth))
    expect(signIn.headers.get('x-middleware-rewrite')).toContain('/admin/__not-found__')
  })

  it('strips internal headers a caller tries to inject', async () => {
    delete process.env.ADMIN_AUTH_MODE
    process.env.ADMIN_USER = 'check'
    process.env.ADMIN_PASSWORD = 'pw'
    const res = await middleware(
      req('/admin', { authorization: 'Basic ' + btoa('check:pw'), 'x-wpa-access': 'forged', 'x-pathname': '/forged' }),
    )
    const overridden = res.headers.get('x-middleware-override-headers') ?? ''
    expect(overridden).toContain('x-pathname')
    expect(res.headers.get('x-middleware-request-x-pathname')).toBe('/admin')
    expect(res.headers.get('x-middleware-request-x-wpa-access')).toBeNull()
  })

  it('individual mode with no session redirects to sign-in and sets a CSRF cookie on the sign-in page', async () => {
    process.env.ADMIN_AUTH_MODE = 'individual'
    process.env.COMMUNITY_API_BASE_URL = 'http://127.0.0.1:1'
    const r = await middleware(req('/admin/data'))
    expect(r.status).toBe(307)
    expect(r.headers.get('location')).toBe('http://admin.test/admin/sign-in?next=%2Fadmin%2Fdata')
    const page = await middleware(req('/admin/sign-in'))
    expect(page.headers.getSetCookie().some((c) => c.startsWith(`${COOKIE.csrf}=`) && /HttpOnly/i.test(c))).toBe(true)
  })

  it('individual mode ignores a valid Basic credential unless the outer gate is on', async () => {
    process.env.ADMIN_AUTH_MODE = 'individual'
    process.env.ADMIN_USER = 'check'
    process.env.ADMIN_PASSWORD = 'pw'
    const auth = { authorization: 'Basic ' + btoa('check:pw') }
    expect((await middleware(req('/admin', auth))).status).toBe(307)
    process.env.ADMIN_BASIC_OUTER_GATE = 'true'
    expect((await middleware(req('/admin'))).status).toBe(401)
    expect((await middleware(req('/admin', auth))).status).toBe(307)
  })
})
