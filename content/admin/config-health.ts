import 'server-only'

/**
 * The one live measurement in the admin panel: a read of the mobile app's
 * production configuration endpoint.
 *
 * This matters because the app pins no artifact versions. It uses whatever
 * /config names, so this response, not anything in a repository, is what
 * actually determines which clinical artifacts every installed app loads.
 *
 * This module is the side-effecting half only: fetch, timeout, memo. All the
 * interpretation lives in `config-probe.ts`, which has no `server-only` and is
 * therefore testable. `server-only` here is not decoration — importing this
 * from a client component is a build error, which is how the server-side-only
 * requirement is enforced rather than merely intended.
 *
 * Controls:
 *   - 2.5 second timeout, hard, via AbortController.
 *   - Memoised for five minutes per server instance, so a page render never
 *     triggers a request and a reload does not hammer the endpoint.
 *   - No credentials, no cookies, no custom headers beyond Accept. It is a
 *     public endpoint read exactly as an app would read it.
 *   - Every failure returns an unavailable result carrying its reason. A probe
 *     that could not connect is reported as a failed probe, never as a
 *     production outage: the failure may well be at this end.
 *   - The body is hashed and its version fields read. Nothing else from it is
 *     retained, logged or rendered.
 */
import {
  CONFIG_URL,
  TIMEOUT_MS,
  TTL_MS,
  interpretResponse,
  type ConfigHealth,
} from './config-probe'

export {
  EXPECTED_ARTIFACTS,
  matchesExpected,
  type ConfigHealth,
} from './config-probe'

let memo: { at: number; value: ConfigHealth } | null = null

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
    return await interpretResponse(res.status, await res.text(), observedAt)
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
