/**
 * Individual mode, end to end through the production build, against the
 * contract mock backend. Each test names the requirement it proves.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { MockBackend, OTP_CODE, POST_ID, REPORT_ID, AUTHOR_ID, TOTP_CODE } from '../support/mock-backend'
import { Browser, startNext, type Running } from '../support/next-server'

let mock: MockBackend
let next: Running

beforeAll(async () => {
  mock = new MockBackend()
  const api = await mock.start()
  next = await startNext({ ADMIN_AUTH_MODE: 'individual', COMMUNITY_API_BASE_URL: api })
})

afterAll(async () => {
  await next?.stop()
  await mock?.stop()
})

beforeEach(() => mock.reset())

const REASON = 'Unsafe dosing advice in the post body.'

/** Email OTP sign-in; returns the browser and where verify sent it. */
async function signIn(email: string) {
  const b = new Browser(next.base)
  const page = await b.get('/admin/sign-in')
  expect(page.status).toBe(200)
  const req = await b.post('/admin/auth/otp/request', { csrf: Browser.csrf(page.body), email, next: '/admin' })
  expect(req.status).toBe(303)
  expect(req.location).toBe('/admin/sign-in/code')
  const codePage = await b.get('/admin/sign-in/code')
  const verify = await b.post('/admin/auth/otp/verify', { csrf: Browser.csrf(codePage.body), code: OTP_CODE, next: '/admin' })
  return { b, verify }
}

/** Sign in an enrolled moderator and complete the step-up. */
async function signInStepped(email = 'mod@test.invalid') {
  const { b, verify } = await signIn(email)
  expect(verify.location).toBe('/admin/totp')
  const totp = await b.get('/admin/totp')
  const ok = await b.post('/admin/auth/totp/verify', { csrf: Browser.csrf(totp.body), code: TOTP_CODE, next: '/admin' })
  expect(ok.status).toBe(303)
  expect(ok.location).toBe('/admin')
  return b
}

describe('no session', () => {
  it('redirects every panel page, the moderation section and unknown admin paths to sign-in', async () => {
    const b = new Browser(next.base)
    for (const path of ['/admin', '/admin/signups', '/admin/moderation', '/admin/totp', '/admin/does-not-exist']) {
      const r = await b.get(path)
      expect(r.status, path).toBe(307)
      expect(r.location, path).toMatch(/^\/admin\/sign-in/)
    }
    expect(mock.calls.filter((c) => c.path.startsWith('/v1/community'))).toHaveLength(0)
  })

  it('serves the sign-in page with a CSRF token and the admin security headers', async () => {
    const r = await new Browser(next.base).get('/admin/sign-in')
    expect(r.status).toBe(200)
    expect(r.body).toContain('Email me a code')
    expect(r.headers.get('cache-control')).toContain('no-store')
    expect(r.headers.get('x-frame-options')).toBe('DENY')
    expect(r.headers.get('x-robots-tag')).toContain('noindex')
  })

  it('refuses a POST with no CSRF token, a wrong token, or a cross-site origin', async () => {
    const b = new Browser(next.base)
    const page = await b.get('/admin/sign-in')
    const csrf = Browser.csrf(page.body)
    expect((await b.post('/admin/auth/otp/request', { email: 'mod@test.invalid' })).status).toBe(403)
    expect((await b.post('/admin/auth/otp/request', { csrf: 'x'.repeat(43), email: 'mod@test.invalid' })).status).toBe(403)
    expect(
      (await b.post('/admin/auth/otp/request', { csrf, email: 'mod@test.invalid' }, { origin: 'https://evil.example' })).status,
    ).toBe(403)
    expect(
      (await b.post('/admin/auth/otp/request', { csrf, email: 'mod@test.invalid' }, { 'sec-fetch-site': 'cross-site' })).status,
    ).toBe(403)
    expect(mock.calls.filter((c) => c.path === '/v1/auth/otp/request')).toHaveLength(0)
  })
})

describe('roles', () => {
  it('a member account gets 403, is signed back out at the backend, and holds no session cookie', async () => {
    const { b, verify } = await signIn('member@test.invalid')
    expect(verify.status).toBe(303)
    expect(verify.location).toBe('/admin/forbidden')
    expect(b.jar.has('__Secure-wpa_at')).toBe(false)
    expect(b.jar.has('__Secure-wpa_rt')).toBe(false)
    expect(mock.calls.some((c) => c.path === '/v1/auth/logout')).toBe(true)
    const page = await b.get('/admin/forbidden')
    expect(page.status).toBe(403)
    // And with no session the panel still only offers sign-in.
    expect((await b.get('/admin')).location).toMatch(/^\/admin\/sign-in/)
  })

  it('a member holding a session (e.g. demoted mid-session) gets 403 on every panel page', async () => {
    const b = await signInStepped('mod@test.invalid')
    mock.account('mod@test.invalid').role = 'member'
    for (const path of ['/admin', '/admin/moderation', '/admin/data']) {
      const r = await b.get(path)
      expect(r.status, path).toBe(307)
      expect(r.location, path).toBe('/admin/forbidden')
      const refused = await b.get(r.location!)
      expect(refused.status).toBe(403)
      expect(refused.body).toContain('Not available to this account')
      expect(refused.body).not.toContain('Acting as')
    }
  })

  it('a moderator cannot open the waitlist (admin only); an admin can', async () => {
    const mod = await signInStepped('mod@test.invalid')
    const r = await mod.get('/admin/signups')
    expect(r.status).toBe(307)
    expect(r.location).toBe('/admin/forbidden')
    const nav = (await mod.get('/admin')).body.match(/<nav aria-label="Admin sections"[\s\S]*?<\/nav>/)![0]
    expect(nav).not.toContain('href="/admin/signups"')
    expect(nav).toContain('href="/admin/moderation"')

    const admin = await signInStepped('admin@test.invalid')
    expect((await admin.get('/admin/signups')).status).toBe(200)
  })
})

describe('TOTP', () => {
  it('a moderator without TOTP is sent to enrolment and blocked from every privileged page and action', async () => {
    const { b, verify } = await signIn('mod-new@test.invalid')
    expect(verify.location).toBe('/admin/totp/enrol')
    for (const path of ['/admin', '/admin/moderation', `/admin/moderation/reports/${REPORT_ID}`]) {
      const r = await b.get(path)
      expect(r.status, path).toBe(307)
      expect(r.location, path).toBe('/admin/totp/enrol')
    }
    const enrol = await b.get('/admin/totp/enrol')
    const act = await b.post('/admin/moderation/act', {
      csrf: Browser.csrf(enrol.body),
      op: 'hide',
      target_type: 'post',
      target_id: POST_ID,
      reason: REASON,
      return_to: '/admin/moderation',
    })
    expect(act.status).toBe(303)
    expect(act.location).toMatch(/^\/admin\/totp/)
    expect(mock.modCalls()).toHaveLength(0)
  })

  it('enrolment shows a QR code and the otpauth URI, confirms, shows backup codes once, and opens the panel', async () => {
    const { b } = await signIn('mod-new@test.invalid')
    const start = await b.get('/admin/totp/enrol')
    expect(start.body).toContain('Start enrolment')
    const begun = await b.post('/admin/auth/totp/enrol', { csrf: Browser.csrf(start.body) })
    expect(begun.location).toBe('/admin/totp/enrol')
    const shown = await b.get('/admin/totp/enrol')
    expect(shown.body).toContain('<svg')
    expect(shown.body).toContain('otpauth://totp/WellaPath%20Community:acct_mod_new')
    const wrong = await b.post('/admin/auth/totp/confirm', { csrf: Browser.csrf(shown.body), code: '000000' })
    expect(wrong.location).toBe('/admin/totp/enrol?error=invalid_code')
    const confirmed = await b.post('/admin/auth/totp/confirm', { csrf: Browser.csrf(shown.body), code: TOTP_CODE })
    expect(confirmed.location).toBe('/admin/totp/backup-codes')
    const codes = await b.get('/admin/totp/backup-codes')
    for (const c of mock.account('mod-new@test.invalid').backupCodes) expect(codes.body).toContain(c)
    expect(codes.body).toContain('If you lose your authenticator')
    const panel = await b.get('/admin')
    expect(panel.status).toBe(200)
  })

  it('an enrolled moderator on a new session must step up; a correct code allows the panel', async () => {
    const { b, verify } = await signIn('mod@test.invalid')
    expect(verify.location).toBe('/admin/totp')
    const blocked = await b.get('/admin/moderation')
    expect(blocked.status).toBe(307)
    expect(blocked.location).toBe('/admin/totp?next=%2Fadmin%2Fmoderation')
    const totp = await b.get('/admin/totp?next=%2Fadmin%2Fmoderation')
    const ok = await b.post('/admin/auth/totp/verify', { csrf: Browser.csrf(totp.body), code: TOTP_CODE, next: '/admin/moderation' })
    expect(ok.location).toBe('/admin/moderation')
    const queue = await b.get('/admin/moderation')
    expect(queue.status).toBe(200)
    expect(queue.body).toContain('unsafe medical advice')
  })

  it('a forged local step-up is not believed: the panel re-proves it against the backend', async () => {
    const { b } = await signIn('mod@test.invalid')
    const meta = JSON.parse(Buffer.from(b.jar.get('__Secure-wpa_meta')!, 'base64url').toString())
    meta.su = Date.now() + 3600_000
    b.jar.set('__Secure-wpa_meta', Buffer.from(JSON.stringify(meta)).toString('base64url'))
    const r = await b.get('/admin')
    expect(r.status).toBe(307)
    expect(r.location).toBe('/admin/totp')
  })

  it('five wrong codes sign the moderator out, clear the session cookies, and lock step-up', async () => {
    const { b } = await signIn('mod-lock@test.invalid')
    let last
    for (let i = 1; i <= 5; i++) {
      const totp = await b.get('/admin/totp')
      expect(totp.status, `attempt ${i} page`).toBe(200)
      last = await b.post('/admin/auth/totp/verify', { csrf: Browser.csrf(totp.body), code: '111111', next: '/admin' })
      if (i < 5) expect(last.location).toBe('/admin/totp?error=invalid_code')
    }
    expect(last!.location).toBe('/admin/sign-in?reason=totp_lockout')
    for (const name of ['__Secure-wpa_at', '__Secure-wpa_rt', '__Secure-wpa_meta']) expect(b.jar.has(name), name).toBe(false)
    const after = await b.get('/admin')
    expect(after.location).toMatch(/^\/admin\/sign-in/)
    const msg = await b.get('/admin/sign-in?reason=totp_lockout')
    expect(msg.body).toContain('locked for 15 minutes')

    // A fresh sign-in is possible, but step-up stays locked.
    const again = await signIn('mod-lock@test.invalid')
    const totp = await again.b.get('/admin/totp')
    const locked = await again.b.post('/admin/auth/totp/verify', { csrf: Browser.csrf(totp.body), code: TOTP_CODE, next: '/admin' })
    expect(locked.location).toBe('/admin/totp?error=locked')
  })
})

describe('moderation', () => {
  it('every action form requires a reason in the browser (required, minlength, maxlength)', async () => {
    const b = await signInStepped()
    const page = await b.get(`/admin/moderation/reports/${REPORT_ID}`)
    expect(page.status).toBe(200)
    const forms = page.body.match(/<form[^>]*action="\/admin\/moderation\/act"[\s\S]*?<\/form>/g) ?? []
    const ops = forms.map((f) => f.match(/data-op="([a-z]+)"/)?.[1])
    expect(ops).toEqual(['dismiss', 'hide', 'remove', 'restore', 'reveal'])
    for (const f of forms) expect(f).toMatch(/<textarea[^>]*name="reason"[^>]*required=""[^>]*minLength="10"[^>]*maxLength="500"/)

    const account = await b.get(`/admin/moderation/accounts/${AUTHOR_ID}`)
    const aforms = account.body.match(/<form[^>]*action="\/admin\/moderation\/act"[\s\S]*?<\/form>/g) ?? []
    expect(aforms.map((f) => f.match(/data-op="([a-z]+)"/)?.[1])).toEqual(['restrict', 'suspend', 'reinstate'])
    for (const f of aforms) expect(f).toMatch(/required=""[^>]*minLength="10"/)
  })

  it('an action without a reason, or with a short one, is rejected by the website and never reaches the backend', async () => {
    const b = await signInStepped()
    const page = await b.get(`/admin/moderation/reports/${REPORT_ID}`)
    const csrf = Browser.csrf(page.body)
    const base = { csrf, op: 'hide', target_type: 'post', target_id: POST_ID, return_to: `/admin/moderation/reports/${REPORT_ID}` }
    const none = await b.post('/admin/moderation/act', { ...base, reason: '   ' })
    expect(none.location).toBe(`/admin/moderation/reports/${REPORT_ID}?error=reason_required`)
    const short = await b.post('/admin/moderation/act', { ...base, reason: 'too short' })
    expect(short.location).toBe(`/admin/moderation/reports/${REPORT_ID}?error=reason_min_length`)
    expect(mock.modCalls()).toHaveLength(0)
    const shown = await b.get(short.location!)
    expect(shown.body).toContain('at least 10 characters')
  })

  it('the backend (mock) rejects a reasonless action on its own as well', async () => {
    const b = await signInStepped()
    const access = b.jar.get('__Secure-wpa_at')!
    const res = await fetch(`http://127.0.0.1:${mock.port}/v1/community/mod/posts/${POST_ID}/hide`, {
      method: 'POST',
      headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatchObject({ code: 'validation_failed', details: { field: 'reason' } })
  })

  it.each([
    ['dismiss', 'report', REPORT_ID, 'dismiss_report', 'dismissed'],
    ['hide', 'post', POST_ID, 'hide_content', 'hidden'],
    ['remove', 'post', POST_ID, 'remove_content', 'removed'],
    ['restrict', 'account', AUTHOR_ID, 'restrict_account', 'restricted'],
    ['suspend', 'account', AUTHOR_ID, 'suspend_account', 'suspended'],
  ])('%s with a reason shows the audit entry the server recorded', async (op, targetType, targetId, action, status) => {
    const b = await signInStepped()
    const page = await b.get(targetType === 'account' ? `/admin/moderation/accounts/${targetId}` : `/admin/moderation/reports/${REPORT_ID}`)
    const r = await b.post('/admin/moderation/act', {
      csrf: Browser.csrf(page.body),
      op,
      target_type: targetType,
      target_id: targetId,
      reason: REASON,
      return_to: '/admin/moderation',
      idem: crypto.randomUUID(),
    })
    expect(r.location).toBe('/admin/moderation/result')
    const sent = mock.modCalls().at(-1)!
    expect(sent.body).toMatchObject({ reason: REASON })
    const row = mock.actions[0] as Record<string, string>
    expect(row).toMatchObject({ actor_account_id: 'acct_mod_1', action, target_id: targetId, reason: REASON })

    const result = await b.get('/admin/moderation/result')
    expect(result.status).toBe(200)
    for (const v of [row.id, row.actor_account_id, row.action, row.target_type, row.target_id, REASON, row.created_at, status]) {
      expect(result.body, String(v)).toContain(String(v))
    }
  })

  it('restore after hide works and is audited; acting on an already-hidden post shows the server state error', async () => {
    const b = await signInStepped()
    const page = await b.get(`/admin/moderation/reports/${REPORT_ID}`)
    const f = { csrf: Browser.csrf(page.body), target_type: 'post', target_id: POST_ID, reason: REASON, return_to: '/admin/moderation' }
    await b.post('/admin/moderation/act', { ...f, op: 'hide' })
    const again = await b.post('/admin/moderation/act', { ...f, op: 'hide' })
    expect(again.location).toBe('/admin/moderation?error=invalid_state.already_in_state')
    const restored = await b.post('/admin/moderation/act', { ...f, op: 'restore' })
    expect(restored.location).toBe('/admin/moderation/result')
    expect((await b.get('/admin/moderation/result')).body).toContain('restore_content')
    const audit = await b.get(`/admin/moderation/audit?target_id=${POST_ID}`)
    expect(audit.body).toContain('hide_content')
    expect(audit.body).toContain('restore_content')
  })

  it('identity reveal requires a reason, is audited, and shows the identity with its audit entry id', async () => {
    const b = await signInStepped()
    const page = await b.get(`/admin/moderation/reports/${REPORT_ID}`)
    expect(page.body).not.toContain(AUTHOR_ID) // no identity before the reveal
    const csrf = Browser.csrf(page.body)
    const noReason = await b.post('/admin/moderation/act', { csrf, op: 'reveal', target_type: 'post', target_id: POST_ID, reason: '' })
    expect(noReason.location).toBe('/admin/moderation?error=reason_required')
    expect(mock.modCalls()).toHaveLength(0)
    const r = await b.post('/admin/moderation/act', { csrf, op: 'reveal', target_type: 'post', target_id: POST_ID, reason: REASON })
    expect(r.location).toBe('/admin/moderation/result')
    expect(mock.calls.at(-1)).toMatchObject({ path: '/v1/community/mod/identity/reveal', body: { target_type: 'post', target_id: POST_ID, reason: REASON } })
    const result = await b.get('/admin/moderation/result')
    expect(result.body).toContain(AUTHOR_ID)
    expect(result.body).toContain('SunnyMum')
    expect(result.body).toContain((mock.actions[0] as { id: string }).id)
    expect(mock.actions[0]).toMatchObject({ action: 'reveal_identity', actor_account_id: 'acct_mod_1' })
  })

  it('a moderator cannot act on their own account (server rule surfaced)', async () => {
    const b = await signInStepped()
    const page = await b.get('/admin/moderation/accounts/acct_mod_1')
    const r = await b.post('/admin/moderation/act', {
      csrf: Browser.csrf(page.body), op: 'suspend', target_type: 'account', target_id: 'acct_mod_1', reason: REASON,
      return_to: '/admin/moderation/accounts/acct_mod_1',
    })
    expect(r.location).toBe('/admin/moderation/accounts/acct_mod_1?error=self_action_forbidden')
  })
})

describe('session', () => {
  it('session cookies are httpOnly, Secure, SameSite=Strict and scoped to /admin', async () => {
    const { b, verify } = await signIn('mod@test.invalid')
    const names = verify.setCookies.map((c) => c.name)
    for (const n of ['__Secure-wpa_at', '__Secure-wpa_rt', '__Secure-wpa_meta', '__Secure-wpa_dev', '__Secure-wpa_csrf']) {
      expect(names, n).toContain(n)
    }
    const page = await b.get('/admin/totp')
    for (const c of [...verify.setCookies, ...page.setCookies]) {
      expect(c.attrs.httponly, c.name).toBe(true)
      expect(c.attrs.secure, c.name).toBe(true)
      expect(String(c.attrs.samesite).toLowerCase(), c.name).toBe('strict')
      expect(c.attrs.path, c.name).toBe('/admin')
    }
  })

  it('the access and refresh tokens never appear in any rendered page', async () => {
    const b = await signInStepped()
    const at = b.jar.get('__Secure-wpa_at')!
    const rt = b.jar.get('__Secure-wpa_rt')!
    for (const path of ['/admin', '/admin/moderation', `/admin/moderation/reports/${REPORT_ID}`, '/admin/moderation/audit', '/admin/totp']) {
      const r = await b.get(path)
      expect(r.body.includes(at), path).toBe(false)
      expect(r.body.includes(rt), path).toBe(false)
    }
  })

  it('the panel shows who is acting, the session deadlines, and reloads itself at the idle limit', async () => {
    const b = await signInStepped()
    const r = await b.get('/admin/data')
    expect(r.body).toContain('Acting as')
    expect(r.body).toContain('ModOne')
    expect(r.body).toContain('acct_mod_1')
    expect(r.body).toContain('Idle sign-out')
    expect(r.body).toMatch(/http-equiv="refresh" content="(\d+)"/)
    const secs = Number(r.body.match(/http-equiv="refresh" content="(\d+)"/)![1])
    expect(secs).toBeGreaterThan(3590)
    expect(secs).toBeLessThanOrEqual(3605)
  })

  it('an expired access token is refreshed (rotated) server-side and the old refresh token is spent', async () => {
    const b = await signInStepped()
    const oldRt = b.jar.get('__Secure-wpa_rt')!
    b.jar.delete('__Secure-wpa_at') // as the browser does when its Max-Age passes
    const r = await b.get('/admin/moderation')
    expect(r.status).toBe(200)
    expect(b.jar.get('__Secure-wpa_rt')).not.toBe(oldRt)
    expect(mock.calls.filter((c) => c.path === '/v1/auth/refresh')).toHaveLength(1)
  })

  it('idle for over an hour signs out with the idle reason and revokes the backend session', async () => {
    const b = await signInStepped()
    const meta = JSON.parse(Buffer.from(b.jar.get('__Secure-wpa_meta')!, 'base64url').toString())
    meta.last = Date.now() - 61 * 60 * 1000
    b.jar.set('__Secure-wpa_meta', Buffer.from(JSON.stringify(meta)).toString('base64url'))
    const r = await b.get('/admin')
    expect(r.location).toBe('/admin/sign-in?reason=idle')
    expect(b.jar.has('__Secure-wpa_rt')).toBe(false)
    expect(mock.calls.some((c) => c.path === '/v1/auth/logout')).toBe(true)
  })

  it('past the absolute limit signs out with the expired reason', async () => {
    const b = await signInStepped()
    const meta = JSON.parse(Buffer.from(b.jar.get('__Secure-wpa_meta')!, 'base64url').toString())
    meta.abs = Date.now() - 1000
    b.jar.set('__Secure-wpa_meta', Buffer.from(JSON.stringify(meta)).toString('base64url'))
    const r = await b.get('/admin/moderation')
    expect(r.location).toMatch(/^\/admin\/sign-in\?reason=expired/)
  })

  it('a suspension at the backend ends the session on the next click', async () => {
    const b = await signInStepped()
    mock.account('mod@test.invalid').status = 'suspended'
    const r = await b.get('/admin')
    expect(r.location).toMatch(/^\/admin\/sign-in\?reason=session_ended/)
  })

  it('sign-out revokes at the backend and clears the session cookies', async () => {
    const b = await signInStepped()
    const page = await b.get('/admin')
    const r = await b.post('/admin/auth/sign-out', { csrf: Browser.csrf(page.body) })
    expect(r.location).toBe('/admin/sign-in?reason=signed_out')
    expect(mock.calls.some((c) => c.path === '/v1/auth/logout' && c.auth)).toBe(true)
    for (const n of ['__Secure-wpa_at', '__Secure-wpa_rt', '__Secure-wpa_meta']) expect(b.jar.has(n), n).toBe(false)
    expect((await b.get('/admin')).location).toMatch(/^\/admin\/sign-in/)
  })

  it('the existing read-only pages render for a stepped-up moderator', async () => {
    const b = await signInStepped()
    for (const path of ['/admin', '/admin/launch-readiness', '/admin/distribution', '/admin/system-health', '/admin/data', '/admin/feedback', '/admin/support', '/admin/reliability', '/admin/product-insights']) {
      const r = await b.get(path)
      expect(r.status, path).toBe(200)
      expect(r.body, path).toContain('<h1')
    }
  })

  it('the shared Basic credential does nothing in individual mode', async () => {
    const b = new Browser(next.base, 'check:whatever')
    const r = await b.get('/admin')
    expect(r.status).toBe(307)
    expect(r.location).toMatch(/^\/admin\/sign-in/)
  })
})
