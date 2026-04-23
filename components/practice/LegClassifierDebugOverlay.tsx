"use client";

import type { PoseLandmark } from "@/lib/pose/types";
import { classifyVariantDetailed } from "@/lib/pose/leg-resolver";

type Props = {
  landmarks: PoseLandmark[] | null;
  stanceId: string | null;
};

export default function LegClassifierDebugOverlay({ landmarks, stanceId }: Props) {
  if (!landmarks || !stanceId) return null;
  const result = classifyVariantDetailed(landmarks, stanceId);
  if (!result) {
    return (
      <div className="pointer-events-none rounded-md border border-dashed border-foreground/20 bg-black/70 px-3 py-2 font-mono text-[10px] leading-tight text-foreground/70">
        <div className="text-foreground/50">leg-classifier</div>
        <div>stance: {stanceId} (symmetric/unknown)</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none rounded-md border border-cyan/30 bg-black/80 px-3 py-2 font-mono text-[10px] leading-tight text-foreground">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-foreground/50 uppercase tracking-wider">
          leg-classifier
        </span>
        <span className="text-foreground/50">{stanceId}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className={result.ambiguous ? "text-amber-400" : "text-cyan"}>
          L:{result.left} / R:{result.right}
        </span>
        <span className="text-foreground/70">
          conf {(result.confidence * 100).toFixed(0)}%
        </span>
        {result.ambiguous && (
          <span className="rounded bg-amber-500/20 px-1 text-amber-300">
            ambig
          </span>
        )}
      </div>
      <div className="mt-1 space-y-0.5">
        {result.methodResults.map((m) => {
          const active = m.confidence > 0 && m.left;
          return (
            <div
              key={m.method}
              className={
                active ? "text-foreground/90" : "text-foreground/30 line-through"
              }
            >
              {m.method.padEnd(20, " ")} w{m.weight.toFixed(1)}{" "}
              {active ? `→ L:${m.left}/R:${m.right}` : "— abstain"}{" "}
              {active && `(${(m.confidence * 100).toFixed(0)}%)`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
