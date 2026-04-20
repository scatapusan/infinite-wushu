import type { PoseLandmark } from "./types";
import type { LegAssignment } from "./stance-gates";
import { calculateAngle } from "./angle-utils";

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
 * Simple classifier — detects which side of the body is "forward" (or "bent")
 * based on a per-stance rule. Returns null if the pose can't be classified yet.
 *
 *   bow-stance:   front = bent leg (smaller knee angle).
 *   crouch-stance: bent = smaller angle, extended = larger.
 *   empty-stance: back  = more-bent leg (smaller angle); front = straighter.
 *   rest-stance:  back  = leg with heel lifted (heel.y < foot_index.y); front = planted.
 */
export function classifyVariant(
  landmarks: PoseLandmark[],
  stanceId: string,
): StanceVariant | null {
  const requiredVisible = (idx: number) => (landmarks[idx]?.visibility ?? 0) >= 0.5;

  if (stanceId === "horse-stance") return "left-forward"; // symmetric; arbitrary

  if (stanceId === "rest-stance") {
    if (![29, 30, 31, 32].every(requiredVisible)) return null;
    const lHeel = landmarks[29];
    const rHeel = landmarks[30];
    const lToe = landmarks[31];
    const rToe = landmarks[32];
    const lHeelUp = lHeel.y < lToe.y - 0.01;
    const rHeelUp = rHeel.y < rToe.y - 0.01;
    if (lHeelUp && !rHeelUp) return "right-forward"; // left is the back/crossed leg
    if (rHeelUp && !lHeelUp) return "left-forward";
    return null; // ambiguous
  }

  // Knee-angle-based classifiers (bow, crouch, empty).
  if (![23, 24, 25, 26, 27, 28].every(requiredVisible)) return null;
  const lAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  const diff = Math.abs(lAngle - rAngle);
  if (diff < 15) return null; // too close to reliably pick

  if (stanceId === "bow-stance" || stanceId === "crouch-stance") {
    // Front / bent leg is the more-bent (smaller angle) side.
    return lAngle < rAngle ? "left-forward" : "right-forward";
  }
  if (stanceId === "empty-stance") {
    // Back leg is more bent; front leg is the straighter side.
    return lAngle > rAngle ? "left-forward" : "right-forward";
  }

  return "left-forward";
}
