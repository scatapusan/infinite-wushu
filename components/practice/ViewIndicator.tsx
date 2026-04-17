"use client";

import type { CameraView } from "@/lib/pose/types";
import OrientationIcon from "./OrientationIcon";

type Props = {
  stepIndex: number;
  totalSteps: number;
  view: CameraView;
  mode: "quick" | "multi";
};

export default function ViewIndicator({
  stepIndex,
  totalSteps,
  view,
  mode,
}: Props) {
  const stepLabel =
    mode === "quick"
      ? "Quick View"
      : `Step ${stepIndex + 1} of ${totalSteps}`;
  const viewLabel = view === "front" ? "Front View" : "Side View";

  return (
    <div className="flex items-center gap-3 rounded-card-sm border border-cyan/30 bg-[#080c1a]/80 px-3 py-2 backdrop-blur-md">
      <OrientationIcon view={view} size={28} className="text-cyan shrink-0" />
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-widest text-foreground/50">
          {stepLabel}
        </p>
        <p className="text-sm font-bold text-foreground">{viewLabel}</p>
      </div>
    </div>
  );
}
