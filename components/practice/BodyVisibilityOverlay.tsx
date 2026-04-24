"use client";

import { CheckCircle } from "lucide-react";
import type { BodyVisibility } from "@/lib/pose/types";

type Props = {
  visibility: BodyVisibility;
};

export default function BodyVisibilityOverlay({ visibility }: Props) {
  if (visibility.ready) {
    return (
      <div className="flex items-center gap-2 rounded-card-sm border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-2">
        <CheckCircle size={14} className="text-[#00FF88] shrink-0" />
        <span className="text-xs font-semibold text-[#00FF88]">
          Ready — full body detected
        </span>
      </div>
    );
  }

  const missing = visibility.parts.filter((p) => !p.detected).map((p) => p.name);
  const lowConfidence = visibility.parts
    .filter((p) => p.detected && !p.confident)
    .map((p) => p.name);

  return (
    <div className="rounded-card-lg border border-gold/30 bg-[#080c1a]/90 px-4 py-3 backdrop-blur-md">
      <p className="text-sm font-semibold text-gold">
        Move back — I can&apos;t see your full body
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibility.parts.map((p) => {
          const cls = !p.detected
            ? "bg-crimson/15 text-crimson"
            : !p.confident
              ? "bg-gold/15 text-gold"
              : "bg-[#00FF88]/15 text-[#00FF88]";
          const icon = !p.detected ? "✗" : !p.confident ? "~" : "✓";
          return (
            <span
              key={p.name}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
            >
              {icon} {p.name}
            </span>
          );
        })}
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-xs text-foreground/50">
          Not visible: {missing.join(", ")}
        </p>
      )}
      {missing.length === 0 && lowConfidence.length > 0 && (
        <p className="mt-2 text-xs text-foreground/50">
          Low confidence: {lowConfidence.join(", ")} — improve lighting or
          framing
        </p>
      )}
    </div>
  );
}
