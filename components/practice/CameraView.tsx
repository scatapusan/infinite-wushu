"use client";

import { useEffect, useCallback, useRef } from "react";
import type {
  PoseLandmark,
  CheckResult,
  CheckStatus,
  StanceCheckConfig,
  CameraView as CameraViewKind,
} from "@/lib/pose/types";
import { drawSkeleton, drawReferenceSkeleton } from "@/lib/pose/draw-skeleton";
import { landmarksFor } from "@/lib/pose/check-evaluators";
import type { ReferenceSkeleton } from "@/lib/pose/reference-skeletons";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  landmarks: PoseLandmark[] | null;
  mirrored: boolean;
  checks: CheckResult[] | null;
  config: StanceCheckConfig | null;
  view: CameraViewKind | null;
  referenceSkeleton: ReferenceSkeleton | null;
};

const STATUS_PRIORITY: Record<CheckStatus, number> = {
  green: 0,
  yellow: 1,
  red: 2,
};

/** Given the per-check landmark indices, assign each landmark the worst status among checks it participates in. */
function buildLandmarkStatusMap(
  checks: CheckResult[],
  config: StanceCheckConfig,
  view: CameraViewKind,
): Map<number, CheckStatus> {
  const map = new Map<number, CheckStatus>();
  const byId = new Map(
    config.checks.filter((c) => c.view === view).map((c) => [c.id, c]),
  );
  for (const r of checks) {
    const def = byId.get(r.id);
    if (!def) continue;
    const indices = landmarksFor(def);
    for (const idx of indices) {
      const existing = map.get(idx);
      if (!existing || STATUS_PRIORITY[r.status] > STATUS_PRIORITY[existing]) {
        map.set(idx, r.status);
      }
    }
  }
  return map;
}

export default function CameraView({
  videoRef,
  canvasRef,
  landmarks,
  mirrored,
  checks,
  config,
  view,
  referenceSkeleton,
}: Props) {
  const drawRafRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarks) {
      // Draw reference skeleton FIRST (behind user's skeleton).
      if (referenceSkeleton) {
        drawReferenceSkeleton(
          ctx,
          referenceSkeleton.landmarks,
          landmarks,
          canvas.width,
          canvas.height,
          mirrored,
        );
      }
      const colorMap =
        checks && config && view
          ? buildLandmarkStatusMap(checks, config, view)
          : null;
      drawSkeleton(
        ctx,
        landmarks,
        canvas.width,
        canvas.height,
        mirrored,
        colorMap,
      );
    }
  }, [videoRef, canvasRef, landmarks, mirrored, checks, config, view, referenceSkeleton]);

  useEffect(() => {
    function loop() {
      draw();
      drawRafRef.current = requestAnimationFrame(loop);
    }
    drawRafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(drawRafRef.current);
  }, [draw]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </div>
  );
}
