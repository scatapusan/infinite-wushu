import { DEMO_TECHNIQUES } from "@/lib/demo-data";
import type { Technique } from "@/lib/types";
import { STANCE_CHECKS } from "./stance-checks";
import type { StanceCheckConfig } from "./types";

const techniqueById = new Map<string, Technique>();
for (const techniques of Object.values(DEMO_TECHNIQUES)) {
  for (const t of techniques) {
    techniqueById.set(t.id, t);
  }
}

export function getTechniqueById(id: string): Technique | undefined {
  return techniqueById.get(id);
}

/**
 * Resolve the scoring config and stance ID to use for pose utilities.
 *
 * - If the technique has its own STANCE_CHECKS entry, use it directly.
 * - Otherwise fall back to the technique's `stance_ref` field (form movements
 *   that borrow a stance's scoring config while keeping their own id for
 *   progress tracking).
 */
export function resolveStanceCheck(techniqueId: string): {
  config: StanceCheckConfig | null;
  scoringId: string;
} {
  if (STANCE_CHECKS[techniqueId]) {
    return { config: STANCE_CHECKS[techniqueId], scoringId: techniqueId };
  }
  const t = techniqueById.get(techniqueId);
  if (t?.stance_ref && STANCE_CHECKS[t.stance_ref]) {
    return { config: STANCE_CHECKS[t.stance_ref], scoringId: t.stance_ref };
  }
  return { config: null, scoringId: techniqueId };
}

/** Technique IDs that have stance-check configs (directly or via stance_ref) */
export const PRACTICABLE_IDS = Array.from(techniqueById.values())
  .filter(
    (t) =>
      t.id in STANCE_CHECKS ||
      (t.stance_ref != null && t.stance_ref in STANCE_CHECKS),
  )
  .map((t) => t.id);

export function isPracticable(techniqueId: string): boolean {
  if (techniqueId in STANCE_CHECKS) return true;
  const t = techniqueById.get(techniqueId);
  return t?.stance_ref != null && t.stance_ref in STANCE_CHECKS;
}
