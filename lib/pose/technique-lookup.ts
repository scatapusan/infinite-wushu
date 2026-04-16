import { DEMO_TECHNIQUES } from "@/lib/demo-data";
import type { Technique } from "@/lib/types";
import { STANCE_ANGLES } from "./reference-angles";

const techniqueById = new Map<string, Technique>();
for (const techniques of Object.values(DEMO_TECHNIQUES)) {
  for (const t of techniques) {
    techniqueById.set(t.id, t);
  }
}

export function getTechniqueById(id: string): Technique | undefined {
  return techniqueById.get(id);
}

/** Technique IDs that have reference angle configs for practice mode */
export const PRACTICABLE_IDS = Object.keys(STANCE_ANGLES);

export function isPracticable(techniqueId: string): boolean {
  return techniqueId in STANCE_ANGLES;
}
