"use client";

import { useEffect } from "react";
import type { SequencedMovement } from "@/lib/pose/form-flow-machine";

type Props = {
  nextMovement: SequencedMovement;
  secondsLeft: number;
  totalSeconds: number;
  onTick: () => void;
  onSkip: () => void;
};

export default function FormTransitionOverlay({
  nextMovement,
  secondsLeft,
  totalSeconds,
  onTick,
  onSkip,
}: Props) {
  useEffect(() => {
    if (secondsLeft <= 0) {
      onSkip();
      return;
    }
    const t = setTimeout(() => onTick(), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onTick, onSkip]);

  // progress 0..1 as the countdown fills
  const progress = 1 - secondsLeft / totalSeconds;
  const circumference = 2 * Math.PI * 70;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-[#050B1A]/95 backdrop-blur-md px-6">
      <p
        className="font-bold uppercase tracking-widest text-white/50"
        style={{ fontSize: "1.75rem" }}
      >
        NEXT
      </p>

      <div className="text-center space-y-2">
        <p
          className="font-black font-chinese text-[#FFD700]"
          style={{ fontSize: "5rem", lineHeight: 1 }}
        >
          {nextMovement.chinese}
        </p>
        <p
          className="font-bold text-white"
          style={{ fontSize: "3.5rem", lineHeight: 1.1 }}
        >
          {nextMovement.english.toUpperCase()}
        </p>
        <p className="italic text-white/60" style={{ fontSize: "1.75rem" }}>
          {nextMovement.pinyin}
        </p>
      </div>

      <div className="relative" style={{ width: "10rem", height: "10rem" }}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#00D4FF"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-black text-[#00D4FF] tabular-nums"
            style={{ fontSize: "5rem", lineHeight: 1 }}
          >
            {secondsLeft}
          </span>
        </div>
      </div>

      <button
        onClick={onSkip}
        className="rounded-2xl border border-white/20 bg-black/50 px-6 py-3 font-bold text-white/80 active:scale-95"
        style={{ fontSize: "1.75rem" }}
      >
        Skip countdown
      </button>
    </div>
  );
}
