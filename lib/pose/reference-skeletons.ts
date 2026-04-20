import type { PoseLandmark, CameraView } from "./types";
import { evaluateGates, getStanceGates } from "./stance-gates";
import { legAssignmentFor, type StanceVariant } from "./leg-resolver";

/**
 * Reference-skeleton landmark data. Coordinates are normalized so:
 *   - Shoulder midpoint (between 11 and 12) is origin (0, 0)
 *   - Distance between shoulders (11 ↔ 12) = 1.0 unit
 *   - y increases downward (MediaPipe convention)
 *
 * At render time, coords are multiplied by the user's detected shoulder width
 * in pixels and translated so the reference shoulder midpoint aligns with the
 * user's shoulder midpoint.
 *
 * Any reference must pass all its own gates. See validateReferenceSkeleton()
 * below — called at module load in development.
 */

export type NormalizedPoint = { x: number; y: number };

/** Landmarks we lay out explicitly; the rest are set to { x:0, y:0, visibility:0 }. */
const DRAWN_INDICES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;

export type ReferenceSkeleton = {
  stanceId: string;
  variant: StanceVariant;
  /** Which camera view the reference was laid out for (primary view of the stance). */
  view: CameraView;
  /** Normalized landmark positions (shoulder-width units, shoulder midpoint origin). */
  landmarks: PoseLandmark[];
};

// ============================================================
// Layout helpers
// ============================================================

function makeLandmarks(points: Partial<Record<number, NormalizedPoint>>): PoseLandmark[] {
  const out: PoseLandmark[] = [];
  for (let i = 0; i <= 32; i++) {
    const p = points[i];
    out.push(
      p
        ? { x: p.x, y: p.y, z: 0, visibility: 1 }
        : { x: 0, y: 0, z: 0, visibility: 0 },
    );
  }
  return out;
}

/** Return a new reference with x-coords mirrored (and L/R landmark pairs swapped). */
function mirrorLandmarks(landmarks: PoseLandmark[]): PoseLandmark[] {
  const pairs: Array<[number, number]> = [
    [11, 12], [13, 14], [15, 16],
    [23, 24], [25, 26], [27, 28],
    [29, 30], [31, 32],
  ];
  const flipped = landmarks.map((lm) => ({ ...lm, x: -lm.x }));
  const swapped = flipped.slice();
  for (const [a, b] of pairs) {
    swapped[a] = flipped[b];
    swapped[b] = flipped[a];
  }
  return swapped;
}

// ============================================================
// Reference layouts (left-forward / left-bent variant)
// Designed to pass all gates at the midpoint of each tolerance range.
// ============================================================

const MABU = makeLandmarks({
  11: { x: -0.50, y: 0.00 }, 12: { x:  0.50, y: 0.00 },
  13: { x: -0.55, y: 0.35 }, 14: { x:  0.55, y: 0.35 },
  15: { x: -0.40, y: 0.60 }, 16: { x:  0.40, y: 0.60 },
  23: { x: -0.40, y: 0.60 }, 24: { x:  0.40, y: 0.60 },
  25: { x: -1.00, y: 0.80 }, 26: { x:  1.00, y: 0.80 },
  27: { x: -1.00, y: 1.35 }, 28: { x:  1.00, y: 1.35 },
  29: { x: -1.05, y: 1.38 }, 30: { x:  1.05, y: 1.38 },
  31: { x: -1.00, y: 1.42 }, 32: { x:  1.00, y: 1.42 },
});

// Gongbu left-forward: left leg bent forward, right leg extended back-and-right.
const GONGBU_LF = makeLandmarks({
  11: { x: -0.50, y: 0.00 }, 12: { x:  0.50, y: 0.00 },
  13: { x: -0.55, y: 0.35 }, 14: { x:  0.55, y: 0.35 },
  15: { x: -0.45, y: 0.60 }, 16: { x:  0.45, y: 0.55 },
  23: { x: -0.45, y: 0.60 }, 24: { x:  0.45, y: 0.55 },
  25: { x: -1.00, y: 0.90 }, 26: { x:  1.50, y: 0.92 },
  27: { x: -1.00, y: 1.55 }, 28: { x:  2.50, y: 1.30 },
  29: { x: -1.05, y: 1.58 }, 30: { x:  2.55, y: 1.33 },
  31: { x: -1.00, y: 1.62 }, 32: { x:  2.55, y: 1.37 },
});

// Pubu left-bent: left leg folded under body, right leg extended horizontally.
const PUBU_LF = makeLandmarks({
  11: { x: -0.50, y: 0.00 }, 12: { x:  0.50, y: 0.00 },
  13: { x: -0.55, y: 0.35 }, 14: { x:  0.55, y: 0.35 },
  15: { x: -0.30, y: 0.80 }, 16: { x:  0.30, y: 0.80 },
  23: { x: -0.30, y: 0.90 }, 24: { x:  0.30, y: 0.90 },
  25: { x: -0.30, y: 0.95 }, 26: { x:  1.40, y: 1.05 },
  27: { x: -0.30, y: 1.40 }, 28: { x:  2.30, y: 1.22 },
  29: { x: -0.33, y: 1.42 }, 30: { x:  2.30, y: 1.22 },
  31: { x: -0.30, y: 1.45 }, 32: { x:  2.38, y: 1.22 },
});

// Xubu left-forward: left leg empty in front (heel lifted), right leg back & bent.
const XUBU_LF = makeLandmarks({
  11: { x: -0.50, y: 0.00 }, 12: { x:  0.50, y: 0.00 },
  13: { x: -0.55, y: 0.35 }, 14: { x:  0.55, y: 0.35 },
  15: { x: -0.40, y: 0.70 }, 16: { x:  0.40, y: 0.70 },
  23: { x: -0.40, y: 0.70 }, 24: { x:  0.40, y: 0.70 },
  25: { x: -0.55, y: 0.95 }, 26: { x:  0.40, y: 0.95 },
  27: { x: -0.70, y: 1.38 }, 28: { x:  0.40, y: 1.40 },
  29: { x: -0.75, y: 1.30 }, 30: { x:  0.35, y: 1.42 },
  31: { x: -0.65, y: 1.40 }, 32: { x:  0.45, y: 1.42 },
});

// Xiebu left-forward: left leg plants (front), right leg crosses behind (back).
const XIEBU_LF = makeLandmarks({
  11: { x: -0.50, y: 0.00 }, 12: { x:  0.50, y: 0.00 },
  13: { x: -0.55, y: 0.35 }, 14: { x:  0.55, y: 0.35 },
  15: { x: -0.35, y: 0.80 }, 16: { x:  0.35, y: 0.80 },
  23: { x: -0.35, y: 0.80 }, 24: { x:  0.35, y: 0.80 },
  25: { x: -0.20, y: 1.05 }, 26: { x:  0.15, y: 1.05 },
  27: { x:  0.10, y: 1.35 }, 28: { x: -0.10, y: 1.35 },
  29: { x:  0.05, y: 1.38 }, 30: { x: -0.15, y: 1.28 },
  31: { x:  0.15, y: 1.38 }, 32: { x: -0.05, y: 1.38 },
});

// ============================================================
// Public registry
// ============================================================

type VariantRegistry = Partial<Record<StanceVariant, ReferenceSkeleton>>;

const REFERENCES: Record<string, VariantRegistry> = (() => {
  function build(
    stanceId: string,
    view: CameraView,
    leftForward: PoseLandmark[],
    asymmetric: boolean,
  ): VariantRegistry {
    const lf: ReferenceSkeleton = { stanceId, variant: "left-forward", view, landmarks: leftForward };
    if (!asymmetric) return { "left-forward": lf, "right-forward": lf };
    const rf: ReferenceSkeleton = {
      stanceId, variant: "right-forward", view,
      landmarks: mirrorLandmarks(leftForward),
    };
    return { "left-forward": lf, "right-forward": rf };
  }
  return {
    "horse-stance": build("horse-stance", "front", MABU, false),
    "bow-stance":   build("bow-stance",   "side",  GONGBU_LF, true),
    "crouch-stance": build("crouch-stance", "side", PUBU_LF, true),
    "empty-stance": build("empty-stance",  "side",  XUBU_LF, true),
    "rest-stance":  build("rest-stance",   "front", XIEBU_LF, true),
  };
})();

export function getReferenceSkeleton(
  stanceId: string,
  variant: StanceVariant = "left-forward",
): ReferenceSkeleton | null {
  return REFERENCES[stanceId]?.[variant] ?? null;
}

// ============================================================
// Self-validation — runs in development to catch drift between
// reference coords and gate conditions.
// ============================================================

export type ReferenceValidationResult = {
  stanceId: string;
  variant: StanceVariant;
  allPass: boolean;
  failures: Array<{ id: string; label: string; value: number | null; targetLabel: string }>;
};

export function validateReferenceSkeleton(ref: ReferenceSkeleton): ReferenceValidationResult {
  const gates = getStanceGates(ref.stanceId);
  const assignment = legAssignmentFor(ref.variant);
  const evalResult = evaluateGates(ref.landmarks, gates, assignment);
  return {
    stanceId: ref.stanceId,
    variant: ref.variant,
    allPass: evalResult.allPass,
    failures: evalResult.results
      .filter((r) => r.status !== "pass")
      .map((r) => ({ id: r.id, label: r.label, value: r.value, targetLabel: r.targetLabel })),
  };
}

export function validateAllReferences(): ReferenceValidationResult[] {
  const out: ReferenceValidationResult[] = [];
  for (const [stanceId, variants] of Object.entries(REFERENCES)) {
    for (const variant of ["left-forward", "right-forward"] as const) {
      const ref = variants[variant];
      if (!ref) continue;
      out.push(validateReferenceSkeleton(ref));
      // Avoid double-validating symmetric stances that share the same ref object.
      if (stanceId === "horse-stance") break;
    }
  }
  return out;
}

// Dev-only self-check on module load. Logs any reference that fails its own gates.
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const results = validateAllReferences();
  for (const r of results) {
    if (!r.allPass) {
      // eslint-disable-next-line no-console
      console.warn(
        `[reference-skeletons] ${r.stanceId} (${r.variant}) fails gates:`,
        r.failures,
      );
    }
  }
}
