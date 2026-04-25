"use client";

import Link from "next/link";
import type { MovementResult, SequencedMovement } from "@/lib/pose/form-flow-machine";
import type { FormLessonMeta } from "@/lib/pose/form-lookup";

type Props = {
  meta: FormLessonMeta;
  movements: SequencedMovement[];
  results: MovementResult[];
  totalScore: number;
  durationSeconds: number;
  onRestart: () => void;
  backHref: string;
};

function formatDuration(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

function scoreColor(score: number): string {
  if (score >= 85) return "#00FF88";
  if (score >= 70) return "#A0FF4A";
  if (score >= 55) return "#FFD700";
  return "#FF3355";
}

export default function FormCompleteScreen({
  meta,
  movements,
  results,
  totalScore,
  durationSeconds,
  onRestart,
  backHref,
}: Props) {
  // Find lowest-scoring movement for flagging
  const scoredResults = results.filter((r) => r.scored && typeof r.score === "number");
  const lowestScore = scoredResults.length > 0
    ? Math.min(...scoredResults.map((r) => r.score ?? 100))
    : null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-[#050B1A]">
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <p
            className="font-bold uppercase tracking-widest text-[#00D4FF]"
            style={{ fontSize: "1.75rem" }}
          >
            FORM COMPLETE
          </p>
          <p
            className="font-black font-chinese text-[#FFD700]"
            style={{ fontSize: "5rem", lineHeight: 1 }}
          >
            {meta.chinese}
          </p>
          <p
            className="font-black text-white"
            style={{ fontSize: "3rem", lineHeight: 1.1 }}
          >
            {meta.english.toUpperCase()}
          </p>
        </div>

        {/* Total score */}
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p
            className="font-bold uppercase tracking-widest text-white/50"
            style={{ fontSize: "1.75rem" }}
          >
            Total score
          </p>
          <p
            className="font-black tabular-nums"
            style={{
              fontSize: "6rem",
              lineHeight: 1,
              color: scoreColor(totalScore),
              textShadow: `0 0 30px ${scoreColor(totalScore)}55`,
            }}
          >
            {totalScore}
          </p>
          <p
            className="font-bold text-white/70"
            style={{ fontSize: "2.5rem" }}
          >
            {formatDuration(durationSeconds)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <p
            className="font-bold uppercase tracking-widest text-white/50"
            style={{ fontSize: "1.75rem" }}
          >
            Movement breakdown
          </p>
          <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/10">
            {movements.map((m, i) => {
              const r = results[i];
              const isWeak =
                r?.scored && r.score !== undefined && r.score === lowestScore && lowestScore !== null;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <span
                    className="font-black text-white/40 tabular-nums flex-shrink-0"
                    style={{ fontSize: "1.75rem", width: "2.5rem" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-white truncate"
                      style={{ fontSize: "1.75rem" }}
                    >
                      {m.english}
                    </p>
                    <p
                      className="font-chinese text-white/50 truncate"
                      style={{ fontSize: "1.5rem" }}
                    >
                      {m.chinese}
                    </p>
                  </div>
                  {r?.scored && r.score !== undefined ? (
                    <span
                      className="font-black tabular-nums flex-shrink-0"
                      style={{ fontSize: "2rem", color: scoreColor(r.score) }}
                    >
                      {r.score}
                    </span>
                  ) : (
                    <span
                      className="font-bold text-white/40 flex-shrink-0"
                      style={{ fontSize: "1.75rem" }}
                    >
                      —
                    </span>
                  )}
                  {isWeak && (
                    <span
                      className="font-bold text-[#FF3355] flex-shrink-0"
                      style={{ fontSize: "1.5rem" }}
                    >
                      ← WEAK
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onRestart}
            className="rounded-3xl bg-[#00D4FF] font-black uppercase tracking-widest text-black active:scale-[0.97]"
            style={{ height: "5.5rem", fontSize: "2rem" }}
          >
            Practice again
          </button>
          <Link
            href={backHref}
            className="rounded-3xl border border-white/20 bg-white/5 flex items-center justify-center font-bold text-white/80 active:scale-[0.97]"
            style={{ height: "5.5rem", fontSize: "2rem" }}
          >
            Exit to lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
