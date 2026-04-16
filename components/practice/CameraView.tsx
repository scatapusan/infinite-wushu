"use client";

import { useEffect, useCallback, useRef } from "react";
import type { PoseLandmark, AngleResult, StanceAngleConfig } from "@/lib/pose/types";
import { drawSkeleton } from "@/lib/pose/draw-skeleton";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  landmarks: PoseLandmark[] | null;
  mirrored: boolean;
  angleResults: AngleResult[] | null;
  angleConfig: StanceAngleConfig | null;
};

export default function CameraView({
  videoRef,
  canvasRef,
  landmarks,
  mirrored,
  angleResults,
  angleConfig,
}: Props) {
  const drawRafRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // Match canvas size to video display size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (landmarks) {
      const specs = angleConfig
        ? angleConfig.angles.map((a) => a.landmarks)
        : null;
      drawSkeleton(
        ctx,
        landmarks,
        canvas.width,
        canvas.height,
        mirrored,
        angleResults,
        specs,
      );
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [videoRef, canvasRef, landmarks, mirrored, angleResults, angleConfig]);

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
