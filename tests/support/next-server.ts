/**
 * Starts the production build (`next start`) with a given environment, and a
 * browser-like client with a cookie jar that applies Set-Cookie in order.
 *
 * Needs `npm run build` first. The same build serves every mode: the lock is
 * chosen from the environment at request time, which is also what this proves.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

export async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as { port: number }).port
      s.close(() => resolve(port))
    })
  })
}

export type Running = { base: string; stop: () => Promise<void> }

export async function startNext(env: Record<string, string | undefined>): Promise<Running> {
  if (!existsSync(join(ROOT, '.next', 'BUILD_ID'))) {
    throw new Error('No production build. Run `npm run build` before the integration tests.')
  }
  const port = await freePort()
  const cleanEnv: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined) continue
    if (/^(ADMIN_|COMMUNITY_API_BASE_URL$|DATABASE_URL$)/.test(k)) continue
    cleanEnv[k] = v
  }
  for (const [k, v] of Object.entries(env)) if (v !== undefined) cleanEnv[k] = v
  const child: ChildProcess = spawn(join(ROOT, 'node_modules', '.bin', 'next'), ['start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: ROOT,
    env: { ...cleanEnv, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout?.on('data', (d) => (log += d))
  child.stderr?.on('data', (d) => (log += d))
  const base = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 30_000
  for (;;) {
    try {
      await fetch(base + '/robots.txt')
      break
    } catch {
      if (Date.now() > deadline || child.exitCode !== null) throw new Error(`next start failed:\n${log}`)
      await new Promise((r) => setTimeout(r, 150))
    }
  }
  return {
    base,
    stop: () =>
      new Promise<void>((resolve) => {
        child.once('exit', () => resolve())
        child.kill('SIGTERM')
        setTimeout(() => child.kill('SIGKILL'), 3000)
      }),
  }
}

export type SetCookie = { name: string; value: string; attrs: Record<string, string | true>; raw: string }

export function parseSetCookie(raw: string): SetCookie {
  const [pair, ...rest] = raw.split(';')
  const i = pair.indexOf('=')
  const attrs: Record<string, string | true> = {}
  for (const a of rest) {
    const [k, ...v] = a.trim().split('=')
    attrs[k.toLowerCase()] = v.length ? v.join('=') : true
  }
  return { name: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim(), attrs, raw }
}

export type Res = { status: number; location: string | null; body: string; headers: Headers; setCookies: SetCookie[] }

/** A same-origin browser: keeps cookies, sends Origin and Sec-Fetch-Site on
 *  POST, never follows redirects on its own. */
export class Browser {
  jar = new Map<string, string>()
  constructor(
    public base: string,
    public basic?: string,
  ) {}

  private apply(res: Response): SetCookie[] {
    const list = res.headers.getSetCookie().map(parseSetCookie)
    for (const c of list) {
      const maxAge = c.attrs['max-age']
      if (maxAge === '0' || c.value === '') this.jar.delete(c.name)
      else this.jar.set(c.name, c.value)
    }
    return list
  }

  cookieHeader() {
    return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  async request(method: 'GET' | 'POST', path: string, form?: Record<string, string>, extra: Record<string, string> = {}): Promise<Res> {
    const headers: Record<string, string> = { ...extra }
    const cookie = this.cookieHeader()
    if (cookie) headers.cookie = cookie
    if (this.basic) headers.authorization = 'Basic ' + Buffer.from(this.basic).toString('base64')
    let body: string | undefined
    if (method === 'POST') {
      headers['content-type'] = 'application/x-www-form-urlencoded'
      headers.origin ??= this.base
      headers['sec-fetch-site'] ??= 'same-origin'
      body = new URLSearchParams(form ?? {}).toString()
    }
    const res = await fetch(this.base + path, { method, headers, body, redirect: 'manual' })
    const setCookies = this.apply(res)
    const text = await res.text()
    const loc = res.headers.get('location')
    return {
      status: res.status,
      location: loc ? new URL(loc, this.base).pathname + new URL(loc, this.base).search : null,
      body: text,
      headers: res.headers,
      setCookies,
    }
  }

  get(path: string, extra?: Record<string, string>) {
    return this.request('GET', path, undefined, extra)
  }

  post(path: string, form: Record<string, string>, extra?: Record<string, string>) {
    return this.request('POST', path, form, extra)
  }

  /** The CSRF token rendered into a page's forms. */
  static csrf(html: string): string {
    const m = html.match(/name="csrf" value="([^"]+)"/)
    if (!m) throw new Error('no csrf field in page')
    return m[1]
  }
}
