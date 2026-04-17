export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type BodyPartStatus = {
  name: string;
  /** True when at least one landmark is above DETECT_THRESHOLD (0.5) */
  detected: boolean;
  /** True when both landmarks are above READY_THRESHOLD (0.7) */
  confident: boolean;
};

export type BodyVisibility = {
  /** All required parts are confident (≥0.7) — scoring can start */
  ready: boolean;
  /** All required parts are at least detected (≥0.5) */
  detected: boolean;
  parts: BodyPartStatus[];
};

export type PracticeAttempt = {
  techniqueId: string;
  score: number;
  angles: Record<string, number>;
  duration: number;
  timestamp: number;
  /** Optional: per-view scores when multi-view mode was used */
  frontScore?: number;
  sideScore?: number;
  /** Both views ≥70 */
  verified?: boolean;
  /** "quick" = single view, "multi" = both views */
  mode?: "quick" | "multi";
};

// ============================================================
// Check-based stance evaluation (Phase 4)
// ============================================================

export type CameraView = "front" | "side";

export type CheckSeverity = "critical" | "major" | "minor";

/** Green: passing. Yellow: close (minor drift). Red: failing. */
export type CheckStatus = "green" | "yellow" | "red";

export type CheckResult = {
  id: string;
  label: string;
  severity: CheckSeverity;
  status: CheckStatus;
  /** Numeric reading for display (angle, ratio, etc.); null if visibility failed */
  value: number | null;
  /** Target or tolerance summary for display, e.g. "90° ±8°" */
  targetLabel: string;
  /** Failure message when status is yellow/red, null when passing */
  message: string | null;
};

export type StanceCheckBase = {
  id: string;
  label: string;
  view: CameraView;
  severity: CheckSeverity;
  /** Human-readable summary of the target, e.g. "90° ±8°" */
  targetLabel: string;
  /** Message when the reading is below the target band */
  messageLow?: string;
  /** Message when the reading is above the target band */
  messageHigh?: string;
  /** Generic message when there is no clear direction */
  message?: string;
};

export type AngleCheck = StanceCheckBase & {
  kind: "angle";
  /** [a, vertex, c] landmark indices */
  landmarks: [number, number, number];
  target: number;
  tolerance: number;
};

export type TorsoLeanCheck = StanceCheckBase & {
  kind: "torsoLean";
  target: number;
  tolerance: number;
};

export type RatioCheck = StanceCheckBase & {
  kind: "ratio";
  /** Numerator: distance between these two landmarks */
  numerator: [number, number];
  /** Denominator: distance between these two landmarks */
  denominator: [number, number];
  /** Distance dimension: "x" | "y" | "both" */
  dimension?: "x" | "y" | "both";
  target: number;
  tolerance: number;
};

export type SymmetryCheck = StanceCheckBase & {
  kind: "symmetry";
  /** Two angles (each a landmark triple) to compare */
  angleA: [number, number, number];
  angleB: [number, number, number];
  /** Maximum allowed diff in degrees */
  tolerance: number;
};

/** Checks alignment of two coordinates (e.g. knee-over-ankle). */
export type AlignmentCheck = StanceCheckBase & {
  kind: "alignment";
  /** Axis to compare on */
  axis: "x" | "y";
  /** Landmark a (e.g. knee) */
  a: number;
  /** Landmark b (e.g. ankle) */
  b: number;
  /** Maximum allowed diff (normalized coords, 0-1) */
  tolerance: number;
  /** "leq" = a's coord should be ≤ b's; "geq" = ≥; "abs" = within tolerance either side */
  comparator: "abs" | "leq" | "geq";
};

/** Foot orientation: angle of ankle→toe vector vs camera axis. */
export type FootAngleCheck = StanceCheckBase & {
  kind: "footAngle";
  /** Ankle landmark (27 or 28) */
  ankle: number;
  /** Foot index landmark (31 or 32) */
  foot: number;
  /** Target angle in degrees (0 = pointing right along x-axis) */
  target: number;
  tolerance: number;
};

/** Legs-crossed detection: ankle x-coords should be inverted vs hip x-coords. */
export type LegsCrossedCheck = StanceCheckBase & {
  kind: "legsCrossed";
};

/** Escape hatch for bespoke logic. */
export type CustomCheck = StanceCheckBase & {
  kind: "custom";
  evaluate: (landmarks: PoseLandmark[]) => {
    passed: boolean;
    status: CheckStatus;
    value: number | null;
    message: string | null;
  };
};

export type StanceCheck =
  | AngleCheck
  | TorsoLeanCheck
  | RatioCheck
  | SymmetryCheck
  | AlignmentCheck
  | FootAngleCheck
  | LegsCrossedCheck
  | CustomCheck;

export type StanceCheckConfig = {
  techniqueId: string;
  /** Camera view preferred for this stance's primary capture */
  primaryView: CameraView;
  checks: StanceCheck[];
};

export type ViewEvaluation = {
  view: CameraView;
  score: number;
  checks: CheckResult[];
  /** Subset of `checks` where status != "green" */
  failures: CheckResult[];
  overallFeedback: string;
};

export type CombinedEvaluation = {
  techniqueId: string;
  front?: ViewEvaluation;
  side?: ViewEvaluation;
  combinedScore: number;
  verified: boolean;
  mode: "quick" | "multi";
};

// ============================================================
// Hand tracking (Phase 4 · Update 4)
// ============================================================

export type HandLandmark = {
  x: number;
  y: number;
  z: number;
};

export type HandShape = "fist" | "palm" | "hook" | "unknown";

export type ArmPosition = "waist" | "punch" | "guard";

export type HandFeedback = {
  leftShape: HandShape;
  rightShape: HandShape;
  /** What the evaluator detected (may differ from expected) */
  detectedArmPosition: ArmPosition | "unknown";
  /** Check results to fold into overall stance score */
  checks: CheckResult[];
};
