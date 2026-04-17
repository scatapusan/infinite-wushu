import type { PoseLandmark, CheckStatus } from "./types";

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

const COLORS = {
  green: "#22c55e",
  yellow: "#d4a030",
  red: "#e85d4a",
  connection: "rgba(0, 180, 230, 0.4)",
  default: "rgba(0, 180, 230, 0.8)",
} as const;

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  mirrored: boolean,
  landmarkColors: Map<number, CheckStatus> | null,
): void {
  ctx.clearRect(0, 0, width, height);

  // Draw connections first
  ctx.lineWidth = 2;
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
    const radius = isEval ? 5 : 3;
    const status = landmarkColors?.get(i);
    const color = status ? COLORS[status] : COLORS.default;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
}
