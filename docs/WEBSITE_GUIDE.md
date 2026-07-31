# WellaPath — Website Brand, Content & Experience Guide

**Version 1.0** · Audience: designer, front-end developer, copywriter
Product: Clinical decision support (CDSS) · Market: Nigeria — Lagos, Kano, FCT
The site's job: earn trust, then drive app installs

> **WellaPath tells you *how urgently* to seek care, and where. It does not tell you what you have.**
>
> Every word on the website has to survive that sentence. It is not a legal disclaimer bolted on at
> the end — it is the product, and it is also the most persuasive thing we own. A symptom app that
> refuses to guess is more credible than one that pretends to know.

Read §1 and §2 before designing anything.

---

## Contents

| § | Section |
|---|---|
| 1 | [The line that governs everything](#1-the-line-that-governs-everything) |
| 2 | [Positioning, and what "premium" actually means here](#2-positioning-and-what-premium-actually-means-here) |
| 3 | [The receipts — use these, and only these](#3-the-receipts--use-these-and-only-these) |
| 4 | [Verbal identity](#4-verbal-identity) |
| 5 | [Visual identity](#5-visual-identity) |
| 6 | [How to describe the product](#6-how-to-describe-the-product--visually-and-verbally) |
| 7 | [Site map & page briefs](#7-site-map--page-briefs) |
| 8 | [UX principles](#8-ux-principles) |
| 9 | [Performance budget](#9-performance-budget) |
| 10 | [Accessibility](#10-accessibility) |
| 11 | [Legal & safety guardrails](#11-legal--safety-guardrails) |
| 12 | [SEO & discovery](#12-seo--discovery) |
| 13 | [Definition of done](#13-definition-of-done) |
| 14 | [Open decisions](#14-open-decisions) |

---

## 1. The line that governs everything

WellaPath is a **clinical decision support system**. A user describes symptoms; the app returns an
urgency level, a short list of conditions those symptoms are consistent with, and a route to real
care. It never returns a diagnosis, and the website must never imply that it does.

This is not caution for its own sake. Three separate forces make it binding: medical device
regulation treats "diagnosis" as a claim with consequences; app store health policies reject apps
that overclaim; and the users we most need to reach — a parent at 11pm with a feverish child — are
the ones most harmed by false confidence.

| ❌ Never publish | ✅ Publish instead |
|---|---|
| "WellaPath diagnoses malaria." | "Know how urgently to act." |
| "Find out what's wrong with you." | "Understand what your symptoms could mean — and what to do next." |
| "AI doctor in your pocket." | "Built on Nigerian clinical guidance." |
| "94% accurate." | "From symptoms to the right clinic." |
| "Know your condition instantly." | — |

### The disclaimer is a design element, not fine print

The app already carries the right sentence: *"This is a symptom assessment, not a diagnosis. Your
symptoms may be caused by a condition not mentioned here."*

On the website, treat that line as a piece of the visual system — set in the same family as body
copy, at a legible size, in a considered position. **Do not shrink it to 11px grey at the bottom of
the footer.** Hidden disclaimers read as something to hide; a confidently placed one reads as a
brand that knows exactly what it is.

---

## 2. Positioning, and what "premium" actually means here

The brief asked for a top-tier premium brand. In health, premium is **not** signalled the way it is
in fashion or fintech. Gradients, hype, superlatives and stock photos of laughing models actively
destroy value here, because the category is crowded with scams — miracle cures, fake pharmacies,
WhatsApp health rumours. Every visual cue that looks like marketing pushes us toward that crowd.

Premium in consumer health is signalled by **restraint, precision and evidence**: generous
whitespace, exact numbers, plain sentences, real photography, no claim we cannot defend. The
reference points are not wellness startups — they are institutions people already trust with
serious information.

### Positioning statement

> For Nigerian households facing symptoms without easy access to a clinician, WellaPath is the calm
> second opinion that tells you how urgently to act and where to go — built on Nigerian clinical
> guidance, and private by design because nothing you enter leaves your phone.

### What we are competing against

Not other apps, mostly. The real alternatives are: asking a relative, asking a pharmacist over the
counter, searching symptoms and landing on American content that has never heard of Lassa fever, or
waiting to see if it gets worse. **The last one is the enemy.** Late presentation is what kills, and
"don't wait" is the emotional centre of the brand.

### Brand character

| We are | We are not | Consequence for the site |
|---|---|---|
| Calm | Alarmist | No countdown timers, no red-everywhere, no fear-based headlines |
| Precise | Vague | Exact figures — "5,344 facilities", not "thousands" |
| Local | Imported | Nigerian faces, Nigerian place names, Nigerian conditions and seasons |
| Plain | Clinical-jargon | "Fast breathing", not "tachypnoea" — jargon only where a clinician is the reader |
| Restrained | Salesy | One primary action per page; no popups, no countdowns, no "limited offer" |
| Accountable | Evasive | Show what we don't cover as clearly as what we do |

---

## 3. The receipts — use these, and only these

Specificity is the whole premium strategy, so these numbers are the most valuable copy assets we
have. They are taken from the shipped clinical artifacts. **Do not round them up, and do not invent
new ones.**

| Figure | What it is |
|---|---|
| **50** | Conditions in the Nigerian knowledge base |
| **75** | Clinical triage rules — 13 global, 62 condition-specific |
| **5,344** | Mapped health facilities with coordinates |
| **924** | Of those flagged emergency-capable |
| **3** | Urgency levels: non-urgent, urgent, emergency |
| **0** | Symptom records stored on our servers |

### The coverage claim has to be honest — and it is better honest

The facility directory covers **Lagos (2,690), Kano (2,040) and the FCT (614)**. That is three
states, not the federation. "Across Nigeria" would be an overclaim, and it would be caught the first
time someone in Enugu searched for a clinic.

Naming the three states is also the stronger marketing move: it sounds like a company that has
actually done the fieldwork, and it makes "coming to your state next" a credible promise rather than
a retraction. Where coverage is genuinely partial, say so in the same breath as the strength.

| ❌ Weak & false | ✅ Strong & true |
|---|---|
| Find health facilities across Nigeria. | 5,344 mapped facilities in Lagos, Kano and the FCT — with 924 flagged as emergency-capable. |
| Powered by advanced AI. | 75 clinical rules, written against Nigerian treatment guidance, that run entirely on your phone. |

### Two proof points nobody else in this market has

These deserve their own moments on the site, because they are genuinely differentiated and hard to
copy.

1. **Seasonal intelligence.** The engine raises malaria's weighting during the May–October rainy
   season, when transmission peaks in Nigeria. A generic symptom checker treats a fever in July the
   same as a fever in January. Ours does not. This is the single most compelling "built for here"
   story we have.

2. **Who you are changes the urgency.** Being under five, pregnant, or elderly escalates the
   recommendation, because those groups decompensate faster. Same symptoms, different advice — which
   is exactly what a clinician would do and exactly what a search engine cannot.

---

## 4. Verbal identity

Write at a **reading age of about 12** in Nigerian Standard English. Short sentences. Active voice.
Second person. No idioms that don't travel, and no Americanisms ("ER", "shot", "acetaminophen" →
"emergency", "injection", "paracetamol").

### 4.1 Tone shifts with urgency — this is the core rule

The app already does this well and the website must match it, because a visitor who has seen the app
should recognise the voice. Calm is the default; directness is earned by severity.

**🟢 NON-URGENT** — "Home self-care may be enough."
> Permissive, never dismissive. "May be" respects uncertainty. Always pair with what would change
> the answer: "If it gets worse or lasts more than three days, see a clinic."

**🟡 URGENT** — "You should consult a doctor."
> Clear instruction, no panic. Give a timeframe — "today" or "within 24 hours" beats "soon", which
> people read as "eventually".

**🔴 EMERGENCY** — "Seek medical care immediately."
> Shortest sentences on the whole site. Imperative. One action visible, everything else out of the
> way. Never soften with "you may want to".

### 4.2 Words we never use

| Banned | Because | Use |
|---|---|---|
| Diagnose / diagnosis | Regulatory claim we cannot make | Assessment, symptom check |
| "You have…" | States a fact about the body | "Your symptoms may be consistent with…" |
| Detect / identify | Implies certainty | Flag, suggest, indicate |
| Accurate / % accuracy | Invites a clinical-validation claim | Describe the method instead |
| Cure, treat, prescribe | We do neither | Guidance, advice, next step |
| Patient | Implies a clinical relationship | You, your child |
| Free consultation | Implies a clinician is involved | Free symptom check |

### 4.3 Microcopy rules

- Buttons state the outcome: `Find nearby care`, `Start symptom check`. Never `Submit` or `Click here`.
- The emergency action is always labelled with what it does — `Call emergency` — never an ambiguous
  icon alone.
- Errors say what happened and the fix: "We couldn't load facilities. Check your connection and try
  again." No apologies, no error codes shown to users.
- Numbers are digits, always: "3 days", not "three days" — faster to scan, clearer to lower-literacy
  readers.
- Sentence case for all headings and buttons. Title Case reads as American marketing.

### Copy QA — two bugs already visible in the app mockups

Fix these in the app and don't reproduce them on the site:

- `"doctor.Schedule"` — missing a space
- `"Seek medical care Immediately!"` — capitalised mid-sentence

At this price point, a typo in the most serious message on the screen costs more trust than any
visual polish can win back.

---

## 5. Visual identity

The app is the source of truth. The website extends it rather than inventing a parallel look — a
visitor moving from site to install must feel one product.

### 5.1 Palette

Violet `#6B4EFF` is the brand colour, taken from the app. The triage colours are **semantic only**:
they encode urgency and nothing else. Never use red as a decorative accent, and never use the triage
green for a marketing button — if red means emergency everywhere except the newsletter box, it means
nothing anywhere.

| Role | App fill | Web text-safe | Notes |
|---|---|---|---|
| Brand violet | `#6B4EFF` | `#3D1F9E` | 5.0:1 on white — passes AA. The darker tone is already in the app; use it for links. |
| Ink | `#1A1A2E` | `#16141F` | Never pure black; the violet bias ties text to the accent. |
| Non-urgent | `#4CAF50` | `#157F4B` | App uses Flutter's `Colors.green`. At 2.8:1 it fails even large-text contrast — never use it for wording. |
| Urgent | `#FBBF24` | `#8A5A00` | **Worst offender:** 1.9:1 on white — effectively invisible as text. Must darken. |
| Emergency | `#EF4444` | `#C0281F` | 3.7:1 — fails AA for body text. Darken for any wording. |

Colour must never be the only carrier of meaning. Every urgency state needs a text label as well as
a hue — colour-blind users and anyone reading in bright Lagos sunlight depend on it.

#### Note for the mobile team — there is no theme file

The Flutter app currently has no central theme or token file. Colours are written inline, and the
triage palette mixes Flutter's Material defaults (`Colors.green`, `Colors.orange`, `Colors.red`)
with custom hex values (`#FBBF24`, `#F97316`, `#EF4444`, `#DC2626`). **Two different reds and two
different ambers are in use for what is conceptually one thing.**

The table above should become the shared source of truth for both surfaces — a `tokens` file in the
app and CSS custom properties on the web, generated from the same list. Until that exists, app and
website will drift, and "one product" is the thing we are selling.

### 5.2 Typography

Pick **one** humanist sans and use its full weight range. A serif is optional for long-form
editorial only. Whatever is chosen must be self-hosted and subset — a font request to a third-party
CDN is both a privacy leak and a slow first render on Nigerian networks.

- **Body:** 17–18px, line-height 1.6, measure capped at 68 characters. Do not go below 16px
  anywhere; this audience includes older readers on small screens.
- **Display:** tight tracking (−0.02em) at large sizes, weight 700+, `text-wrap: balance` on every
  headline.
- **Numbers:** `font-variant-numeric: tabular-nums` wherever figures align — the receipts in §3
  especially.
- **No all-caps body copy.** Uppercase only for short mono labels, with 0.1em letter-spacing.

### 5.3 Imagery — where premium is won or lost

This is the highest-risk area. Generic medical stock photography — a white-coated model with folded
arms, a stethoscope on a blue gradient — will make the brand look exactly like the scams it needs to
be distinguished from.

| ❌ Never | ✅ Always |
|---|---|
| Western stock doctors. Blue-gradient medical abstractions. Glowing DNA helices, circuit-board brains, "AI" iconography. Smiling models pointing at phones. | Commissioned photography of Nigerian people in real settings — a mother in her own home, a pharmacist in a Lagos shop, a health centre in Kano. Natural light. Documentary, not staged. |

If a photo budget isn't available at launch, **use the product UI instead of buying stock**. Real
screens in clean device frames are more premium than any stock image, and they carry information.
Illustration is acceptable in the app's existing flat style, but keep it to spot use — it should
never carry a hero on its own.

### 5.4 Layout & motion

- Generous vertical rhythm. Whitespace is the cheapest premium signal available and the only one
  that also improves comprehension.
- One primary action per screen. Two competing CTAs halve both.
- Corner radius: small and consistent (4–8px). Heavy rounding reads as consumer-toy; sharp corners
  read as institutional. Sit deliberately between.
- Motion is functional only — state changes, reveals under 200ms, no parallax, no scroll-jacking.
  Honour `prefers-reduced-motion`. Animation costs battery and CPU on the low-end devices most of our
  users hold.

---

## 6. How to describe the product — visually and verbally

### 6.1 Show the method, not a magic answer

The temptation is to show a screen saying "Malaria — 94%". That is the one thing we must never show.
It is also, conveniently, less interesting than the truth. The compelling story is the
**reasoning**: symptoms in, urgency and a route out.

Describe the flow in four honest beats, and use the real app screens for each:

1. **Tell it where it hurts.** Body area, then symptoms relevant to that area — not a list of 400
   checkboxes.
2. **It weighs what you said.** Against 50 conditions and 75 clinical rules, adjusted for age,
   pregnancy and season.
3. **It checks for danger signs first.** Red flags override everything else. Confusion, convulsions,
   difficulty breathing, dark urine — these jump straight to emergency regardless of the score.
4. **It tells you what to do and where to go.** One of three urgency levels, plus the nearest
   facilities that can actually treat it.

That third beat is worth a dedicated section on the site. **"Red flags override the score" is the
most trust-building sentence in the entire product**, because it is precisely the safety logic a
clinician would look for — and it is the opposite of a black box.

### 6.2 Explaining privacy visually

"Nothing you enter leaves your phone" is a headline claim, not a policy footnote. It is also
literally true: the scoring engine runs on-device and no symptom data is stored server-side.

Show it as a simple diagram: a phone containing the assessment, with one thin arrow leaving it
labelled *"the clinical rules come down"* — and no arrow going back up. One honest diagram
outperforms three paragraphs of privacy prose, and it is the kind of claim competitors cannot copy
without rebuilding their architecture.

### 6.3 Describing the conditions library

The 50 conditions are the site's largest content asset (see §12). Each one gets a page. For every
condition, lead with what a worried person actually needs, in this order:

1. **Danger signs — go now.** Top of the page, before anything else. Someone in an emergency must
   not have to scroll.
2. **What it is**, in two plain sentences.
3. **Common symptoms** in everyday words.
4. **Who is most at risk** — the demographic modifiers, stated plainly.
5. **When it's most common** — the seasonal story where one exists.
6. **What to do next**, then the disclaimer, then the app CTA.

Never structure these pages as "symptoms → likely diagnosis". Structure them as "symptoms → how
urgently to act". Same content, and only one of those is a claim we can defend.

---

## 7. Site map & page briefs

Eight routes at launch. Resist adding more; a small site executed precisely reads as more premium
than a large one padded out.

### `/` — Home

- **Job:** In one screen, make a stranger believe this is serious, local, and safe to trust — then
  get the install.
- **Hero:** Headline on urgency, not diagnosis. Suggested: "Know how urgently to act." Sub: what it
  does, for whom, where. Real app screen beside it, not an illustration.
- **Sections:** How it works (§6.1 four beats) · Red flags override the score · Private by design
  (§6.2) · The receipts (§3) · Conditions we cover · Coverage, stated honestly · Install
- **Primary action:** Get the app. One button, repeated at natural intervals — never a popup.
- **Never:** Carousel hero. Fake testimonials. Accuracy percentages. Countdown or urgency-marketing
  devices.

### `/how-it-works`

- **Job:** Convert the sceptical and the clinically literate — including partners and health workers
  evaluating us.
- **Content:** The four beats in depth, with a real worked example. Walk one fever in July through to
  an urgent recommendation, showing how season and age changed it. This single example does more than
  any feature list.
- **Must include:** Red-flag override logic · what the app deliberately does not do · that clinical
  artifacts are versioned and reviewed.

### `/conditions` — index and 50 detail pages

- **Job:** Organic search entry at the exact moment of worry, and proof of clinical depth.
- **Structure:** Index filterable by body area and by "common in Nigeria". Detail pages per §6.3.
- **Note:** This is the highest-traffic part of the site long-term. Someone searching "dark urine
  fever Lagos" at 2am should land here and be told to go now.

### `/find-care`

- **Job:** Prove the facility directory is real, and be genuinely useful to someone without the app.
- **Content:** Search by state and area. Show type, whether emergency-capable, and distance. Be
  explicit that only 45 records currently carry a phone number — an empty field the user expected to
  be filled is worse than a labelled gap.
- **Coverage:** Lagos, Kano, FCT — named, with counts. "Your state next" as a capture, not a claim.

### `/privacy`

- **Job:** Turn compliance into a selling point.
- **Content:** Plain-language summary first, legal text second. State what we never collect. NDPR
  obligations addressed explicitly (§11).

### `/clinical-safety`

- **Job:** The page that wins institutional trust — partners, health authorities, journalists,
  investors.
- **Content:** Sources behind the knowledge base. Who reviews it. How versioning works. Named
  clinical reviewers with credentials, once we can. Limitations, stated by us before anyone else
  states them for us.

### `/partners` — for clinics, employers & NGOs

- **Job:** Open the B2B channel. Different voice: this reader may be a clinician or a procurement
  officer, so precision beats simplicity here.
- **Primary action:** Book a conversation. A form, not an app install.

### `/about`

- **Job:** Answer "who is behind this, and why should I believe them?" — the decisive question in
  health.
- **Content:** Real names, real faces, real credentials. Why Nigeria, why these conditions.
  Anonymous health brands do not get trusted, and shouldn't be.

---

## 8. UX principles

### 8.1 Design for the worst moment, not the best

Assume the visitor is frightened, one-handed, on a cracked mid-range Android, on patchy data,
possibly at night, possibly holding a sick child. Every decision follows from that picture rather
than from a designer's 27-inch monitor.

- **Emergency information is never behind an interaction.** No accordion, no tab, no "read more" on
  a danger sign.
- **Touch targets 48×48px minimum**, with 8px between adjacent targets.
- **Thumb reach:** primary actions in the lower half of the viewport on mobile.
- **Sunlight legibility:** test outdoors, not just in a dark room. Low-contrast grey-on-grey
  disappears entirely at noon.
- **No dark patterns, ever.** No fake scarcity, no guilt-trip unsubscribe, no pre-checked consent. In
  health this is not merely distasteful — it is the fastest way to lose the trust the whole brand
  rests on.

### 8.2 Trust architecture

Trust signals are load-bearing structure, not decoration. Place them where doubt actually occurs:
next to the claim that provokes it. A privacy line belongs beside the symptom-check CTA, not only on
`/privacy`. Clinical sourcing belongs on condition pages, not only on `/clinical-safety`.

### 8.3 Forms

- Ask for the minimum. Every field is a reason to leave, and in health it is also a liability.
- Label above the field, always visible. Placeholder-only labels fail the moment typing starts.
- Validate on blur, not on keystroke. Errors beside the field, in words.
- Nigerian phone formats accepted in every common shape — `0803…`, `+234803…`, with spaces. Never
  reject a valid number on formatting.

---

## 9. Performance budget

In Nigeria, mobile data is bought in bundles and page weight is a direct cost to the user. A heavy
site is not just slow — it is expensive, and it is a health site failing the people with the least.
Treat these as **build-failing budgets**, not aspirations.

| Metric | Budget | Why this number |
|---|---|---|
| Largest Contentful Paint | < 2.5s on 4G · < 5s on 3G | Measured throttled, on a mid-range Android — not on desktop fibre |
| Total page weight | < 500 KB | Roughly the cost ceiling before a bundle-conscious user notices |
| JavaScript shipped | < 120 KB gzipped | Parse cost on low-end CPUs dominates, not download |
| Fonts | ≤ 2 files, subset, self-hosted | No third-party font request: privacy and latency |
| Images | AVIF/WebP, responsive, lazy below fold | Never ship a 2MB hero JPEG |
| Lighthouse mobile | ≥ 95 across all four | Accessibility and SEO are non-negotiable in this category |

### Recommended approach

Static-first: a statically generated site (Next.js static export, Astro, or similar) on a CDN with
African edge presence. Condition pages are static content and must never require JavaScript to read.
The facility search is the one genuinely dynamic feature — build it so the page renders and is
readable before that JavaScript arrives.

**Every page must be readable with JavaScript disabled or failed.** On flaky connections, partial
script failure is common — and a health page that renders blank is the worst possible outcome.

---

## 10. Accessibility

**WCAG 2.2 AA is the floor.** This is a health service: users may have impaired vision, tremor, low
literacy, or be reading in a second language while distressed. Access is a clinical safety property,
not a checkbox.

- Contrast: 4.5:1 body text, 3:1 large text and UI boundaries. The app's amber and red both fail as
  text — use the darkened values in §5.1.
- Never colour alone: every urgency state carries a text label.
- Full keyboard operation with a visible focus ring. Never `outline: none` without a replacement.
- Semantic HTML and one `h1` per page. Landmarks: `header`, `nav`, `main`, `footer`.
- Real alt text on informative images; empty `alt=""` on decorative ones.
- Test with a screen reader on the emergency path specifically. If one flow gets manual testing, it
  is that one.
- Support 200% zoom and text-only resize without loss of content.

---

## 11. Legal & safety guardrails

Non-negotiable, and cheaper to build in than to retrofit.

- **Disclaimer placement:** on the home page, on every condition page, and on any page showing an
  urgency level. Legible, not hidden (§1).
- **Emergency signposting:** every page footer carries how to reach emergency help. Never let a
  distressed visitor hunt for it.
- **No testimonials that imply diagnosis.** "WellaPath told me I had typhoid" cannot be published
  even if a user genuinely said it. Acceptable: "It told me not to wait, and I went in that night."
- **No before/after or outcome claims.** No survival or recovery statistics attributed to using the
  app.
- **NDPR compliance:** Nigeria Data Protection Regulation applies. Lawful basis stated, consent for
  analytics that is genuinely opt-in and not pre-checked, a named contact for data requests, and a
  documented retention period.
- **Analytics restraint:** a privacy-respecting, cookieless tool by preference. Never send symptom or
  condition-page detail to a third-party ad network — that would leak health interest data and
  contradict the core privacy claim.
- **No third-party ad pixels on condition pages.** This is the single most sensitive category of
  browsing data on the site.

---

## 12. SEO & discovery

The 50 condition pages are the growth engine. People search symptoms, in their own words, usually at
night. Most of what they currently find was written for American readers and has never heard of
Lassa fever.

- **Target symptom language, not clinical names.** "Fever and dark urine" earns more qualified
  traffic than "haemoglobinuria".
- **Localise deliberately:** "malaria symptoms in children Nigeria", "cholera signs Lagos". This is
  where we can genuinely outrank global sites, because we are more relevant, not because we are
  bigger.
- **Structured data:** `MedicalWebPage` and `MedicalCondition` schema on condition pages;
  `Organization` sitewide. Health results are heavily curated — schema and visible authorship both
  matter.
- **Show authorship and review dates.** "Reviewed by [clinician], March 2026" is both a ranking
  factor in this category and a genuine trust signal.
- **Seasonal content:** publish ahead of the rainy season and outbreak periods. The engine already
  knows about seasonality; the content calendar should too.
- **Never optimise a symptom page into a diagnosis claim** to chase a keyword. The ranking is not
  worth the risk, and the pages that overclaim are exactly the ones health-search updates demote.

---

## 13. Definition of done

No page ships until every line here is true of it.

- [ ] No banned word from §4.2 appears anywhere in the copy
- [ ] The disclaimer is present, legible, and not visually suppressed
- [ ] Emergency contact information is reachable from the footer of this page
- [ ] Every urgency state carries a text label as well as a colour
- [ ] All text meets 4.5:1 contrast; amber and red use the darkened §5.1 values
- [ ] Fully keyboard operable, with a visible focus state throughout
- [ ] Screen-reader pass completed on any page that shows an urgency level
- [ ] Lighthouse mobile ≥ 95 on performance, accessibility, best practices and SEO
- [ ] Page weight under 500 KB; JavaScript under 120 KB gzipped
- [ ] Readable and navigable with JavaScript disabled
- [ ] Tested on a real mid-range Android over throttled 3G — not only in a desktop browser
- [ ] Tested outdoors in direct sunlight
- [ ] Coverage claims name Lagos, Kano and the FCT; nothing claims national coverage
- [ ] Every statistic traces to a shipped clinical artifact and matches §3 exactly
- [ ] No third-party ad or analytics pixel on any condition page
- [ ] Consent for analytics is opt-in and not pre-checked

---

## 14. Open decisions

These need answers from the founder before the relevant work starts. Each one changes the build
rather than merely the wording.

**Who clinically reviews the knowledge base, and may we name them?**
A named reviewer with credentials is the strongest trust asset available, and §12 depends on it for
health-search credibility. Blocks `/clinical-safety`.

**Is the primary conversion an app install, or a web symptom check?**
If the assessment ever runs on the web, the on-device privacy claim needs rewording and the engine
needs a second home. Recommend install-only at launch — it keeps the privacy story absolutely clean.

**English only at launch?**
Hausa, Yoruba and Igbo would widen reach considerably, and Kano coverage in particular argues for
Hausa. It changes typography, layout and the content pipeline, so it must be decided before build
rather than retrofitted.

**Is there existing brand identity beyond the app's violet?**
Logo, wordmark, any typeface licence. If not, that is a prerequisite piece of work, and the palette
in §5.1 should be treated as derived-from-app rather than final.

**Which emergency number do we publish?**
112 nationally, but state services differ and Lagos has its own. Getting this wrong is a safety
issue, not a content one. Needs verification per covered state.

**Is B2B in scope for launch?**
If `/partners` ships, it needs a real offer and a real pipeline behind it. An empty B2B page is
worse than none.

---

*WellaPath — Website Guide v1.0 · Clinical decision support, not a diagnosis engine · Figures
verified against shipped artifacts (`kb.ng.v2.4`, `rules.ng.v2.2`, `facilities.ng.v1.1`).*
