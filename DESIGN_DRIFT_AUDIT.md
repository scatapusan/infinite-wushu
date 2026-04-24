# WuXue Design System — Drift Audit

Audited against `.claude/skills/wuxue-design/README.md` and `.claude/skills/wuxue-design/SKILL.md`.
All file reads confirmed directly. Agent-assist used for initial triage; every flagged violation verified by hand.

---

## Section 1 — Summary

### Totals

| Severity | Count | Description |
|----------|-------|-------------|
| **HIGH** | 43 | Semantic violations: wrong radii pixel values, emoji violations, Title Case, sub-floor practice fonts, off-palette colors |
| **MEDIUM** | 91 | Color token drift (correct values, wrong token name, or off-palette by one), wrong Tailwind radius tokens (same pixel value but not using design system class), hardcoded hex values that should be Tailwind tokens |
| **LOW** | 8 | Over-aggressive press scale, redundant shadow layering, undocumented font families |
| **DISCUSS** | 7 | Defensible but not clearly documented choices |
| **Total** | 149 | Across 20 files |

### Breakdown by category

| Category | HIGH | MED | LOW | Total |
|----------|------|-----|-----|-------|
| Color — off-palette hex | 2 | 61 | 0 | 63 |
| Color — emoji violations | 3 | 0 | 0 | 3 |
| Typography — Title Case | 10 | 0 | 0 | 10 |
| Typography — practice font floor | 7 | 0 | 0 | 7 |
| Spacing / radii — forbidden values | 10 | 0 | 0 | 10 |
| Spacing / radii — wrong token name | 0 | 13 | 0 | 13 |
| Component patterns — press scale | 0 | 0 | 8 | 8 |
| Component patterns — misc | 0 | 9 | 0 | 9 |
| Discuss | — | — | — | 7 |

### Files affected
20 of 63 files audited have at least one violation. All violations are concentrated in **`components/practice/`** and the two practice page orchestrators in **`app/practice/`**.

---

## Section 2 — Per-file breakdown

### Two global color drift patterns (appear in ≥5 files each)

Before per-file listing, two palette errors appear system-wide:

| Drift color | Used as | Should be | Severity | Files |
|-------------|---------|-----------|----------|-------|
| `#22D3EE` | "cyan" in practice UI | Brand cyan `#00b4e6` (`text-cyan`) OR practice-ref `#00D4FF` (`text-practice-ref`) | MEDIUM | SetupScreen, FormCompleteScreen, FormExitConfirm, FormIntroOverlay, FormMovementInfoCard, FormPausedOverlay, PracticePage, PracticeFormPage |
| `#22c55e` | "pass green" | Practice-pass `#00FF88` (`text-practice-pass`, `bg-practice-pass`) | HIGH (semantic mismatch) | FeedbackPanel, HandFeedbackRow, BodyVisibilityOverlay, ResultsScreen, HoldTimer, ScoreCircle |

`#22D3EE` is Tailwind's `cyan-300` — not the brand cyan (`#00b4e6`) and not the documented practice-ref (`#00D4FF`). It appears nowhere in the design system spec.

`#22c55e` is Tailwind's `green-500` — not the documented practice-pass (`#00FF88`). Any "correct / passing" dot or text should use `#00FF88`.

---

### `components/practice/SetupScreen.tsx`

**Effort: L (100+ lines, systematic rewrite of inline styles)**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 41 | Color | `#22D3EE` (toggle on-state) | `rgb(var(--cyan))` or `#00b4e6` | MEDIUM |
| 63 | Color | `#94A3B8` (SectionLabel color) | `foreground/50` (`text-foreground/50`) | MEDIUM |
| 92 | Spacing | `bg-[#050B1A]` as full-screen wrapper | `bg-practice-bg` or keep — DISCUSS | DISCUSS |
| 102 | Radii | `rounded-xl` (back button) | `rounded-card-md` (12px) | MEDIUM |
| 111 | Color | `text-[#FFD700]` (Chinese technique name) | `text-practice-warn` or `text-gold` — in practice context, `#FFD700` is practice-warn not gold (#d4a030). DISCUSS | DISCUSS |
| 120 | Radii | `rounded-2xl` (distance check panel) | `rounded-card` (16px) | MEDIUM |
| 122–125 | Color | `#CBD5E1` (instruction text) | `text-foreground/70` | MEDIUM |
| 131 | Color | `#00FF88` hardcoded indicator dot | `bg-practice-pass` | MEDIUM |
| 137 | Color | `#00FF88` text | `text-practice-pass` | MEDIUM |
| 155 | Radii | `rounded-2xl` (camera angle button) | `rounded-card` | MEDIUM |
| 157–158 | Color | `#22D3EE` selected border/bg | `border-cyan` / `bg-cyan/10` | MEDIUM |
| 166 | Color | `#22D3EE` selected text | `text-cyan` | MEDIUM |
| 187 | Radii | `rounded-2xl` (lead leg button) | `rounded-card` | MEDIUM |
| 189–190 | Color | `#22D3EE` selected border/bg | `border-cyan` / `bg-cyan/10` | MEDIUM |
| 198 | Color | `#22D3EE` selected text | `text-cyan` | MEDIUM |
| 204–205 | Typography | `fontSize: "1.25rem"` (20px) on "FORWARD" label in practice-surface context | ≥ 28px (`practice-small`) | HIGH |
| 230 | Radii | `rounded-2xl` (options toggle rows) | `rounded-card` | MEDIUM |
| 252 | Radii | `rounded-2xl` (dominant hand buttons) | `rounded-card` | MEDIUM |
| 254–255 | Color | `#22D3EE` selected border/bg | `border-cyan` / `bg-cyan/10` | MEDIUM |
| 259–260 | Emoji | 👈 / 👉 pointing hand emojis | No emoji. Show "LEFT" / "RIGHT" text only (✋ is the only permitted emoji) | HIGH |
| 263 | Color | `#22D3EE` selected text | `text-cyan` | MEDIUM |
| 275 | Radii | `rounded-2xl` (voice hint banner) | `rounded-card` | MEDIUM |
| 275 | Color | `#22D3EE` border/bg | `border-cyan/20` / `bg-cyan/5` | MEDIUM |
| 276 | Color | `text-[#22D3EE]` | `text-cyan` | MEDIUM |
| 289 | Radii | `rounded-3xl` (START button) | `rounded-card-lg` (20px) | HIGH |
| 293 | Color | `#22D3EE` start button bg | `bg-cyan` | MEDIUM |
| All toggle rows | Component | `active:scale-95` | `active:scale-[0.97]` or `active:scale-[0.98]` | LOW |

---

### `components/practice/FormCompleteScreen.tsx`

**Effort: M (20-100 lines)**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 25 | Color | `#A0FF4A` (score 70–85 band) | Not in any documented palette. Nearest valid: `#FFD700` (practice-warn). **Only 5 values exist in practice palette.** | HIGH |
| 51 | Typography | `"Total Score"` Title Case | `"Total score"` | HIGH |
| 57 | Color | `text-[#FFD700]` (Chinese form title) | `text-practice-warn` (or text-gold in non-practice context). In practice context, DISCUSS | DISCUSS |
| 66 | Typography | `.toUpperCase()` applied to `meta.english` | OK — HUD heading uppercasing is documented. Compliant | — |
| 71 | Radii | `rounded-3xl` (total score panel) | `rounded-card-lg` (20px) | HIGH |
| 75 | Typography | `"Total Score"` Title Case | `"Total score"` | HIGH |
| 100 | Typography | `"Movement Breakdown"` Title Case | `"Movement breakdown"` | HIGH |
| 105 | Radii | `rounded-3xl` (breakdown panel) | `rounded-card-lg` | HIGH |
| 168 | Radii | `rounded-3xl` (Practice Again button) | `rounded-card-lg` | HIGH |
| 168 | Color | `bg-[#22D3EE]` | `bg-cyan` | MEDIUM |
| 170 | Typography | `"Practice Again"` Title Case on button | `"Practice again"` | HIGH |
| 175 | Radii | `rounded-3xl` (Exit to Lessons link) | `rounded-card-lg` | HIGH |
| 177 | Typography | `"Exit to Lessons"` Title Case | `"Exit to lessons"` | HIGH |

---

### `components/practice/FormExitConfirm.tsx`

**Effort: XS (1-5 lines)**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 11 | Radii | `rounded-3xl` (dialog panel) | `rounded-card-lg` | HIGH |
| 27 | Radii | `rounded-3xl` (KEEP GOING button) | `rounded-card-lg` | HIGH |
| 27 | Color | `bg-[#22D3EE]` | `bg-cyan` | MEDIUM |
| 34 | Radii | `rounded-3xl` (EXIT button) | `rounded-card-lg` | HIGH |
| 34 | Color | `text-[#FF3355]` hardcoded | `text-practice-fail` | MEDIUM |

---

### `components/practice/FormIntroOverlay.tsx`

**Effort: S (5-20 lines)**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 38 | Radii | `rounded-2xl` (EXIT button) | `rounded-card` | MEDIUM |
| 38 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |
| 55 | Color | `text-[#FFD700]` (Chinese form name) | `text-practice-warn` in practice context | MEDIUM |
| 73 | Radii | `rounded-3xl` (first movement card) | `rounded-card-lg` | HIGH |
| 76 | Typography | `fontSize: "1.5rem"` (24px) on "Starting with movement 1" label in practice surface | ≥28px | HIGH |
| 81 | Color | `text-[#FFD700]` (Chinese movement name in card) | `text-practice-warn` | MEDIUM |
| 95 | Color | `border-[#00D4FF]` — #00D4FF IS practice-ref, but hardcoded | `border-practice-ref` | MEDIUM |
| 99 | Color | `text-[#00D4FF]` hardcoded | `text-practice-ref` | MEDIUM |
| 110 | Radii | `rounded-2xl` (START NOW button) | `rounded-card` | MEDIUM |
| 110 | Color | `bg-[#22D3EE]` | `bg-cyan` or `bg-practice-ref` | MEDIUM |
| 110 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |

---

### `components/practice/FormMovementInfoCard.tsx`

**Effort: S**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 14 | Radii | `rounded-3xl` (card panel) | `rounded-card-lg` | HIGH |
| 18 | Color | `text-[#FFD700]` (Chinese movement name) | `text-practice-warn` | MEDIUM |
| 55 | Color | `text-[#00D4FF]` (bullet dot) | `text-practice-ref` | MEDIUM |
| 68 | Radii | `rounded-3xl` (Continue button) | `rounded-card-lg` | HIGH |
| 68 | Color | `bg-[#22D3EE]` | `bg-cyan` | MEDIUM |
| 74 | Typography | `fontSize: "1.5rem"` (24px) on hint text in practice surface | ≥28px | HIGH |

---

### `components/practice/FormPausedOverlay.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 12 | Color | `text-[#FFD700]` (PAUSED heading) | `text-practice-warn` — #FFD700 IS practice-warn but hardcoded. The textShadow `rgba(255,215,0,0.4)` matches README pattern, so shadow is COMPLIANT | MEDIUM |
| 26 | Radii | `rounded-3xl` (RESUME button) | `rounded-card-lg` | HIGH |
| 26 | Color | `bg-[#22D3EE]` | `bg-cyan` | MEDIUM |
| 32 | Radii | `rounded-3xl` (Exit form button) | `rounded-card-lg` | HIGH |

---

### `components/practice/FormTransitionOverlay.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 45 | Color | `text-[#FFD700]` (Chinese name) | `text-practice-warn` | MEDIUM |
| 75 | Color | `stroke="#00D4FF"` in SVG | `stroke="currentColor"` + `text-practice-ref` on parent, OR keep — SVG stroke doesn't take Tailwind classes directly. DISCUSS | DISCUSS |
| 86 | Color | `text-[#00D4FF]` (countdown number) | `text-practice-ref` | MEDIUM |
| 96 | Radii | `rounded-2xl` (Skip button) | `rounded-card` | MEDIUM |
| 96 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |

---

### `components/practice/FeedbackPanel.tsx`

**Effort: S**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 24 | Color | `bg-[#22c55e]` (pass dot) | `bg-practice-pass` (`#00FF88`) | MEDIUM |
| 30 | Color | `text-[#22c55e]` (pass text) | `text-practice-pass` | MEDIUM |
| 91 | Color | `text-[#22c55e]/80` (passing toggle link) | `text-practice-pass/80` | MEDIUM |
| 106 | Color | `bg-[#22c55e]` (passing dot) | `bg-practice-pass` | MEDIUM |
| 110 | Color | `text-[#22c55e]/80` (passing value) | `text-practice-pass/80` | MEDIUM |

---

### `components/practice/HandFeedbackRow.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 11 | Color | `bg-[#22c55e]` (pass dot) | `bg-practice-pass` | MEDIUM |
| 16 | Color | `text-[#22c55e]` (pass text) | `text-practice-pass` | MEDIUM |

---

### `components/practice/BodyVisibilityOverlay.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 13–15 | Color | `border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]` (ready state) | `border-practice-pass/30 bg-practice-pass/10 text-practice-pass` | MEDIUM |
| 38 | Color | `bg-[#22c55e]/15 text-[#22c55e]` (detected part chip) | `bg-practice-pass/15 text-practice-pass` | MEDIUM |

---

### `components/practice/ResultsScreen.tsx`

**Effort: S**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 19 | Color | `text-[#22c55e]` (TEXT_CLASS green) | `text-practice-pass` | MEDIUM |
| 33 | Color | `border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]` (verified badge) | Use `practice-pass` token | MEDIUM |
| 87 | Color | `text-[#22c55e]` (score ≥70 indicator) | `text-practice-pass` | MEDIUM |
| 93 | Color | `text-[#22c55e]` ("All checks passed") | `text-practice-pass` | MEDIUM |
| 106 | Color | `bg-[#22c55e]` (passing dot) | `bg-practice-pass` | MEDIUM |
| 110 | Color | `text-[#22c55e]/80` | `text-practice-pass/80` | MEDIUM |

---

### `components/practice/ScoreCircle.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 7 | Color | `return "#22c55e"` (pass color) | `#00FF88` (practice-pass) — used in practice-view FeedbackPanel context | HIGH |
| 8 | Color | `return "#d4a030"` (mid-score) | Hardcoded gold. In practice view context this should be `#FFD700` (practice-warn), not brand gold. Semantically wrong palette. | MEDIUM |
| 9 | Color | `return "#e85d4a"` (fail color) | `#FF3355` (practice-fail) in practice context | MEDIUM |

*Note: ScoreCircle is used in ResultsScreen (practice results) so the practice palette applies. Using brand colors (gold, crimson) instead of practice colors (#FFD700, #FF3355) is a semantic violation.*

---

### `components/practice/CircularHoldTimer.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 19 | Color | `return "#00FF88"` (pass) | `#00FF88` is correct but hardcoded — should use `theme.colors.practice.pass` or CSS var | MEDIUM |
| 20 | Color | `return "#FFD700"` (warn) | Hardcoded — should use `practice-warn` token | MEDIUM |
| 21 | Color | `return "#FF3355"` (fail) | Hardcoded — should use `practice-fail` token | MEDIUM |
| 117 | Typography | `fontSize: "1rem"` (16px) on OFFICIAL/timer label | ≥28px (`practice-small`) — this label is visible at 2-3m | HIGH |

---

### `components/practice/HoldTimer.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 50 | Color | `text-[#22c55e]` (met state) | `text-practice-pass` (`#00FF88`) | MEDIUM |

---

### `components/practice/CountdownOverlay.tsx`

**Effort: S**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 42 | Typography | `text-sm` (14px) instruction text in practice-view overlay | ≥28px (`practice-small`) | HIGH |
| 48 | Typography | `text-xs` (12px) "Get into position…" in practice-view overlay | ≥28px | HIGH |
| 51 | Typography | `text-xs` (12px) "Skip countdown" button label visible at 2-3m | ≥28px | HIGH |

*All three are HIGH because the CountdownOverlay appears over the live camera feed while the user is 2-3m away.*

---

### `components/practice/LegClassifierDebugOverlay.tsx`

**Effort: XS (debug component — low priority)**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 16 | Radii | `rounded-md` (6px) | 6px is explicitly forbidden ("never 4 or 6px"). Use `rounded-card-sm` (10px) | HIGH |
| 24 | Radii | `rounded-md` (6px) | Same — `rounded-card-sm` | HIGH |
| 32 | Color | `text-amber-400` | Off-palette entirely — no amber in system. Use `text-practice-warn` | MEDIUM |
| 39 | Color | `bg-amber-500/20 text-amber-300` | Off-palette. Use `bg-practice-warn/20 text-practice-warn` | MEDIUM |

*This is a debug overlay, never shown in production. Low priority but still drift.*

---

### `components/practice/PracticeExitButton.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 16 | Radii | `rounded-2xl` | `rounded-card` (16px) — same pixel value, wrong token | MEDIUM |
| 16 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |

---

### `components/TechniqueCard.tsx`

**Effort: XS**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 47 | Typography | `"Key Points"` Title Case in h3 label | `"Key points"` | HIGH |
| 67 | Typography | `"Common Mistakes"` Title Case in h3 label | `"Common mistakes"` | HIGH |

---

### `app/practice/[techniqueId]/PracticePage.tsx`

**Effort: M**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 453 | Color | `animate-spin` loading spinner | Functional spinner — not an entrance animation. DISCUSS | DISCUSS |
| 471 | Radii | `rounded-2xl` (Reload button) | `rounded-card` | MEDIUM |
| 471 | Color | `bg-[#00FF88]` on Reload button | `bg-practice-pass` | MEDIUM |
| 471 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |
| 514 | Color | `text-[#FFD700]` (Chinese technique name in HUD) | `text-practice-warn` — in practice surface #FFD700 is the gold-equivalent | MEDIUM |
| 525 | Color | `text-[#00D4FF]` (view label FRONT/SIDE) | `text-practice-ref` | MEDIUM |
| 543 | Radii | `rounded-2xl` (toggle camera button) | `rounded-card` | MEDIUM |
| 543 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |
| 553 | Radii | `rounded-2xl` (toggle reference button) | `rounded-card` | MEDIUM |
| 553 | Color | `color: showRef ? "#00D4FF"` | `text-practice-ref` via className | MEDIUM |
| 557 | Emoji | `👻` (toggle reference skeleton) | No emoji. Use a lucide icon (`Eye` / `EyeOff`) | HIGH |
| 564 | Radii | `rounded-2xl` (flip reference button) | `rounded-card` | MEDIUM |
| 564 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |
| 660 | Color | `background: "#00D4FF"` (mic indicator dot) | `bg-practice-ref` | MEDIUM |
| 658 | Color | `bg-[#00D4FF]` (exit gesture progress bar fill) | `bg-practice-ref` | MEDIUM |

---

### `app/practice/form/[lessonId]/PracticeFormPage.tsx`

**Effort: S**

| Line | Category | Current | Documented | Severity |
|------|----------|---------|------------|----------|
| 607 | Color | `animate-spin` loading spinner | Functional. DISCUSS | DISCUSS |
| 659 | Color | `background: "#00D4FF"` (current progress segment) | `bg-practice-ref` | MEDIUM |
| 659 | Color | `"#00FF88"` (done segment) | `bg-practice-pass` | MEDIUM |
| 673 | Color | `text-[#FFD700]` (Chinese movement name) | `text-practice-warn` in practice surface | MEDIUM |
| 689 | Typography | `fontSize: "1.5rem"` (24px) on pinyin label in practice-view top bar | ≥28px (`practice-small`) | HIGH |
| 780 | Radii | `rounded-2xl` (Skip movement hint button) | `rounded-card` | MEDIUM |
| 780 | Color | `border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]` | Use `practice-warn` token | MEDIUM |
| 780 | Component | `active:scale-95` | `active:scale-[0.97]` | LOW |
| 796 | Color | `bg-[#00D4FF]` (exit gesture bar fill) | `bg-practice-ref` | MEDIUM |
| 801 | Color | `text-[#00D4FF]` | `text-practice-ref` | MEDIUM |

---

## Section 3 — Good list

Files that match the design system completely (verified by direct read or confirmed clean by exploration agent):

| File | Why it's reference-quality |
|------|---------------------------|
| `app/globals.css` | All tokens correctly defined, cyber-dot texture, safe-area helpers, correct focus ring |
| `tailwind.config.ts` | Clean token definitions: card radii, practice palette, fontFamily — source of truth |
| `components/LandingHero.tsx` | Correct lock-up, btn-gold/btn-ghost, rounded-full chip, font-chinese text-gold on 武学 |
| `components/Dashboard.tsx` | card-surface, cyan/gold gradient progress bar, correct eyebrow casing, font-chinese |
| `components/ModuleCard.tsx` | card-surface, hover:border-cyan/40, locked opacity-50, gradient progress, text-zh text-gold/80 |
| `components/LessonCard.tsx` | Star fill-gold, correct lock/check/play/circle icon set, rounded-full number badge |
| `components/ContinueLearningCard.tsx` | btn-gold on Resume, text-pinyin / text-zh / text-gold/80 pattern |
| `components/VocabBrowse.tsx` | rounded-card-sm on filter chips, rounded-card-md on search, bg-cyan/15 active state |
| `app/login/page.tsx` | rounded-card-md inputs, btn-gold, rounded-card-sm segmented control, correct bilingual lock-up |
| `app/vocab/review/page.tsx` | gradient progress bar, text-zh text-gold for flashcard characters, btn-gold / btn-ghost / btn-crimson, rounded-card-md throughout |
| `components/practice/CorrectionDisplay.tsx` | Documented textShadow pattern exactly: `0 2px 24px rgba(255,215,0,0.5), 0 0 8px rgba(0,0,0,0.8)`, WebkitTextStroke, font-black |
| `components/practice/Disclaimer.tsx` | (agent-confirmed clean) |
| `components/practice/ArmPositionSelector.tsx` | (agent-confirmed clean) |
| `components/practice/OrientationIcon.tsx` | (agent-confirmed clean) |
| `components/practice/ViewIndicator.tsx` | (agent-confirmed clean) |
| `components/Header.tsx` | (agent-confirmed clean) |
| `components/ChineseDisplayToggle.tsx` | (agent-confirmed clean) |
| `components/SpeakButton.tsx` | (agent-confirmed clean) |
| `components/VideoPlayer.tsx` | (agent-confirmed clean) |
| `components/SourceAttribution.tsx` | (agent-confirmed clean) |
| `components/ToggleSwitch.tsx` | (agent-confirmed clean) |
| `components/VocabCard.tsx` | (agent-confirmed clean) |
| `components/QuizQuestionCard.tsx` | (agent-confirmed clean) |

**`CorrectionDisplay.tsx` is the best reference for the practice-surface text-over-camera pattern.** Its textShadow layers (gold glow + black outline + WebkitTextStroke) are exactly what the README documents.

---

## Section 4 — Migration recommendation

### Which violations to fix first

The two global drift patterns affect the most files and are responsible for ~55% of all violations:

1. **`#22c55e` → `#00FF88`** (wrong pass-green). Appears in 6 files. A global find-replace on this single hex value cleans FeedbackPanel, HandFeedbackRow, BodyVisibilityOverlay, ResultsScreen, HoldTimer, and partially ScoreCircle.

2. **`#22D3EE` → `text-cyan` / `bg-cyan` / `text-practice-ref`** (wrong cyan). Appears in 8 files. The correct replacement depends on context: brand interactions (buttons, active states) → `#00b4e6` (cyan token); practice-view reference color (countdown ring, perspective label) → `#00D4FF` (practice-ref token).

### Suggested fix batches

#### Batch 1 — Color token swaps (high impact, low risk) `XS–S` per file

Target: replace the two global drift colors.

1. `bg-[#22c55e]` / `text-[#22c55e]` → `bg-practice-pass` / `text-practice-pass`
   - Files: FeedbackPanel, HandFeedbackRow, BodyVisibilityOverlay, ResultsScreen, HoldTimer, ScoreCircle
2. `#22D3EE` → `bg-cyan` / `text-cyan` (for interactive elements) OR `bg-practice-ref` / `text-practice-ref` (for countdown/perspective display)
   - Files: SetupScreen, FormCompleteScreen, FormExitConfirm, FormIntroOverlay, FormMovementInfoCard, FormPausedOverlay, PracticePage, PracticeFormPage
3. Remove `#A0FF4A` from FormCompleteScreen scoreColor — replace with `#FFD700` (practice-warn) for the 70–85 band, matching the established `practice-warn` slot.
4. Replace amber Tailwind classes in LegClassifierDebugOverlay with practice-warn.

Also consolidate hardcoded `#FFD700`, `#00FF88`, `#FF3355`, `#00D4FF` across all practice files to use Tailwind tokens (`text-practice-warn`, `text-practice-pass`, etc.) — these are correct values but bypass the token system.

#### Batch 2 — Typography (`XS` per file)

1. Fix Title Case → sentence case in: TechniqueCard (2 labels), FormCompleteScreen (4 labels), SetupScreen (4 labels)
2. Fix below-28px font sizes in practice surface:
   - `CircularHoldTimer.tsx` L117: OFFICIAL/timer label → `practice-small` (1.75rem / 28px)
   - `CountdownOverlay.tsx` L42, L48, L51: three text-sm/text-xs → `practice-small`
   - `FormIntroOverlay.tsx` L76: 1.5rem → 1.75rem
   - `FormMovementInfoCard.tsx` L74: 1.5rem → 1.75rem
   - `PracticeFormPage.tsx` L689: pinyin label 1.5rem → 1.75rem
   - `SetupScreen.tsx` L204: "FORWARD" label 1.25rem → 1.75rem

#### Batch 3 — Radii token swap (`XS` per file, ~13 instances)

Replace non-system radius tokens. Same pixel values, different token names:

| Current class | Maps to | Correct token |
|---------------|---------|---------------|
| `rounded-3xl` (24px) | No equivalent | `rounded-card-lg` (20px) — nearest token |
| `rounded-2xl` (16px) | Same as card | `rounded-card` |
| `rounded-xl` (12px) | Same as card-md | `rounded-card-md` |
| `rounded-md` (6px) | **Forbidden** | `rounded-card-sm` (10px) |

Files: SetupScreen, FormCompleteScreen, FormExitConfirm, FormIntroOverlay, FormMovementInfoCard, FormPausedOverlay, PracticeExitButton, LegClassifierDebugOverlay, PracticePage, PracticeFormPage.

#### Batch 4 — Component patterns & emoji (`XS` per file)

1. Remove `👈` `👉` from SetupScreen dominant-hand buttons — replace with text labels
2. Remove `👻` from PracticePage reference-skeleton toggle — replace with `Eye`/`EyeOff` from lucide-react
3. Fix `active:scale-95` → `active:scale-[0.97]` in SetupScreen, FormIntroOverlay, FormTransitionOverlay, PracticeExitButton, PracticePage, PracticeFormPage

### Effort summary

| File | Batch | Effort |
|------|-------|--------|
| components/practice/SetupScreen.tsx | 1 + 2 + 3 + 4 | L |
| components/practice/FormCompleteScreen.tsx | 1 + 2 + 3 | M |
| app/practice/[techniqueId]/PracticePage.tsx | 1 + 3 + 4 | M |
| app/practice/form/[lessonId]/PracticeFormPage.tsx | 1 + 2 + 3 | M |
| components/practice/FormIntroOverlay.tsx | 1 + 2 + 3 | S |
| components/practice/CountdownOverlay.tsx | 2 | S |
| components/practice/ResultsScreen.tsx | 1 | S |
| components/practice/FeedbackPanel.tsx | 1 | S |
| components/practice/FormExitConfirm.tsx | 1 + 3 | XS |
| components/practice/FormMovementInfoCard.tsx | 1 + 2 + 3 | XS |
| components/practice/FormPausedOverlay.tsx | 1 + 3 | XS |
| components/practice/FormTransitionOverlay.tsx | 1 + 3 | XS |
| components/practice/ScoreCircle.tsx | 1 | XS |
| components/practice/CircularHoldTimer.tsx | 1 + 2 | XS |
| components/practice/BodyVisibilityOverlay.tsx | 1 | XS |
| components/practice/HandFeedbackRow.tsx | 1 | XS |
| components/practice/HoldTimer.tsx | 1 | XS |
| components/practice/PracticeExitButton.tsx | 3 + 4 | XS |
| components/TechniqueCard.tsx | 2 | XS |
| components/practice/LegClassifierDebugOverlay.tsx | 1 + 3 | XS |

### Fastest wins

Start with Batch 1 color token swaps — a targeted find-replace of `#22c55e` and `#22D3EE` across the `components/practice/` folder eliminates ~55 violations and touches no logic or layout. Run after confirming the correct Tailwind token for each occurrence (`text-practice-pass` vs `text-cyan` vs `text-practice-ref` depends on whether the element is in a card-surface context or practice-surface context).

---

*Audit generated 2026-04-24. Codebase branch: `claude/crazy-perlman-2a06a0`.*
