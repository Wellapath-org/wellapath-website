/**
 * A mock of the WellaPath Community API, implementing the contract responses
 * /admin depends on (COMMUNITY_API_CONTRACT.md v1.0 §1.3 errors, §2.1
 * privileged gate, §3.3 A1–A4 and A7–A9, §7 M1, §12 D1–D3, D6–D13).
 *
 * Deterministic test credentials: the emailed OTP is always 123456 and the
 * valid TOTP code is always 246810. Nothing here is a real secret.
 *
 * Every request is recorded in `calls`, so a test can prove the website did
 * NOT reach the backend (e.g. an action with no reason).
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'

export const OTP_CODE = '123456'
export const TOTP_CODE = '246810'
export const ACCESS_TTL_S = 900
export const PRIV_ABS_MS = 12 * 3600 * 1000
export const STEP_UP_MS = 12 * 3600 * 1000

type Role = 'member' | 'moderator' | 'admin'
type Account = {
  id: string
  email: string
  role: Role
  status: 'active' | 'restricted' | 'suspended'
  enrolled: boolean
  pendingSecret: boolean
  displayName: string | null
  failures: number
  lockedUntil: number
  backupCodes: string[]
}
type Session = { id: string; accountId: string; deviceId: string; stepUpUntil: number; revoked: boolean; absUntil: number }

export type Call = { method: string; path: string; auth: boolean; body: unknown }

export const POST_ID = '0194f7a2-0000-7000-8000-000000000001'
export const COMMENT_ID = '0194f7a2-0000-7000-8000-000000000002'
export const REPORT_ID = '0194f7a2-0000-7000-8000-0000000000aa'
export const AUTHOR_ID = 'acct_author_1'

export class MockBackend {
  server: Server
  port = 0
  calls: Call[] = []
  accounts = new Map<string, Account>()
  sessions = new Map<string, Session>()
  access = new Map<string, { sid: string; exp: number }>()
  /** usedAt and next model the D-019 race window (contract §3.2). */
  refresh = new Map<string, { sid: string; used: boolean; usedAt?: number; next?: string }>()
  otpIssued = new Set<string>()
  actions: Record<string, unknown>[] = []
  private lastIssuedRefresh = ''
  contentStatus = new Map<string, string>()
  reportStatus = new Map<string, string>()
  nextActionId = 1000

  constructor() {
    this.reset()
    this.server = createServer((req, res) => {
      this.handle(req, res).catch(() => this.send(res, 500, err('internal_error')))
    })
  }

  reset() {
    this.calls = []
    this.accounts.clear()
    this.sessions.clear()
    this.access.clear()
    this.refresh.clear()
    this.otpIssued.clear()
    this.actions = []
    this.contentStatus = new Map([
      [POST_ID, 'visible'],
      [COMMENT_ID, 'visible'],
    ])
    this.reportStatus = new Map([[REPORT_ID, 'open']])
    const add = (id: string, email: string, role: Role, enrolled: boolean, displayName: string | null) =>
      this.accounts.set(email, {
        id,
        email,
        role,
        status: 'active',
        enrolled,
        pendingSecret: false,
        displayName,
        failures: 0,
        lockedUntil: 0,
        backupCodes: [],
      })
    add('acct_mod_new', 'mod-new@test.invalid', 'moderator', false, 'NewMod')
    add('acct_mod_1', 'mod@test.invalid', 'moderator', true, 'ModOne')
    add('acct_mod_lock', 'mod-lock@test.invalid', 'moderator', true, 'LockMod')
    add('acct_admin_1', 'admin@test.invalid', 'admin', true, 'AdminOne')
    add('acct_member_1', 'member@test.invalid', 'member', false, 'MemberOne')
    add(AUTHOR_ID, 'author@test.invalid', 'member', false, 'SunnyMum')
  }

  async start() {
    await new Promise<void>((r) => this.server.listen(0, '127.0.0.1', () => r()))
    this.port = (this.server.address() as AddressInfo).port
    return `http://127.0.0.1:${this.port}`
  }

  stop() {
    return new Promise<void>((r) => this.server.close(() => r()))
  }

  account(email: string) {
    return this.accounts.get(email)!
  }

  /** Mod calls only (the privileged surface). */
  modCalls() {
    return this.calls.filter((c) => c.path.startsWith('/v1/community/mod/') && c.method === 'POST')
  }

  /* ── plumbing ─────────────────────────────────────────────────────────── */

  private send(res: ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}) {
    res.writeHead(status, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'x-request-id': 'req_mock_' + randomBytes(4).toString('hex'),
      ...headers,
    })
    res.end(body === undefined ? undefined : JSON.stringify(body))
  }

  private async body(req: IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    if (!chunks.length) return {}
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      return {}
    }
  }

  private me(a: Account) {
    return {
      account_id: a.id,
      email: a.email,
      role: a.role,
      status: a.status,
      restricted_until: null,
      two_factor_enabled: a.enrolled,
      community_allowed: true,
      created_at: '2026-11-01T00:00:00.000Z',
      profile: a.displayName ? { display_name: a.displayName, professional: null } : null,
    }
  }

  private issue(sid: string, a: Account, created: boolean) {
    const s = this.sessions.get(sid)!
    const at = 'eyJmock.' + randomBytes(24).toString('base64url')
    const rt = 'wprt_' + randomBytes(32).toString('base64url')
    const exp = Date.now() + ACCESS_TTL_S * 1000
    this.access.set(at, { sid, exp })
    this.refresh.set(rt, { sid, used: false })
    this.lastIssuedRefresh = rt
    return {
      token_type: 'Bearer',
      access_token: at,
      expires_in: ACCESS_TTL_S,
      access_token_expires_at: new Date(exp).toISOString(),
      refresh_token: rt,
      refresh_token_expires_at: new Date(s.absUntil).toISOString(),
      account_created: created,
      account: this.me(a),
    }
  }

  private byId(id: string) {
    for (const a of this.accounts.values()) if (a.id === id) return a
    return undefined
  }

  private authed(req: IncomingMessage, allowExpired = false): { a: Account; s: Session } | { error: [number, unknown] } {
    const h = req.headers.authorization ?? ''
    if (!h.startsWith('Bearer ')) return { error: [401, err('unauthenticated', { reason: 'missing_token' })] }
    const t = this.access.get(h.slice(7))
    if (!t) return { error: [401, err('unauthenticated', { reason: 'invalid_token' })] }
    if (!allowExpired && t.exp < Date.now()) return { error: [401, err('token_expired')] }
    const s = this.sessions.get(t.sid)
    if (!s || s.revoked) return { error: [401, err('unauthenticated', { reason: 'session_revoked' })] }
    const a = this.byId(s.accountId)!
    if (a.status === 'suspended') return { error: [401, err('unauthenticated', { reason: 'session_revoked' })] }
    return { a, s }
  }

  private privileged(req: IncomingMessage, min: Role = 'moderator') {
    const r = this.authed(req)
    if ('error' in r) return r
    const rank = { member: 0, moderator: 1, admin: 2 }
    if (rank[r.a.role] < rank[min]) return { error: [403, err('forbidden')] as [number, unknown] }
    if (!r.a.enrolled) return { error: [403, err('mfa_enrollment_required')] as [number, unknown] }
    if (r.s.stepUpUntil < Date.now()) return { error: [403, err('mfa_step_up_required')] as [number, unknown] }
    return r
  }

  private revokeSession(sid: string) {
    const s = this.sessions.get(sid)
    if (s) s.revoked = true
  }

  private record(actor: Account, action: string, targetType: string, targetId: string, reason: string) {
    const row = {
      id: String(this.nextActionId++),
      actor_account_id: actor.id,
      action,
      target_type: targetType,
      target_id: targetId,
      reason,
      created_at: new Date().toISOString(),
    }
    this.actions.unshift(row)
    return row
  }

  private modContent(id: string, kind: 'post' | 'comment') {
    return {
      id,
      kind,
      space_id: 'general_health',
      post_id: kind === 'comment' ? POST_ID : null,
      body: 'A fictional reported post body for tests.',
      author: { display_mode: 'pseudonymous', display_name: null, badge: null },
      status: this.contentStatus.get(id) ?? 'visible',
      open_report_count: this.reportStatus.get(REPORT_ID) === 'open' ? 1 : 0,
      created_at: '2026-11-05T09:00:00.000Z',
      updated_at: '2026-11-05T09:00:00.000Z',
    }
  }

  private report() {
    return {
      id: REPORT_ID,
      target_type: 'post',
      target_id: POST_ID,
      reason: 'unsafe_medical_advice',
      note: 'Fictional note.',
      status: this.reportStatus.get(REPORT_ID),
      created_at: '2026-11-06T09:00:00.000Z',
      target: this.modContent(POST_ID, 'post'),
    }
  }

  /* ── routes ───────────────────────────────────────────────────────────── */

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://mock')
    const path = url.pathname
    const method = req.method ?? 'GET'
    const body = method === 'POST' ? await this.body(req) : {}
    this.calls.push({ method, path, auth: Boolean(req.headers.authorization), body })
    const send = (status: number, b?: unknown, h?: Record<string, string>) => this.send(res, status, b, h)
    const fail = (r: { error: [number, unknown] }) => send(r.error[0], r.error[1])

    // A1
    if (method === 'POST' && path === '/v1/auth/otp/request') {
      const email = String(body.email ?? '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+$/.test(email)) return send(400, err('validation_failed', { field: 'email', rule: 'format' }))
      if (this.accounts.has(email)) this.otpIssued.add(email)
      return send(202, {})
    }
    // A2
    if (method === 'POST' && path === '/v1/auth/otp/verify') {
      const email = String(body.email ?? '').toLowerCase()
      const a = this.accounts.get(email)
      if (!a || !this.otpIssued.has(email) || body.code !== OTP_CODE) return send(400, err('invalid_code'))
      if (a.status === 'suspended') return send(403, err('account_suspended'))
      if (typeof body.device_id !== 'string' || !/^[0-9a-f-]{36}$/.test(body.device_id)) {
        return send(400, err('validation_failed', { field: 'device_id', rule: 'format' }))
      }
      this.otpIssued.delete(email)
      const sid = randomUUID()
      const abs = a.role === 'member' ? 30 * 24 * 3600 * 1000 : PRIV_ABS_MS
      this.sessions.set(sid, { id: sid, accountId: a.id, deviceId: body.device_id, stepUpUntil: 0, revoked: false, absUntil: Date.now() + abs })
      return send(200, this.issue(sid, a, false))
    }
    // A3
    if (method === 'POST' && path === '/v1/auth/refresh') {
      const r = this.refresh.get(String(body.refresh_token ?? ''))
      if (!r) return send(401, err('unauthenticated', { reason: 'refresh_invalid' }))
      const s = this.sessions.get(r.sid)!
      if (s.revoked) return send(401, err('unauthenticated', { reason: 'session_revoked' }))
      // D-019 (founder, 2026-11-08): a repeat is tolerated only within 10 s,
      // from the same device, with the replacement (same family) unused.
      const next = r.next ? this.refresh.get(r.next) : undefined
      const tolerated =
        r.used &&
        s.deviceId === body.device_id &&
        Date.now() - (r.usedAt ?? 0) < 10_000 &&
        next !== undefined &&
        next.sid === r.sid &&
        !next.used
      if (tolerated) return send(409, err('conflict', { reason: 'refresh_race' }))
      if (r.used || s.deviceId !== body.device_id) {
        this.revokeSession(r.sid)
        return send(401, err('unauthenticated', { reason: 'refresh_reused' }))
      }
      if (s.absUntil < Date.now()) return send(401, err('unauthenticated', { reason: 'refresh_expired' }))
      r.used = true
      r.usedAt = Date.now()
      const pair = this.issue(r.sid, this.byId(s.accountId)!, false)
      r.next = this.lastIssuedRefresh
      return send(200, pair)
    }
    // A4
    if (method === 'POST' && path === '/v1/auth/logout') {
      const r = this.authed(req, true)
      if ('error' in r) return send(204)
      this.revokeSession(r.s.id)
      return send(204)
    }
    // A7
    if (method === 'POST' && path === '/v1/auth/totp/enrol') {
      const r = this.authed(req)
      if ('error' in r) return fail(r)
      if (r.a.role === 'member') return send(403, err('forbidden'))
      if (r.a.enrolled) return send(409, err('conflict', { reason: 'totp_already_enrolled' }))
      r.a.pendingSecret = true
      return send(200, {
        otpauth_uri: `otpauth://totp/WellaPath%20Community:${r.a.id}?secret=JBSWY3DPEHPK3PXP&issuer=WellaPath%20Community&digits=6&period=30`,
        secret_base32: 'JBSWY3DPEHPK3PXP',
        digits: 6,
        period: 30,
      })
    }
    // A8 and A9 share the failure counter
    if (method === 'POST' && (path === '/v1/auth/totp/enrol/confirm' || path === '/v1/auth/totp/verify')) {
      const r = this.authed(req)
      if ('error' in r) return fail(r)
      const { a, s } = r
      if (a.role === 'member') return send(403, err('forbidden'))
      const confirm = path.endsWith('/confirm')
      if (confirm && !a.pendingSecret) return send(422, err('invalid_state', { reason: 'not_enrolled' }))
      if (!confirm && !a.enrolled) return send(403, err('mfa_enrollment_required'))
      if (a.lockedUntil > Date.now()) {
        const retry = Math.ceil((a.lockedUntil - Date.now()) / 1000)
        return send(429, err('rate_limited', { retry_after_seconds: retry }), { 'retry-after': String(retry) })
      }
      const backupIdx = typeof body.backup_code === 'string' ? a.backupCodes.indexOf(body.backup_code) : -1
      const good = body.code === TOTP_CODE || (!confirm && backupIdx >= 0)
      if (!good) {
        a.failures += 1
        if (a.failures >= 5) {
          a.failures = 0
          a.lockedUntil = Date.now() + 15 * 60 * 1000
          this.revokeSession(s.id)
          return send(401, err('unauthenticated', { reason: 'session_revoked' }))
        }
        return send(400, err('invalid_code'))
      }
      a.failures = 0
      if (backupIdx >= 0) a.backupCodes.splice(backupIdx, 1)
      s.stepUpUntil = Math.min(Date.now() + STEP_UP_MS, s.absUntil)
      const step_up_expires_at = new Date(s.stepUpUntil).toISOString()
      if (confirm) {
        a.enrolled = true
        a.pendingSecret = false
        a.backupCodes = Array.from({ length: 10 }, (_, i) => `bk${String(i).padStart(2, '0')}-${randomBytes(3).toString('hex')}`)
        return send(200, { backup_codes: a.backupCodes, step_up_expires_at })
      }
      return send(200, { step_up: 'verified', step_up_expires_at })
    }
    // M1
    if (method === 'GET' && path === '/v1/community/me') {
      const r = this.authed(req)
      if ('error' in r) return fail(r)
      return send(200, this.me(r.a))
    }

    if (!path.startsWith('/v1/community/mod/')) return send(404, err('not_found'))

    const p = this.privileged(req)
    if ('error' in p) return fail(p)
    const actor = p.a

    // D1, D2, D13
    if (method === 'GET' && path === '/v1/community/mod/reports') {
      const status = url.searchParams.get('status') ?? 'open'
      const items = this.reportStatus.get(REPORT_ID) === status ? [this.report()] : []
      return send(200, { items, next_cursor: null })
    }
    if (method === 'GET' && path === `/v1/community/mod/reports/${REPORT_ID}`) return send(200, this.report())
    if (method === 'GET' && path.startsWith('/v1/community/mod/reports/')) return send(404, err('not_found'))
    if (method === 'GET' && path === '/v1/community/mod/actions') {
      const tid = url.searchParams.get('target_id')
      const limit = Number(url.searchParams.get('limit') ?? 20)
      return send(200, { items: this.actions.filter((x) => !tid || x.target_id === tid).slice(0, limit), next_cursor: null })
    }

    if (method !== 'POST') return send(404, err('not_found'))

    // Every mutating moderation request requires a 10–500 char reason (§12).
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!reason) return send(400, err('validation_failed', { field: 'reason', rule: 'required' }))
    if (reason.length < 10) return send(400, err('validation_failed', { field: 'reason', rule: 'min_length' }))
    if (reason.length > 500) return send(400, err('validation_failed', { field: 'reason', rule: 'max_length' }))

    // D6
    if (path === '/v1/community/mod/identity/reveal') {
      const tid = String(body.target_id ?? '')
      if (!this.contentStatus.has(tid)) return send(404, err('not_found'))
      const row = this.record(actor, 'reveal_identity', String(body.target_type), tid, reason)
      const author = this.byId(AUTHOR_ID)!
      return send(200, {
        account_id: author.id,
        display_name: author.displayName,
        role: author.role,
        status: author.status,
        created_at: '2026-11-01T00:00:00.000Z',
        prior_moderation_actions: this.actions.filter((x) => x.target_id === author.id).length,
        reveal_action_id: row.id,
      })
    }
    // D3
    let m = path.match(/^\/v1\/community\/mod\/reports\/([^/]+)\/dismiss$/)
    if (m) {
      if (this.reportStatus.get(m[1]) === undefined) return send(404, err('not_found'))
      if (this.reportStatus.get(m[1]) !== 'open') return send(422, err('invalid_state', { reason: 'already_in_state' }))
      this.reportStatus.set(m[1], 'dismissed')
      return send(200, { ...this.record(actor, 'dismiss_report', 'report', m[1], reason), target_status: 'dismissed' })
    }
    // D7–D9
    m = path.match(/^\/v1\/community\/mod\/(posts|comments)\/([^/]+)\/(hide|remove|restore)$/)
    if (m) {
      const [, kind, id, verb] = m
      const cur = this.contentStatus.get(id)
      if (!cur) return send(404, err('not_found'))
      const allowed = { hide: ['visible'], remove: ['visible', 'hidden'], restore: ['hidden', 'removed'] }[verb]!
      if (!allowed.includes(cur)) {
        return send(422, err('invalid_state', { reason: verb === 'restore' ? 'not_hidden_or_removed' : 'already_in_state' }))
      }
      const to = { hide: 'hidden', remove: 'removed', restore: 'visible' }[verb]!
      this.contentStatus.set(id, to)
      if (verb !== 'restore' && this.reportStatus.get(REPORT_ID) === 'open') this.reportStatus.set(REPORT_ID, 'actioned')
      const action = { hide: 'hide_content', remove: 'remove_content', restore: 'restore_content' }[verb]!
      return send(200, { ...this.record(actor, action, kind.slice(0, -1), id, reason), target_status: to })
    }
    // D10–D12
    m = path.match(/^\/v1\/community\/mod\/accounts\/([^/]+)\/(restrict|suspend|reinstate)$/)
    if (m) {
      const [, id, verb] = m
      const target = this.byId(id)
      if (!target) return send(404, err('not_found'))
      if (target.id === actor.id) return send(403, err('self_action_forbidden'))
      if (target.role !== 'member' && actor.role !== 'admin') return send(403, err('forbidden'))
      if (verb === 'reinstate' && target.status === 'active') {
        return send(422, err('invalid_state', { reason: 'not_restricted_or_suspended' }))
      }
      // C3 (founder, 2026-11-08): no-op restrict/suspend, and no audit row.
      if ((verb === 'restrict' && target.status === 'restricted') || (verb === 'suspend' && target.status === 'suspended')) {
        return send(422, err('invalid_state', { reason: 'already_in_state' }))
      }
      const to = { restrict: 'restricted', suspend: 'suspended', reinstate: 'active' }[verb] as Account['status']
      target.status = to
      let revoked = 0
      if (verb === 'suspend') {
        for (const s of this.sessions.values()) if (s.accountId === target.id && !s.revoked) (s.revoked = true), revoked++
      }
      const action = { restrict: 'restrict_account', suspend: 'suspend_account', reinstate: 'reinstate_account' }[verb]!
      const row = { ...this.record(actor, action, 'account', id, reason), target_status: to }
      return send(200, verb === 'suspend' ? { ...row, sessions_revoked: revoked } : row)
    }
    return send(404, err('not_found'))
  }
}

function err(code: string, details?: Record<string, unknown>) {
  const message: Record<string, string> = {
    validation_failed: 'Validation failed',
    invalid_code: 'Invalid code',
    unauthenticated: 'Not signed in',
    token_expired: 'Token expired',
    forbidden: 'Forbidden',
    mfa_enrollment_required: 'TOTP enrolment required',
    mfa_step_up_required: 'TOTP step-up required',
    not_found: 'Not found',
  }
  const out: Record<string, unknown> = { code, message: message[code] ?? code, request_id: 'req_mock_0000000000' }
  if (details) out.details = details
  return { error: out }
}
