"use client";

import type { StanceEvaluation } from "@/lib/pose/types";
import ScoreCircle from "./ScoreCircle";
import HoldTimer from "./HoldTimer";

type Props = {
  evaluation: StanceEvaluation | null;
};

const STATUS_COLORS = {
  green: "text-[#22c55e]",
  yellow: "text-gold",
  red: "text-crimson",
};

export default function FeedbackPanel({ evaluation }: Props) {
  const score = evaluation?.score ?? 0;
  const holding = score >= 70;

  return (
    <div className="pointer-events-auto flex items-center gap-4 rounded-card-lg border border-white/10 bg-[#080c1a]/80 px-5 py-4 backdrop-blur-md">
      {/* Score */}
      <ScoreCircle score={score} />

      {/* Angle readouts */}
      <div className="flex-1 space-y-1.5">
        {evaluation ? (
          <>
            {evaluation.angles.map((a) => (
              <div key={a.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    a.status === "green"
                      ? "bg-[#22c55e]"
                      : a.status === "yellow"
                        ? "bg-gold"
                        : "bg-crimson"
                  }`}
                />
                <span className="w-24 text-foreground/60">{a.label}</span>
                <span className={`font-mono font-bold ${STATUS_COLORS[a.status]}`}>
                  {a.current}°
                </span>
                <span className="text-foreground/30">/ {a.target}°</span>
                {a.feedback && (
                  <span className="text-xs text-foreground/50 hidden sm:inline">
                    {a.feedback}
                  </span>
                )}
              </div>
            ))}
            <p className="mt-2 text-sm font-medium text-foreground/80">
              {evaluation.overallFeedback}
            </p>
          </>
        ) : (
          <p className="text-sm text-foreground/50">
            Stand in frame to begin...
          </p>
        )}
      </div>

      {/* Hold timer */}
      <HoldTimer holding={holding} />
    </div>
  );
}
