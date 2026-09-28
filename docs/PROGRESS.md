# Progress

Where the build actually stands, as of **12 September 2026**.

`PLAN.md` is the plan and does not change much. This file is the status, and changes every time
something ships. If the two disagree, this one is right about what exists and `PLAN.md` is right
about what was intended.

---

## In one line

The site is **feature-complete and deployed, but closed**: `wellapath.org` is a waitlist until the
app ships, and every route except the front door, `/privacy` and `/support` redirects back to it.
Those two stay open because Google Play and TestFlight review point at them. What still stands
between the full site and launch is not code: 36 of 48 danger-sign labels have no clinician's
signature, and the build refuses to complete without one.

---

## Phases

Against the build order in `PLAN.md` §5.

| Phase | State | Note |
|---|---|---|
| 1. Foundation | **Done** | Tokens, fonts, layout, nav, footer, buttons |
| 2. Content layer | **Done** | `sync:kb`, typed loaders, urgency mapping, draft red-flag labels |
| 3. Components | **Done** | The `DESIGN.md` §4 inventory |
| 4. Home | **Done** | Real figures throughout, capture form wired to a real store |
| 5. Depth | **Done** | `/how-it-works`, `/clinical-safety`, `/privacy`, `/about`, `/partners` |
| 6. Conditions | **Done** | Index + 50 pages + schema + sitemap. The SEO engine is wired |
| 7. Find care | **Changed scope** | Became `/coverage`, a proof page. The live directory is the app's job, not the website's. See the note in `app/coverage/page.tsx` |
| 8. Hardening | **Mostly done** | Copy, layout, a11y, SEO and consent all run as CI checks. Not yet run on a real Android over 3G |

Added since the plan was written, because they were asked for rather than foreseen: the four
`/for/*` segment pages, the WhatsApp signup channel, the `/admin/signups` dashboard, the
analytics consent layer, the pre-launch waitlist mode, and (for the Play/TestFlight
internal-testing review) `/support` plus a privacy policy expanded to cover the app's location
permission, crash reporting, third parties, children and deletion, with an effective date and
`support@wellapath.org` as the contact.

---

## What is live in the repo

13 page templates producing **65 pages**: 11 fixed routes, 50 condition guides and 4 segment
pages, the last two generated from data. 63 of them are indexable and in the sitemap once
launched; `/admin/signups` and `/notify/thanks` are deliberately not.

All of it currently sits behind the launch switch. `LAUNCHED` unset means the front door is a
waitlist, the sitemap lists one URL, and every route outside the allowlist in
`content/launch.ts` (`/`, `/privacy`, `/support`, the signup path, `/admin`) 307s back to `/`.
Setting `LAUNCHED=true` in Vercel and redeploying opens the full site; that is the whole launch
operation. The default is closed, which is the safe direction for the mistake of a missing
variable.

### Store testing

Internal testing on Google Play and Apple TestFlight is being set up against the closed site.
PR #1 (merged 12 September) added `/support` and rewrote `/privacy` for store review, with the
app's data practices confirmed by the team before merge. Both URLs were verified after deploy:
public, HTTPS, no sign-in, no redirect. The Play Console gets
`https://wellapath.org/privacy` as the privacy policy URL and `support@wellapath.org` as the
support email.

| Area | State |
|---|---|
| Marketing pages | `/`, `/how-it-works`, `/coverage`, `/clinical-safety`, `/about`, `/partners`, `/privacy`, `/support` (only the front door, `/privacy` and `/support` answer while closed) |
| Segment pages | `/for/households`, `/for/health-facilities`, `/for/clinicians`, `/for/public-health` |
| Conditions | `/conditions` + 50 guides, filterable by urgency and season without JavaScript |
| Signup | Email **or** WhatsApp, either alone. Postgres is the source of truth, Resend is the mail copy |
| Admin | `/admin/signups` behind HTTP Basic, noindex, never cached |
| Share cards | 1200x630, generated at build. One per condition, carrying its urgency |
| Analytics | GA4, opt-in, never on a condition page |

---

## Measured, not estimated

Re-measured on the built site on 2 August 2026, except `/support` (113 kB first load, within
budget) and the sitemap counts, measured 12 September.

| | Figure | Budget |
|---|---|---|
| First Load JS, home | **116 kB** | 120 kB |
| First Load JS, shared | 103 kB | — |
| Heaviest route | `/how-it-works`, 115 kB | 120 kB |
| Home page height @360px | 16,705 px | was 18,162 |
| Home page height @820px | 11,358 px | was 13,403 |
| Sitemap | 63 URLs launched, 1 while closed | every indexable route |

111 kB of the 116 kB is React and the Next runtime. Our own code is under a kilobyte per route.

---

## The checks

`npm run check` runs all five against a built server on `:3737`. All five pass, in both modes.

The suite is launch-aware: while the site is closed it checks only the routes that answer (70
checks over 5 routes) and prints that it did, so a green run never claims more than it verified.
The full run needs `LAUNCHED=true npm run build && LAUNCHED=true npm run check`.

| Check | Asserts |
|---|---|
| `check:phone` | 13 written forms of one Nigerian number normalise identically; 6 international numbers (+44, +1, 00…) accepted; 12 invalid ones refused |
| `check:copy` | 252 checks over 18 routes (launched): banned words, the disclaimer, 112, one h1, landmarks, alt text, no em-dashes |
| `check:layout` | Overflow, 48px targets, font floors, focus, 200% zoom, reduced motion at 320/360/390/430/768/820, plus the mobile menu at each |
| `check:seo` | Canonical, title and description length, share card, one h1, schema parses, sitemap completeness, `sameAs` matches the footer |
| `check:analytics` | Nothing reaches Google before consent, nothing from a condition page ever, banner buttons of equal weight |

`npm run check:resend` is separate: it is a setup preflight, not a CI gate.

Each of these exists because something was found wrong, not because a checklist listed it. The
notes at the top of each script say which.

---

## Blocking launch

### 1. The danger-sign labels — the only one that could hurt someone

**36 of 48 unreviewed.** These are the sentences at the top of every condition page telling a reader
what means go now. `npm run build` fails while any is `reviewed: false`; deploys currently pass
`ALLOW_UNREVIEWED_RED_FLAGS=true`, which is a preview switch and not a launch position.

Needs: a named clinician to read `content/red-flag-labels.ts` and sign off. Nothing else unblocks
`/clinical-safety`'s authorship signal either.

### 2. Environment variables on Vercel

Set, then redeploy — Vercel only applies variables to deployments created after they are added.
States below were last verified 3 August, except `LAUNCHED`.

| Variable | State |
|---|---|
| `DATABASE_URL` | **Set.** Verified present for Production and Preview on 2026-09-28, with the Neon integration attached and available. The admin panel's derived signup-storage fact is the source of truth for this, not this table |
| `RESEND_API_KEY` | Held locally, needs setting in Vercel |
| `RESEND_AUDIENCE_ID` | `c838d74a-bfca-47da-b936-ae3435c97292` |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Gate `/admin/signups`. Missing means the route denies everything, which is the safe failure |
| `ALLOW_UNREVIEWED_RED_FLAGS` | `true` while item 1 is open |
| `LAUNCHED` | **Unset, deliberately.** The site stays a waitlist until it is `true`; setting it and redeploying is the whole launch operation |

### 3. Not yet done

- **Google Search Console.** Verify the domain and submit `sitemap.xml`. None of the SEO work is
  measurable until this exists, and it is the only way to see how the 50 condition pages perform,
  since analytics deliberately never runs on them.
- **A real Android over 3G.** Everything is measured in a headless Chrome on a laptop.
- **Screen-reader pass on the emergency path**, which `PLAN.md` §5 phase 8 asks for by name.

---

## Open questions

Carried from `PLAN.md` §7, with what has since been settled.

**Still open:**

1. **Who clinically reviews the knowledge base, and may we name them?** Item 1 above. The single
   highest-value unblock by a distance.
2. **Is `self_care` a fourth urgency state or a synonym for non-urgent?** One line in
   `content/urgency.ts`, but it changes the published "3 urgency levels" receipt.
3. **Confirm 112 per state.** The app publishes 112 and the site matches, so this is verification
   rather than a blocker. Lagos runs its own line.
4. **A named data protection contact.** `/privacy` now publishes `support@wellapath.org` as the
   contact for data requests, which satisfies the store-review requirement, but the promise of a
   *named* person before public launch stands, and the Organization schema still has no
   `contactPoint` until there is one.
5. **Should the launch signup send a confirmation email?** Double opt-in is a stronger NDPR
   position, but the copy currently reads "One email, at launch. Nothing else, ever." The copy would
   have to change first.

**Settled since:**

- *Where should the capture form POST?* — `/api/notify`, which exists. It takes an email address or
  a WhatsApp number, either alone.
- *Is `/partners` in scope?* — yes, it ships, and it is reachable from the navigation.
- *Which emergency number?* — 112, matching the app.
- *Is there brand identity beyond the violet?* — yes. The real logo files are in `public/brand/`;
  the earlier hand-drawn SVG is gone.
- *Cookie banner?* — `PLAN.md` §5 lists one as deliberately out of scope, on the grounds that there
  were no cookies to consent to. That changed when GA4 was added on 2 August. The banner exists,
  it is opt-in, and it appears only where analytics may run.
- *What may the privacy policy claim about the app?* — confirmed by the team on 12 September:
  facility sorting by distance happens on-device and precise location is never transmitted; the
  assessment works with location permission declined; there is no account or sign-in, so
  uninstalling removes everything the app stored. Sentry ships as a dependency but disabled: no
  DSN, telemetry off, nothing sent. The policy says exactly that, and must be updated before
  Sentry is ever activated. Do not claim the app ships without Sentry.
- *Support contact and response time* — `support@wellapath.org` is approved as the privacy and
  support contact. It is not a named Data Protection Officer and must not be described as one
  until someone is formally appointed. The published line is "we aim to respond within two
  working days", deliberately an aim rather than a guarantee.

---

## The admin panel

`/admin` is now a small panel rather than a single page: Overview, Waitlist,
Launch Readiness, App Distribution, System Health, Facilities/Data, Feedback,
Support, Reliability, Product Insights. All ten are read-only. There is no
control anywhere in it that promotes, submits, distributes, edits or deletes
anything, because every one of those actions belongs in the console that owns
it, where it is attributable to a named person rather than to a shared
password.

**The waitlist page is unchanged.** Same URL, same query, same behaviour. The
only edit to it is the CSV export fix recorded below.

**Every displayed value carries where it came from.** Four states and no
fifth: `live` (measured this request), `derived` (reproduces from the
repository), `manual` (a person typed it in, and it shows their name and the
date), `unavailable` (no value exists). The union in `content/admin/facts.ts`
gives the unavailable branch no `value` field at all, so a switched-off
subsystem cannot be given a number even by mistake; the compiler refuses it.
That is the whole reason the boundary exists. "0 crashes" and "crash reporting
is off" are opposite facts, and a launch decision made on the first while the
second is true is made on evidence that does not exist.

Manual entries expire after 14 days into "Not verified", keeping the original
observer and date in the note, so a sign-off from six weeks ago cannot read as
a current one.

**System Health is the one live panel.** It reads the production configuration
endpoint server-side, with a 2.5 second timeout, cached five minutes, no
credentials and no custom headers. It compares a canonical hash (keys sorted,
compact separators) against the reviewed baseline, so a harmless
re-serialisation does not raise a false alarm while a real content change
does. Every failure renders "Not verified" with the reason. A failed probe is
never described as a production outage: the check runs from one server and the
fault may be at this end.

**Reliability and Product Insights are deliberately separate.** Crash
diagnostics and product analytics have different data, different switches and
different approvals, and are never shown on one page or summed. Both are off,
and both say so in words.

**Waitlist records are read by nothing else.** No new tables, no new queries,
no joins. `content/admin/derived.ts` imports `dbConfigured` only, which is a
boolean about configuration and reads no row. `scripts/check-admin.mjs`
asserts both the static isolation and that no other admin page renders
anything shaped like a contact.

### Admin authentication is accepted for now, and only for now

A single shared credential is adequate while one person operates this. It
carries no per-user identity and no audit trail, so it cannot answer who looked
at what.

**Before a second person is given admin access, this needs individual
authentication, roles and auditability.** That is recorded as a launch action
rather than left as a reader's inference.

This repository is public, so the specifics of the current control and its
gaps are deliberately not written down here. They belong in the private
engineering notes, not in a file anyone can read alongside the URL it
protects.

`/admin` responses now also carry `frame-ancestors 'none'` and
`X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` and a
`Permissions-Policy` turning off camera, microphone, geolocation, payment and
USB, alongside the existing `no-store` and `noindex, nofollow`. Scoped to
`/admin` deliberately: a site-wide content security policy is a separate
project with a real chance of breaking the marketing pages.

### Screenshotting the admin panel

**Never capture the waitlist page against production data.** It renders real
contact details, and a local run picks up whatever credentials are in
`.env.local`, so an ordinary screenshot of that page is a screenshot of
personal data. This is not hypothetical: it has happened once during
development and was caught before the image went anywhere.

Capture it in one of two states instead:

- the unreachable state, by starting the server with deliberately invalid
  Resend credentials and no Postgres URL, which is also the more useful image
  because it shows the honest-failure path; or
- against fictional local fixtures.

Inspect every image before attaching it anywhere, including in a pull request,
a review comment or a document. This applies to any page that can reach the
signups table, not only the waitlist page itself.

Do not commit signup data, or examples derived from it, to this repository.

### Checks

`npm run check:admin` is a sixth check, in the same plain-Node style as the
others and needing no test framework. It exists because the five existing
checks all skip `/admin` and have to, since it is behind Basic auth, which
left the one part of the site holding personal data as the one part with no
automated verification.

It runs 322 assertions: every route 401s without credentials and 200s with
them, every response carries the cache, robots and security headers, the
waitlist page still renders a genuine state, unavailable facts never render a
figure, the inactive sections say they are inactive, no admin page other than
the waitlist reads or renders an identity, and the sitemap and robots still
exclude `/admin`.

It needs its own throwaway credentials and never reads the live password:

```bash
ADMIN_USER=check ADMIN_PASSWORD="$(openssl rand -base64 24)" npm run check:admin
```

It is not in the aggregate `npm run check` for that reason: the other five run
against any server, and this one needs a server started with credentials it
knows.

---

## Known, accepted, not bugs

- **The hero screenshot contains a real typo.** The app's urgent result screen reads
  `medical evaluation.Schedule`. Fix it in the app and re-shoot; a doctored product screenshot is
  worse than a known one.
- **GA4 will understate traffic**, by design. Nothing from condition pages, nothing from anyone who
  declines. Search Console is the tool for condition-page performance.
- **`reviewedBy` and `lastReviewed` are absent from the schema** and a check fails the build if they
  appear. They assert clinical sign-off that item 1 has not had.
