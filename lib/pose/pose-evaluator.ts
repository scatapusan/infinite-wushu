import type {
  PoseLandmark,
  StanceCheckConfig,
  CheckResult,
  ViewEvaluation,
  CameraView,
  CombinedEvaluation,
} from "./types";
import { evaluateCheck } from "./check-evaluators";
import {
  evaluateGates,
  getStanceGates,
  type GatesEvaluation,
  type LegAssignment,
} from "./stance-gates";

export type StanceFrameEvaluation = {
  view: ViewEvaluation;
  gates: GatesEvaluation;
};

/**
 * Evaluate both the scored checks and the spatial gates in one pass.
 * Gates enforce AND logic and drive the hold timer; checks drive the score display.
 */
export function evaluateStanceFrame(
  landmarks: PoseLandmark[],
  config: StanceCheckConfig,
  view: CameraView,
  assignment: LegAssignment,
  extraChecks: CheckResult[] = [],
): StanceFrameEvaluation {
  const viewEval = evaluateStanceView(landmarks, config, view, extraChecks);
  const gates = evaluateGates(
    landmarks,
    getStanceGates(config.techniqueId),
    assignment,
  );
  return { view: viewEval, gates };
}

/**
 * Evaluate all checks in a stance config that apply to the given view.
 * Scoring starts at 100, deducting per failing check.
 */
export function evaluateStanceView(
  landmarks: PoseLandmark[],
  config: StanceCheckConfig,
  view: CameraView,
  extraChecks: CheckResult[] = [],
): ViewEvaluation {
  const applicable = config.checks.filter((c) => c.view === view);
  const checks: CheckResult[] = applicable.map((c) =>
    evaluateCheck(c, landmarks),
  );
  const allResults = [...checks, ...extraChecks];

  const score = computeScore(allResults);
  const failures = allResults.filter((c) => c.status !== "green");
  const overallFeedback = deriveOverallFeedback(allResults, score);

  return { view, score, checks: allResults, failures, overallFeedback };
}

/**
 * Deduction-based scoring:
 *   - Start at 100
 *   - Red + critical: −30
 *   - Red + major:    −15
 *   - Red + minor:    −5
 *   - Yellow + major: −5 (yellow counts as "close")
 *   - Clamp to [0, 100]
 */
export function computeScore(checks: CheckResult[]): number {
  let score = 100;
  for (const c of checks) {
    if (c.status === "red") {
      if (c.severity === "critical") score -= 30;
      else if (c.severity === "major") score -= 15;
      else score -= 5;
    } else if (c.status === "yellow" && c.severity === "major") {
      score -= 5;
    }
  }
  return Math.max(0, Math.min(100, score));
}

function deriveOverallFeedback(checks: CheckResult[], score: number): string {
  if (checks.length === 0) return "Stand in frame to begin…";
  const failing = checks.filter((c) => c.status === "red");
  if (score >= 90 && failing.length === 0)
    return "Excellent form — hold it steady.";
  if (score >= 70 && failing.length === 0)
    return "Good — small adjustments needed.";
  const worst =
    failing.find((c) => c.severity === "critical") ??
    failing.find((c) => c.severity === "major") ??
    failing[0];
  return worst?.message ?? "Keep adjusting your stance.";
}

/** Combine two per-view evaluations into a single result. */
export function combineViews(
  techniqueId: string,
  front: ViewEvaluation | undefined,
  side: ViewEvaluation | undefined,
  mode: "quick" | "multi",
): CombinedEvaluation {
  const scores = [front?.score, side?.score].filter(
    (s): s is number => typeof s === "number",
  );
  const combinedScore =
    scores.length === 0
      ? 0
      : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const verified =
    mode === "multi" &&
    (front?.score ?? 0) >= 70 &&
    (side?.score ?? 0) >= 70;
  return {
    techniqueId,
    front,
    side,
    combinedScore,
    verified,
    mode,
  };
}
