# wellapath-website

The WellaPath marketing website — `wellapath.org`.

## Start here

| Document | What it is |
|---|---|
| **[`docs/WEBSITE_GUIDE.md`](docs/WEBSITE_GUIDE.md)** | The brand, content and experience guide. Read §1 and §2 before designing or writing anything. |
| **[`docs/DESIGN.md`](docs/DESIGN.md)** | The design system — tokens, type scale, component specs. Derived from Stripe, governed by the guide. |
| **[`docs/PLAN.md`](docs/PLAN.md)** | Build plan, verified figures, measured budgets, open decisions. |
| **[`docs/PROGRESS.md`](docs/PROGRESS.md)** | Where the build stands today: what is done, what is measured, what is blocking launch. |

`docs/website-guide.html` is the guide, styled — open it in a browser or print to PDF.

## The one rule

WellaPath is a **clinical decision support system**, not a diagnosis engine. It tells a user how
urgently to seek care and where — never what they have. Every word on the site has to survive that
sentence. See §1 and the banned-word list in §4.2.

`npm run check:copy` enforces the banned-word list against the rendered pages.

## Running it

```bash
npm install
npm run sync:kb     # pull clinical artifacts from ../wellapath-knowledge-base
npm run dev         # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run check                # phone + copy + layout/a11y + SEO (needs the site running on :3737)
```

### The build will fail, and that is correct

`npm run build` refuses to complete while any danger-sign label in
`content/red-flag-labels.ts` is `reviewed: false`. 36 of 48 currently are. Those sentences sit at the
top of every condition page and need a clinician's sign-off, not a copywriter's.

To build a preview anyway:

```bash
ALLOW_UNREVIEWED_RED_FLAGS=true npm run build
```

## Launch signup

The "Notify me at launch" form posts to `/api/notify`. It takes **an email
address or a WhatsApp number, and either one on its own is enough**. Requiring
the email would undo the reason the number is offered: it reaches people email
does not.

Postgres is the source of truth, because it is the only store that can hold a
WhatsApp-only signup and it is the single place `/privacy`'s deletion promise
has to be honoured. Resend is written to as well whenever there is an email, so
the launch broadcast stays one action there.

```bash
cp .env.example .env.local     # then fill in the values below
npm run check:resend           # tells you exactly what is missing or wrong
```

| Variable | Where from |
|---|---|
| `DATABASE_URL` | **Vercel → Storage → Create → Neon Postgres.** Copy the pooled connection string. The `signups` table is created on first use; there is no migration step |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) — "Sending access" is enough; this code only creates contacts, it never sends |
| `RESEND_AUDIENCE_ID` | [resend.com/audiences](https://resend.com/audiences) — create an audience, copy its **ID**, not its name |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Chosen by you. They gate `/admin/signups`, which lists real names and numbers |

Set the same values in **Vercel → Settings → Environment Variables**. Vercel only
applies environment variables to deployments created *after* they are added, so
redeploy once you have set them.

Until `DATABASE_URL` is set every signup returns an honest error and the details
are written to the server log, so nothing is lost — but nothing is stored either.
`/admin/signups` says so on the page rather than quietly reporting zero.

Numbers are normalised to E.164 (`+234XXXXXXXXXX`) on the way in, so the same
number typed as `08031234567`, `+234 803 123 4567` or `(0803) 123-4567` is one
contact, not three. See `content/phone.ts`.

## SEO

Four things are enforced by `npm run check:seo` rather than remembered:

- **A canonical on every indexable route.** The navigation links to six
  `/conditions?…` filter URLs, which without one are six near-identical pages.
- **A 1200x630 share card on every page**, generated at build from
  `components/og-card.tsx`. Condition pages get their own, carrying the
  condition name and its urgency.
- **Titles and descriptions that fit a result** — under 65 and 165 characters,
  unique across routes, and never starting mid-phrase.
- **The sitemap lists every indexable route and nothing that is noindex.** It is
  built from the same constants the navigation reads, so a new segment page
  cannot be added without appearing in it.

Structured data lives in one place, `content/schema.ts`: `Organization` and
`WebSite` sitewide, `MedicalWebPage` + `MedicalCondition` + `BreadcrumbList` on
condition pages, `BreadcrumbList` on the segment pages.

**`reviewedBy` and `lastReviewed` are deliberately absent.** They are the two
fields a health site most wants, and both assert clinical sign-off that 36 of
the 48 danger-sign labels have not had. `check-seo.mjs` fails the build if
either appears. Add them the day a clinician signs off, not before.

The official accounts live in `SOCIALS` (`content/site.ts`) and are read twice:
by the Organization schema's `sameAs`, and by the footer links. `check-seo.mjs`
fails if the two disagree, because a `sameAs` the site does not visibly link to
is a claim with nothing behind it.

Still missing: a `contactPoint` on the Organization schema. There is no
published inbox in the repo to point at, and inventing one is worse than
omitting it.

## Analytics

Google Analytics 4 (`G-YT2G413V4Z`), opt-in, and never on a condition page.
Both constraints come from commitments already published on `/privacy`, so both
are enforced by `npm run check:analytics` against the running site rather than
trusted to stay true.

- **Nothing loads before Accept.** Not consent-mode-denied, not loaded and
  throttled: the script is absent. Declining, ignoring the banner, or browsing
  with JavaScript off all mean zero requests to Google.
- **Nothing under `/conditions` is loaded on or reported**, including the filter
  URLs, and the banner does not appear there either. What someone is worried
  about is the most sensitive thing this site could know.
- **The banner has two buttons of equal weight**, neither preselected. The check
  fails if their fills differ or one is more than 1.6x the width of the other.
- **Consent can be withdrawn** from the control on `/privacy`. The NDPR basis is
  consent, and consent that cannot be withdrawn is not consent.

One honest limit, stated on `/privacy` too: gtag cannot be unloaded once
injected. If someone accepts on a marketing page and then opens a condition
guide, the script is still in memory. It is told nothing — `send_page_view` is
false and every page view is issued by hand for allowed paths only, which is
what check 6 in that script proves.

The choice is stored in `localStorage`, not a cookie. A cookie would be the one
cookie set before any consent existed, which is the thing being asked about.

## Where the facts come from

Every figure is derived at build time from the shipped clinical artifacts in
`wellapath-knowledge-base` — `npm run sync:kb` copies them into `content/artifacts/` and writes
`stamp.json`. **No number is typed by hand anywhere in the site.** All figures below were re-derived
from the artifacts and match the guide exactly:

| Figure | Source |
|---|---|
| 50 conditions | `conditions/*.ng.v2.0.json` |
| 75 rules (13 global, 62 condition-specific) | `rules.ng.v2.2.json` |
| 5,344 facilities · 924 emergency-capable · 45 with a phone number | `facilities.ng.v1.1.json` |
| Lagos 2,690 · Kano 2,040 · FCT 614 | `facilities.ng.v1.1.json` |

A knowledge-base release therefore shows up as a diff in `content/artifacts/stamp.json` rather than
as a silent change to a published claim.

## App screenshots

`public/app-screens/` — real product UI, used instead of stock photography per §5.3. Source captures
are kept in `app screen screenshots/`.

## Related repos

- `wellapath-mobile` — Flutter app (the site's visual source of truth)
- `wellapath-backend` — Fastify artifact distribution
- `wellapath-knowledge-base` — clinical artifacts
