"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { PoseLandmark } from "./types";

type UsePoseDetectionReturn = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  landmarks: PoseLandmark[] | null;
  isLoading: boolean;
  error: string | null;
  facingMode: "user" | "environment";
  toggleCamera: () => void;
};

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export function usePoseDetection(): UsePoseDetectionReturn {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Throttle React state updates to ~10 Hz
  const lastUpdateRef = useRef(0);
  const landmarksRef = useRef<PoseLandmark[] | null>(null);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  useEffect(() => {
    let cancelled = false;
      let poseLandmarker: any = null;

    async function init() {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import to avoid SSR issues
        const vision = await import("@mediapipe/tasks-vision");
        const { PoseLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN);

        poseLandmarker = await PoseLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          },
        );

        if (cancelled) {
          poseLandmarker.close();
          return;
        }

              landmarkerRef.current = poseLandmarker as any;

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          poseLandmarker.close();
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        setIsLoading(false);

        // Start detection loop
        let lastVideoTime = -1;

        const detect = () => {
          if (cancelled) return;
          rafRef.current = requestAnimationFrame(detect);

          if (!video || video.readyState < 2) return;
          if (video.currentTime === lastVideoTime) return;
          lastVideoTime = video.currentTime;

          try {
            const result = poseLandmarker.detectForVideo(
              video,
              performance.now(),
            );
            if (result.landmarks && result.landmarks.length > 0) {
              const lms: PoseLandmark[] = result.landmarks[0].map(
                              (lm: any) => ({
                  x: lm.x,
                  y: lm.y,
                  z: lm.z,
                  visibility: lm.visibility ?? 0,
                }),
              );
              landmarksRef.current = lms;

              // Throttle state updates
              const now = performance.now();
              if (now - lastUpdateRef.current > 100) {
                lastUpdateRef.current = now;
                setLandmarks(lms);
              }
            }
          } catch {
            // Detection can fail on some frames — skip
          }
        }

        rafRef.current = requestAnimationFrame(detect);
      } catch (err: unknown) {
        if (cancelled) return;
        setIsLoading(false);
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
        } else if (
          err instanceof DOMException &&
          err.name === "NotFoundError"
        ) {
          setError("No camera found on this device.");
        } else {
          setError("Failed to initialize pose detection. Please try again.");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (poseLandmarker) {
        try {
          poseLandmarker.close();
        } catch {
          // already closed
        }
      }
    };
  }, [facingMode]);

  return {
    videoRef,
    canvasRef,
    landmarks,
    isLoading,
    error,
    facingMode,
    toggleCamera,
  };
}

/** Access the latest landmarks without waiting for React state (for canvas drawing) */
export function useLatestLandmarks(
  hook: UsePoseDetectionReturn,
): React.RefObject<PoseLandmark[] | null> {
  const ref = useRef<PoseLandmark[] | null>(null);
  ref.current = hook.landmarks;
  return ref;
}
