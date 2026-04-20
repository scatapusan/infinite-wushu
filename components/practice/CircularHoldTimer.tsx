"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio-feedback";

type Props = {
  holding: boolean;
  target?: number;
  score: number;
  onOfficial?: () => void;
};

const SIZE = 200;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number): string {
  if (score >= 70) return "#00FF88";
  if (score >= 40) return "#FFD700";
  return "#FF3355";
}

export default function CircularHoldTimer({
  holding,
  target = 2,
  score,
  onOfficial,
}: Props) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const prevHoldingRef = useRef(false);

  useEffect(() => {
    if (holding) {
      // Fire sfx on hold start (only when transitioning from not-holding)
      if (!prevHoldingRef.current) sfx.holdStarted();
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 0.1;
          if (!firedRef.current && next >= target) {
            firedRef.current = true;
            sfx.holdComplete();
            onOfficial?.();
          }
          return next;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSeconds(0);
      firedRef.current = false;
    }
    prevHoldingRef.current = holding;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [holding, target, onOfficial]);

  const progress = Math.min(seconds / target, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const met = seconds >= target;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* Background track */}
      <svg
        width={SIZE}
        height={SIZE}
        className="absolute inset-0 -rotate-90"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={holding ? color : "rgba(255,255,255,0.15)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Score number — 96px equivalent */}
        <span
          className="font-black tabular-nums leading-none"
          style={{
            fontSize: "6rem",
            color,
            transition: "color 0.3s ease",
            textShadow: `0 0 20px ${color}55`,
          }}
        >
          {score}
        </span>
        {/* Hold label */}
        <span
          className="font-bold tracking-widest uppercase"
          style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em" }}
        >
          {met ? "OFFICIAL" : `${seconds.toFixed(1)}s`}
        </span>
      </div>

      {/* Completion pulse ring */}
      {met && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: `4px solid ${color}`,
            opacity: 0.4,
          }}
        />
      )}
    </div>
  );
}
