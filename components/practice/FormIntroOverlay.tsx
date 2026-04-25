"use client";

import { useEffect } from "react";
import type { SequencedMovement } from "@/lib/pose/form-flow-machine";
import type { FormLessonMeta } from "@/lib/pose/form-lookup";

type Props = {
  meta: FormLessonMeta;
  firstMovement: SequencedMovement;
  secondsLeft: number;
  onTick: () => void;
  onSkip: () => void;
  onExit: () => void;
};

export default function FormIntroOverlay({
  meta,
  firstMovement,
  secondsLeft,
  onTick,
  onSkip,
  onExit,
}: Props) {
  useEffect(() => {
    if (secondsLeft <= 0) {
      onSkip();
      return;
    }
    const t = setTimeout(() => onTick(), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onTick, onSkip]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between bg-[#050B1A]/95 backdrop-blur-md px-6 py-10">
      <div className="flex justify-end">
        <button
          onClick={onExit}
          className="rounded-2xl border border-white/20 bg-black/50 px-5 py-3 font-bold text-white/70 active:scale-95"
          style={{ fontSize: "1.75rem" }}
        >
          EXIT
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <p
            className="font-bold uppercase tracking-widest text-[#00D4FF]"
            style={{ fontSize: "1.75rem" }}
          >
            GUIDED FORM PRACTICE
          </p>
          <p
            className="font-black font-chinese text-[#FFD700]"
            style={{ fontSize: "5rem", lineHeight: 1 }}
          >
            {meta.chinese}
          </p>
          <p
            className="font-black text-white"
            style={{ fontSize: "3.5rem", lineHeight: 1.1 }}
          >
            {meta.english.toUpperCase()}
          </p>
          <p
            className="italic text-white/60"
            style={{ fontSize: "2rem" }}
          >
            {meta.pinyin}
          </p>
        </div>

        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 space-y-2">
          <p
            className="font-bold uppercase tracking-widest text-white/50"
            style={{ fontSize: "1.75rem" }}
          >
            Starting with movement 1
          </p>
          <p
            className="font-bold font-chinese text-[#FFD700]"
            style={{ fontSize: "3.5rem", lineHeight: 1.1 }}
          >
            {firstMovement.chinese}
          </p>
          <p
            className="font-bold text-white"
            style={{ fontSize: "2rem" }}
          >
            {firstMovement.english}
          </p>
        </div>

        <div
          className="rounded-full border-4 border-[#00D4FF] flex items-center justify-center"
          style={{ width: "10rem", height: "10rem" }}
        >
          <span
            className="font-black text-[#00D4FF] tabular-nums"
            style={{ fontSize: "6rem", lineHeight: 1 }}
          >
            {secondsLeft}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onSkip}
          className="rounded-2xl bg-[#00D4FF] px-8 py-4 font-black uppercase tracking-widest text-black active:scale-95"
          style={{ fontSize: "2rem" }}
        >
          START NOW
        </button>
        <p
          className="font-semibold text-white/30 text-center"
          style={{ fontSize: "1.5rem" }}
        >
          ✋ Arms up 1s = exit · Say &quot;next&quot; to skip countdown
        </p>
      </div>
    </div>
  );
}
