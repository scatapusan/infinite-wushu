import { DEMO_TECHNIQUES } from "@/lib/demo-data";
import { VOCAB_WORDS } from "@/lib/vocab-data";

export type ValidationResult = {
  id: string;
  type: "technique" | "vocab";
  issue: string;
};

/**
 * Validates that every content item has an explicit attribution level.
 * Returns an empty array when all items are fully attributed.
 */
export function validateContentAttribution(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const techniques of Object.values(DEMO_TECHNIQUES)) {
    for (const t of techniques) {
      if (!t.attribution) {
        results.push({ id: t.id, type: "technique", issue: "missing attribution" });
      }
    }
  }

  for (const word of VOCAB_WORDS) {
    if (!word.attribution) {
      results.push({ id: word.id, type: "vocab", issue: "missing attribution" });
    }
  }

  return results;
}
