import type { PoseLandmark } from "./types";
import type { LegAssignment } from "./stance-gates";
import {
  classifyLegs,
  getClassifierConfig,
  type LegClassification,
} from "./leg-classifier";

/**
 * Which leg is the "forward" one in asymmetric stances.
 * For symmetric stances (mabu) this is irrelevant.
 */
export type StanceVariant = "left-forward" | "right-forward";

/**
 * Map left landmark indices to their symbolic names.
 * "left-forward" means the user's left-body-side leg is the front leg.
 */
const LEFT_FORWARD: LegAssignment = {
  front_shoulder: 11, back_shoulder: 12,
  front_hip: 23,      back_hip: 24,
  front_knee: 25,     back_knee: 26,
  front_ankle: 27,    back_ankle: 28,
  front_heel: 29,     back_heel: 30,
  front_foot_index: 31, back_foot_index: 32,
  // Pubu/xubu-style bent/extended — left is bent by default.
  bent_hip: 23,       bent_knee: 25, bent_ankle: 27,
  extended_hip: 24,   extended_knee: 26, extended_ankle: 28,
  extended_heel: 30,  extended_foot_index: 32,
};

const RIGHT_FORWARD: LegAssignment = {
  front_shoulder: 12, back_shoulder: 11,
  front_hip: 24,      back_hip: 23,
  front_knee: 26,     back_knee: 25,
  front_ankle: 28,    back_ankle: 27,
  front_heel: 30,     back_heel: 29,
  front_foot_index: 32, back_foot_index: 31,
  bent_hip: 24,       bent_knee: 26, bent_ankle: 28,
  extended_hip: 23,   extended_knee: 25, extended_ankle: 27,
  extended_heel: 29,  extended_foot_index: 31,
};

export function legAssignmentFor(variant: StanceVariant): LegAssignment {
  return variant === "right-forward" ? RIGHT_FORWARD : LEFT_FORWARD;
}

/**
 * Classify the forward side for an asymmetric stance.
 *
 * Delegates to the authoritative `leg-classifier` module. Returns null when:
 *   - the stance is symmetric (horse-stance) and defaults to left-forward
 *   - the stanceId is unknown to the classifier
 *   - confidence is below the minimum threshold (ambiguous pose)
 *
 * Symmetric stances return "left-forward" for consistency with historical behavior.
 */
export function classifyVariant(
  landmarks: PoseLandmark[],
  stanceId: string,
): StanceVariant | null {
  if (stanceId === "horse-stance") return "left-forward";

  const config = getClassifierConfig(stanceId);
  if (!config) return "left-forward"; // unknown stance — fall back to default

  const result = classifyLegs(landmarks, config, stanceId);
  if (result.ambiguous) return null;

  if (config.stanceType === "bent-extended") {
    // Crouch (pubu) — "left-forward" in the legacy scheme means left leg is the
    // BENT leg. See LEFT_FORWARD.bent_* mappings above.
    return result.left === "bent" ? "left-forward" : "right-forward";
  }

  // front-back stances (bow, empty, rest):
  // legacy "left-forward" means left leg is the front leg.
  return result.left === "front" ? "left-forward" : "right-forward";
}

/**
 * Lower-level accessor for callers that want the full classification (confidence,
 * per-method breakdown, etc.) rather than the reduced StanceVariant.
 */
export function classifyVariantDetailed(
  landmarks: PoseLandmark[],
  stanceId: string,
): LegClassification | null {
  if (stanceId === "horse-stance") return null;
  const config = getClassifierConfig(stanceId);
  if (!config) return null;
  return classifyLegs(landmarks, config, stanceId);
}
