/**
 * Basic mode (the default) behaves as main does, and the transition outer
 * gate works. Same build as individual.test.ts; only the environment differs.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ADMIN_SECTIONS } from '@/content/admin/sections'
import { MockBackend, OTP_CODE } from '../support/mock-backend'
import { Browser, startNext, type Running } from '../support/next-server'

const CREDS = { ADMIN_USER: 'check', ADMIN_PASSWORD: 'throwaway-test-password-1' }
const BASIC = `${CREDS.ADMIN_USER}:${CREDS.ADMIN_PASSWORD}`
const NEW_ROUTES = ['/admin/sign-in', '/admin/sign-in/code', '/admin/totp', '/admin/totp/enrol', '/admin/forbidden', '/admin/moderation', '/admin/moderation/audit']

describe('basic mode (ADMIN_AUTH_MODE unset)', () => {
  let next: Running
  let mock: MockBackend
  beforeAll(async () => {
    mock = new MockBackend()
    const api = await mock.start()
    // A backend URL is configured on purpose: basic mode must ignore it.
    next = await startNext({ ...CREDS, COMMUNITY_API_BASE_URL: api })
  })
  afterAll(async () => {
    await next?.stop()
    await mock?.stop()
  })

  it('every section is 401 with a Basic challenge without credentials and 200 with them', async () => {
    for (const s of ADMIN_SECTIONS) {
      const anon = await new Browser(next.base).get(s.href)
      expect(anon.status, s.href).toBe(401)
      expect(anon.headers.get('www-authenticate')).toContain('Basic')
      const ok = await new Browser(next.base, BASIC).get(s.href)
      expect(ok.status, s.href).toBe(200)
      expect(ok.headers.get('cache-control')).toContain('no-store')
      expect(ok.body).not.toContain('Acting as')
      expect(ok.body).not.toContain('href="/admin/moderation"')
      expect(ok.setCookies, s.href).toHaveLength(0)
    }
  })

  it('individual-mode routes do not exist: 401 without credentials, 404 with them', async () => {
    for (const path of NEW_ROUTES) {
      expect((await new Browser(next.base).get(path)).status, path).toBe(401)
      expect((await new Browser(next.base, BASIC).get(path)).status, path).toBe(404)
    }
    for (const path of ['/admin/auth/otp/request', '/admin/auth/sign-out', '/admin/moderation/act']) {
      expect((await new Browser(next.base).post(path, { email: 'mod@test.invalid' })).status, path).toBe(401)
      expect((await new Browser(next.base, BASIC).post(path, { email: 'mod@test.invalid' })).status, path).toBe(404)
    }
    expect(mock.calls).toHaveLength(0)
  })

  it('a wrong password is refused', async () => {
    expect((await new Browser(next.base, 'check:wrong').get('/admin')).status).toBe(401)
  })
})

describe('basic mode with no credentials configured', () => {
  let next: Running
  beforeAll(async () => {
    next = await startNext({})
  })
  afterAll(async () => next?.stop())

  it('fails closed', async () => {
    const r = await new Browser(next.base, BASIC).get('/admin')
    expect(r.status).toBe(401)
    expect(r.body).toContain('not configured')
  })
})

describe('a mistyped mode is basic', () => {
  let next: Running
  beforeAll(async () => {
    next = await startNext({ ...CREDS, ADMIN_AUTH_MODE: 'Individual ' + 'x' })
  })
  afterAll(async () => next?.stop())

  it('still asks for Basic', async () => {
    expect((await new Browser(next.base).get('/admin')).status).toBe(401)
    expect((await new Browser(next.base, BASIC).get('/admin/sign-in')).status).toBe(404)
  })
})

describe('individual mode behind the Basic outer gate', () => {
  let next: Running
  let mock: MockBackend
  beforeAll(async () => {
    mock = new MockBackend()
    const api = await mock.start()
    next = await startNext({ ...CREDS, ADMIN_AUTH_MODE: 'individual', ADMIN_BASIC_OUTER_GATE: 'true', COMMUNITY_API_BASE_URL: api })
  })
  afterAll(async () => {
    await next?.stop()
    await mock?.stop()
  })

  it('without Basic: 401 everywhere, including sign-in', async () => {
    for (const path of ['/admin', '/admin/sign-in', '/admin/moderation']) {
      expect((await new Browser(next.base).get(path)).status, path).toBe(401)
    }
  })

  it('with Basic but no individual session: sent to sign-in, never into the panel', async () => {
    const b = new Browser(next.base, BASIC)
    const r = await b.get('/admin')
    expect(r.status).toBe(307)
    expect(r.location).toMatch(/^\/admin\/sign-in/)
    expect((await b.get('/admin/sign-in')).status).toBe(200)
  })

  it('with Basic, sign-in works and still requires TOTP', async () => {
    const b = new Browser(next.base, BASIC)
    const page = await b.get('/admin/sign-in')
    await b.post('/admin/auth/otp/request', { csrf: Browser.csrf(page.body), email: 'mod@test.invalid' })
    const code = await b.get('/admin/sign-in/code')
    const v = await b.post('/admin/auth/otp/verify', { csrf: Browser.csrf(code.body), code: OTP_CODE })
    expect(v.location).toBe('/admin/totp')
    expect((await b.get('/admin')).location).toBe('/admin/totp')
  })
})

describe('individual mode with no backend configured', () => {
  let next: Running
  beforeAll(async () => {
    next = await startNext({ ADMIN_AUTH_MODE: 'individual' })
  })
  afterAll(async () => next?.stop())

  it('fails closed: sign-in says so and the panel is unreachable', async () => {
    const b = new Browser(next.base)
    expect((await b.get('/admin')).location).toMatch(/^\/admin\/sign-in/)
    const page = await b.get('/admin/sign-in')
    expect(page.body).toContain('not configured')
    expect(page.body).not.toContain('Email me a code')
  })
})
