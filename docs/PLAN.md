# WellaPath Website — Build Plan

**Version 1.0** · Companion to [`WEBSITE_GUIDE.md`](WEBSITE_GUIDE.md) and [`DESIGN.md`](DESIGN.md)

---

## 1. Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Design reference | **Stripe**, adapted | §2's "premium = precision" thesis; brand violet is a near-match (`#635BFF` / `#6B4EFF`). Gradients, dark heroes and animation rejected — see `DESIGN.md` §1 |
| Framework | **Next.js 15, App Router, TypeScript** | Static generation for 58 routes; RSC means near-zero client JS |
| Styling | **Tailwind v4, CSS-first `@theme`** | Tokens are CSS custom properties, so the app team can consume the same list. No runtime, no config file |
| Rendering | **Fully static** (`output: 'export'`-compatible) | §9: every page readable with JS disabled or failed |
| Type | **Inter Variable**, self-hosted, subset | One file, whole weight range, real tabular figures. Deviation from §5.2 argued in `DESIGN.md` §3.1 |
| Primary CTA | **Email capture — "Notify me at launch"** | Confirmed. Store badges swap in later; a dead badge is worse than none |
| Language | **English only at launch** | §14. Hausa is the strongest second, and the content pipeline is built so it can be added without a rewrite |
| Web symptom check | **No — install only** | §14's recommendation. Keeps "nothing leaves your phone" absolutely clean |
| Analytics | **None at launch** | §11. When added: cookieless, opt-in, and never on condition pages |

---

## 2. Facts, verified against the artifacts

Every figure was re-derived from the shipped JSON rather than copied from the guide. All of them
hold:

| Figure | Guide | Measured | Source |
|---|---|---|---|
| Conditions | 50 | **50** | `conditions/*.ng.v2.0.json` |
| Rules | 75 (13 global + 62) | **75** | `rules.ng.v2.2.json` `_metadata` |
| Facilities | 5,344 | **5,344** | `facilities.ng.v1.1.json` |
| Emergency-capable | 924 | **924** | `emergency_capable === true` |
| Lagos / Kano / FCT | 2,690 / 2,040 / 614 | **2,690 / 2,040 / 614** | grouped by `state` |
| Records with a phone | 45 | **45** | `phone !== null` |

Two things the guide does not mention, both usable:

- **21 of 50 conditions carry a `seasonal_modifiers` entry.** §3 calls seasonal intelligence the
  single most compelling "built for here" story; it is worth 21 conditions, not just malaria.
- **All 50 carry `local_expressions`** — "body hot", "fever dey", "cold and hot". This is the best
  SEO asset in the repo (§12 wants symptom language, not clinical names) and no global competitor
  has it. Surfaced on condition pages as *"You might call this…"*.

### Two gaps that block content — detail in `DESIGN.md` §5

1. **Urgency: data has 4 values (`self_care` ×6), guide and app show 3.** Site maps
   `self_care → non-urgent`; needs confirming.
2. **36 of 47 danger-sign tokens have no plain-language label.** Blocks the top of all 50 condition
   pages. Needs a clinician, not a copywriter.

---

## 3. Architecture

```
wellapath-website/
├─ docs/               WEBSITE_GUIDE.md · DESIGN.md · PLAN.md
├─ content/
│  ├─ artifacts/       synced copies of the clinical JSON (committed)
│  ├─ conditions.ts    typed loader → the 50 pages
│  ├─ facilities.ts    typed loader + server-side filter
│  ├─ urgency.ts       the single 4→3 mapping
│  └─ red-flag-labels.ts   plain-language layer, each entry reviewed:true|false
├─ app/                8 routes + /conditions/[slug]
├─ components/         the DESIGN.md §4 inventory
├─ public/
│  ├─ fonts/           Inter subset woff2
│  └─ app-screens/     ← drop the app screenshots here
└─ scripts/sync-kb.mjs  pulls from ../wellapath-knowledge-base
```

**Artifacts are committed, not imported across repos.** `npm run sync:kb` copies them in and stamps
the versions it took. The site then builds standalone — on CI, on Vercel, on a laptop without the
sibling repos — and a KB release becomes a reviewable diff rather than a silent content change.

### Where the screenshots go

`public/app-screens/`. Drop them in and they appear — the `PhoneFrame` component reads a manifest,
so no code changes are needed. Until real files land, it renders a labelled placeholder at the
correct aspect ratio, so layout is already final.

Per §5.3: **real app screens are the launch imagery.** No stock photography at all. Commissioned
Nigerian documentary photography is a later upgrade, not a launch blocker, and buying stock in the
interim would actively cost more than it bought.

---

## 4. Routes

| Route | Rendering | Client JS | Notes |
|---|---|---|---|
| `/` | static | none | Hero · 4 beats · red-flag override · privacy diagram · receipts · coverage · capture |
| `/how-it-works` | static | none | The worked example: one fever in July, walked through season + age |
| `/conditions` | static | none | Filter by body area / seasonal / urgency — links, not JS |
| `/conditions/[slug]` × 50 | static | none | §6.3 order, danger signs first. `MedicalWebPage` schema |
| `/find-care` | static + `searchParams` | none | `<form method="GET">`, filtered server-side |
| `/clinical-safety` | static | none | Sources, versioning, named reviewers, limitations |
| `/privacy` | static | none | Plain-language first, NDPR explicit |
| `/partners` | static | none | B2B voice, form not install |
| `/about` | static | none | Real names, faces, credentials |

**Total client JavaScript budget: 0 KB of our own.** Next.js ships a runtime; everything we write is
server-rendered. Nav uses `<details>`, filters use links, search uses a GET form. Nothing on the site
*needs* JavaScript to work, which is the §9 requirement met by construction rather than by testing
afterwards.

### Measured, on the built site

| Metric | Budget | Measured | |
|---|---|---|---|
| Client JS, gzipped | < 120 KB | **111 KB** | ✅ |
| Initial page weight (`/`) | < 500 KB | **202 KB** | ✅ |
| Webfont | ≤ 2 files, self-hosted | **1 file, 48 KB** | ✅ |
| Horizontal scroll at 320/360/390px | none | **none** | ✅ |
| Touch targets | ≥ 48×48 | **all ≥ 48** | ✅ |
| Readable with JS disabled | required | **all 63 routes** | ✅ |

Two honest notes on those numbers:

- **111 KB of the 120 KB budget is React and the Next runtime.** Our own code is ~180 bytes per
  page. There is no optimisation left on our side; if more headroom is ever needed, the lever is
  dropping client hydration entirely (Astro, or Next with `ppr`/RSC-only output), not tuning what we
  wrote. Worth knowing before someone spends a week on it.
- The 39 KB polyfill chunk Next emits is tagged `noModule`, so no modern browser downloads it. It is
  excluded above for that reason — and because every page works without JavaScript, old browsers
  that *do* fetch it lose nothing if it fails.

### Rendering status, as built

`/conditions` and `/find-care` currently render **on demand** rather than statically, because they
read `searchParams`. That is correct on a Node host and costs nothing, but it is not yet
`output: 'export'`-compatible. To make it so, pre-render the filter permutations with
`generateStaticParams` and move the filters into the path (`/find-care/lagos`). Deliberately deferred
— it only matters if the site has to live on a pure static CDN.

---

## 5. Build order

Each phase leaves the site deployable — that is the point of the sequencing.

| Phase | Delivers | Live? |
|---|---|---|
| **1. Foundation** | Tokens, fonts, layout shell, nav, footer, buttons | Deployable shell |
| **2. Content layer** | `sync:kb`, typed loaders, urgency mapping, red-flag draft labels | — |
| **3. Components** | The `DESIGN.md` §4 inventory | — |
| **4. Home** | `/` complete, real figures, capture form | **Launchable as a one-pager** |
| **5. Depth** | `/how-it-works`, `/clinical-safety`, `/privacy` | Credible small site |
| **6. Conditions** | Index + 50 pages, schema, sitemap | The SEO engine turns on |
| **7. Find care** | Server-filtered directory | Full launch scope |
| **8. Hardening** | Lighthouse, screen-reader pass on the emergency path, 3G test on real Android | Ship |

Phases 1–4 are what "live while we build" means concretely: after phase 4 there is a real,
honest, fast one-page site at `wellapath.org` that can absorb traffic while 5–8 land behind it.

### Deliberately out of scope at launch

Blog · testimonials in any form · pricing · chat widget · A/B testing · cookie banner (there are no
cookies to consent to, and a banner for nothing is a dark pattern in the §8.1 sense).

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| **Danger-sign labels ship unreviewed** | `npm run build` **fails** while any entry is `reviewed: false` — verified, not aspirational. Dev renders a visible "draft" marker beside each. The one gap that could actually hurt someone |
| **The hero screenshot contains a known typo** | The app's urgent result screen reads `medical evaluation.Schedule` — the §4.2 bug. Fix in the app, then re-shoot `public/app-screens/hero-urgent.webp`. Not retouched: a doctored product screenshot is worse than a known one |
| Emergency number wrong per state | Placeholder until verified. §14, safety issue not a content one |
| Someone adds a testimonial implying diagnosis | §11 in the PR template; banned-word check in CI |
| Condition pages drift into diagnosis framing | Page template is structurally "symptoms → urgency"; there is no field for "likely diagnosis" to go in |
| KB version bumps silently change published figures | `sync:kb` stamps versions; receipts import from the artifact, so a changed number is a visible diff |
| Perf regression from a future image or embed | Budgets as CI gates, per §9's "build-failing, not aspirational" |

---

## 7. Open — needs the founder

Carried from §14, narrowed to what actually blocks work:

1. **Who clinically reviews the knowledge base, and may we name them?** Blocks `/clinical-safety`,
   §12's authorship signal, *and* the 36 danger-sign labels — which currently **fail the build**.
   The single highest-value unblock by a distance.
2. **Is `self_care` a fourth urgency state or a synonym for non-urgent?** One line in
   `content/urgency.ts` either way, but it changes the "3 urgency levels" receipt.
3. **Where should the capture form POST?** It targets `/api/notify` and `/api/partners`, which do not
   exist yet. Until they do, a submission 404s.
4. **Is `/partners` in scope?** It ships with a real form and real technical claims. If there is no
   pipeline behind it, remove it from `NAV` rather than soften it.
5. **Confirm 112 per state.** The app already publishes 112 and the site now matches it, so this is
   verification rather than a blocker — but Lagos runs its own line and §14 is right that getting it
   wrong is a safety issue.

**Answered since v1.0 of the guide:**

- *Which emergency number?* — the app's home screen publishes **112**. The site matches it.
- *Is there brand identity beyond the violet?* — **yes**, there is a wordmark: lowercase `wellapath`
  with a tick mark, seen on the app splash screen. It is reproduced as inline SVG in
  `components/chrome.tsx` so it inherits `currentColor`. A vector original would still be better than
  a redraw.

---

*WellaPath Website Build Plan v1.0 · Figures re-derived from `kb.ng.v2.4`, `rules.ng.v2.2`,
`facilities.ng.v1.1`*
