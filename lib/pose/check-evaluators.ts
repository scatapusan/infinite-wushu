import type {
  PoseLandmark,
  StanceCheck,
  CheckResult,
  CheckStatus,
  CheckSeverity,
} from "./types";
import { calculateAngle, calculateTorsoLean, DETECT_THRESHOLD } from "./angle-utils";

/** Landmarks that must be visible for a given check to run meaningfully. */
export function landmarksFor(check: StanceCheck): number[] {
  switch (check.kind) {
    case "angle":
      return check.landmarks.slice();
    case "torsoLean":
      return [11, 12, 23, 24];
    case "ratio":
      return [...check.numerator, ...check.denominator];
    case "symmetry":
      return [...check.angleA, ...check.angleB];
    case "alignment":
      return [check.a, check.b];
    case "footAngle":
      return [check.ankle, check.foot];
    case "legsCrossed":
      return [23, 24, 27, 28];
    case "custom":
      return []; // responsibility of the custom evaluator
  }
}

function allVisible(landmarks: PoseLandmark[], indices: number[]): boolean {
  return indices.every(
    (i) => (landmarks[i]?.visibility ?? 0) >= DETECT_THRESHOLD,
  );
}

/** Statuses based on severity — stricter for critical checks. */
function bandStatus(
  absDelta: number,
  tolerance: number,
  severity: CheckSeverity,
): CheckStatus {
  // Critical checks: narrow green band, everything outside is red (no yellow grace)
  if (severity === "critical") {
    return absDelta <= tolerance ? "green" : "red";
  }
  // Major / minor: three-tier band
  if (absDelta <= tolerance) return "green";
  if (absDelta <= tolerance * 2) return "yellow";
  return "red";
}

function distance(
  a: PoseLandmark,
  b: PoseLandmark,
  dimension: "x" | "y" | "both" = "both",
): number {
  if (dimension === "x") return Math.abs(a.x - b.x);
  if (dimension === "y") return Math.abs(a.y - b.y);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function offscreen(check: StanceCheck): CheckResult {
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status: "yellow",
    value: null,
    targetLabel: check.targetLabel,
    message: "Landmark not visible — adjust camera framing",
  };
}

function messageFor(
  check: {
    messageLow?: string;
    messageHigh?: string;
    message?: string;
  },
  delta: number,
  status: CheckStatus,
): string | null {
  if (status === "green") return null;
  if (delta < 0 && check.messageLow) return check.messageLow;
  if (delta > 0 && check.messageHigh) return check.messageHigh;
  return check.message ?? check.messageLow ?? check.messageHigh ?? null;
}

export function evaluateCheck(
  check: StanceCheck,
  landmarks: PoseLandmark[],
): CheckResult {
  // Visibility guard for non-custom checks
  if (check.kind !== "custom") {
    const required = landmarksFor(check);
    if (!allVisible(landmarks, required)) {
      return offscreen(check);
    }
  }

  switch (check.kind) {
    case "angle":
      return evaluateAngle(check, landmarks);
    case "torsoLean":
      return evaluateTorsoLean(check, landmarks);
    case "ratio":
      return evaluateRatio(check, landmarks);
    case "symmetry":
      return evaluateSymmetry(check, landmarks);
    case "alignment":
      return evaluateAlignment(check, landmarks);
    case "footAngle":
      return evaluateFootAngle(check, landmarks);
    case "legsCrossed":
      return evaluateLegsCrossed(check, landmarks);
    case "custom":
      return evaluateCustom(check, landmarks);
  }
}

function evaluateAngle(
  check: Extract<StanceCheck, { kind: "angle" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const [ai, bi, ci] = check.landmarks;
  const current = calculateAngle(landmarks[ai], landmarks[bi], landmarks[ci]);
  const delta = current - check.target;
  const status = bandStatus(Math.abs(delta), check.tolerance, check.severity);
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status,
    value: Math.round(current),
    targetLabel: check.targetLabel,
    message: messageFor(check, delta, status),
  };
}

function evaluateTorsoLean(
  check: Extract<StanceCheck, { kind: "torsoLean" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const lean = calculateTorsoLean(landmarks);
  const delta = lean - check.target;
  const status = bandStatus(Math.abs(delta), check.tolerance, check.severity);
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status,
    value: Math.round(lean),
    targetLabel: check.targetLabel,
    message: messageFor(check, delta, status),
  };
}

function evaluateRatio(
  check: Extract<StanceCheck, { kind: "ratio" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const dim = check.dimension ?? "both";
  const num = distance(
    landmarks[check.numerator[0]],
    landmarks[check.numerator[1]],
    dim,
  );
  const den = distance(
    landmarks[check.denominator[0]],
    landmarks[check.denominator[1]],
    dim,
  );
  const ratio = den === 0 ? 0 : num / den;
  const delta = ratio - check.target;
  const status = bandStatus(Math.abs(delta), check.tolerance, check.severity);
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status,
    // Display as ×10 so "2.0" ratio reads cleanly
    value: Math.round(ratio * 10) / 10,
    targetLabel: check.targetLabel,
    message: messageFor(check, delta, status),
  };
}

function evaluateSymmetry(
  check: Extract<StanceCheck, { kind: "symmetry" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const a = calculateAngle(
    landmarks[check.angleA[0]],
    landmarks[check.angleA[1]],
    landmarks[check.angleA[2]],
  );
  const b = calculateAngle(
    landmarks[check.angleB[0]],
    landmarks[check.angleB[1]],
    landmarks[check.angleB[2]],
  );
  const diff = Math.abs(a - b);
  const status = bandStatus(diff, check.tolerance, check.severity);
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status,
    value: Math.round(diff),
    targetLabel: check.targetLabel,
    message: status === "green" ? null : check.message ?? null,
  };
}

function evaluateAlignment(
  check: Extract<StanceCheck, { kind: "alignment" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const a = landmarks[check.a];
  const b = landmarks[check.b];
  const av = check.axis === "x" ? a.x : a.y;
  const bv = check.axis === "x" ? b.x : b.y;
  const delta = av - bv;
  let status: CheckStatus;
  if (check.comparator === "leq") {
    // delta should be ≤ tolerance (a's coord at or below b's)
    if (delta <= check.tolerance) status = "green";
    else if (delta <= check.tolerance * 2) status = "yellow";
    else status = "red";
  } else if (check.comparator === "geq") {
    if (delta >= -check.tolerance) status = "green";
    else if (delta >= -check.tolerance * 2) status = "yellow";
    else status = "red";
  } else {
    status = bandStatus(Math.abs(delta), check.tolerance, check.severity);
  }
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status,
    value: Math.round(delta * 100) / 100,
    targetLabel: check.targetLabel,
    message: messageFor(check, delta, status),
  };
}

function evaluateFootAngle(
  check: Extract<StanceCheck, { kind: "footAngle" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const ankle = landmarks[check.ankle];
  const foot = landmarks[check.foot];
  const dx = foot.x - ankle.x;
  const dy = foot.y - ankle.y;
  const angleDeg = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  const delta = angleDeg - check.target;
  const status = bandStatus(Math.abs(delta), check.tolerance, check.severity);
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status,
    value: Math.round(angleDeg),
    targetLabel: check.targetLabel,
    message: messageFor(check, delta, status),
  };
}

function evaluateLegsCrossed(
  check: Extract<StanceCheck, { kind: "legsCrossed" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  // Hip order vs ankle order should invert when legs are crossed.
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const hipOrder = Math.sign(rightHip.x - leftHip.x);
  const ankleOrder = Math.sign(rightAnkle.x - leftAnkle.x);
  const crossed = hipOrder !== 0 && ankleOrder !== 0 && hipOrder !== ankleOrder;
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status: crossed ? "green" : "red",
    value: crossed ? 1 : 0,
    targetLabel: check.targetLabel,
    message: crossed ? null : check.message ?? null,
  };
}

function evaluateCustom(
  check: Extract<StanceCheck, { kind: "custom" }>,
  landmarks: PoseLandmark[],
): CheckResult {
  const r = check.evaluate(landmarks);
  return {
    id: check.id,
    label: check.label,
    severity: check.severity,
    status: r.status,
    value: r.value,
    targetLabel: check.targetLabel,
    message: r.message,
  };
}
