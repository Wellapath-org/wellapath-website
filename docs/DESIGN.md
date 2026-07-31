# WellaPath — Web Design System

**Version 3.0** · Companion to [`WEBSITE_GUIDE.md`](WEBSITE_GUIDE.md) · Audience: front-end developer

> **v3.0 — marketing site, light only, B2B + B2C.** Three changes from v2:
>
> 1. **The site no longer runs any service.** The working facility search at
>    `/find-care` is gone; `/coverage` proves the directory is real instead. The
>    symptom assessment and the clinic locator live in the app, the same split
>    Stripe and Anthropic run — the website sells, the product delivers.
> 2. **Light mode only.** The dark-mode block is deleted, `color-scheme: light`
>    is declared. Sunlight legibility (§8.1) is the governing case, and one
>    surface means the triage colours are measured once instead of twice.
> 3. **Four audiences, four real pages.** `/for/households`,
>    `/for/health-facilities`, `/for/clinicians`, `/for/public-health`.
>
> It also removes six named tells of generated design that v2 was committing.
> See §0.

Stripe's structure and visual devices, WellaPath's violet.

> **What changed in v2.0, and why it matters.** v1.0 read the guide's §2 ("premium is signalled by
> restraint") as a ban on gradients, animation and colour, and built an austere institutional site.
> The founder reviewed it and asked for Stripe's actual look — the gradient mesh, the layered
> product cards, the motion. **That is a deliberate, informed override of §2 and §5.4 of the guide,
> and it is recorded here rather than quietly applied.** §2 should be updated to match, or this
> document read as superseding it on aesthetics.
>
> The override is aesthetic only. Everything in §6 below — the clinical safety rules — survived
> unchanged and is not open to visual preference.

---

## 0. What v3 removed, and why

Each of these is a documented tell of AI-generated design. v2 committed all six.

| Removed | Why |
|---|---|
| **`border-l-4` coloured left stripes** on urgency cards, danger signs, the footer emergency block | Reported as *"almost as reliable a sign of AI-generated design as em-dashes"*. Urgency now reads from a badge plus a tinted header band — which was always better for §10, since the text label was already carrying the meaning |
| **Border + shadow on the same card** | 1px hairline plus diffuse shadow is the generated-UI signature. The rule is now edge **XOR** elevation: `ring ring-ink/8` **or** `shadow-raise`, never both |
| **Icon tiles stacked above headings** in uniform 3-column grids | The default generated homepage. Icons are now inline with the heading (`FeatureRow`), and layouts are asymmetric (`Split` at 7/5 or 5/7) |
| **Hand-rolled SVG icons** at arbitrary stroke weights | Replaced with Lucide 1.28, wrapped in `LucideProvider strokeWidth={1.5} size={20}`. Lucide at its default `strokeWidth={2}` is itself a tell; setting the default once de-defaults the whole icon layer |
| **Dot-in-a-pill urgency badges** | The stock generated badge. Replaced with a three-segment scale filled to the level, plus the word and its position (`▌▌ URGENT 2/3`) — which carries information the pill never did, and reuses the segmented motif already used for match strength |
| **Generic alert box** for the emergency block | Rebuilt around the number: `112` set as a display figure in tabular numerals beside the instruction, with a single hairline rule in the triage red. One shared `EmergencyCard`, used in the footer and on `/coverage` |
| **Six identical cards in a grid** on the limits section | *"Cardocalypse"* — replaced with a hairline-divided two-column list. The cards also had no padding, so the copy was running to the card edge |
| **Coloured uppercase eyebrow kickers** | *"Borrows editorial authority it has not earned."* Eyebrows are now mono, muted, lightly tracked |
| **Uniform `py-24` everywhere** | Reads as unfinished rather than generous. `Section` takes `space="tight \| normal \| loose"`; spacing is contrastive |

Two more, structural:

- **`--color-*: initial`** deletes Tailwind's default palette. There is no `indigo-500`,
  no `slate-700`, no `gray-200` in this project. Default Tailwind indigo is the single
  most-cited tell and the only reliable prevention is making it impossible to type.
- **Shadows are two-layer and violet-tinted with negative spread**, never black and never
  single — Stripe's own construction. Black shadows desaturate what they fall on.

---

## 1. The reference

**Stripe.** Chosen originally because its premium signal is precision rather than lifestyle, and
confirmed in review as the target look. The transplant is unusually clean: Stripe's brand violet is
`#635BFF` and WellaPath's, from the Flutter app, is `#6B4EFF` — the same hue at the same value. Every
structural decision Stripe makes around that colour ports directly.

### The devices we take, in order of importance

| Device | Where it lives |
|---|---|
| **Two-tone heading** — bold ink lead sentence, muted continuation, inline, same paragraph | `<TwoTone>`, every section header |
| **Gradient aurora** — a violet mesh sweeping behind the hero | `.aurora`, `.aurora-soft` |
| **Ruled container** — hairline verticals marking the content column | `.rails` |
| **Stat row** — large *light-weight* numerals between hairline rules | `<StatRow>` / `<Stat>` |
| **Product cards** — white, 16px radius, gradient wash bleeding from the bottom, hover lift | `<Card wash lift>` |
| **Recreated product UI** — never screenshots | `components/product.tsx` |
| **Chevron affordance** — `›` after every forward action | `.chev` |
| **Icon tiles** — rounded lavender square holding a violet glyph | `<IconTile>` |
| **One dark section** — deep violet-navy with gradient-filled numerals | home, "Red flags override the score" |

### What we still reject

- **Stripe's orange/pink/blue.** The aurora is violet-family only. Introducing warm hues would
  collide with the triage palette, which is the one place colour carries clinical meaning.
- **Decorative red, amber or green anywhere.** See §6.
- **Scroll-jacking, parallax, carousels, popups.** Motion reveals only, all under 250ms.
- **Stock photography.** Still true, and now moot: there are no photographs on the site at all.

---

## 2. Colour

Measured, not estimated. Lavender ground is `#F6F5FB`, navy is `#0E0B26`.

| Token | Value | on white | on lavender | Use |
|---|---|---|---|---|
| `--color-ink` | `#171436` | 17.65 | 16.28 | Headlines, lead sentences |
| `--color-ink-soft` | `#565175` | 7.42 | 6.85 | **The muted half of every two-tone heading**, body prose |
| `--color-ink-mute` | `#6F6A8A` | 5.12 | 4.72 | Captions, metadata |
| `--color-accent` | `#6B4EFF` | 5.05 | 4.66 | Button fills, brand mark |
| `--color-accent-hover` | `#5A3AFF` | 6.03 | — | Button hover |
| `--color-accent-ink` | `#4A2FD6` | 7.87 | 7.26 | Links, focus ring, violet text |
| `--color-accent-wash` | `#F1EDFF` | — | — | Surface only |
| `--color-accent-tile` | `#ECE7FF` | — | — | Icon tiles, step badges |
| `--color-rule` | `#E7E4F0` | — | — | Hairlines |
| `--color-rail` | `#EEECF6` | — | — | Container verticals |
| `--color-field-border` | `#8E86A8` | 3.43 | — | Inputs — WCAG 1.4.11 needs 3:1 |
| `--color-ink-on-navy` | `#C3BAF0` | — | 10.60 on navy | Muted text in the dark section |

**Triage — semantic only.** `--triage-safe #14764A` (5.21 on lavender) · `--triage-warn #8A5A00`
(5.47) · `--triage-crit #C0281F` (5.43). All three pass AA on white, lavender and as white-on-fill.

### The aurora must never cost contrast

`.aurora` carries a mask that keeps the left of the hero near-white:

```css
mask-image: linear-gradient(100deg, transparent 8%, rgb(0 0 0 / .35) 30%, #000 58%);
```

Headline text therefore sits on near-white ground while the gradient blooms behind the product card.
This is not a stylistic preference — it is how the hero keeps its 4.5:1 while still looking like
Stripe. **Any change to the aurora must be re-measured against the text it sits behind.**

---

## 3. Typography

**Inter Variable**, self-hosted, Latin-subset, one 48 KB file covering 400–800. The deviation from
§5.2's "humanist sans" is argued on legibility grounds: tall x-height and open apertures hold up at
17px on a low-DPI Android in daylight, and it has true `tnum` figures for the receipts. Swap to
Source Sans 3 Variable if the letter of §5.2 is preferred — it is one token.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--text-hero` | `clamp(2.75rem, 5.2vw, 4.25rem)` / 1.08 | 700 | Home `h1` only |
| `--text-display` | `clamp(2.25rem, 4vw, 3.25rem)` / 1.12 | 700 / 400 | Section headers, page `h1` |
| `--text-h1` | `clamp(2rem, 3.2vw, 2.75rem)` / 1.15 | 400–700 | Hero sub, condition names |
| `--text-h2` | `clamp(1.625rem, 2.4vw, 2.125rem)` / 1.2 | 700 | Subsection heads |
| `--text-h3` | `1.3125rem` / 1.3 | 600–700 | Card titles |
| `--text-body-lg` | `1.1875rem` / 1.6 | 400 | Page intros |
| `--text-body` | `1.0625rem` / 1.6 | 400 | Default prose |
| `--text-small` | `0.9375rem` (15px) / 1.5 | 400 | Captions — **absolute floor** |
| `--text-label` | `0.75rem` (12px), `0.09em`, uppercase | 600 | 1–3 word labels ONLY |
| `--text-figure` | `clamp(2.75rem, 4.6vw, 3.75rem)` / 1 | **400** | Stats |

**Stats are set at weight 400, not bold.** That single choice is most of why they read as expensive
rather than loud. Do not "fix" it.

**Two-tone headings are the house style.** Lead sentence bold in `--ink`; continuation `font-normal`
in `--ink-soft`, same size, same paragraph. Keep the continuation to **two lines at desktop** — the
device dies past three, which is the most common way to get this wrong.

Floors, enforced by `scripts/check-layout.mjs`: nothing below 15px in prose; 12px only for uppercase
labels; measure capped at 62ch (`.measure`) or 74ch (`.measure-wide`).

---

## 4. Shape, depth, motion

**Radius** — `4 / 6 / 8 / 10 / 16 / 20`. Cards 16px, buttons 8px, inputs/tiles 10px, phone shell
32px. This is a deliberate increase over v1.0's 4–8px cap: Stripe's larger radii are part of the
look, and at 16px on a bordered card it still reads institutional rather than toy.

**Depth** — three shadows only: `--shadow-card` (resting), `--shadow-lift` (hover, floating UI),
`--shadow-float` (the phone). Cards always carry a hairline border as well; the border does the
structural work and the shadow only suggests elevation.

**Motion** — all of it inside `@media (prefers-reduced-motion: no-preference)`, so reduced-motion is
the default path and animation is the opt-in.

- `.reveal` — rise-and-fade on scroll via native `animation-timeline: view()`. **No JavaScript, no
  IntersectionObserver, no bytes.** Browsers without support simply show the content. A `@media
  print` override forces `opacity: 1` so nothing is ever hidden in print or a full-page capture.
- `.lift` — 3px translate + shadow on card hover, 220ms.
- `.chev::after` — the chevron slides 3px on hover, 180ms.
- `.aurora` — a 26s drift. The only ambient animation on the site.

### Effects: CSS first, JavaScript only where CSS is blind

The site's motion is deliberately split, and the split follows a budget rather than a taste.
Client JS is capped at 120 KB gzipped and the audience pays for every kilobyte in mobile data,
so a general-purpose animation library (Framer Motion, GSAP) was never affordable here.

**Tier 1 — zero JavaScript.** Everything scroll-driven uses native
`animation-timeline: view()` / `scroll-timeline`. This is what Stripe's own marketing site does,
and it runs off the main thread, which matters more on a mid-range Android than it does on a
laptop. Every block is wrapped in both `prefers-reduced-motion: no-preference` and
`@supports (animation-timeline: view())`, so an unsupporting browser simply shows the finished
state.

| Class | Effect |
|---|---|
| `.stagger > *` | Each child animates on its **own** view timeline, so the stagger comes from real positions rather than hand-tuned delays |
| `.draw [data-draw]` | SVG stroke draws itself on scroll. Used on the privacy diagram so the arrow lands after the boxes — the sequence *is* the argument |
| `.rail-track` / `.rail-fill` | Scroll-linked reading progress via a named `scroll-timeline` |
| `.settle` | The hero product card lifts fractionally as the hero scrolls away. Bounded to `exit 0%–100%`, so it finishes and stops. Not parallax |

**Tier 2 — JavaScript, for what CSS cannot observe.** Two things only:

- **`@number-flow/react`** on the receipts. Animated *digit* transitions are genuinely impossible
  in CSS, and §3 calls the exact figures our most valuable copy asset, so this is the one place
  motion earns real attention. The server renders the final correct figure as plain text; the
  component only upgrades it after mount, rolls once, and never re-animates.
- **`components/effects.tsx`** — a hand-rolled pointer spotlight. Two listeners writing CSS custom
  properties, rAF-throttled to one write per frame, `pointer: fine` only so it never runs on touch.
  No library: the smallest one that does this costs more than the feature.

**Framer Motion — one component, and it earns it.** `components/urgency-morph.tsx` is the only
JS-animated piece on the site, and it exists because §3's two proof points (seasonal weighting,
demographics changing urgency) cannot be *shown* in static copy. The reported symptoms are pinned
and never move — that is the control in the experiment — while everything downstream animates: the
triage scale climbs a step, the label and headline swap, the modifier chips fly in, the timeframe
tightens. The animation is the argument.

Bundle discipline that made it affordable:

- `LazyMotion` + `m` from `motion/react`, **not** the full `motion` component. Base is ~5 KB and
  `domAnimation` (~15 KB) is fetched **after paint**, so it never lands in First Load JS.
- `strict` is on, so a stray `motion.div` throws rather than silently pulling the full bundle back.
- Layout animations (`layoutId`) need `domMax` (~25 KB), which we cannot afford. The sliding
  selector is a plain transform between two known positions — same effect, a third of the cost.
- It is a client component, so it still server-renders: the content is complete and correct with
  JavaScript disabled, and motion only enhances after hydration.

Under `prefers-reduced-motion` every duration drops to zero and the autoplay never starts. The
control still works; it just switches instantly.

**Emotion was considered and rejected.** It is a CSS-in-JS runtime, and this project already has
Tailwind v4 with a locked token system. Adding it would mean a second styling system plus runtime
cost for no visual gain — bytes spent on plumbing rather than on anything a visitor would notice.

**Generative visuals — and one deliberate deletion.**

The original `RadialBurst` was removed. It was Stripe's shape wearing our colours, and it read that
way. A visual that invites "did they copy Stripe?" is worth less than no visual.

| Visual | Where | Why it is ours |
|---|---|---|
| `CoverageMap` | `/coverage` | A scatter of the **real latitude and longitude** of all 5,344 facilities. Lagos sits south-west, the FCT centre, Kano north — where they actually are. Nobody can claim we copied our own dataset, and no competitor reproduces it without the same fieldwork. It is also the strongest form of §3's argument: "5,344 facilities" is a claim; this is the receipt, including the empty country around it |
| `FlowRibbon` | dark safety section | A bundle of curves pinching at a waist, masked to the lower band so it never crosses the headline |
| `AuroraGL` | hero | A hand-written WebGL fragment shader — domain-warped fractal noise per pixel per frame, so the field churns rather than slides, and the pointer bends the warp |

**Why not three.js.** three.js core is ~150 KB gzipped, larger than this entire site's JavaScript
budget, for an audience §9 says buys mobile data in bundles. It is a 3D scene graph — cameras,
materials, lights — and a full-screen gradient uses none of it. The shader in `aurora-gl.tsx` is one
quad, one fragment program, no dependencies, and it is lazily loaded so it never touches First Load
JS. Same output, roughly 2% of the bytes.

**Keeping scroll smooth is engineered, not hoped for:**

- The shader's `requestAnimationFrame` loop **stops entirely** when the hero leaves the viewport, via
  an `IntersectionObserver`. Scrolling the rest of the page pays nothing for a shader nobody sees.
  This is the single most important line in that file.
- Device pixel ratio capped at 1.5. A mid-range Android does not need 3× pixels of blur.
- The pointer is eased toward a target rather than read per event, so a fast cursor cannot queue work.
- Everything else — dot bloom, ribbon drift, reveals — is CSS `transform`/`opacity` only.
- The shader never mounts on save-data, reduced-motion, or coarse-pointer devices.

Geometry uses a **seeded** generator (Mulberry32), never `Math.random`, so server and client markup
match exactly and React never reports a hydration mismatch.

> **A trap worth knowing.** `figure-gradient` clips its background to the *text*, and NumberFlow
> renders digits in nested spans the clip cannot paint — a gradient figure wrapped in NumberFlow
> renders **invisible**. `Stat` now refuses to flow a gradient figure.

**The rules any new effect must meet**

- [ ] Content is complete and correct with JavaScript disabled. Motion enhances; it never reveals.
- [ ] `prefers-reduced-motion` honoured, and the reduced path is the default in the cascade.
- [ ] Nothing animates a triage colour, a danger sign, or the disclaimer. Emergency information
      does not fade in.
- [ ] No scroll-jacking, no scroll-linked parallax, no carousels, no bounce or elastic easing.
- [ ] It survives the JS budget. Measure, do not assume.

**Focus** — `outline: 2px solid var(--color-accent-ink); outline-offset: 2px`. The offset gap shows
page ground, so the ring stays at 7.87:1 even on a violet fill.

---

## 5. Product imagery: drawn, not screenshotted

**There are no screenshots on this site, and no photographs.** `components/product.tsx` rebuilds the
app's screens as markup: `ResultCard`, `BodyAreaMock`, `SymptomPickerMock`, `SeverityMock`,
`FacilityListMock`, wrapped in `PhoneShell` or `MockFrame`.

Raw captures were tried first and removed. They sat badly — wrong aspect ratios, baked-in status
bars, a device frame fighting the page's own frame, text at whatever size the capture happened to be.
Stripe does not paste screenshots either; its product cards are recreated UI.

What recreating buys:

- Crisp at any size and in both themes; ~0 KB instead of ~25 KB each (the whole `public/` folder is
  now 48 KB — one font).
- **The copy is the corrected copy.** The app's `medical evaluation.Schedule` bug (§4.2) is not
  reproduced, because these strings come from `content/urgency.ts` rather than from a PNG. The
  screenshot version of this site *did* reproduce it, in the hero.
- Every mock carries `role="img"` with a written description, so a screen-reader user hears one
  sentence rather than "Head, Chest, Abdomen, Search, Point on the body…" as though it were operable.

Source captures stay in `app screen screenshots/` as reference for keeping the mocks faithful.

### Em-dashes in the clinical artifacts

45 of the 50 condition files use em-dashes, across 92 distinct strings. Those are stripped at the
**display layer** (`deDash()` in `content/conditions.ts`), not in the artifacts — the artifacts are
the source of truth shared with the Flutter app, and rewriting clinical text here would silently
diverge the two surfaces. The proper fix belongs in `wellapath-knowledge-base`; this keeps the
website clean until it lands.

---

## 6. The clinical contracts — unchanged, and not styleable

Restyling did not touch any of this, and a future restyle must not either.

- **`UrgencyBadge` has no colour-only variant.** The text label is not a prop the caller can blank.
- **`DangerSigns` contains no `<details>`, `<button>` or `aria-expanded`** anywhere in its subtree.
  It renders fully expanded, in source order, on first paint. Enforced by `check-copy.mjs`.
- **`MatchStrength` always renders its word label.** A bar alone invites being read as a probability.
- **The disclaimer is a design element** — 15px minimum, never suppressed grey, on `--accent-wash`
  with a border. Present on `/`, every condition page, and any page showing an urgency level.
- **The emergency block is the first thing in the footer**, on every route, never fine print.
- **Triage colour is never decorative.** No red on an error, no green on a success, no amber on a
  badge. If green means "non-urgent" everywhere except one card, it means nothing anywhere. Three
  violations of this were introduced during the v1 build and caught by `check-copy.mjs`; the check
  exists because review missed them.
- **No danger sign ships unreviewed.** `assertRedFlagsReviewed()` fails the production build.

---

## 7. Definition of done — the mechanical subset

CI checks, not review comments. `npm run check` runs both against a live build.

- [ ] No `--triage-*` token used decoratively; no violet outside actions, links and brand marks
- [ ] Every urgency state renders a text label
- [ ] Every input border is `--field-border` or darker; focus visible at 3:1
- [ ] `DangerSigns` subtree contains no disclosure element
- [ ] No red-flag string rendered from an unreviewed entry
- [ ] Aurora re-measured against any text placed over it
- [ ] One webfont file, self-hosted, subset, `font-display: swap`
- [ ] Every page renders and is navigable with JavaScript disabled
- [ ] Client JS under 120 KB gzipped; page weight under 500 KB
- [ ] No horizontal scroll at 320 / 360 / 390px
- [ ] All touch targets ≥ 48×48
- [ ] Nothing below 15px in prose; 12px only for uppercase labels
- [ ] **No em-dashes in published copy.** Heavy em-dash use reads as machine-written.
      Commas, colons and full stops carry the same meaning. En-dashes in numeric ranges
      (`May–October`) are correct typography and are left alone. Enforced by `check:copy`

**Measured on the current build:** JS **107 KB** gzipped · home page **187 KB** total · images
**0 KB** · no horizontal scroll at 320/360/390 · all targets ≥48px · **168 copy checks across 15
routes** and all layout checks passing · zero default-Tailwind palette values in the output.

### Two bugs the layout check caught during the v3 rebuild

Both were introduced by fixes and would have shipped otherwise:

- `shrink-0` on `Badge`, added to stop it stretching in a flex column, made it refuse to wrap
  and pushed the page sideways at 320px. `w-fit max-w-full self-start` does the same job safely.
- `whitespace-nowrap` on `Button`, added to stop mid-label wrapping, overflowed the viewport on
  long labels. Buttons now wrap and centre — two lines beats a horizontally scrolling page.

Grid and flex children carry `min-w-0` throughout. Without it a child's min-content width
(a table, a long label) silently widens the whole page.

---

*WellaPath Web Design System v2.0 · Stripe's structure, WellaPath's violet · Contrast measured, not
asserted · Aesthetic override of guide §2/§5.4 recorded in the preamble*
