import { DEMO_TECHNIQUES } from "@/lib/demo-data";
import type { Technique } from "@/lib/types";
import { STANCE_CHECKS } from "./stance-checks";

const techniqueById = new Map<string, Technique>();
for (const techniques of Object.values(DEMO_TECHNIQUES)) {
  for (const t of techniques) {
    techniqueById.set(t.id, t);
  }
}

export function getTechniqueById(id: string): Technique | undefined {
  return techniqueById.get(id);
}

/** Technique IDs that have stance-check configs for practice mode */
export const PRACTICABLE_IDS = Object.keys(STANCE_CHECKS);

export function isPracticable(techniqueId: string): boolean {
  return techniqueId in STANCE_CHECKS;
}
