import type { PoseLandmark } from "./types";

/**
 * Stance gates: spatial constraints evaluated with AND logic.
 * All distances are normalized by shoulder width (dist between landmarks 11, 12).
 *
 * TODO(phase-6): add isStrictMode() preference + settings toggle.
 * Strict mode: knee ±7°, torso ±5°, tighter gate conditions.
 * Use for competition-prep tier or Infinite Wushu advanced modules.
 */

export type SymbolicLandmark =
  | "front_shoulder" | "front_hip" | "front_knee" | "front_ankle" | "front_heel" | "front_foot_index"
  | "back_shoulder"  | "back_hip"  | "back_knee"  | "back_ankle"  | "back_heel"  | "back_foot_index"
  | "bent_hip"       | "bent_knee" | "bent_ankle"
  | "extended_hip"   | "extended_knee" | "extended_ankle" | "extended_heel" | "extended_foot_index";

export type LandmarkRef = number | SymbolicLandmark;

export type GateType =
  | "x-alignment"     // |a.x - b.x| / shoulderWidth
  | "y-alignment"     // |a.y - b.y| / shoulderWidth
  | "x-diff-signed"   // (a.x - b.x) / shoulderWidth
  | "y-diff-signed"   // (a.y - b.y) / shoulderWidth
  | "ratio";          // hypot(dx, dy) / shoulderWidth

export type GateCondition =
  | { op: "within"; tolerance: number }
  | { op: "ratio-range"; min: number; max: number }
  | { op: "ratio-min"; min: number }
  | { op: "ratio-max"; max: number }
  | { op: "leq"; value: number }
  | { op: "geq"; value: number };

export type StanceGate = {
  id: string;
  label: string;
  type: GateType;
  a: LandmarkRef;
  b: LandmarkRef;
  condition: GateCondition;
};

export type LegAssignment = Partial<Record<SymbolicLandmark, number>>;

export type GateResult = {
  id: string;
  label: string;
  status: "pass" | "fail" | "not-visible";
  value: number | null;
  targetLabel: string;
};

export type GatesEvaluation = {
  allPass: boolean;
  anyNotVisible: boolean;
  results: GateResult[];
};

/** Minimum landmark visibility to evaluate a gate. Below this, surface "adjust camera angle". */
export const GATE_VISIBILITY_THRESHOLD = 0.7;

function resolveRef(ref: LandmarkRef, assignment: LegAssignment): number | undefined {
  if (typeof ref === "number") return ref;
  return assignment[ref];
}

function describeCondition(c: GateCondition): string {
  switch (c.op) {
    case "within": return `±${c.tolerance}`;
    case "ratio-range": return `${c.min}–${c.max}×`;
    case "ratio-min": return `≥ ${c.min}×`;
    case "ratio-max": return `≤ ${c.max}×`;
    case "leq": return `≤ ${c.value}`;
    case "geq": return `≥ ${c.value}`;
  }
}

function testCondition(value: number, c: GateCondition): boolean {
  switch (c.op) {
    case "within":      return Math.abs(value) <= c.tolerance;
    case "ratio-range": return value >= c.min && value <= c.max;
    case "ratio-min":   return value >= c.min;
    case "ratio-max":   return value <= c.max;
    case "leq":         return value <= c.value;
    case "geq":         return value >= c.value;
  }
}

/**
 * Evaluate a list of gates against the current landmarks.
 * Any gate whose referenced landmarks are below visibility threshold surfaces
 * as `not-visible` and forces allPass=false (treated as "adjust camera", not fail).
 */
export function evaluateGates(
  landmarks: PoseLandmark[],
  gates: StanceGate[],
  assignment: LegAssignment,
): GatesEvaluation {
  const sL = landmarks[11];
  const sR = landmarks[12];
  const shouldersOk =
    sL && sR &&
    (sL.visibility ?? 0) >= GATE_VISIBILITY_THRESHOLD &&
    (sR.visibility ?? 0) >= GATE_VISIBILITY_THRESHOLD;
  const shoulderWidth = shouldersOk ? Math.hypot(sR.x - sL.x, sR.y - sL.y) : 0;

  if (!shouldersOk || shoulderWidth < 1e-4) {
    return {
      allPass: false,
      anyNotVisible: true,
      results: gates.map((g) => ({
        id: g.id,
        label: g.label,
        status: "not-visible",
        value: null,
        targetLabel: describeCondition(g.condition),
      })),
    };
  }

  let allPass = true;
  let anyNotVisible = false;
  const results: GateResult[] = [];

  for (const gate of gates) {
    const ai = resolveRef(gate.a, assignment);
    const bi = resolveRef(gate.b, assignment);
    const a = ai != null ? landmarks[ai] : undefined;
    const b = bi != null ? landmarks[bi] : undefined;
    const targetLabel = describeCondition(gate.condition);

    if (
      !a || !b ||
      (a.visibility ?? 0) < GATE_VISIBILITY_THRESHOLD ||
      (b.visibility ?? 0) < GATE_VISIBILITY_THRESHOLD
    ) {
      anyNotVisible = true;
      allPass = false;
      results.push({ id: gate.id, label: gate.label, status: "not-visible", value: null, targetLabel });
      continue;
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    let value: number;
    switch (gate.type) {
      case "x-alignment":   value = Math.abs(dx) / shoulderWidth; break;
      case "y-alignment":   value = Math.abs(dy) / shoulderWidth; break;
      case "x-diff-signed": value = dx / shoulderWidth; break;
      case "y-diff-signed": value = dy / shoulderWidth; break;
      case "ratio":         value = Math.hypot(dx, dy) / shoulderWidth; break;
    }

    const pass = testCondition(value, gate.condition);
    if (!pass) allPass = false;
    results.push({
      id: gate.id,
      label: gate.label,
      status: pass ? "pass" : "fail",
      value: Math.round(value * 1000) / 1000,
      targetLabel,
    });
  }

  return { allPass, anyNotVisible, results };
}

// ============================================================
// Gate definitions per stance
// All distances are normalized by shoulder width.
// Symbolic refs (front_*, back_*, bent_*, extended_*) are resolved
// per-frame by leg-resolver.ts based on the user's current pose.
// ============================================================

export const STANCE_GATES: Record<string, StanceGate[]> = {
  "horse-stance": [
    { id: "mabu-gate-feet-width", label: "Feet ≈ 2× shoulders", type: "ratio",
      a: 27, b: 28, condition: { op: "ratio-range", min: 1.8, max: 2.6 } },
    { id: "mabu-gate-left-thigh", label: "Left thigh parallel", type: "y-alignment",
      a: 23, b: 25, condition: { op: "within", tolerance: 0.25 } },
    { id: "mabu-gate-right-thigh", label: "Right thigh parallel", type: "y-alignment",
      a: 24, b: 26, condition: { op: "within", tolerance: 0.25 } },
    { id: "mabu-gate-left-knee-over-ankle", label: "L knee over ankle", type: "x-alignment",
      a: 25, b: 27, condition: { op: "within", tolerance: 0.20 } },
    { id: "mabu-gate-right-knee-over-ankle", label: "R knee over ankle", type: "x-alignment",
      a: 26, b: 28, condition: { op: "within", tolerance: 0.20 } },
    { id: "mabu-gate-torso-upright", label: "Torso upright", type: "x-alignment",
      a: 11, b: 23, condition: { op: "within", tolerance: 0.15 } },
    { id: "mabu-gate-hips-level", label: "Hips level", type: "y-alignment",
      a: 23, b: 24, condition: { op: "within", tolerance: 0.10 } },
  ],

  "bow-stance": [
    { id: "gongbu-gate-feet-spacing", label: "Feet spread ≥ 2.8×", type: "ratio",
      a: 27, b: 28, condition: { op: "ratio-min", min: 2.8 } },
    { id: "gongbu-gate-front-knee-ankle", label: "Front knee over ankle", type: "x-alignment",
      a: "front_knee", b: "front_ankle", condition: { op: "within", tolerance: 0.15 } },
    { id: "gongbu-gate-front-thigh", label: "Front thigh bent", type: "y-alignment",
      a: "front_hip", b: "front_knee", condition: { op: "within", tolerance: 0.35 } },
    { id: "gongbu-gate-back-leg-extended", label: "Back leg extended", type: "ratio",
      a: "back_hip", b: "back_ankle", condition: { op: "ratio-min", min: 2.0 } },
    { id: "gongbu-gate-hips-level", label: "Hips level", type: "y-alignment",
      a: 23, b: 24, condition: { op: "within", tolerance: 0.12 } },
    { id: "gongbu-gate-torso-upright", label: "Torso upright", type: "x-alignment",
      a: "front_shoulder", b: "front_hip", condition: { op: "within", tolerance: 0.22 } },
  ],

  "crouch-stance": [
    { id: "pubu-gate-bent-thigh", label: "Bent thigh sunk", type: "y-alignment",
      a: "bent_hip", b: "bent_knee", condition: { op: "within", tolerance: 0.20 } },
    { id: "pubu-gate-extended-thigh", label: "Extended thigh low", type: "y-alignment",
      a: "extended_hip", b: "extended_knee", condition: { op: "within", tolerance: 0.25 } },
    { id: "pubu-gate-extended-straight", label: "Extended leg straight", type: "y-alignment",
      a: "extended_knee", b: "extended_ankle", condition: { op: "within", tolerance: 0.20 } },
    { id: "pubu-gate-extended-heel-flat", label: "Extended heel flat", type: "y-alignment",
      a: "extended_heel", b: "extended_foot_index", condition: { op: "within", tolerance: 0.08 } },
    { id: "pubu-gate-feet-spacing", label: "Feet spread ≥ 2.5×", type: "ratio",
      a: 27, b: 28, condition: { op: "ratio-min", min: 2.5 } },
    { id: "pubu-gate-torso-upright", label: "Torso upright", type: "x-alignment",
      a: 11, b: 23, condition: { op: "within", tolerance: 0.25 } },
  ],

  "empty-stance": [
    { id: "xubu-gate-feet-narrow", label: "Feet close ≤ 1.3×", type: "ratio",
      a: 27, b: 28, condition: { op: "ratio-max", max: 1.3 } },
    { id: "xubu-gate-front-heel-up", label: "Front heel lifted", type: "y-diff-signed",
      a: "front_heel", b: "front_foot_index", condition: { op: "leq", value: -0.05 } },
    { id: "xubu-gate-back-knee-ankle", label: "Back knee over ankle", type: "x-alignment",
      a: "back_knee", b: "back_ankle", condition: { op: "within", tolerance: 0.20 } },
    { id: "xubu-gate-back-thigh", label: "Back thigh sunk", type: "y-alignment",
      a: "back_hip", b: "back_knee", condition: { op: "within", tolerance: 0.30 } },
    { id: "xubu-gate-torso-upright", label: "Torso upright", type: "x-alignment",
      a: 11, b: 23, condition: { op: "within", tolerance: 0.15 } },
    { id: "xubu-gate-hips-level", label: "Hips level", type: "y-alignment",
      a: 23, b: 24, condition: { op: "within", tolerance: 0.12 } },
  ],

  "rest-stance": [
    { id: "xiebu-gate-ankles-stacked", label: "Ankles close (x)", type: "x-alignment",
      a: 27, b: 28, condition: { op: "within", tolerance: 0.30 } },
    { id: "xiebu-gate-legs-wrapped", label: "Back knee tucked near front heel", type: "ratio",
      a: "back_knee", b: "front_heel", condition: { op: "ratio-max", max: 0.45 } },
    { id: "xiebu-gate-front-thigh", label: "Front thigh sunk", type: "y-alignment",
      a: "front_hip", b: "front_knee", condition: { op: "within", tolerance: 0.30 } },
    { id: "xiebu-gate-hips-level", label: "Hips level", type: "y-alignment",
      a: 23, b: 24, condition: { op: "within", tolerance: 0.15 } },
    { id: "xiebu-gate-torso-upright", label: "Torso upright", type: "x-alignment",
      a: 11, b: 23, condition: { op: "within", tolerance: 0.20 } },
  ],
};

export function getStanceGates(techniqueId: string): StanceGate[] {
  return STANCE_GATES[techniqueId] ?? [];
}
