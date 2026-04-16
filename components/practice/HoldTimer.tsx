"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Whether the user is currently in correct form (score above threshold) */
  holding: boolean;
  /** Threshold in seconds to show success */
  target?: number;
};

export default function HoldTimer({ holding, target = 2 }: Props) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (holding) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 0.1);
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [holding]);

  const display = seconds.toFixed(1);
  const met = seconds >= target;

  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-foreground/50">
        Hold
      </p>
      <p
        className={`text-2xl font-bold tabular-nums ${met ? "text-[#22c55e]" : "text-foreground/80"}`}
      >
        {display}s
      </p>
      <p className="text-xs text-foreground/40">
        {met ? "Great hold!" : `Target: ${target}s`}
      </p>
    </div>
  );
}
