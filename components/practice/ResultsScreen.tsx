"use client";

import Link from "next/link";
import { CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import type { CombinedEvaluation } from "@/lib/pose/types";
import ScoreCircle from "./ScoreCircle";
import Disclaimer from "./Disclaimer";

type Props = {
  result: CombinedEvaluation;
  techniqueEnglish: string;
  techniqueChinese: string;
  onRetry: () => void;
  backHref: string;
  includeHands?: boolean;
};

const TEXT_CLASS = {
  green: "text-[#22c55e]",
  yellow: "text-gold",
  red: "text-crimson",
} as const;

export default function ResultsScreen({
  result,
  techniqueEnglish,
  techniqueChinese,
  onRetry,
  backHref,
  includeHands,
}: Props) {
  const badgeClasses = result.verified
    ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
    : "border-gold/40 bg-gold/10 text-gold";
  const badgeLabel = result.verified ? "Verified" : "Preliminary";
  const BadgeIcon = result.verified ? CheckCircle : AlertCircle;

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-[#080c1a]/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <header className="text-center">
          <p className="text-sm font-semibold text-gold font-chinese">
            {techniqueChinese}
          </p>
          <h2 className="text-2xl font-bold">{techniqueEnglish}</h2>
        </header>

        <div className="flex flex-col items-center gap-3">
          <ScoreCircle score={result.combinedScore} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}
          >
            <BadgeIcon size={12} />
            {badgeLabel}
          </span>
          <p className="text-xs text-foreground/50">
            {result.mode === "multi"
              ? "Combined score from two views"
              : "Single-view score (enable multi-view for verified)"}
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["front", "side"] as const).map((view) => {
            const ev = result[view];
            if (!ev) {
              return (
                <div
                  key={view}
                  className="card-surface p-4 text-xs text-foreground/40"
                >
                  <p className="uppercase tracking-widest">{view} view</p>
                  <p className="mt-2 text-sm">Not captured</p>
                </div>
              );
            }
            const failures = ev.failures;
            return (
              <div key={view} className="card-surface p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-foreground/50">
                    {view} view
                  </p>
                  <p
                    className={`font-mono font-bold ${
                      ev.score >= 70 ? "text-[#22c55e]" : "text-crimson"
                    }`}
                  >
                    {ev.score}
                  </p>
                </div>
                {failures.length === 0 ? (
                  <p className="text-xs text-[#22c55e]">All checks passed</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {failures.map((f) => (
                      <li key={f.id} className="flex gap-2">
                        <span
                          className={`mt-0.5 shrink-0 ${TEXT_CLASS[f.status]}`}
                        >
                          •
                        </span>
                        <span className="text-foreground/70">
                          {f.message ?? f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onRetry}
            className="btn-gold inline-flex min-h-11 items-center gap-2 px-5 py-3"
          >
            <RotateCcw size={14} />
            Try again
          </button>
          <Link
            href={backHref}
            className="btn-ghost inline-flex min-h-11 items-center gap-2 px-5 py-3"
          >
            Back to lesson
          </Link>
        </div>

        <Disclaimer variant="full" includeHands={includeHands} />
      </div>
    </div>
  );
}
