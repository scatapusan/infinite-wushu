import type { PoseLandmark, AngleResult } from "./types";

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

/** Landmark indices involved in leg/torso evaluation */
const EVAL_LANDMARKS = new Set([11, 12, 23, 24, 25, 26, 27, 28]);

const COLORS = {
  green: "#22c55e",
  yellow: "#d4a030",
  red: "#e85d4a",
  connection: "rgba(0, 180, 230, 0.4)",
  default: "rgba(0, 180, 230, 0.8)",
};

/**
 * Build a map from landmark index to color based on angle evaluation results.
 * Evaluation landmarks that aren't in any angle spec stay default cyan.
 */
function buildLandmarkColors(
  angleResults: AngleResult[] | null,
  angleSpecs: [number, number, number][] | null,
): Map<number, string> {
  const map = new Map<number, string>();
  if (!angleResults || !angleSpecs) return map;

  for (let i = 0; i < angleResults.length; i++) {
    const result = angleResults[i];
    const [a, b, c] = angleSpecs[i];
    const color = COLORS[result.status];
    // Color the vertex (joint) and its connected landmarks
    map.set(b, color);
    if (!map.has(a)) map.set(a, color);
    if (!map.has(c)) map.set(c, color);
  }
  return map;
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  mirrored: boolean,
  angleResults: AngleResult[] | null,
  angleSpecs: [number, number, number][] | null,
): void {
  ctx.clearRect(0, 0, width, height);

  const colorMap = buildLandmarkColors(angleResults, angleSpecs);

  // Draw connections first (behind landmarks)
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

  // Draw landmarks
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (lm.visibility < 0.5) continue;

    const x = mirrored ? (1 - lm.x) * width : lm.x * width;
    const y = lm.y * height;

    const isEval = EVAL_LANDMARKS.has(i);
    const radius = isEval ? 5 : 3;
    const color = colorMap.get(i) ?? COLORS.default;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Draw angle values near joints
  if (angleResults && angleSpecs) {
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < angleResults.length; i++) {
      const result = angleResults[i];
      const vertex = angleSpecs[i][1];
      if (vertex >= landmarks.length) continue;
      const lm = landmarks[vertex];
      if (lm.visibility < 0.5) continue;

      const x = mirrored ? (1 - lm.x) * width : lm.x * width;
      const y = lm.y * height;

      ctx.fillStyle = COLORS[result.status];
      ctx.fillText(`${result.current}°`, x, y - 12);
    }
  }
}
