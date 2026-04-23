# Leg Classifier — design notes

This file captures decisions that live in [lib/pose/leg-classifier.ts](lib/pose/leg-classifier.ts) but
would be tedious to rediscover from the code alone.

## Architecture: trait-based, not method-first

The spec described four methods (A knee-angle / B hip-orientation / C foot-position /
D weight-distribution). The natural-sounding implementation is:

```
method A for bow-stance: smaller-angle side is FRONT.
method A for empty-stance: smaller-angle side is BACK (flip).
```

That flip is a trap. A method like foot-position doesn't have one "correct" semantic —
in gongbu the *further* foot is the back leg (extended behind), in xubu the further
foot is the front leg (reaching forward), in pubu the further foot is extended.
Trying to post-hoc flip each method per stance is error-prone and led to a double-flip
bug during development.

The module now separates **observation** (semantic-neutral: "which side's knee is more
bent?") from **interpretation** (stance-specific: "for xubu, more bent = BACK"). The
`INTERPRETATION` table maps (stance, method) → `LegRole`. This way each observer stays
simple and local, and the per-stance semantics live in one place that's trivial to read.

## Divergence from spec: rest-stance weights

Spec: rest-stance = knee-angle + foot-position (weights unspecified).

Shipped: rest-stance = **heel-lift 0.7 + foot-position 0.3**. Knee-angle is excluded.

Why: in xiebu both knees are bent to similar degrees (the crossed-leg geometry is
about hip rotation, not knee-angle asymmetry). The heel-lift of the back leg is the
biomechanically distinctive and reliable signal. Foot-position still contributes
because the planted (front) foot tends to sit laterally offset from the body center
while the lifted back foot crosses behind and ends up closer to centerline.

If this turns out wrong in the wild, both a dev-override (the per-stance table is
in one file) and a tunable (threshold constants are module-local) make it easy to
roll back.

## Confidence normalization

Confidence = `weightedSum / totalConfiguredWeight` (not / totalActiveWeight).

A method that abstains because of low visibility or below-threshold asymmetry
**should** drag the combined confidence down — we're missing evidence we intended to
collect. Dividing by active weight would hide that: one lonely method firing at full
strength would report 1.0 confidence even when we're flying on a single signal. The
partial-occlusion test encodes this contract.

Consequence: method weights must sum to ~1.0 per stance. They currently do.

## Temporal buffer — lock/unlock asymmetry

- **Lock**: 10 consecutive non-ambiguous frames, avg confidence ≥ 0.7.
- **Unlock**: 10 consecutive non-ambiguous frames that **disagree** with the lock.
- Ambiguous frames don't count toward either streak — they pause the state machine.

This makes the buffer robust to transient pose-detection noise: a single bad frame
doesn't flip the classification, and a stretch of occlusion/ambiguous frames while
the user is still (e.g. arms down) won't spuriously unlock.

Window size is 15 frames, slightly larger than the 10-frame agreement requirement,
so that the sliding window always has room for a full tail to evaluate.

## Integration surface

- `classifyVariant(landmarks, stanceId)` is the legacy API used by practice pages.
  It returns `StanceVariant | null` (null when ambiguous). Unchanged shape, richer
  internals.
- `classifyVariantDetailed(landmarks, stanceId)` returns the full `LegClassification`
  with confidence + per-method breakdown. Used by the debug overlay.
- `classifyLegs`, `LegClassifierBuffer`, and `resolveBowStance` / `resolveEmptyStance` /
  `resolveRestStance` / `resolveCrouchStance` are exported for future code that
  wants to own its own temporal smoothing or stance-specific side resolution.

## Debug overlay

Gated by `showLegClassifierDebug()` (LocalStorage key `wuxue:leg-classifier-debug`).
To enable: `localStorage.setItem("wuxue:leg-classifier-debug", "1")` in the browser
console and reload. Renders in the lower-left of the practice view, showing the
resolved left/right roles, combined confidence, and each method's per-frame vote.
