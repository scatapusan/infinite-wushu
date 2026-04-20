/**
 * Maps gate IDs (from stance-gates.ts) to short, ALL-CAPS correction messages
 * readable at 2–3 m. Maximum 3 words. Ordered from most to least severe
 * within each stance so the highest-priority failure surfaces first.
 */

export type CorrectionMessage = {
  gateId: string;
  message: string;
  priority: number; // lower = higher priority, shown first
};

const CORRECTIONS: CorrectionMessage[] = [
  // ── Horse Stance ────────────────────────────────────────────────
  { gateId: "mabu-gate-feet-width",            message: "FEET WIDER",       priority: 1 },
  { gateId: "mabu-gate-left-thigh",            message: "SINK LOWER",       priority: 2 },
  { gateId: "mabu-gate-right-thigh",           message: "SINK LOWER",       priority: 2 },
  { gateId: "mabu-gate-left-knee-over-ankle",  message: "KNEE OVER ANKLE",  priority: 3 },
  { gateId: "mabu-gate-right-knee-over-ankle", message: "KNEE OVER ANKLE",  priority: 3 },
  { gateId: "mabu-gate-torso-upright",         message: "STRAIGHTEN BACK",  priority: 4 },
  { gateId: "mabu-gate-hips-level",            message: "LEVEL HIPS",       priority: 5 },

  // ── Bow Stance ───────────────────────────────────────────────────
  { gateId: "gongbu-gate-feet-spacing",        message: "FEET WIDER",       priority: 1 },
  { gateId: "gongbu-gate-front-thigh",         message: "SINK FRONT",       priority: 2 },
  { gateId: "gongbu-gate-back-leg-extended",   message: "EXTEND BACK LEG",  priority: 2 },
  { gateId: "gongbu-gate-front-knee-ankle",    message: "KNEE OVER ANKLE",  priority: 3 },
  { gateId: "gongbu-gate-hips-level",          message: "LEVEL HIPS",       priority: 4 },
  { gateId: "gongbu-gate-torso-upright",       message: "STRAIGHTEN BACK",  priority: 5 },

  // ── Crouch Stance ────────────────────────────────────────────────
  { gateId: "pubu-gate-feet-spacing",          message: "WIDER STANCE",     priority: 1 },
  { gateId: "pubu-gate-bent-thigh",            message: "SINK LOWER",       priority: 2 },
  { gateId: "pubu-gate-extended-thigh",        message: "EXTEND LEG OUT",   priority: 2 },
  { gateId: "pubu-gate-extended-straight",     message: "STRAIGHTEN LEG",   priority: 3 },
  { gateId: "pubu-gate-extended-heel-flat",    message: "HEEL DOWN",        priority: 3 },
  { gateId: "pubu-gate-torso-upright",         message: "STRAIGHTEN BACK",  priority: 4 },

  // ── Empty Stance ─────────────────────────────────────────────────
  { gateId: "xubu-gate-feet-narrow",           message: "FEET CLOSER",      priority: 1 },
  { gateId: "xubu-gate-front-heel-up",         message: "LIFT FRONT HEEL",  priority: 2 },
  { gateId: "xubu-gate-back-thigh",            message: "SINK LOWER",       priority: 2 },
  { gateId: "xubu-gate-back-knee-ankle",       message: "KNEE OVER ANKLE",  priority: 3 },
  { gateId: "xubu-gate-torso-upright",         message: "STRAIGHTEN BACK",  priority: 4 },
  { gateId: "xubu-gate-hips-level",            message: "LEVEL HIPS",       priority: 5 },

  // ── Rest Stance ──────────────────────────────────────────────────
  { gateId: "xiebu-gate-ankles-stacked",       message: "STACK ANKLES",     priority: 1 },
  { gateId: "xiebu-gate-legs-wrapped",         message: "CROSS DEEPER",     priority: 2 },
  { gateId: "xiebu-gate-front-thigh",          message: "SINK LOWER",       priority: 3 },
  { gateId: "xiebu-gate-hips-level",           message: "LEVEL HIPS",       priority: 4 },
  { gateId: "xiebu-gate-torso-upright",        message: "STRAIGHTEN BACK",  priority: 5 },
];

const BY_GATE_ID = new Map(CORRECTIONS.map((c) => [c.gateId, c]));

/**
 * Given a list of failing gate IDs, return messages sorted by priority
 * (highest severity first). Deduplicates identical messages.
 */
export function getCorrections(failingGateIds: string[]): string[] {
  const seen = new Set<string>();
  return failingGateIds
    .map((id) => BY_GATE_ID.get(id))
    .filter((c): c is CorrectionMessage => c != null)
    .sort((a, b) => a.priority - b.priority)
    .map((c) => c.message)
    .filter((msg) => {
      if (seen.has(msg)) return false;
      seen.add(msg);
      return true;
    });
}
