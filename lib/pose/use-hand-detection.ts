"use client";

import { useEffect, useRef, useState } from "react";
import type { HandLandmark } from "./types";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type Options = {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  /** Called with fps when a frame completes (for guardrail) */
  onFps?: (fps: number) => void;
};

type Result = {
  /** Landmarks for the left hand (from user's POV, not camera) */
  left: HandLandmark[] | null;
  /** Landmarks for the right hand */
  right: HandLandmark[] | null;
  ready: boolean;
};

/**
 * Hand landmark detection. Shares the existing <video> element from usePoseDetection —
 * does not open a second camera stream.
 *
 * MediaPipe reports handedness as "Left" / "Right" from the image's POV (so a mirrored
 * front-camera video reports the user's LEFT hand as "Right" and vice versa). We unswap
 * this below so callers receive user-perspective hands.
 */
export function useHandDetection({ videoRef, enabled, onFps }: Options): Result {
  const [left, setLeft] = useState<HandLandmark[] | null>(null);
  const [right, setRight] = useState<HandLandmark[] | null>(null);
  const [ready, setReady] = useState(false);

  const lastUpdateRef = useRef(0);
  const rafRef = useRef(0);
  const landmarkerRef = useRef<any>(null);
  const lastFrameTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) {
      setLeft(null);
      setRight(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    let handLandmarker: any = null;

    async function init() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { HandLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN);

        handLandmarker = await HandLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
          },
        );

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        landmarkerRef.current = handLandmarker;
        setReady(true);

        let lastVideoTime = -1;

        const detect = () => {
          if (cancelled) return;
          rafRef.current = requestAnimationFrame(detect);

          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          if (video.currentTime === lastVideoTime) return;
          lastVideoTime = video.currentTime;

          try {
            const result = handLandmarker.detectForVideo(
              video,
              performance.now(),
            );

            // MediaPipe returns handedness per hand
            let userLeft: HandLandmark[] | null = null;
            let userRight: HandLandmark[] | null = null;
            const hands = result.landmarks ?? [];
            const handedness = result.handednesses ?? [];
            for (let i = 0; i < hands.length; i++) {
              const label = handedness[i]?.[0]?.categoryName as
                | "Left"
                | "Right"
                | undefined;
              // Image-side "Left" = user's RIGHT (mirrored) — unswap
              const side =
                label === "Left" ? "right" : label === "Right" ? "left" : null;
              const lms: HandLandmark[] = hands[i].map((lm: any) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
              }));
              if (side === "left") userLeft = lms;
              else if (side === "right") userRight = lms;
            }

            // FPS tracking for the guardrail
            const now = performance.now();
            const delta = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;
            if (delta > 0) {
              const fps = 1000 / delta;
              onFps?.(fps);
            }

            // Throttle state updates to ~10 Hz
            if (now - lastUpdateRef.current > 100) {
              lastUpdateRef.current = now;
              setLeft(userLeft);
              setRight(userRight);
            }
          } catch {
            // Detection can fail on some frames — skip
          }
        };

        rafRef.current = requestAnimationFrame(detect);
      } catch {
        // Silent failure — hand tracking is optional
        setReady(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (handLandmarker) {
        try {
          handLandmarker.close();
        } catch {
          // already closed
        }
      }
      setLeft(null);
      setRight(null);
      setReady(false);
    };
  }, [enabled, videoRef, onFps]);

  return { left, right, ready };
}
