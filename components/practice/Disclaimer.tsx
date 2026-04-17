"use client";

import { Info } from "lucide-react";

type Props = {
  variant?: "compact" | "full";
  /** Include the extra hand-tracking-specific line */
  includeHands?: boolean;
  className?: string;
};

const LINES_FULL = [
  "AI evaluation is a training aid, not a replacement for coach feedback.",
  "Scoring accuracy depends on camera position, lighting, and body visibility.",
];
const LINE_HANDS =
  "Hand shape detection works best with clear, well-lit hands visible to camera.";

export default function Disclaimer({
  variant = "compact",
  includeHands = false,
  className = "",
}: Props) {
  if (variant === "compact") {
    return (
      <p
        className={`flex items-center gap-1.5 text-[11px] text-foreground/40 ${className}`}
      >
        <Info size={11} className="shrink-0" />
        AI is a training aid — not a replacement for coach feedback.
      </p>
    );
  }

  return (
    <div
      className={`rounded-card-sm border border-white/10 bg-white/[0.03] px-4 py-3 ${className}`}
    >
      <div className="flex items-start gap-2">
        <Info size={14} className="mt-0.5 shrink-0 text-foreground/40" />
        <ul className="space-y-1 text-xs text-foreground/50">
          {LINES_FULL.map((l) => (
            <li key={l}>{l}</li>
          ))}
          {includeHands && <li>{LINE_HANDS}</li>}
        </ul>
      </div>
    </div>
  );
}
