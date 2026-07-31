/**
 * Header, footer, wordmark, capture form — Stripe's chrome, our violet.
 * All server-rendered. The mobile nav is <details>/<summary>: keyboard
 * operable and screen-reader announced with zero JavaScript.
 */
import Link from 'next/link'
import { MENU, NAV, FOOTER_GROUPS, EMERGENCY, SITE, DISCLAIMER } from '@/content/site'
import { Button } from './ui'
import { EmergencyCard } from './clinical'
import { Mail, ChevronDown } from 'lucide-react'

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

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ground">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-6 px-6 py-3 md:px-10">
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
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
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

        <details className="group relative lg:hidden">
          <summary className="flex min-h-12 min-w-12 cursor-pointer list-none items-center justify-center rounded-lg border border-rule px-4 text-body font-semibold text-ink [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 top-full mt-3 w-72 rounded-lg border border-rule bg-card p-3 shadow-lift">
            <nav aria-label="Main" className="flex max-h-[70vh] flex-col overflow-y-auto">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-safe flex min-h-12 items-center rounded-md px-3 text-body text-ink hover:bg-sunk"
                >
                  {item.label}
                </Link>
              ))}
              {MENU.filter((m) => m.columns).map((m) => (
                <div key={m.title} className="mt-3 border-t border-rule pt-3">
                  <p className="text-eyebrow px-3 font-mono uppercase text-ink-mute">{m.title}</p>
                  {m.columns?.flatMap((c) => c.links).map((l) => (
                    <Link
                      key={l.href + l.label}
                      href={l.href}
                      className="transition-safe flex min-h-12 items-center rounded-md px-3 text-body text-ink-soft hover:bg-sunk hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="mt-3 border-t border-rule pt-3">
                <Button href="/#get-the-app" full>
                  Get the app
                </Button>
              </div>
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

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-sunk">
      <div className="rails relative mx-auto w-full max-w-[1080px] px-6 py-16 md:px-10">
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
            <Link href="/" className="inline-flex min-h-12 items-center">
              <Wordmark />
            </Link>
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

export function GetTheApp({ id = 'get-the-app' }: { id?: string }) {
  return (
    <div
      id={id}
      className="relative overflow-hidden rounded-xl bg-card p-8 ring ring-ink/8 md:p-10"
    >
      <div className="aurora-soft" aria-hidden="true" />
      <div className="relative z-1">
        <h2 className="text-h2 font-bold text-ink">
          Get the app.
          <span className="font-normal text-ink-soft"> It is free, and no account is needed.</span>
        </h2>
        <p className="text-body measure mt-4 text-ink-soft">
          WellaPath is coming to Android and iPhone. Leave your email and we will tell you once, on the day it is live. Nothing else,
          ever.
        </p>

        <form action="/api/notify" method="POST" className="relative mt-8 max-w-md">
          {/* Honeypot. Hidden from people and from screen readers, so anything
              that fills it is a bot. `hidden` alone would be skipped by some
              bots, hence the off-screen positioning as well. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor={`${id}-company`}>Company</label>
            <input id={`${id}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <label htmlFor={`${id}-email`} className="text-body block font-semibold text-ink">
            Email address
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-2 min-h-12 w-full rounded-md bg-card px-4 text-body text-ink ring ring-field-border placeholder:text-ink-mute focus:ring-2 focus:ring-accent-ink"
          />
          <div className="mt-4">
            <Button type="submit" full icon={Mail}>
              Notify me at launch
            </Button>
          </div>
          <p className="text-small mt-4 text-ink-mute">
            One email, at launch. We do not sell or share your address, and we delete the list 30
            days after. See our{' '}
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
