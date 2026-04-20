"use client";

import { useState } from "react";
import type { ViewEvaluation } from "@/lib/pose/types";
import ScoreCircle from "./ScoreCircle";
import HoldTimer from "./HoldTimer";

type Props = {
  evaluation: ViewEvaluation | null;
  onOfficial?: () => void;
  holdSeconds?: number;
  /**
   * Drive the hold timer externally (gate-based). When provided, replaces the
   * legacy score ≥ 70 heuristic. When undefined, falls back to the score.
   */
  holding?: boolean;
  /** If true, show "adjust camera angle" banner instead of checks. */
  adjustCamera?: boolean;
  /** Optional extra rows below the failure list (e.g. hand feedback) */
  children?: React.ReactNode;
};

const DOT_CLASS = {
  green: "bg-[#22c55e]",
  yellow: "bg-gold",
  red: "bg-crimson",
} as const;

const TEXT_CLASS = {
  green: "text-[#22c55e]",
  yellow: "text-gold",
  red: "text-crimson",
} as const;

export default function FeedbackPanel({
  evaluation,
  onOfficial,
  holdSeconds = 2,
  holding: holdingProp,
  adjustCamera = false,
  children,
}: Props) {
  const [showPassing, setShowPassing] = useState(false);
  const score = evaluation?.score ?? 0;
  const holding = holdingProp ?? score >= 70;

  const passing = evaluation?.checks.filter((c) => c.status === "green") ?? [];
  const nonPassing = evaluation?.checks.filter((c) => c.status !== "green") ?? [];

  return (
    <div className="pointer-events-auto flex items-start gap-4 rounded-card-lg border border-white/10 bg-[#080c1a]/85 px-5 py-4 backdrop-blur-md">
      <ScoreCircle score={score} />

      <div className="flex-1 space-y-1.5 min-w-0">
        {adjustCamera ? (
          <p className="text-sm font-medium text-gold">
            Adjust camera angle — some landmarks not clearly visible.
          </p>
        ) : evaluation ? (
          <>
            {nonPassing.length > 0 && (
              <ul className="space-y-1">
                {nonPassing.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2.5 text-xs leading-tight"
                  >
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${DOT_CLASS[c.status]}`}
                    />
                    <span className="w-28 shrink-0 text-foreground/60 truncate">
                      {c.label}
                    </span>
                    <span className={`font-mono font-bold ${TEXT_CLASS[c.status]}`}>
                      {c.value ?? "—"}
                    </span>
                    {c.message && (
                      <span className="text-foreground/55 flex-1 truncate">
                        {c.message}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {passing.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassing((v) => !v)}
                className="text-[11px] text-[#22c55e]/80 hover:text-[#22c55e] transition-colors"
              >
                {showPassing
                  ? `Hide ${passing.length} passing`
                  : `${passing.length} check${passing.length === 1 ? "" : "s"} passing ✓`}
              </button>
            )}

            {showPassing && (
              <ul className="space-y-1 pt-1">
                {passing.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2.5 text-xs leading-tight"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                    <span className="w-28 text-foreground/50 truncate">
                      {c.label}
                    </span>
                    <span className="font-mono text-[#22c55e]/80">
                      {c.value ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-sm font-medium text-foreground/80">
              {evaluation.overallFeedback}
            </p>

            {children}
          </>
        ) : (
          <p className="text-sm text-foreground/50">
            Stand in frame to begin…
          </p>
        )}
      </div>

      <HoldTimer
        holding={holding}
        target={holdSeconds}
        onOfficial={onOfficial}
      />
    </div>
  );
}
