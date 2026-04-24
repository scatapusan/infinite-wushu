---
name: wuxue-design
description: Use this skill to generate well-branded interfaces and assets for WuXue (武学 · Infinite Wushu), the wushu learning app, for production code or throwaway prototypes, mocks, and concept visuals. Contains the essential design guidelines — colors, typography, fonts, assets, iconography, tone of voice, and UI kit components for prototyping.
user-invocable: true
---

# WuXue Design Skill

Read `README.md` for the complete brand guide — content fundamentals, visual foundations, iconography, and the full token inventory. It is the source of truth. The README also lists the other files in this skill so you know what's available.

Key files:
- `colors_and_type.css` — drop into any HTML artifact via `<link rel="stylesheet" href="colors_and_type.css">` and you have all tokens plus `.btn-primary`, `.card-surface`, `.eyebrow`, `.zh-gold`, `.p-hero` etc.
- `fonts/` — self-host Inter and Noto Serif SC, or keep the Google Fonts link in HTML files.
- `assets/` — logos, icons, any raster brand material.
- `ui_kits/app/` — working JSX recreations of the real WuXue mobile app. Lift components from here instead of rebuilding.
- `preview/` — card-sized examples of tokens and components, useful as quick visual reference.

If creating visual artifacts (slides, mocks, throwaway prototypes) **copy assets out** of this skill into the output folder, then create static HTML files for the user to view. If working on production code in the actual `infinite-wushu` repo, read the rules here to become an expert in the brand, then follow the existing codebase conventions (Tailwind utility classes, `@/lib/*` imports, `card-surface` / `btn-gold` helpers defined in `app/globals.css`).

If the user invokes this skill without any other guidance, ask them:
1. What are they building — a marketing artifact, an in-app screen, a slide, a prototype?
2. Is this for the signed-out (landing) surface, the signed-in (app) surface, or the practice (camera) surface? The practice surface has its own ultra-saturated palette and 28px minimum font size.
3. Do they want strict recreation or an exploration that stretches the brand?

Then act as an expert designer who outputs HTML artifacts or production code, depending on the need. Never invent colors, fonts, or iconography beyond what's documented here — the WuXue brand is deliberately tight.
