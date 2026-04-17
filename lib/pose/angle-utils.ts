import type { PoseLandmark, BodyVisibility } from "./types";

/**
 * Calculate the angle at vertex b formed by points a-b-c, in degrees.
 * Returns a value between 0 and 180.
 */
export function calculateAngle(
  a: PoseLandmark,
  b: PoseLandmark,
  c: PoseLandmark,
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Calculate torso lean angle from vertical (0 = perfectly upright).
 * Uses midpoint of shoulders (11, 12) and midpoint of hips (23, 24).
 */
export function calculateTorsoLean(landmarks: PoseLandmark[]): number {
  const shoulderMid = midpoint(landmarks[11], landmarks[12]);
  const hipMid = midpoint(landmarks[23], landmarks[24]);
  // Angle of shoulder-hip line from vertical
  // atan2(dx, dy) where dy is measured downward (hip.y > shoulder.y in screen coords)
  const dx = shoulderMid.x - hipMid.x;
  const dy = hipMid.y - shoulderMid.y; // positive = shoulders above hips (normal)
  return Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
}

const REQUIRED_LANDMARKS: { name: string; indices: [number, number] }[] = [
  { name: "Shoulders", indices: [11, 12] },
  { name: "Hips",      indices: [23, 24] },
  { name: "Knees",     indices: [25, 26] },
  { name: "Ankles",    indices: [27, 28] },
];

/** Landmark present in frame */
export const DETECT_THRESHOLD = 0.5;
/** Landmark clearly visible — required before scoring starts */
export const READY_THRESHOLD = 0.7;

export function checkBodyVisibility(landmarks: PoseLandmark[]): BodyVisibility {
  const parts = REQUIRED_LANDMARKS.map(({ name, indices }) => {
    const v1 = landmarks[indices[0]]?.visibility ?? 0;
    const v2 = landmarks[indices[1]]?.visibility ?? 0;
    return {
      name,
      detected: v1 >= DETECT_THRESHOLD && v2 >= DETECT_THRESHOLD,
      confident: v1 >= READY_THRESHOLD && v2 >= READY_THRESHOLD,
    };
  });
  return {
    ready: parts.every((p) => p.confident),
    detected: parts.every((p) => p.detected),
    parts,
  };
}

function midpoint(a: PoseLandmark, b: PoseLandmark): PoseLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}
