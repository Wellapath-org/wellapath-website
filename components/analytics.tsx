'use client'

/**
 * Google Analytics, opt-in, and never on a condition page.
 *
 * ── The two promises this code exists to keep ─────────────────────────────
 *
 * /privacy says analytics here will be "genuinely opt-in and never
 * pre-checked", and that it "will never run on a condition page. Condition-page
 * browsing is the most sensitive category of data on this site and we will not
 * send it to a third party."
 *
 * Both are enforced here rather than promised:
 *
 *   1. The gtag script is not in the page until someone has actively chosen
 *      Accept. Not consent-mode-denied, not loaded-and-throttled: absent.
 *      Declining, ignoring the banner, or browsing with JavaScript off all
 *      leave zero requests to Google.
 *
 *   2. Nothing under /conditions is loaded on, or reported to, Google. The
 *      banner does not even appear there, because asking for analytics consent
 *      on the page that reveals what someone is worried about is the wrong
 *      moment to ask.
 *
 * ── The honest limit ──────────────────────────────────────────────────────
 *
 * gtag cannot be unloaded once injected. If a visitor accepts on a marketing
 * page and then follows a link to a condition guide, the script is still in
 * memory. What this code guarantees is that no condition URL is ever SENT:
 * `send_page_view` is false and every page_view is issued by hand, only for
 * allowed paths. Arriving directly on a condition page loads nothing at all.
 * The wording on /privacy says exactly this and no more.
 *
 * ── Why localStorage and not a cookie ─────────────────────────────────────
 *
 * The record of the choice would otherwise be the one cookie set before any
 * consent existed, which is the thing being asked about. localStorage is
 * first-party, is never transmitted, and is readable only by this origin.
 */
import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const GA_ID = 'G-YT2G413V4Z'
const KEY = 'wellapath.analytics-consent'

type Consent = 'granted' | 'denied' | 'unset'

/**
 * Paths that are never reported.
 *
 * /conditions covers the guides AND the listing: the filter URLs the navigation
 * links to (?urgency=emergency) say as much about a visitor as a guide does.
 * /admin holds real contact details. /notify is a form result.
 */
function isReportable(pathname: string) {
  return (
    !pathname.startsWith('/conditions') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/notify')
  )
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : 'unset'
  } catch {
    // Private mode, or storage disabled. Treat as undecided, never as granted.
    return 'unset'
  }
}

let injected = false

function injectGtag() {
  if (injected || document.getElementById('ga-src')) return
  injected = true

  window.dataLayer = window.dataLayer || []
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted', // only ever reached after an explicit Accept
  })
  // send_page_view false: page views are issued by hand below, so a condition
  // URL cannot be reported by the automatic one firing on a client navigation.
  gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })

  const s = document.createElement('script')
  s.id = 'ga-src'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

export function Analytics() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<Consent>('unset')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setConsent(readConsent())
    setReady(true)
    // Re-render the banner if the choice is reset from /privacy in another tab
    // or by the reset control below.
    const onChange = () => setConsent(readConsent())
    window.addEventListener('wellapath:consent', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('wellapath:consent', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const reportable = isReportable(pathname)

  useEffect(() => {
    if (consent !== 'granted') return
    if (!reportable) return
    injectGtag()
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.origin + pathname,
      page_title: document.title,
    })
  }, [consent, pathname, reportable])

  const choose = useCallback((value: 'granted' | 'denied') => {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* storage blocked; the choice holds for this page view only */
    }
    setConsent(value)
  }, [])

  // Nothing renders until the stored choice is known, so the banner cannot
  // flash on a page belonging to someone who already answered.
  if (!ready || consent !== 'unset' || !reportable) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-100 border-t border-rule bg-card shadow-raise"
    >
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="min-w-0">
          <p id="consent-title" className="text-body font-semibold text-ink">
            Can we count this visit?
          </p>
          <p className="text-small measure-wide mt-1 text-ink-soft">
            Only if you say yes. We never count visits to condition pages, whatever you choose
            here, and the symptom assessment never leaves your phone either way. See our{' '}
            <a href="/privacy" className="text-accent-ink underline underline-offset-2">
              privacy page
            </a>
            .
          </p>
        </div>

        {/* Decline is a real button of equal weight, not a dismissed link. A
            pre-selected or visually louder Accept is the pattern /privacy
            promises this site will not use. */}
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="transition-safe flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-card px-5 text-body font-semibold text-ink ring ring-ink/12 hover:bg-sunk md:flex-none"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="transition-safe flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-card px-5 text-body font-semibold text-ink ring ring-ink/12 hover:bg-sunk md:flex-none"
          >
            Yes, count it
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The withdrawal control, placed on /privacy.
 *
 * The NDPR basis is consent, and consent that cannot be withdrawn is not
 * consent. This states the current choice in words rather than a toggle
 * position, because a toggle alone leaves people guessing which way is on.
 */
export function AnalyticsChoice() {
  const [consent, setConsent] = useState<Consent>('unset')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setConsent(readConsent())
    setReady(true)
  }, [])

  const set = (value: Consent) => {
    try {
      if (value === 'unset') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, value)
    } catch {
      /* storage blocked */
    }
    setConsent(value)
    window.dispatchEvent(new Event('wellapath:consent'))
  }

  if (!ready) {
    return (
      <p className="text-body text-ink-soft">Checking your current choice…</p>
    )
  }

  const said = {
    granted: 'You have allowed us to count your visits to marketing pages.',
    denied: 'You have asked us not to count your visits. Nothing is being sent.',
    unset: 'You have not been asked yet, or you have cleared your choice. Nothing is being sent.',
  }[consent]

  return (
    <div className="rounded-lg bg-sunk p-6">
      <p className="text-body font-semibold text-ink">Your analytics choice</p>
      <p className="text-body mt-2 text-ink-soft">{said}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => set(consent === 'granted' ? 'denied' : 'granted')}
          className="transition-safe flex min-h-12 items-center justify-center rounded-lg bg-card px-5 text-body font-semibold text-ink ring ring-ink/12 hover:bg-sunk"
        >
          {consent === 'granted' ? 'Stop counting my visits' : 'Allow counting my visits'}
        </button>
        {consent !== 'unset' && (
          <button
            type="button"
            onClick={() => set('unset')}
            className="transition-safe flex min-h-12 items-center justify-center rounded-lg px-5 text-body font-semibold text-accent-ink hover:bg-accent-wash"
          >
            Clear my choice
          </button>
        )}
      </div>
      <p className="text-small mt-4 text-ink-mute">
        Turning it off stops any further data being sent from this browser. To remove data already
        collected, use the data request contact above.
      </p>
    </div>
  )
}
