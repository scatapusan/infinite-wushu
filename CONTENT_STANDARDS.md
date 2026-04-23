# Content Standards

Guidelines for adding or updating technique and vocabulary content in WuXue.

## Attribution levels

| Level | When to use |
|-------|-------------|
| `iwuf-official` | Video or text sourced directly from IWUF publications or official channels |
| `iwuf-aligned` | Content consistent with IWUF curriculum from a credentialed instructor or federation |
| `community` | Standard wushu terminology or widely reproduced curriculum (PE textbook sequences, etc.) |
| `internal` | WuXue-authored original content |
| `unattributed` | Placeholder — source not yet verified. Must be upgraded before production |

Every `Technique` and `VocabWord` must have an explicit `attribution` field. The
`validateContentAttribution()` function in `lib/content-validators.ts` will return
a non-empty array if any item is missing attribution.

## Preferred sources

- **IWUF Classroom** (classroom.iwuf.com) — official IWUF instructional videos.
  Suitable for `iwuf-official` attribution. Preferred upgrade target for the 18
  currently unattributed technique videos.
- **Sunny Lai Wushu** (YouTube) — publicly available stances tutorial. Currently
  used for all five basic stances.
- **Master Shi Yandi 五步拳** (YouTube: aq4PHYF3XSY) — standard PE-textbook
  五步拳 sequence used for all wubuquan form movements.

## Prohibited sources

- **David Bao / Wushu Central** — content is Patreon-gated (paid access only).
  Do not embed or reference these videos. Techniques cannot be marked
  `community` on the basis of Patreon content.

## Research notes

### Elementary Changquan (初级长拳)
The IWUF Classroom hosts official Changquan Yi Lu, Er Lu, and San Lu videos
suitable for `iwuf-official` attribution. No Changquan techniques currently exist
in the demo data; when they are added, IWUF Classroom should be the primary
source.

### Stance videos
The original placeholder URLs (cbPb6X2pam8) have been replaced with per-stance
timestamps from the Sunny Lai Wushu series. If a more authoritative source
becomes available (e.g. IWUF Classroom basics), update `video_url`, `source`,
`sourceUrl`, and upgrade `attribution` to `"iwuf-official"` or `"iwuf-aligned"`.

## Pending upgrades

The following are known gaps to resolve before launching the app publicly:

1. Replace the 18 unattributed technique videos with verified IWUF Classroom or
   other cleared sources (see SOURCE_ATTRIBUTION_AUDIT.md §2 for the list).
2. Add `sourceUrl` fields to all attributed techniques once canonical URLs are
   confirmed stable.
3. Review all `community`-attributed items against IWUF Classroom to determine
   if any qualify for `iwuf-aligned` or `iwuf-official` upgrade.
