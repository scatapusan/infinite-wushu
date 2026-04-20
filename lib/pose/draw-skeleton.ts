import type { PoseLandmark, CheckStatus } from "./types";

// 60% opacity brand cyan — increased from 40% for visibility at practice distance.
export const REFERENCE_SKELETON_COLOR = "rgba(0, 212, 255, 0.6)";

/** MediaPipe Pose connection pairs for drawing the skeleton */
const CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
  // Left foot
  [27, 29],
  [27, 31],
  // Right foot
  [28, 30],
  [28, 32],
  // Face (minimal)
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
];

/** Landmark indices involved in body evaluation — drawn larger */
const EVAL_LANDMARKS = new Set([11, 12, 23, 24, 25, 26, 27, 28, 31, 32]);

// High-saturation colors for 2–3 m viewing distance (practice view only).
const COLORS = {
  green:      "#00FF88",
  yellow:     "#FFD700",
  red:        "#FF3355",
  connection: "rgba(0, 212, 255, 0.35)",
  default:    "rgba(0, 212, 255, 0.9)",
} as const;

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  mirrored: boolean,
  landmarkColors: Map<number, CheckStatus> | null,
): void {
  // Draw connections first
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.connection;
  for (const [i, j] of CONNECTIONS) {
    if (i >= landmarks.length || j >= landmarks.length) continue;
    const a = landmarks[i];
    const b = landmarks[j];
    if (a.visibility < 0.5 || b.visibility < 0.5) continue;

    const ax = mirrored ? (1 - a.x) * width : a.x * width;
    const ay = a.y * height;
    const bx = mirrored ? (1 - b.x) * width : b.x * width;
    const by = b.y * height;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Draw landmarks with status colors
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (lm.visibility < 0.5) continue;

    const x = mirrored ? (1 - lm.x) * width : lm.x * width;
    const y = lm.y * height;

    const isEval = EVAL_LANDMARKS.has(i);
    const radius = isEval ? 7 : 4;
    const status = landmarkColors?.get(i);
    const color = status ? COLORS[status] : COLORS.default;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/**
 * Draw a reference skeleton (ghost overlay) scaled and anchored to the user.
 *
 *   - `reference` landmarks are in shoulder-width units, origin at shoulder midpoint.
 *   - `userLandmarks` provides the anchor: shoulder midpoint + shoulder width in pixels.
 *
 * Call BEFORE drawSkeleton so the user's skeleton renders on top.
 */
export function drawReferenceSkeleton(
  ctx: CanvasRenderingContext2D,
  reference: PoseLandmark[],
  userLandmarks: PoseLandmark[],
  width: number,
  height: number,
  mirrored: boolean,
): void {
  const userL = userLandmarks[11];
  const userR = userLandmarks[12];
  if (!userL || !userR) return;
  if ((userL.visibility ?? 0) < 0.5 || (userR.visibility ?? 0) < 0.5) return;

  // User's shoulder midpoint + shoulder width in PIXELS
  const userLx = (mirrored ? 1 - userL.x : userL.x) * width;
  const userLy = userL.y * height;
  const userRx = (mirrored ? 1 - userR.x : userR.x) * width;
  const userRy = userR.y * height;
  const midX = (userLx + userRx) / 2;
  const midY = (userLy + userRy) / 2;
  const shoulderPx = Math.hypot(userRx - userLx, userRy - userLy);
  if (shoulderPx < 10) return;

  function project(lm: PoseLandmark): { x: number; y: number } {
    // Reference coords are already mirrored-friendly (symmetric around x=0).
    // We do NOT apply the mirrored flag here — mirroring is a display transform
    // on user coords, but the reference's own left/right is already laid out
    // to match the user after their mirror has been applied.
    return {
      x: midX + lm.x * shoulderPx,
      y: midY + lm.y * shoulderPx,
    };
  }

  ctx.save();
  ctx.strokeStyle = REFERENCE_SKELETON_COLOR;
  ctx.fillStyle = REFERENCE_SKELETON_COLOR;
  ctx.lineWidth = 3;

  for (const [i, j] of CONNECTIONS) {
    if (i >= reference.length || j >= reference.length) continue;
    const a = reference[i];
    const b = reference[j];
    if ((a.visibility ?? 0) < 0.5 || (b.visibility ?? 0) < 0.5) continue;
    const ap = project(a);
    const bp = project(b);
    ctx.beginPath();
    ctx.moveTo(ap.x, ap.y);
    ctx.lineTo(bp.x, bp.y);
    ctx.stroke();
  }

  for (let i = 0; i < reference.length; i++) {
    const lm = reference[i];
    if ((lm.visibility ?? 0) < 0.5) continue;
    const p = project(lm);
    const radius = EVAL_LANDMARKS.has(i) ? 6 : 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}
