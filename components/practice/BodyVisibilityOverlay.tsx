"use client";

import { CheckCircle } from "lucide-react";
import type { BodyVisibility } from "@/lib/pose/types";

type Props = {
  visibility: BodyVisibility;
};

export default function BodyVisibilityOverlay({ visibility }: Props) {
  if (visibility.ready) {
    return (
      <div className="flex items-center gap-2 rounded-card-sm border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2">
        <CheckCircle size={14} className="text-[#22c55e] shrink-0" />
        <span className="text-xs font-semibold text-[#22c55e]">Ready!</span>
      </div>
    );
  }

  const missing = visibility.parts.filter((p) => !p.visible).map((p) => p.name);

  return (
    <div className="rounded-card-lg border border-gold/30 bg-[#080c1a]/90 px-4 py-3 backdrop-blur-md">
      <p className="text-sm font-semibold text-gold">
        Move back — can&apos;t see your full body
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibility.parts.map((p) => (
          <span
            key={p.name}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              p.visible
                ? "bg-[#22c55e]/15 text-[#22c55e]"
                : "bg-crimson/15 text-crimson"
            }`}
          >
            {p.visible ? "✓" : "✗"} {p.name}
          </span>
        ))}
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-xs text-foreground/50">
          Missing: {missing.join(", ")}
        </p>
      )}
    </div>
  );
}
