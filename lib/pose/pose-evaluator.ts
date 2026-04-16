import type {
  PoseLandmark,
  StanceAngleConfig,
  AngleResult,
  StanceEvaluation,
} from "./types";
import { calculateAngle, calculateTorsoLean } from "./angle-utils";

const MIN_VISIBILITY = 0.5;

export function evaluateStance(
  landmarks: PoseLandmark[],
  config: StanceAngleConfig,
): StanceEvaluation {
  const angles: AngleResult[] = config.angles.map((spec) => {
    let current: number;

    if (spec.isTorsoLean) {
      current = calculateTorsoLean(landmarks);
    } else {
      const [ai, bi, ci] = spec.landmarks;
      const a = landmarks[ai];
      const b = landmarks[bi];
      const c = landmarks[ci];

      // If any landmark has low visibility, return a neutral result
      if (
        a.visibility < MIN_VISIBILITY ||
        b.visibility < MIN_VISIBILITY ||
        c.visibility < MIN_VISIBILITY
      ) {
        return {
          label: spec.label,
          current: spec.target,
          target: spec.target,
          tolerance: spec.tolerance,
          delta: 0,
          status: "yellow" as const,
          feedback: "Move so your full body is visible",
        };
      }

      current = calculateAngle(a, b, c);
    }

    const delta = current - spec.target;
    const absDelta = Math.abs(delta);

    let status: "green" | "yellow" | "red";
    if (absDelta <= spec.tolerance) {
      status = "green";
    } else if (absDelta <= spec.tolerance * 2) {
      status = "yellow";
    } else {
      status = "red";
    }

    let feedback: string | null = null;
    if (status !== "green") {
      feedback = delta < 0 ? spec.feedback_low : spec.feedback_high;
    }

    return {
      label: spec.label,
      current: Math.round(current),
      target: spec.target,
      tolerance: spec.tolerance,
      delta: Math.round(delta),
      status,
      feedback,
    };
  });

  // Score: each angle contributes equally
  const score =
    angles.length === 0
      ? 0
      : Math.round(
          angles.reduce((sum, a) => sum + angleScore(a), 0) / angles.length,
        );

  const overallFeedback = deriveOverallFeedback(angles, score);

  return { angles, score, overallFeedback };
}

function angleScore(result: AngleResult): number {
  const absDelta = Math.abs(result.delta);
  const tol = result.tolerance;

  if (absDelta <= tol) return 100;
  if (absDelta <= tol * 2) {
    // Linear interpolation 100 -> 50
    return 100 - ((absDelta - tol) / tol) * 50;
  }
  // Beyond 2x tolerance: 50 -> 0
  const maxDelta = tol * 4;
  if (absDelta >= maxDelta) return 0;
  return 50 - ((absDelta - tol * 2) / (tol * 2)) * 50;
}

function deriveOverallFeedback(angles: AngleResult[], score: number): string {
  if (score >= 90) return "Excellent form! Hold it steady.";
  if (score >= 70) return "Good — small adjustments needed.";

  // Find the worst angle and use its feedback
  const worst = angles.reduce(
    (w, a) => (Math.abs(a.delta) > Math.abs(w.delta) ? a : w),
    angles[0],
  );
  return worst?.feedback ?? "Keep adjusting your stance.";
}
