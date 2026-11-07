/**
 * A client for the WellaPath Community API, the parts /admin needs.
 *
 * Shapes and paths are COMMUNITY_API_CONTRACT.md v1.0 (§3 auth, §7.1 Me, §12
 * moderation). Only the Next server calls this: middleware and route handlers
 * and server components. The browser never talks to the backend and never
 * holds a backend token in JavaScript.
 *
 * Nothing here logs. Requests carry emails, codes and tokens, and the website
 * rule (#7) is that no contact detail reaches a log. Errors are reduced to the
 * contract's error code, the reason and the request id, none of which carry
 * input values (§1.3).
 *
 * Edge-safe: fetch, AbortController and nothing from Node.
 */
import { communityApiBase } from './mode'

export type Role = 'member' | 'moderator' | 'admin'
export type AccountStatus = 'active' | 'restricted' | 'suspended'

export type Me = {
  account_id: string
  email?: string
  role: Role
  status: AccountStatus
  restricted_until?: string | null
  two_factor_enabled: boolean
  community_allowed?: boolean
  created_at?: string
  profile: { display_name: string; professional?: unknown } | null
}

export type TokenPair = {
  token_type: 'Bearer'
  access_token: string
  expires_in: number
  access_token_expires_at: string
  refresh_token: string
  refresh_token_expires_at: string
  account_created: boolean
  account: Me
}

export type ModContent = {
  id: string
  kind: 'post' | 'comment'
  space_id: string
  post_id: string | null
  body: string | null
  author: { display_mode?: string; display_name?: string | null; badge?: unknown } | null
  status: string
  open_report_count: number
  created_at: string
  updated_at?: string
}

export type ReportQueueItem = {
  id: string
  target_type: 'post' | 'comment'
  target_id: string
  reason: string
  note: string | null
  status: 'open' | 'actioned' | 'dismissed' | string
  created_at: string
  target: ModContent
}

export type ModerationAction = {
  id: string
  actor_account_id: string
  action: string
  target_type: string
  target_id: string
  reason: string
  created_at: string
  target_status?: string
  sessions_revoked?: number
  target_role?: Role
}

export type AccountableIdentity = {
  account_id: string
  display_name: string | null
  role: Role
  status: AccountStatus
  created_at: string
  prior_moderation_actions: number
  reveal_action_id: string
}

export type Page<T> = { items: T[]; next_cursor: string | null }

export type ApiError = {
  status: number
  code: string
  reason?: string
  requestId?: string
  retryAfter?: number
  field?: string
}

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; error: ApiError }

const TIMEOUT_MS = 8000

/** Unknown role values are treated as `member` (contract §13): fail closed. */
export function normaliseRole(role: unknown): Role {
  return role === 'moderator' || role === 'admin' ? role : 'member'
}

export const isPrivileged = (role: Role) => role === 'moderator' || role === 'admin'

/** Path segments are opaque ids; anything outside the contract's id alphabet
 *  is refused locally rather than sent. */
export function safeId(id: string): string | null {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null
}

async function call<T>(
  method: 'GET' | 'POST',
  path: string,
  opts: { token?: string; body?: unknown; idempotencyKey?: string } = {},
): Promise<ApiResult<T>> {
  const base = communityApiBase()
  if (!base) return { ok: false, error: { status: 503, code: 'not_configured' } }

  const headers: Record<string, string> = { accept: 'application/json' }
  if (opts.token) headers.authorization = `Bearer ${opts.token}`
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  if (opts.idempotencyKey) headers['idempotency-key'] = opts.idempotencyKey

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(base + path, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    })
  } catch {
    return { ok: false, error: { status: 503, code: 'community_unavailable' } }
  } finally {
    clearTimeout(timer)
  }

  let json: unknown = null
  if (res.status !== 204) {
    try {
      json = await res.json()
    } catch {
      json = null
    }
  }

  if (res.ok) return { ok: true, status: res.status, data: (json ?? {}) as T }

  const e = (json as { error?: Record<string, unknown> } | null)?.error ?? {}
  const details = (e.details ?? {}) as Record<string, unknown>
  const retry = Number(res.headers.get('retry-after'))
  return {
    ok: false,
    error: {
      status: res.status,
      code: typeof e.code === 'string' ? e.code : 'internal_error',
      reason: typeof details.reason === 'string' ? details.reason : undefined,
      field: typeof details.field === 'string' ? details.field : undefined,
      requestId: typeof e.request_id === 'string' ? e.request_id : undefined,
      retryAfter: Number.isFinite(retry) && retry > 0 ? retry : undefined,
    },
  }
}

export const DEVICE_LABEL = 'WellaPath admin (web)'

export const api = {
  /* §3.3 auth */
  otpRequest: (email: string) => call<Record<string, never>>('POST', '/v1/auth/otp/request', { body: { email } }),
  otpVerify: (email: string, code: string, deviceId: string) =>
    call<TokenPair>('POST', '/v1/auth/otp/verify', {
      body: { email, code, device_id: deviceId, device_label: DEVICE_LABEL },
    }),
  refresh: (refreshToken: string, deviceId: string) =>
    call<TokenPair>('POST', '/v1/auth/refresh', { body: { refresh_token: refreshToken, device_id: deviceId } }),
  logout: (accessToken: string, refreshToken?: string) =>
    call<null>('POST', '/v1/auth/logout', {
      token: accessToken,
      body: refreshToken ? { refresh_token: refreshToken } : {},
    }),
  totpEnrol: (token: string) =>
    call<{ otpauth_uri: string; secret_base32: string; digits: number; period: number }>(
      'POST',
      '/v1/auth/totp/enrol',
      { token, body: {} },
    ),
  totpConfirm: (token: string, code: string) =>
    call<{ backup_codes: string[]; step_up_expires_at: string }>('POST', '/v1/auth/totp/enrol/confirm', {
      token,
      body: { code },
    }),
  totpVerify: (token: string, body: { code: string } | { backup_code: string }) =>
    call<{ step_up: 'verified'; step_up_expires_at: string }>('POST', '/v1/auth/totp/verify', { token, body }),

  /* §7 self */
  me: (token: string) => call<Me>('GET', '/v1/community/me', { token }),

  /* §12 moderation reads */
  reports: (token: string, q: { status?: string; cursor?: string }) => {
    const p = new URLSearchParams()
    if (q.status) p.set('status', q.status)
    if (q.cursor) p.set('cursor', q.cursor)
    p.set('limit', '20')
    return call<Page<ReportQueueItem>>('GET', `/v1/community/mod/reports?${p}`, { token })
  },
  report: (token: string, id: string) =>
    call<ReportQueueItem>('GET', `/v1/community/mod/reports/${encodeURIComponent(id)}`, { token }),
  actions: (token: string, q: { target_type?: string; target_id?: string; cursor?: string; limit?: number }) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') p.set(k, String(v))
    if (!p.has('limit')) p.set('limit', '20')
    return call<Page<ModerationAction>>('GET', `/v1/community/mod/actions?${p}`, { token })
  },

  /* §12 moderation writes; the path and body come from MOD_OPS */
  post: <T>(token: string, path: string, body: unknown, idempotencyKey?: string) =>
    call<T>('POST', path, { token, body, idempotencyKey }),
}
