# WuXue — Design System

**WuXue** (武学 · *wǔxué*, "martial studies") is a progressive wushu learning app by **Infinite Wushu**. It teaches Chinese martial arts step-by-step — from basic stances (步型 *bùxíng*) through forms and weapons — with English-first copy and Chinese characters woven in lesson by lesson.

The signature feature is a **camera-based practice view** where a student stands 2–3 meters from their phone and receives live pose-detection feedback on their stance alignment. Everything in the practice surface is sized for viewing at arm-span-plus distance.

---

## Sources

All brand material in this design system was extracted from the product codebase. Nothing in the pack is fabricated.

- **Codebase:** [github.com/scatapusan/infinite-wushu](https://github.com/scatapusan/infinite-wushu) (Next.js 14 · Tailwind 3 · TypeScript · Supabase · MediaPipe Tasks Vision)
- **Pinned files that defined the system:**
  - `app/globals.css` — color tokens, button utilities, Chinese-display modes
  - `tailwind.config.ts` — palette, fontFamily, practice-distance font sizes, border radii
  - `app/layout.tsx` — `Inter` + `Noto Serif SC` via next/font, forced dark theme
  - `CONTENT_STANDARDS.md` — attribution rules, tone, sourcing
  - `components/*` — 43 production React components (landing, dashboard, lesson, quiz, practice suite)

---

## Index

Files at the root of this system:

| File | What it is |
|---|---|
| `README.md` | This document. Brand, content, visual, iconography guides. |
| `SKILL.md` | Agent Skill manifest — drop this folder into Claude Code and invoke as a skill. |
| `colors_and_type.css` | All CSS variables for color, type, spacing, radii, shadows. Import this from any artifact. |
| `assets/` | Logos, illustrations, any raster/vector brand assets. |
| `fonts/` | Bundled web fonts (Inter, Noto Serif SC). |
| `preview/` | Small HTML cards that render in the Design System tab. |
| `ui_kits/app/` | JSX component recreations + live interactive index. The only product surface. |

There is **one product, one surface**: the WuXue mobile web app. No separate marketing site, no desktop app, no docs site. Everything described here is about the app.

---

## Product at a glance

| Area | What it does |
|---|---|
| **Landing** | Signed-out hero. Brand lock-up 武学 in gold, CTA pair (Create / Sign in), demo link, Facebook follow button. |
| **Dashboard** | Signed-in home. Overall progress bar (cyan→gold gradient), "Continue learning" resume card, vocab-due badge, Chinese-display toggle, module grid grouped by Foundation / Forms. |
| **Module & Lesson pages** | Lesson cards numbered with Chinese-script circles, quiz scores displayed as percentages, prerequisite-based lock states. |
| **Technique Card** | English title, pinyin + gold Chinese + speak button, demo video, key points (cyan checks), common mistakes (crimson warning block), source attribution, "Practice This Stance" CTA. |
| **Quiz** | Multiple-choice, cyan correct / crimson wrong, explanation callout, speak button for any Chinese in the prompt. |
| **Practice (single stance)** | Full-screen camera view, skeleton overlay, circular hold timer with score dial, rotating correction headline, verdict screen. |
| **Practice (guided form)** | Multi-movement flow — intro overlay, per-movement transitions, countdown, movement-info card, pause overlay, form-complete summary with score breakdown. |
| **Vocab** | Searchable grid of flashcards with category tints. Spaced-repetition review with due-count badge. |
| **Settings** | Coach mode toggle, quick mode, hand-tracking toggle, sign-out. |

---

## CONTENT FUNDAMENTALS

**Voice: the calm senior student.** Copy is patient, direct, non-condescending. It assumes you've shown up to train — it never hypes or celebrates for you. Instruction is declarative ("Stand in frame to begin…"), status is plain-stated ("3 vocab cards due"), and failures are framed as information, not judgment ("Adjust camera angle — some landmarks not clearly visible.").

**Bilingual pattern.** Every concept has three faces: **English first** (semantic anchor), **pinyin in italic** (pronunciation), **Chinese characters in gold Noto Serif SC** (the real name). They appear in this order inline:

> Horse Stance · *mǎbù* · **馬步**

The Chinese-display toggle lets the reader hide pinyin, hide characters, show all, or English-only — so the copy has to read naturally in any of those four modes. Never lead with characters in body copy; always anchor in English.

**Casing.**
- **Sentence case** for titles, buttons, headings: "Create account", "Continue learning", "Practice this stance".
- **UPPERCASE with wide tracking** (`letter-spacing: 0.15–0.30em`) for three specific things: section eyebrows ("YOUR JOURNEY"), the practice-view HUD ("OFFICIAL", "FORM COMPLETE", "NEXT UP"), and the landing tagline ("INFINITE WUSHU").
- **No Title Case Like This** anywhere in the product.

**I/you.** Addresses the reader as "you" and their context as "your" ("Your journey", "your training"). Never "we", never "our product". The app does not personify.

**Emoji.** Effectively not used. A single hand emoji (✋) appears in the practice exit hint ("Arms up 1s = exit"), because it describes a physical gesture. Otherwise, **no emoji anywhere** — status uses lucide icons, dots, or plain text.

**Numbers and data.** Tabular-nums everywhere numbers live next to other numbers (scores, timers, `4 of 12 lessons`, `85%`). Durations as `m:ss` (`1:42`). Scores as integers without % (`85`), percentages only for progress aggregates (`42%`).

**Specific examples from the product:**

- Empty: *"No modules yet. Check back soon."*
- Success: *"All caught up · You've completed every lesson"*
- Reassurance: *"Your progress is private and only visible to you."*
- Instruction: *"A progressive curriculum from 步型 (bùxíng, stances) to forms and weapons. English first, with Chinese woven in lesson by lesson."*
- Disclaimer (compact): *"AI is a training aid — not a replacement for coach feedback."*
- Disclaimer (full, 2-line): *"AI evaluation is a training aid, not a replacement for coach feedback. · Scoring accuracy depends on camera position, lighting, and body visibility."*
- Practice HUD: `OFFICIAL` · `NEXT UP` · `FORM COMPLETE` · `EXIT` · `START NOW`
- Form-complete flag: *"← WEAK"* next to the lowest-scoring movement.

**Content attribution is a first-class rule.** Every technique and vocab entry carries one of: `iwuf-official` · `iwuf-aligned` · `community` · `internal` · `unattributed`. The UI shows the source line below key-points. Do not invent technique content without a real source — this is not decorative.

---

## VISUAL FOUNDATIONS

### The mood
A dojo at night with the lamps on. Deep navy ink, a single cyan glow, brass-gold for anything Chinese. The base is dark; color is used *sparingly* and with intent. The product is never dressed up — it's uniformed.

### Color
- **Ink / background** `#080c1a` — deep, slightly blue-black navy. The canvas.
- **Surface** `#0d1328` — raised card, 1 step above ink. Paired with a thin cyan-tinted border `rgba(0,180,230,0.12)`.
- **Parchment / foreground** `#e0eaf0` — body text, off-white with a cool bias.
- **Cyan** `#00b4e6` — the primary. Brand, CTAs, active state, progress, positive confirmation.
- **Gold** `#d4a030` — accent. *Only* for Chinese characters, star ratings, and the Facebook chip. Using gold for a generic button is wrong; it carries cultural weight.
- **Crimson** `#e85d4a` — destructive / alarm. Common-mistakes blocks, wrong-answer state, error banners, retry buttons.

Two **semantic extensions** exist for downstream product work:
- **Practice view (ultra-saturated)** for the 2–3m camera surface: pass `#00FF88`, warn `#FFD700`, fail `#FF3355`, reference `#00D4FF`, bg `#050B1A`. These deliberately break the muted brand palette — they're engineered for glance-readability under real-world lighting.
- **Gradient accent** — cyan→gold is the one blessed gradient. Used for the overall-progress bar on the dashboard. Never used as a background, never on a button. The gradient says "traditional meets athletic" without shouting it.

### Backgrounds & texture
- Mobile: **flat navy.** No gradient, no image.
- Desktop (≥640px): a faint **cyan dot grid** (`radial-gradient(circle at 1px 1px, rgb(0 180 230 / 0.04) 1px, transparent 0) 28px`). Nearly invisible up close — reads as texture, not pattern.
- The practice-view darkens to `#050B1A/90` with `backdrop-filter: blur(12px)` when the camera feed is behind an overlay.
- **No hand-drawn illustrations.** No photography. No full-bleed imagery. The brand illustration *is* the single character 武 or the pair 武学 set in gold Noto Serif SC.

### Typography
- **Inter** — the entire Latin stack. Loaded via next/font, weights 400/500/600/700/900.
- **Noto Serif SC** — every Chinese character. Always. Never rendered in Inter.
- **Two parallel scales:** the standard app scale (11–36px, driven by Tailwind defaults) and the **practice-distance scale** (28px / 40px / 56px / 80px) for anything visible inside the camera view.
- **28px is a hard floor** in the practice surface. Nothing smaller than `practice-small` may appear there — not a label, not a unit, not a hint.
- Chinese characters are usually one size larger than their English counterpart when they sit side-by-side, and nearly always in gold.
- Italic is reserved for pinyin. Don't italicize English for emphasis.

### Layout
- **Max width `max-w-3xl`** (768px) for main content columns. The app is built mobile-first; wider screens letterbox rather than spread.
- **`px-6`** (24px) is the canonical horizontal gutter. `px-4` on very narrow screens.
- **Safe areas (`safe-pt` / `safe-pb`)** are respected — this ships as a PWA-friendly mobile web app, so notch and home-indicator insets matter.
- Stacked cards with `space-y-4` or `space-y-6`. Grid of modules uses `sm:grid-cols-2`, gap-4.

### Cards
- `border-radius: 16px` (`card`). Smaller chips use `card-sm` = 10px, buttons use `card-md` = 12px, hero surfaces use `card-lg` = 20px.
- `background: #0d1328`. `border: 1px solid rgba(0,180,230,0.12)`.
- **No drop shadow.** Elevation is signaled by fill + border, not by shadow. The dark canvas makes shadows pointless anyway.
- Hover: border brightens to `rgba(0,180,230,0.4)` (`hover:border-cyan/40`).
- Disabled / locked: `opacity: 0.5` on the whole card, lock icon top-right.

### Borders & radii
Borders are always `1px`, thin. When hairlines need to disappear (dividers inside a card) use `divide-y divide-white/10`. Radii: `10 / 12 / 16 / 20` + full-round for dots and toggle knobs. Never square corners, never 4 or 6px.

### Shadows & glows
- **No card drop shadows.** Seriously, none.
- **Glows** appear in exactly one place: practice-view score numbers get a `textShadow: 0 0 30px <score-color>55`. This is the entire glow system.
- The correction headline layers `0 2px 24px rgba(255,215,0,0.5), 0 0 8px rgba(0,0,0,0.8)` so the gold text stays legible over a live camera feed.

### Animation
- **Small, functional.** `transition: 150ms ease` is the default. Hover and active states use it.
- **Active/press:** `transform: scale(0.97–0.98)`. Never a color flash — always a shrink.
- **Hold timer:** the circular SVG arc eases with `transition: stroke-dashoffset 0.1s linear, stroke 0.3s ease` — a deliberately mechanical tick, not a soft lerp.
- **Completion pulse:** Tailwind's `animate-ping` on the hold-timer ring when the hold target is met. Only one thing pulses at a time.
- **No bounces, no spring physics, no parallax, no entrance choreography.** A lesson doesn't "reveal itself"; it's just there.

### Hover / press / focus
- **Hover:** color brighten (text: `foreground/70` → `foreground` or `→ cyan`; border: `white/10` → `cyan/40`). Never a darken.
- **Press:** `scale(0.97)` on interactive items, `scale(0.98)` on buttons.
- **Focus-visible:** 2px cyan outline, 2px offset, 4px radius. Global rule. Do not disable this.
- Toggles use a dedicated 48×28px pill (see `components/ToggleSwitch.tsx`) — the knob slides via `left` position, not transform, so focus outlines don't get clipped.

### Transparency & blur
- Overlays on top of the camera or content dim the background to `rgba(8, 12, 26, 0.90–0.95)` and apply `backdrop-filter: blur(12px)`.
- Inline translucent fills use `white/0.02–0.06` for filled inputs and soft chips, `cyan/0.05–0.15` for active-tab fills, `gold/0.10` for the Facebook chip, `crimson/0.05` for the common-mistakes warning panel.
- No large-area translucent panels. Blur is for overlays only.

### Protection (legibility over imagery)
When text sits over a live camera feed, it is protected by **a combination of layers**, not a capsule background:
1. `font-weight: 900` (black)
2. `text-shadow` with both a colored glow and a black outline
3. `-webkit-text-stroke: 1px rgba(0,0,0,0.3)`

This is the correction-headline pattern. The app deliberately avoids dropping a solid pill behind HUD text because it breaks the "camera feed is the canvas" feeling. Solid panels are only used when they carry their own content (feedback panel, intro overlay).

### Iconography
See the dedicated section below.

---

## ICONOGRAPHY

**Primary set: [Lucide](https://lucide.dev) via `lucide-react` v0.460.0.** Used everywhere a glyph is needed. Import per-icon as a React component — never the full set.

**Seen in production:** `BookOpen` · `Lock` · `Play` · `Check` · `Circle` · `Star` · `Camera` · `AlertTriangle` · `ArrowRight` · `Info` · `Settings` · `Search` · `CheckCircle` · `AlertCircle` · `RotateCcw` · `ExternalLink` · `X`.

**Usage rules:**
- Default size is **14–18px**. `size={14}` inside buttons, `size={16–18}` standalone.
- Stroke inherits `currentColor` — color is set by the parent text-* class. A cyan check is `<Check className="text-cyan" />`, not an icon color prop.
- Icons always pair with a label except in two cases: the settings gear (has `aria-label="Settings"`) and the sign-out button. Both have 44×44px minimum hit targets.
- The status-icon set for lessons: `Lock` (locked) · `Check` (completed) · `Play` (in-progress) · `Circle` (ready). This is the canonical progression.

**Score badges in practice view.** `CheckCircle` for verified, `AlertCircle` for preliminary. 12px, paired with a pill label ("Verified" / "Preliminary").

**Emoji.** Only ✋ in the arms-up-to-exit hint. No other emoji. Do not add them.

**Unicode.** The middle-dot `·` is used as a soft inline separator (`武学 · WuXue · by Infinite Wushu`). The em-dash `—` is the punctuation workhorse. The right-arrow `→` appears once ("Preview without an account →"). Em-dash and middle-dot are part of the brand voice — don't replace them with hyphens.

**Logos and brand marks.**
- **Primary mark:** the character pair **武学** set in Noto Serif SC Bold, `#d4a030` (gold).
- **Wordmark:** **WuXue** in Inter Bold, `#00b4e6` (cyan), tracking `wide` (`tracking-wide`).
- **Sub-line:** "by Infinite Wushu" in Inter Medium, 10px, `tracking-wider`, at `foreground/40`.
- **Standard lock-up:** 武学 (gold, 24px) on the left, WuXue stacked over "by Infinite Wushu" on the right. Header pattern.
- **Landing hero variant:** 武学 set at 60–72px, stand-alone, with "INFINITE WUSHU" as an eyebrow above in wide-tracked cyan.

There is **no horizontal logo file**, no favicon SVG, no icon app — the mark is always rendered as live text. This has a practical advantage: it inherits the Chinese-display toggle when relevant and always scales crisply.

---

## Font substitutions

Currently **none**. The product uses Google Fonts via next/font: **Inter** (Latin) and **Noto Serif SC** (Chinese). Both are freely available — link them via `<link>` or `@import` and you're authentic. The `fonts/` folder in this system contains placeholders in case the host wants to self-host; fetch the TTFs from Google Fonts directly when needed.

---

## Caveats for humans reading this

- **Images:** the repo ships with no raster brand imagery — no photos, no illustrations, no backgrounds. This is intentional. If you need hero imagery for a marketing artifact, ask the Infinite Wushu team directly; do not generate synthetic images.
- **Demo content:** lessons in the app include video embeds (YouTube, IWUF Classroom). Videos are *content*, not assets — do not copy video URLs into mocks.
- **Practice palette vs brand palette:** they are different on purpose. If you're mocking the camera view, use the high-saturation set. If you're mocking anything else, use the muted brand set.
