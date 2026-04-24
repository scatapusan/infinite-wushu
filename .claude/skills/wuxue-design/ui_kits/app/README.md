# WuXue UI Kit — Mobile App

High-fidelity recreations of the WuXue mobile web app. These are visual/interaction mocks (not production code) — they mirror the real `components/` in `scatapusan/infinite-wushu` without the Supabase/MediaPipe plumbing.

## Files
- `index.html` — interactive click-thru prototype. Start here.
- `Shell.jsx` — phone frame wrapper + localStorage-backed screen router.
- `tokens.js` — shared color + size constants.
- `icons.jsx` — Lucide-equivalent inline SVGs.
- `Header.jsx` — top bar with 武学 lockup + nav + settings.
- `Dashboard.jsx` — home: progress card, continue-learning, vocab badge, module grid.
- `LessonDetail.jsx` — technique card with video placeholder, key points, common mistakes, practice CTA.
- `PracticeSetup.jsx` — pre-practice readiness: camera permission, body visibility, disclaimer.
- `PracticeLive.jsx` — live camera view with skeleton overlay, score dial, correction headline.
- `FormComplete.jsx` — movement breakdown + total score summary.

## Screens covered
Per user request:
1. **Home** (Dashboard)
2. **Lesson detail** (with practice CTA)
3. **Pre-practice setup**
4. **Live practice** (skeleton overlay)
5. **Form completion**

## What's omitted
Real pose detection, live video, Supabase auth, spaced-repetition scheduling, TTS. The app shell uses mock data and fake state transitions.
