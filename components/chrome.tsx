/**
 * Header, footer, wordmark, capture form — Stripe's chrome, our violet.
 * All server-rendered. The mobile nav is <details>/<summary>: keyboard
 * operable and screen-reader announced with zero JavaScript.
 */
import Link from 'next/link'
import { MENU, FOOTER_GROUPS, EMERGENCY, SITE, DISCLAIMER, SOCIALS } from '@/content/site'
import { LAUNCHED } from '@/content/launch'
import { Button } from './ui'
import { EmergencyCard } from './clinical'
import { BellRing, ChevronDown, X, Phone } from 'lucide-react'

/* ── Wordmark ─────────────────────────────────────────────────────────────
   From the app splash: lowercase "wellapath" with the tick. Drawn as SVG so
   it stays sharp and inherits currentColor.
   ───────────────────────────────────────────────────────────────────────── */

export function Wordmark({
  className = '',
  height = 26,
}: {
  className?: string
  height?: number
}) {
  // The supplied artwork, not a redraw. The letterforms are a custom typeface
  // and cannot be reproduced faithfully in markup; the earlier hand-drawn
  // version was an approximation and is gone.
  // A plain <img>, not next/image.
  //
  // The logo is a fixed-size static asset above the fold: there is no
  // responsive srcset to pick, nothing to lazy-load, and no runtime resizing to
  // do. next/image bought none of that and cost ~5 KB of client JS, pushing
  // First Load to the edge of the 120 KB budget. It also pulls `sharp` into the
  // server bundle, which is where the outstanding libvips advisory lives.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/wordmark.webp"
      alt={SITE.name}
      width={Math.round((618 / 120) * height)}
      height={height}
      fetchPriority="high"
      decoding="async"
      className={className}
    />
  )
}

/** The symbol alone, for tight spaces. Same artwork as the favicon. */
export function TickMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/symbol.png" alt="" width={40} height={40} className={className} aria-hidden />
  )
}

/* ── Header ─────────────────────────────────────────────────────────────── */

/**
 * Destinations the mobile sheet already surfaces outside the grouped lists:
 * MENU's own top-level rows, plus the "Get the app" button pinned at the
 * bottom. Filtering the groups against this is what keeps one scrolling list
 * from showing the same page twice.
 */
const SHORTCUT_HREFS = new Set([
  ...MENU.filter((m) => m.href).map((m) => m.href!),
  '/#get-the-app',
])

/**
 * Before launch the nav would be a menu of redirects: every destination in
 * MENU is closed, and offering twenty-three links that all land back on the
 * waitlist is worse than offering none. So the header is the wordmark and the
 * one action the page has.
 */
function WaitlistHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-5 py-3 sm:px-6 md:px-10">
        <Link href="/" className="flex min-h-12 shrink-0 items-center" aria-label={SITE.name}>
          <Wordmark className="brightness-0 invert" />
        </Link>
        <Button href="#get-the-app" variant="onNavy" showIcon={false}>
          <span className="whitespace-nowrap">Join waitlist</span>
        </Button>
      </div>
    </header>
  )
}

export function SiteHeader() {
  if (!LAUNCHED) return <WaitlistHeader />

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ground">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-5 py-3 sm:gap-6 sm:px-6 md:px-10">
        <Link
          href="/"
          className="flex min-h-12 shrink-0 items-center"
          aria-label={`${SITE.name} home`}
        >
          <Wordmark />
        </Link>

        {/* ── Desktop navigation ────────────────────────────────────────
            Panels are <details>, so they open on click, are keyboard operable
            and screen-reader announced with **no JavaScript at all**. Every
            page on the site is reachable from here; before this, /privacy,
            /about, /partners and the four /for/* pages existed only in the
            footer.
            ─────────────────────────────────────────────────────────────── */}
        <nav aria-label="Main" className="hidden items-center gap-1 nav:flex">
          {MENU.map((item) =>
            item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="transition-safe flex min-h-12 items-center whitespace-nowrap rounded-md px-3 text-small font-medium text-ink-soft hover:bg-sunk hover:text-ink"
              >
                {item.title}
              </Link>
            ) : (
              <div key={item.title} className="menu group static">
                {/* Hover to open, focus to open for keyboard. Not <details>:
                    that needs a click, and the reference opens on hover.
                    `aria-expanded` is driven by CSS state, so the button still
                    reads correctly to assistive tech without any JavaScript. */}
                <button
                  type="button"
                  className="transition-safe flex min-h-12 cursor-default items-center gap-1 whitespace-nowrap rounded-md px-3 text-small font-medium text-ink-soft group-hover:bg-sunk group-hover:text-ink group-has-[:focus-visible]:bg-sunk group-has-[:focus-visible]:text-ink"
                >
                  {item.title}
                  <ChevronDown
                    className="menu-chev size-3.5"
                    aria-hidden="true"
                  />
                </button>

                <div className="menu-panel absolute left-0 right-0 top-full z-50 border-t border-rule bg-card shadow-raise">
                  <div className="mx-auto grid w-full max-w-[1120px] gap-x-10 px-6 py-10 md:grid-cols-3 md:px-10">
                    {item.columns?.map((col, ci) => (
                      <div
                        key={col.heading}
                        className={ci > 0 ? 'md:border-l md:border-dotted md:border-rule md:pl-10' : ''}
                      >
                        <h2 className="text-eyebrow font-mono uppercase text-ink-mute">
                          {col.heading}
                        </h2>
                        <ul className="mt-4 space-y-0.5">
                          {col.links.map((l) => (
                            <li key={l.href + l.label}>
                              <Link
                                href={l.href}
                                className="transition-safe block rounded-md px-3 py-2.5 hover:bg-sunk"
                              >
                                <span className="text-body block font-semibold text-ink">
                                  {l.label}
                                </span>
                                {l.note && (
                                  <span className="text-small block text-ink-mute">{l.note}</span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          )}
          <div className="ml-2">
            <Button href="/#get-the-app" showIcon={false}>
              <span className="whitespace-nowrap">Get the app</span>
            </Button>
          </div>
        </nav>

        {/* ── Mobile navigation ─────────────────────────────────────────
            A full-width sheet, not a floating dropdown. The old panel was
            288px wide holding 1,225px of links inside a 572px box: it scrolled
            internally with no affordance, left a stray strip of hero showing
            beside it at 360px, and repeated five destinations because the flat
            NAV list and the mega-menu columns overlap. Twenty-three entries do
            not fit in a dropdown, and pretending otherwise is what made it
            feel unfinished on a phone.

            So: it fills the width, takes the viewport below the header, keeps
            the mega-menu's own groupings rather than flattening them, and
            scrolls in one place. Still <details>/<summary>, so it stays
            keyboard operable and screen-reader announced with no JavaScript.

            The panel is positioned against the <header>, which is sticky and
            therefore the containing block, so `top-full` sits it exactly under
            the bar and `100% ` in the height resolves to the bar's own height.
            100dvh, not 100vh, because a mobile URL bar collapses on scroll and
            vh would leave the last link under it. */}
        <details className="group nav:hidden [&_summary::-webkit-details-marker]:hidden">
          <summary
            className="flex min-h-12 min-w-12 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-rule px-4 text-body font-semibold text-ink transition-safe group-open:border-ink group-open:bg-ink group-open:text-white"
            aria-label="Main menu"
          >
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
            <X className="hidden size-4 group-open:block" aria-hidden="true" />
          </summary>

          <div className="absolute inset-x-0 top-full h-[calc(100dvh-100%)] overflow-y-auto overscroll-contain border-t border-rule bg-ground">
            <nav aria-label="Main" className="mx-auto w-full max-w-[1080px] px-5 pb-10 pt-2 sm:px-6">
              {/* Shortcuts first, then the grouped detail.
                  MENU carries /conditions, /coverage and /about twice on
                  purpose: once as a top-level shortcut, once inside the
                  relevant mega-menu column. Two entry points read as two
                  routes to the same place when they sit side by side in a
                  panel, but as one repeated line in a single scrolling list,
                  so the sheet shows the shortcut and drops the later copy. */}
              {MENU.filter((m) => m.href).map((m) => (
                <Link
                  key={m.title}
                  href={m.href!}
                  className="transition-safe flex min-h-14 items-center border-b border-rule text-h3 font-semibold text-ink"
                >
                  {m.title}
                </Link>
              ))}

              {MENU.filter((m) => m.columns).map((item) => (
                <div key={item.title} className="border-b border-rule py-5">
                  <p className="text-eyebrow font-mono uppercase text-ink-mute">{item.title}</p>
                  {item.columns?.map((col) => {
                    const links = col.links.filter((l) => !SHORTCUT_HREFS.has(l.href))
                    if (links.length === 0) return null
                    return (
                      <div key={col.heading} className="mt-4">
                        <p className="text-small font-semibold text-ink">{col.heading}</p>
                        <ul className="mt-1">
                          {links.map((l) => (
                            <li key={l.href + l.label}>
                              {/* py-2 and the leading-tight note keep a row
                                  with a note the same visual weight as one
                                  without. Left to itself the two-line row read
                                  as cramped next to the single-line rows above
                                  it, which made the list look mis-set. */}
                              <Link
                                href={l.href}
                                className="transition-safe flex min-h-12 flex-col justify-center gap-0.5 py-2 text-ink-soft"
                              >
                                <span className="text-body leading-snug">{l.label}</span>
                                {l.note && (
                                  <span className="text-small leading-snug text-ink-mute">
                                    {l.note}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              ))}

              <div className="mt-6">
                <Button href="/#get-the-app" full>
                  Get the app
                </Button>
              </div>

              {/* Emergency help is reachable from the footer of every page, and
                  §11 does not let the menu be the one surface that hides it. */}
              <a
                href={`tel:${EMERGENCY.national}`}
                className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-triage-crit text-body font-semibold text-triage-crit"
              >
                <Phone className="size-4" aria-hidden="true" />
                Emergency: call {EMERGENCY.national}
              </a>
            </nav>
          </div>
        </details>
      </div>
    </header>
  )
}

/* ── Footer ───────────────────────────────────────────────────────────────
   §11: every page footer carries how to reach emergency help — first, not
   last, and never styled as fine print. Then Stripe's ruled column grid.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * The pre-launch footer.
 *
 * Trimmed to what is reachable and what is required: the emergency card (§11
 * applies to a waitlist exactly as it applies to a condition page), privacy,
 * because the form links to it at the moment consent is given, and the three
 * official accounts, because the Organization schema lists them under `sameAs`
 * and a `sameAs` the site does not visibly link to is a claim with nothing
 * behind it. check-seo asserts that pairing on every route.
 *
 * The mock also had a "Terms & Support" link. There is no terms page to point
 * it at, so terms is not here rather than being a link to nothing. Support IS
 * here: /support exists, stays open before launch, and the store listings
 * require it to be reachable from the site's footer.
 */
function WaitlistFooter() {
  return (
    <footer className="border-t border-rule bg-sunk">
      <div className="rails relative mx-auto w-full max-w-[1080px] px-5 py-12 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="relative z-1">
          <EmergencyCard />

          <div className="mt-12 border-t border-rule pt-8">
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <Link href="/" className="inline-flex min-h-12 items-center">
                <Wordmark />
              </Link>

              {/* A real landmark, not decoration. These four links are the
                  only navigation the closed site has, and check-copy asserts
                  every page carries a <nav> for exactly that reason. */}
              <nav aria-label="Footer">
                <ul className="flex flex-wrap items-center gap-x-6">
                  <li>
                    <Link
                      href="/privacy"
                      className="transition-safe flex min-h-12 items-center text-small text-ink-soft hover:text-ink"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/support"
                      className="transition-safe flex min-h-12 items-center text-small text-ink-soft hover:text-ink"
                    >
                      Support
                    </Link>
                  </li>
                  {SOCIALS.map((s) => (
                    <li key={s.href}>
                      <a
                        href={s.href}
                        rel="me noopener noreferrer"
                        target="_blank"
                        className="transition-safe flex min-h-12 items-center text-small text-ink-soft hover:text-ink"
                      >
                        {s.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <p className="text-small measure-wide mt-4 text-ink-soft">
              {SITE.domain} · Built for Nigerians, by people who understand the gap between symptoms
              and care.
            </p>
            <p className="text-small measure-wide mt-4 text-ink-soft">{DISCLAIMER}</p>
            <p className="text-small mt-5 text-ink-mute">
              © {new Date().getFullYear()} {SITE.name}. Clinical decision support for Nigeria.
              Lagos, Kano and the FCT. Not yet national.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function SiteFooter() {
  if (!LAUNCHED) return <WaitlistFooter />

  return (
    <footer className="border-t border-rule bg-sunk">
      <div className="rails relative mx-auto w-full max-w-[1080px] px-5 py-12 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="relative z-1">
          <EmergencyCard />

          {/* Four columns with dotted rules between, as the reference does.
              Columns can carry a second stacked group, which is how a long
              site map fits without a fifth column. */}
          <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER_GROUPS.map((group, i) => (
              <div
                key={group.title}
                className={
                  i > 0 ? 'lg:border-l lg:border-dotted lg:border-rule lg:pl-10' : ''
                }
              >
                <nav aria-label={group.title}>
                  <h2 className="text-body font-bold text-ink">{group.title}</h2>
                  <ul className="mt-4">
                    {group.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="transition-safe flex min-h-12 items-center text-body text-ink-soft hover:text-accent-ink"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {'second' in group && group.second && (
                  <nav aria-label={group.second.title} className="mt-10">
                    <h2 className="text-body font-bold text-ink">{group.second.title}</h2>
                    <ul className="mt-4">
                      {group.second.links.map((l) => (
                        <li key={l.href + l.label}>
                          <Link
                            href={l.href}
                            className="transition-safe flex min-h-12 items-center text-body text-ink-soft hover:text-accent-ink"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 border-t border-rule pt-8">
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <Link href="/" className="inline-flex min-h-12 items-center">
                <Wordmark />
              </Link>

              {/* The same array the Organization schema uses for sameAs. A
                  sameAs the site does not visibly link to is a claim with
                  nothing behind it, and people look for these in a footer. */}
              <ul className="flex flex-wrap items-center gap-x-6">
                {SOCIALS.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      rel="me noopener noreferrer"
                      target="_blank"
                      className="transition-safe flex min-h-12 items-center text-small text-ink-soft hover:text-ink"
                    >
                      {s.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-small measure-wide mt-4 text-ink-soft">{DISCLAIMER}</p>
            <p className="text-small mt-5 text-ink-mute">
              © {new Date().getFullYear()} {SITE.name}. Clinical decision support for Nigeria.
              Lagos, Kano and the FCT. Not yet national.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── Capture ──────────────────────────────────────────────────────────────
   The primary conversion. No popup, no countdown, no pre-checked consent
   (§8.1). Label above the field and always visible (§8.3).
   ───────────────────────────────────────────────────────────────────────── */

/**
 * The wording is a prop, the form is not.
 *
 * The waitlist page needs this to say "join the waitlist" rather than "get the
 * app", and that is the entire difference. Copying the form to change four
 * sentences would give the site two capture forms posting to one endpoint, two
 * sets of field ids, and two places to get the NDPR line wrong. The defaults
 * are the launch-day wording, so every existing caller is unchanged.
 */
export function GetTheApp({
  id = 'get-the-app',
  heading = 'Get the app.',
  headingRest = 'It is free, and no account is needed.',
  intro = 'WellaPath is coming to Android and iPhone. Leave an email address or a WhatsApp number and we will tell you once, on the day it is live. Nothing else, ever.',
  promise = 'One message, at launch.',
  submitLabel = 'Notify me at launch',
}: {
  id?: string
  heading?: string
  headingRest?: string
  intro?: string
  promise?: string
  submitLabel?: string
}) {
  return (
    <div
      id={id}
      className="relative overflow-hidden rounded-xl bg-card p-8 ring ring-ink/8 md:p-10"
    >
      <div className="aurora-soft" aria-hidden="true" />
      <div className="relative z-1">
        <h2 className="text-h2 font-bold text-ink">
          {heading}
          <span className="font-normal text-ink-soft"> {headingRest}</span>
        </h2>
        <p className="text-body measure mt-4 text-ink-soft">{intro}</p>

        <form action="/api/notify" method="POST" className="relative mt-8 max-w-md">
          {/* Honeypot. Hidden from people and from screen readers, so anything
              that fills it is a bot. `hidden` alone would be skipped by some
              bots, hence the off-screen positioning as well. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor={`${id}-company`}>Company</label>
            <input id={`${id}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="source" value={id} />

          {/* Neither field is `required`, and that is the point. Requiring the
              email would undo the reason WhatsApp is here: it reaches people
              email does not. The server insists on one of the two, so the rule
              still holds with JavaScript off. */}
          <label htmlFor={`${id}-email`} className="text-body block font-semibold text-ink">
            Email address
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-2 min-h-12 w-full rounded-md bg-card px-4 text-body text-ink ring ring-field-border placeholder:text-ink-mute focus:ring-2 focus:ring-accent-ink"
          />

          <div
            className="my-5 flex items-center gap-4 text-small text-ink-mute"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-rule" />
            or
            <span className="h-px flex-1 bg-rule" />
          </div>

          <label htmlFor={`${id}-whatsapp`} className="text-body block font-semibold text-ink">
            WhatsApp number
          </label>
          <input
            id={`${id}-whatsapp`}
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 123 4567"
            aria-describedby={`${id}-whatsapp-help`}
            className="mt-2 min-h-12 w-full rounded-md bg-card px-4 text-body text-ink ring ring-field-border placeholder:text-ink-mute focus:ring-2 focus:ring-accent-ink"
          />
          <p id={`${id}-whatsapp-help`} className="text-small mt-2 text-ink-mute">
            Any country. Nigerian numbers work in any format; from elsewhere, start with your
            country code, like +44 or +1.
          </p>

          <div className="mt-6">
            <Button type="submit" full icon={BellRing}>
              {submitLabel}
            </Button>
          </div>
          <p className="text-small mt-4 text-ink-mute">
            {promise} Either field on its own is enough. We do not sell or share your details, and
            we delete the list 30 days after. See our{' '}
            <Link href="/privacy" className="text-accent-ink underline underline-offset-2">
              privacy page
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  )
}
