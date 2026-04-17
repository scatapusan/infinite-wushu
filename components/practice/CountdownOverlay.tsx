"use client";

import { useEffect } from "react";
import type { CameraView } from "@/lib/pose/types";
import OrientationIcon from "./OrientationIcon";

type Props = {
  secondsLeft: number;
  nextView: CameraView;
  onTick: () => void;
  onDone: () => void;
};

export default function CountdownOverlay({
  secondsLeft,
  nextView,
  onTick,
  onDone,
}: Props) {
  useEffect(() => {
    if (secondsLeft <= 0) {
      onDone();
      return;
    }
    const timer = setTimeout(() => onTick(), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, onTick, onDone]);

  const instruction =
    nextView === "side"
      ? "Turn 90° for side view"
      : "Face the camera for front view";

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-[#080c1a]/90 backdrop-blur-md">
      <OrientationIcon
        view={nextView}
        size={96}
        className="text-cyan"
      />
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-foreground/60">
          {instruction}
        </p>
        <p className="mt-2 text-7xl font-bold text-cyan tabular-nums">
          {secondsLeft}
        </p>
        <p className="mt-1 text-xs text-foreground/40">
          Get into position…
        </p>
      </div>
      <button
        onClick={onDone}
        className="text-xs text-foreground/50 underline hover:text-foreground transition"
      >
        Skip countdown
      </button>
    </div>
  );
}
