"use client";

import type { SequencedMovement } from "@/lib/pose/form-flow-machine";
import SourceAttribution from "@/components/SourceAttribution";

type Props = {
  movement: SequencedMovement;
  onContinue: () => void;
};

export default function FormMovementInfoCard({ movement, onContinue }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 backdrop-blur-sm px-6 pb-8">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d1328]/95 p-8 space-y-5">
        <div className="flex items-baseline gap-4">
          <p
            className="font-bold font-chinese text-[#FFD700] leading-none"
            style={{ fontSize: "4.5rem" }}
          >
            {movement.chinese}
          </p>
          <div className="flex flex-col min-w-0">
            <p
              className="font-black text-white leading-none truncate"
              style={{ fontSize: "2.5rem" }}
            >
              {movement.english.toUpperCase()}
            </p>
            <p
              className="italic text-white/60 leading-none truncate"
              style={{ fontSize: "1.75rem" }}
            >
              {movement.pinyin}
            </p>
          </div>
        </div>

        {movement.description && (
          <p
            className="text-white/80 leading-snug"
            style={{ fontSize: "1.75rem" }}
          >
            {movement.description}
          </p>
        )}

        {movement.keyPoints.length > 0 && (
          <ul className="space-y-2">
            {movement.keyPoints.slice(0, 3).map((point, i) => (
              <li
                key={i}
                className="flex gap-3 text-white/70"
                style={{ fontSize: "1.75rem" }}
              >
                <span className="text-[#00D4FF] flex-shrink-0">·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {movement.attribution && (
          <SourceAttribution attribution={movement.attribution} source={movement.source} />
        )}

        <button
          onClick={onContinue}
          className="w-full rounded-3xl bg-[#00D4FF] font-black uppercase tracking-widest text-black active:scale-[0.97]"
          style={{ height: "6rem", fontSize: "2.5rem" }}
        >
          Continue →
        </button>
        <p
          className="text-center font-semibold text-white/40"
          style={{ fontSize: "1.5rem" }}
        >
          Or wait — auto-advances in 5s
        </p>
      </div>
    </div>
  );
}
