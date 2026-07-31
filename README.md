# wellapath-website

The WellaPath marketing website — `wellapath.org`.

## Start here

| Document | What it is |
|---|---|
| **[`docs/WEBSITE_GUIDE.md`](docs/WEBSITE_GUIDE.md)** | The brand, content and experience guide. Read §1 and §2 before designing or writing anything. |
| **[`docs/DESIGN.md`](docs/DESIGN.md)** | The design system — tokens, type scale, component specs. Derived from Stripe, governed by the guide. |
| **[`docs/PLAN.md`](docs/PLAN.md)** | Build plan, verified figures, measured budgets, open decisions. |

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
npm run check                # copy + layout/a11y checks (needs the site running on :3737)
```

### The build will fail, and that is correct

`npm run build` refuses to complete while any danger-sign label in
`content/red-flag-labels.ts` is `reviewed: false`. 36 of 48 currently are. Those sentences sit at the
top of every condition page and need a clinician's sign-off, not a copywriter's.

To build a preview anyway:

```bash
ALLOW_UNREVIEWED_RED_FLAGS=true npm run build
```

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
