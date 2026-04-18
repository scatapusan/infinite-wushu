"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Whether the user is currently in correct form (score above threshold) */
  holding: boolean;
  /** Threshold in seconds to show success */
  target?: number;
  /** Fires once when hold-time crosses target */
  onOfficial?: () => void;
};

export default function HoldTimer({ holding, target = 10, onOfficial }: Props) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (holding) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 0.1;
          if (!firedRef.current && next >= target) {
            firedRef.current = true;
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [holding, target, onOfficial]);

  const display = seconds.toFixed(1);
  const met = seconds >= target;

  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-foreground/50">
        Hold
      </p>
      <p
        className={`text-2xl font-bold tabular-nums ${met ? "text-[#22c55e]" : "text-foreground/80"}`}
      >
        {display}s
      </p>
      <p className="text-[10px] text-foreground/40">
        {met ? "Official!" : `Target: ${target}s`}
      </p>
    </div>
  );
}
