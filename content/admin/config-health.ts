import 'server-only'

/**
 * The one live measurement in the admin panel: a read of the mobile app's
 * production configuration endpoint.
 *
 * This matters because the app pins no artifact versions. It uses whatever
 * /config names, so this response, not anything in a repository, is what
 * actually determines which clinical artifacts every installed app loads.
 *
 * Controls, all deliberate:
 *   - Server side only. `server-only` makes importing this from a client
 *     component a build error.
 *   - 2.5 second timeout, hard, via AbortController.
 *   - Memoised for five minutes per server instance, so a page render never
 *     triggers a request and a reload does not hammer the endpoint.
 *   - No credentials, no cookies, no custom headers. It is a public endpoint
 *     and is read exactly as an app would read it.
 *   - Every failure returns an unavailable result with the reason. A probe
 *     that could not connect is reported as a failed probe, never as a
 *     production outage: the failure may well be at this end.
 *   - The response body is hashed and its version fields read. Nothing else
 *     from it is retained, logged or rendered.
 */

/** Public production endpoint. No secret, no key, no header. */
const CONFIG_URL = 'https://api.wellapath.org/config'

const TIMEOUT_MS = 2_500
const TTL_MS = 5 * 60 * 1000

/**
 * The canonical hash recorded when the configuration was last reviewed.
 * Canonical means the JSON re-serialised with recursively sorted keys and
 * compact separators, so that a harmless re-serialisation by the backend does
 * not raise a false alarm while a real content change still does.
 */
const BASELINE_CANONICAL_SHA256 =
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
      /** Versions only. No URLs, no hashes of individual artifacts, no body. */
      artifacts: Record<string, string>
      integrity: 'match' | 'differs'
      observedAt: string
    }
  | {
      ok: false
      /** Why the probe did not produce a result. Never shown as an outage. */
      reason: 'timeout' | 'network' | 'status' | 'malformed'
      detail: string
      observedAt: string
    }

let memo: { at: number; value: ConfigHealth } | null = null

/** Recursively sorts object keys so the encoding is stable. */
function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise)
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(src).sort()) out[key] = canonicalise(src[key])
    return out
  }
  return value
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function probe(): Promise<ConfigHealth> {
  const observedAt = new Date().toISOString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(CONFIG_URL, {
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'error',
      headers: { accept: 'application/json' },
    })

    if (res.status !== 200) {
      return { ok: false, reason: 'status', detail: `HTTP ${res.status}`, observedAt }
    }

    const text = await res.text()
    const bytes = new TextEncoder().encode(text).length

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, reason: 'malformed', detail: 'Response is not JSON', observedAt }
    }

    const canonical = await sha256Hex(JSON.stringify(canonicalise(parsed)))

    const artifacts: Record<string, string> = {}
    const root = parsed as Record<string, unknown>
    const block = root?.artifacts
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

    return {
      ok: true,
      status: 200,
      bytes,
      artifacts,
      integrity: canonical === BASELINE_CANONICAL_SHA256 ? 'match' : 'differs',
      observedAt,
    }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      reason: aborted ? 'timeout' : 'network',
      detail: aborted ? `No response within ${TIMEOUT_MS} ms` : 'Could not reach the endpoint',
      observedAt,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Cached read. Safe to call from several components in one render. */
export async function getConfigHealth(): Promise<ConfigHealth> {
  const now = Date.now()
  if (memo && now - memo.at < TTL_MS) return memo.value
  const value = await probe()
  memo = { at: now, value }
  return value
}

/** Test seam for scripts/check-admin.mjs. Not used by any page. */
export function __resetConfigHealthCache(): void {
  memo = null
}
