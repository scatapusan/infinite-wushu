import type { PoseLandmark } from "./types";
import { calculateAngle } from "./angle-utils";

/**
 * Authoritative leg classifier for asymmetric stances.
 *
 * Design: Each low-level method is semantic-neutral — it reports which side
 * of the body exhibits a trait (e.g. "more bent knee", "heel lifted") with a
 * confidence score. A per-stance interpretation table maps each trait to a
 * LegRole (front/back/bent/extended) for the stance under evaluation. The
 * combined classifier runs all configured methods, weights their votes, and
 * picks a winner per side.
 *
 * Why this shape: the old `classifyVariant` hard-wired "smaller knee angle =
 * front leg" which is right for gongbu/pubu/xiebu but wrong for xubu (empty
 * stance — the more-bent leg is the back weight-bearing leg there). Baking the
 * interpretation per-stance separates biomechanical facts from semantic labels.
 *
 * Integration: `leg-resolver.ts` now delegates `classifyVariant` here;
 * downstream call sites (PracticePage, PracticeFormPage) keep their existing
 * surface. The richer `classifyLegs` / `LegClassifierBuffer` / stance resolvers
 * are exposed for future code that needs confidence data.
 */

// ─── Landmark index constants (MediaPipe Pose with foot extensions) ──────

const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;
const L_KNEE = 25;
const R_KNEE = 26;
const L_ANKLE = 27;
const R_ANKLE = 28;
const L_HEEL = 29;
const R_HEEL = 30;
const L_TOE = 31;
const R_TOE = 32;

// ─── Public types ────────────────────────────────────────────────────────

export type LegRole = "front" | "back" | "bent" | "extended";

export type ClassifierMethod =
  | "knee-angle"
  | "hip-orientation"
  | "foot-position"
  | "weight-distribution"
  | "heel-lift"
  | "combined";

export type StanceType = "front-back" | "bent-extended";

type SideWinner = "left" | "right" | null;

/** Raw trait-comparison output from a single method. */
interface MethodObservation {
  winner: SideWinner;
  confidence: number;
}

export interface LegClassification {
  left: LegRole;
  right: LegRole;
  /** 0..1 — weighted average of contributing method confidences. */
  confidence: number;
  /** The winning method (or "combined" when weighted votes produced the result). */
  method: ClassifierMethod;
  /** True when confidence < minConfidence or visibility is too poor to trust. */
  ambiguous: boolean;
  /** Per-method votes — useful for debug overlay and tests. */
  methodResults: MethodVote[];
}

export interface MethodVote {
  method: ClassifierMethod;
  /** Role assigned to the user's left side. Null when the method abstained. */
  left: LegRole | null;
  right: LegRole | null;
  /** Raw confidence of this method's vote, before weighting. */
  confidence: number;
  weight: number;
}

export interface LegClassifierConfig {
  stanceType: StanceType;
  /** Which methods to run, and their weight in the final vote. */
  methodWeights: Partial<Record<Exclude<ClassifierMethod, "combined">, number>>;
  /** Below this, result is marked `ambiguous`. Default 0.7. */
  minConfidence?: number;
  /** Critical landmark visibility threshold. Default 0.7. */
  requireVisibility?: number;
}

// ─── Per-stance configuration ─────────────────────────────────────────────

/**
 * Stance-specific trait → role interpretation.
 *
 * Each entry says: "for this stance, the side that wins method X is assigned
 * this role." null means the method is unreliable for this stance and its
 * vote should be discarded even if the stance is in its weights map.
 */
type TraitInterpretation = Partial<
  Record<Exclude<ClassifierMethod, "combined">, LegRole>
>;

const INTERPRETATION: Record<string, TraitInterpretation> = {
  "bow-stance": {
    // Gongbu: front leg is bent ~90°, back leg is straight and extended
    // behind. Pelvis typically rotates slightly toward the front leg.
    "knee-angle": "front", // more-bent = front
    "hip-orientation": "front", // pelvis faces front leg
    "foot-position": "back", // back leg extends further → its foot is further from hip center
  },
  "empty-stance": {
    // Xubu: back leg bears all weight (bent), front leg extends forward
    // with toe touching (straight).
    "knee-angle": "back", // more-bent = back (weight-bearing)
    "foot-position": "front", // front leg reaches forward → front foot further from hip
    "weight-distribution": "back", // lower hip = weight-bearing = back
  },
  "rest-stance": {
    // Xiebu: legs crossed, body lowered. Back leg's heel is lifted off
    // the floor (on the ball of the foot). Knees similarly bent so
    // knee-angle isn't reliable.
    "heel-lift": "back", // lifted heel = back leg
    "foot-position": "front", // front foot planted on hip's side
  },
  "crouch-stance": {
    // Pubu: one leg deeply bent in a squat, the other fully extended to
    // the side, horizontal.
    "knee-angle": "bent", // more-bent = bent (tautological but explicit)
    "foot-position": "extended", // extended leg's foot reaches far out
  },
};

/**
 * Per-stance method weights. See LEG_CLASSIFIER_NOTES.md for rationale.
 *
 * Rest-stance diverges from the spec (which listed knee-angle + foot-position):
 * heel-lift is the dominant reliable signal since crossed-leg geometry makes
 * knee angles similar.
 */
const STANCE_CLASSIFIER_CONFIG: Record<string, LegClassifierConfig> = {
  "bow-stance": {
    stanceType: "front-back",
    methodWeights: {
      "knee-angle": 0.5,
      "hip-orientation": 0.3,
      "foot-position": 0.2,
    },
  },
  "empty-stance": {
    stanceType: "front-back",
    methodWeights: {
      "knee-angle": 0.4,
      "foot-position": 0.3,
      "weight-distribution": 0.3,
    },
  },
  "rest-stance": {
    stanceType: "front-back",
    methodWeights: {
      "heel-lift": 0.7,
      "foot-position": 0.3,
    },
  },
  "crouch-stance": {
    stanceType: "bent-extended",
    methodWeights: {
      "knee-angle": 0.6,
      "foot-position": 0.4,
    },
  },
};

/** Look up the per-stance config. Returns null for symmetric / unknown stances. */
export function getClassifierConfig(stanceId: string): LegClassifierConfig | null {
  return STANCE_CLASSIFIER_CONFIG[stanceId] ?? null;
}

// ─── Visibility helpers ──────────────────────────────────────────────────

function vis(landmarks: PoseLandmark[], idx: number): number {
  return landmarks[idx]?.visibility ?? 0;
}

function allVisible(
  landmarks: PoseLandmark[],
  indices: number[],
  threshold: number,
): boolean {
  for (const i of indices) {
    if (vis(landmarks, i) < threshold) return false;
  }
  return true;
}

// ─── Methods A–E (semantic-neutral observations) ─────────────────────────

/**
 * Method A: knee-angle comparison.
 * Winner = side with the SMALLER knee angle (more bent).
 */
function observeKneeAngle(
  landmarks: PoseLandmark[],
  requireVisibility: number,
): MethodObservation {
  if (!allVisible(landmarks, [L_HIP, R_HIP, L_KNEE, R_KNEE, L_ANKLE, R_ANKLE], requireVisibility)) {
    return { winner: null, confidence: 0 };
  }
  const lAngle = calculateAngle(
    landmarks[L_HIP],
    landmarks[L_KNEE],
    landmarks[L_ANKLE],
  );
  const rAngle = calculateAngle(
    landmarks[R_HIP],
    landmarks[R_KNEE],
    landmarks[R_ANKLE],
  );
  const diff = Math.abs(lAngle - rAngle);
  // Below 8°, too close to call.
  if (diff < 8) return { winner: null, confidence: 0 };
  // Confidence scales with gap: 8°→~0.13, 60°→1.0.
  const confidence = Math.min(diff / 60, 1);
  const winner: SideWinner = lAngle < rAngle ? "left" : "right";
  return { winner, confidence };
}

/**
 * Method B: hip orientation.
 * Winner = side the pelvis rotates toward (appears lower / closer to camera).
 *
 * In an axis-facing stance like gongbu, the body rotates slightly so that the
 * pelvis faces the forward leg. In screen space, the forward-side hip tends
 * to be vertically lower (closer to camera = lower y in some projections) and
 * the opposite-side hip rises. This is a WEAK signal — skip when rotation is
 * marginal.
 */
function observeHipOrientation(
  landmarks: PoseLandmark[],
  requireVisibility: number,
): MethodObservation {
  if (!allVisible(landmarks, [L_HIP, R_HIP, L_SHOULDER, R_SHOULDER], requireVisibility)) {
    return { winner: null, confidence: 0 };
  }
  const pelvisDx = landmarks[R_HIP].x - landmarks[L_HIP].x;
  const pelvisDy = landmarks[R_HIP].y - landmarks[L_HIP].y;
  const pelvisLen = Math.hypot(pelvisDx, pelvisDy) || 1;
  const rotationMagnitude = Math.abs(pelvisDy) / pelvisLen;
  // Below 5% tilt, hips are effectively level — can't read rotation.
  if (rotationMagnitude < 0.08) return { winner: null, confidence: 0 };
  const confidence = Math.min(rotationMagnitude / 0.3, 1);
  // The lower hip (larger y in image coords) is rotated toward camera.
  const winner: SideWinner =
    landmarks[L_HIP].y > landmarks[R_HIP].y ? "left" : "right";
  return { winner, confidence };
}

/**
 * Method C: foot position relative to hip center.
 * Winner = side whose ankle is further from hip center (horizontally).
 *
 * Interpretation is stance-specific (gongbu: further = back; xubu: further =
 * front; pubu: further = extended). The per-stance table handles it.
 */
function observeFootPosition(
  landmarks: PoseLandmark[],
  requireVisibility: number,
): MethodObservation {
  if (!allVisible(landmarks, [L_HIP, R_HIP, L_ANKLE, R_ANKLE], requireVisibility)) {
    return { winner: null, confidence: 0 };
  }
  const hipCenterX = (landmarks[L_HIP].x + landmarks[R_HIP].x) / 2;
  // Use shoulder width when available for a more stable normalizer;
  // fall back to hip width.
  const shoulderWidth =
    vis(landmarks, L_SHOULDER) >= requireVisibility &&
    vis(landmarks, R_SHOULDER) >= requireVisibility
      ? Math.abs(landmarks[R_SHOULDER].x - landmarks[L_SHOULDER].x) || 0.001
      : Math.abs(landmarks[R_HIP].x - landmarks[L_HIP].x) || 0.001;
  const lDist = Math.abs(landmarks[L_ANKLE].x - hipCenterX) / shoulderWidth;
  const rDist = Math.abs(landmarks[R_ANKLE].x - hipCenterX) / shoulderWidth;
  const diff = Math.abs(lDist - rDist);
  if (diff < 0.2) return { winner: null, confidence: 0 };
  const confidence = Math.min(diff / 1.5, 1);
  const winner: SideWinner = lDist > rDist ? "left" : "right";
  return { winner, confidence };
}

/**
 * Method D: weight distribution (hip Y comparison).
 * Winner = side of the LOWER hip — the weight-bearing leg sinks that hip down.
 *
 * Only used for empty-stance in the current configs; other front-back stances
 * have weight distributed too evenly for this to be informative.
 */
function observeWeightDistribution(
  landmarks: PoseLandmark[],
  requireVisibility: number,
): MethodObservation {
  if (!allVisible(landmarks, [L_HIP, R_HIP], requireVisibility)) {
    return { winner: null, confidence: 0 };
  }
  const lHipY = landmarks[L_HIP].y;
  const rHipY = landmarks[R_HIP].y;
  const diff = Math.abs(lHipY - rHipY);
  // Require at least 1% of image height — smaller than this is sensor noise.
  if (diff < 0.01) return { winner: null, confidence: 0 };
  // Confidence scales with tilt: 1%→0.2, 5%→1.0.
  const confidence = Math.min(diff / 0.05, 1);
  const winner: SideWinner = lHipY > rHipY ? "left" : "right";
  return { winner, confidence };
}

/**
 * Method E: heel-lift detection (rest-stance specialization).
 * Winner = side whose heel is LIFTED off the floor (heel y < toe y in image space).
 */
function observeHeelLift(
  landmarks: PoseLandmark[],
  requireVisibility: number,
): MethodObservation {
  if (!allVisible(landmarks, [L_HEEL, R_HEEL, L_TOE, R_TOE], requireVisibility)) {
    return { winner: null, confidence: 0 };
  }
  const THRESHOLD = 0.01;
  const lLift = landmarks[L_TOE].y - landmarks[L_HEEL].y;
  const rLift = landmarks[R_TOE].y - landmarks[R_HEEL].y;
  const lUp = lLift > THRESHOLD;
  const rUp = rLift > THRESHOLD;
  if (lUp === rUp) return { winner: null, confidence: 0 };
  const winner: SideWinner = lUp ? "left" : "right";
  const liftMag = lUp ? lLift : rLift;
  // Heel-lift is a binary-ish signal — when it triggers, confidence is high.
  const confidence = Math.min(0.7 + (liftMag - THRESHOLD) / 0.08, 1);
  return { winner, confidence };
}

// ─── Vote → roles conversion ──────────────────────────────────────────────

function rolePair(
  winnerRole: LegRole,
  stanceType: StanceType,
): [LegRole, LegRole] {
  if (stanceType === "bent-extended") {
    return winnerRole === "bent" ? ["bent", "extended"] : ["extended", "bent"];
  }
  return winnerRole === "front" ? ["front", "back"] : ["back", "front"];
}

function observationToVote(
  method: Exclude<ClassifierMethod, "combined">,
  obs: MethodObservation,
  stanceId: string,
  stanceType: StanceType,
): MethodVote {
  const interpretation = INTERPRETATION[stanceId];
  const assigned = interpretation?.[method];
  if (!assigned || obs.winner === null || obs.confidence === 0) {
    return { method, left: null, right: null, confidence: 0, weight: 0 };
  }
  const [winnerRole, loserRole] = rolePair(assigned, stanceType);
  return obs.winner === "left"
    ? { method, left: winnerRole, right: loserRole, confidence: obs.confidence, weight: 0 }
    : { method, left: loserRole, right: winnerRole, confidence: obs.confidence, weight: 0 };
}

// ─── Combined classifier ──────────────────────────────────────────────────

const OBSERVERS: Record<
  Exclude<ClassifierMethod, "combined">,
  (l: PoseLandmark[], v: number) => MethodObservation
> = {
  "knee-angle": observeKneeAngle,
  "hip-orientation": observeHipOrientation,
  "foot-position": observeFootPosition,
  "weight-distribution": observeWeightDistribution,
  "heel-lift": observeHeelLift,
};

/** Run all configured methods and combine their votes into a single classification. */
export function classifyLegs(
  landmarks: PoseLandmark[],
  config: LegClassifierConfig,
  stanceId: string,
): LegClassification {
  const requireVisibility = config.requireVisibility ?? 0.7;
  const minConfidence = config.minConfidence ?? 0.7;

  const methodResults: MethodVote[] = [];
  // Tally contribution weight per role, per side.
  const leftTally: Record<LegRole, number> = { front: 0, back: 0, bent: 0, extended: 0 };
  const rightTally: Record<LegRole, number> = { front: 0, back: 0, bent: 0, extended: 0 };
  let totalConfiguredWeight = 0;
  let totalActiveWeight = 0;
  let weightedConfidenceSum = 0;

  for (const [methodName, weight] of Object.entries(config.methodWeights) as [
    Exclude<ClassifierMethod, "combined">,
    number,
  ][]) {
    if (!weight || weight <= 0) continue;
    totalConfiguredWeight += weight;
    const observer = OBSERVERS[methodName];
    if (!observer) continue;

    const obs = observer(landmarks, requireVisibility);
    const vote = observationToVote(methodName, obs, stanceId, config.stanceType);
    vote.weight = weight;
    methodResults.push(vote);

    if (vote.left && vote.right && vote.confidence > 0) {
      const effective = vote.confidence * weight;
      leftTally[vote.left] += effective;
      rightTally[vote.right] += effective;
      totalActiveWeight += weight;
      weightedConfidenceSum += effective;
    }
  }

  if (totalActiveWeight === 0) {
    return {
      left: config.stanceType === "bent-extended" ? "bent" : "front",
      right: config.stanceType === "bent-extended" ? "extended" : "back",
      confidence: 0,
      method: "combined",
      ambiguous: true,
      methodResults,
    };
  }

  const roles: [LegRole, LegRole] =
    config.stanceType === "bent-extended" ? ["bent", "extended"] : ["front", "back"];

  // Pick the higher-scoring role per side. Reconcile conflicts.
  const leftWinner = leftTally[roles[0]] >= leftTally[roles[1]] ? roles[0] : roles[1];
  const rightWinner = rightTally[roles[0]] >= rightTally[roles[1]] ? roles[0] : roles[1];

  let left: LegRole;
  let right: LegRole;
  if (leftWinner !== rightWinner) {
    left = leftWinner;
    right = rightWinner;
  } else {
    // Sides agree on the same role — flip the side with less evidence.
    const leftConf = leftTally[leftWinner];
    const rightConf = rightTally[rightWinner];
    const opposite = leftWinner === roles[0] ? roles[1] : roles[0];
    if (leftConf >= rightConf) {
      left = leftWinner;
      right = opposite;
    } else {
      left = opposite;
      right = rightWinner;
    }
  }

  // Divide by TOTAL configured weight, not just active. A method that abstains
  // (low visibility or below threshold) SHOULD drag the overall confidence down —
  // we're missing evidence we intended to collect.
  const confidence =
    totalConfiguredWeight > 0
      ? weightedConfidenceSum / totalConfiguredWeight
      : 0;

  // If only one method produced a usable vote, label the classification by it.
  let method: ClassifierMethod = "combined";
  const contributing = methodResults.filter((m) => m.confidence > 0 && m.left);
  if (contributing.length === 1) method = contributing[0].method;

  return {
    left,
    right,
    confidence,
    method,
    ambiguous: confidence < minConfidence,
    methodResults,
  };
}

// ─── Temporal smoothing buffer ────────────────────────────────────────────

export interface BufferSnapshot {
  /** Current best-estimate classification, or null when no frames yet. */
  classification: LegClassification | null;
  /** True when the classification has been locked (won't flip until reset or sustained disagreement). */
  locked: boolean;
  /** Number of frames currently buffered. */
  size: number;
  /** True when the last 30+ frames have been too mixed to settle. */
  persistentlyAmbiguous: boolean;
}

/**
 * Rolling buffer over per-frame classifications that locks the result once
 * `lockFrames` consecutive frames agree with avg confidence ≥ threshold.
 *
 * Usage:
 *   const buffer = new LegClassifierBuffer();
 *   // per frame:
 *   buffer.push(classifyLegs(landmarks, config, stanceId));
 *   const snap = buffer.current();
 *   if (snap.locked) { ...use snap.classification... }
 *
 * Reset when practice resets or the user's body leaves the frame.
 */
export class LegClassifierBuffer {
  private readonly windowSize: number;
  private readonly lockFrames: number;
  private readonly minLockConfidence: number;
  private readonly unlockFrames: number;
  private readonly buffer: LegClassification[] = [];
  private locked: LegClassification | null = null;
  private disagreementStreak = 0;
  private mixedStreak = 0;

  constructor(opts?: {
    windowSize?: number;
    lockFrames?: number;
    minLockConfidence?: number;
    unlockFrames?: number;
  }) {
    this.windowSize = opts?.windowSize ?? 15;
    this.lockFrames = opts?.lockFrames ?? 10;
    this.minLockConfidence = opts?.minLockConfidence ?? 0.7;
    this.unlockFrames = opts?.unlockFrames ?? 10;
  }

  push(classification: LegClassification): void {
    this.buffer.push(classification);
    if (this.buffer.length > this.windowSize) this.buffer.shift();

    // When locked, only unambiguous disagreement counts toward unlocking.
    if (this.locked) {
      const agrees =
        !classification.ambiguous &&
        classification.left === this.locked.left &&
        classification.right === this.locked.right;
      if (agrees) {
        this.disagreementStreak = 0;
      } else if (!classification.ambiguous) {
        this.disagreementStreak += 1;
        if (this.disagreementStreak >= this.unlockFrames) {
          this.locked = null;
          this.disagreementStreak = 0;
        }
      }
      return;
    }

    // Not locked yet — check if the tail of the buffer agrees.
    if (this.buffer.length < this.lockFrames) return;
    const tail = this.buffer.slice(-this.lockFrames);
    const first = tail[0];
    if (first.ambiguous) {
      this.mixedStreak += 1;
      return;
    }
    const allAgree = tail.every(
      (c) => !c.ambiguous && c.left === first.left && c.right === first.right,
    );
    if (!allAgree) {
      this.mixedStreak += 1;
      return;
    }
    const avgConfidence =
      tail.reduce((acc, c) => acc + c.confidence, 0) / tail.length;
    if (avgConfidence < this.minLockConfidence) {
      this.mixedStreak += 1;
      return;
    }
    this.locked = { ...first, confidence: avgConfidence };
    this.mixedStreak = 0;
  }

  current(): BufferSnapshot {
    const last = this.buffer[this.buffer.length - 1] ?? null;
    return {
      classification: this.locked ?? last,
      locked: !!this.locked,
      size: this.buffer.length,
      persistentlyAmbiguous: !this.locked && this.mixedStreak > 30,
    };
  }

  reset(): void {
    this.buffer.length = 0;
    this.locked = null;
    this.disagreementStreak = 0;
    this.mixedStreak = 0;
  }

  /** Dev-only: inspect internal state for the debug overlay. */
  debugState(): {
    bufferSize: number;
    locked: boolean;
    disagreementStreak: number;
    mixedStreak: number;
  } {
    return {
      bufferSize: this.buffer.length,
      locked: !!this.locked,
      disagreementStreak: this.disagreementStreak,
      mixedStreak: this.mixedStreak,
    };
  }
}

// ─── Stance-specific resolvers ────────────────────────────────────────────

export interface StanceResolveResult {
  /** "left" or "right" for the body side with the named role. Null when ambiguous. */
  side: "left" | "right" | null;
  confidence: number;
  ambiguous: boolean;
  methodResults: MethodVote[];
}

function resolveFrontBack(
  landmarks: PoseLandmark[],
  stanceId: string,
): StanceResolveResult {
  const config = getClassifierConfig(stanceId);
  if (!config) {
    return { side: null, confidence: 0, ambiguous: true, methodResults: [] };
  }
  const c = classifyLegs(landmarks, config, stanceId);
  const side: "left" | "right" | null = c.ambiguous
    ? null
    : c.left === "front"
      ? "left"
      : "right";
  return {
    side,
    confidence: c.confidence,
    ambiguous: c.ambiguous,
    methodResults: c.methodResults,
  };
}

export function resolveBowStance(landmarks: PoseLandmark[]): StanceResolveResult {
  return resolveFrontBack(landmarks, "bow-stance");
}

export function resolveEmptyStance(landmarks: PoseLandmark[]): StanceResolveResult {
  return resolveFrontBack(landmarks, "empty-stance");
}

export function resolveRestStance(landmarks: PoseLandmark[]): StanceResolveResult {
  return resolveFrontBack(landmarks, "rest-stance");
}

export function resolveCrouchStance(
  landmarks: PoseLandmark[],
): StanceResolveResult {
  const config = getClassifierConfig("crouch-stance");
  if (!config) {
    return { side: null, confidence: 0, ambiguous: true, methodResults: [] };
  }
  const c = classifyLegs(landmarks, config, "crouch-stance");
  // For pubu we report which side has the EXTENDED leg (the visually
  // distinctive one).
  const side: "left" | "right" | null = c.ambiguous
    ? null
    : c.left === "extended"
      ? "left"
      : "right";
  return {
    side,
    confidence: c.confidence,
    ambiguous: c.ambiguous,
    methodResults: c.methodResults,
  };
}
