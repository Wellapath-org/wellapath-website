/**
 * The pure half of the production configuration check.
 *
 * Deliberately separate from `config-health.ts`, which carries `server-only`
 * and therefore cannot be imported by a test at all. Everything here is a
 * function of its arguments: no network, no clock, no environment. That makes
 * the part most worth testing — what happens when the endpoint misbehaves —
 * actually testable, which it was not when it lived inside the fetch.
 */

/** Public production endpoint. No secret, no key, no header. */
export const CONFIG_URL = 'https://api.wellapath.org/config'

export const TIMEOUT_MS = 2_500
export const TTL_MS = 5 * 60 * 1000

/**
 * The canonical hash recorded when the configuration was last reviewed.
 * Canonical means the JSON re-serialised with recursively sorted keys and
 * compact separators, so a harmless re-serialisation by the backend does not
 * raise a false alarm while a real content change still does.
 */
export const BASELINE_CANONICAL_SHA256 =
  '3b2bbb1cec6b25631bcf499902314c22c19cbab33fe7fcfae0c6288a4f8578ed'

/** The artifact versions the configuration is expected to name. */
export const EXPECTED_ARTIFACTS: Readonly<Record<string, string>> = {
  token_dictionary: '1.1',
  knowledge_base: '2.4',
  rules: '2.2',
  facilities: '1.1',
}

export type ConfigHealth =
  | {
      ok: true
      status: number
      bytes: number
      /** Versions only. No URLs, no per-artifact hashes, no payload. */
      artifacts: Record<string, string>
      integrity: 'match' | 'differs'
      observedAt: string
    }
  | {
      ok: false
      /** Why there is no result. Never presented as an outage. */
      reason: 'timeout' | 'network' | 'status' | 'malformed'
      detail: string
      observedAt: string
    }

/** Recursively sorts object keys so the encoding is stable. */
export function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise)
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(src).sort()) out[key] = canonicalise(src[key])
    return out
  }
  return value
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalise(value))
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Turns a raw response into a result.
 *
 * Every path that is not a well-formed 200 returns `ok: false` with a reason.
 * There is no path that returns a partial success, and none that invents a
 * version it did not read.
 */
export async function interpretResponse(
  status: number,
  text: string,
  observedAt: string,
  baseline: string = BASELINE_CANONICAL_SHA256,
): Promise<ConfigHealth> {
  if (status !== 200) {
    return { ok: false, reason: 'status', detail: `HTTP ${status}`, observedAt }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'malformed', detail: 'Response is not JSON', observedAt }
  }

  const artifacts: Record<string, string> = {}
  const block = (parsed as Record<string, unknown> | null)?.artifacts
  if (block && typeof block === 'object') {
    for (const [name, entry] of Object.entries(block as Record<string, unknown>)) {
      const version = (entry as Record<string, unknown>)?.version
      if (typeof version === 'string') artifacts[name] = version
    }
  }

  if (Object.keys(artifacts).length === 0) {
    return {
      ok: false,
      reason: 'malformed',
      detail: 'No artifact versions in the response',
      observedAt,
    }
  }

  const canonical = await sha256Hex(canonicalJson(parsed))

  return {
    ok: true,
    status: 200,
    bytes: new TextEncoder().encode(text).length,
    artifacts,
    integrity: canonical === baseline ? 'match' : 'differs',
    observedAt,
  }
}

/** Whether the served versions are the ones that were reviewed. */
export function matchesExpected(artifacts: Record<string, string>): boolean {
  return Object.entries(EXPECTED_ARTIFACTS).every(
    ([name, version]) => artifacts[name] === version,
  )
}
