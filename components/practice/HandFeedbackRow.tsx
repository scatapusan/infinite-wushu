"use client";

import type { CheckResult, HandFeedback } from "@/lib/pose/types";

type Props = {
  feedback: HandFeedback | null;
  paused?: boolean;
};

const DOT_CLASS = {
  green: "bg-[#00FF88]",
  yellow: "bg-gold",
  red: "bg-crimson",
} as const;

const TEXT_CLASS = {
  green: "text-[#00FF88]",
  yellow: "text-gold",
  red: "text-crimson",
} as const;

function Row({ check }: { check: CheckResult }) {
  return (
    <li className="flex items-start gap-2.5 text-xs leading-tight">
      <span
        className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${DOT_CLASS[check.status]}`}
      />
      <span className="w-28 shrink-0 truncate text-foreground/60">
        {check.label}
      </span>
      <span className={`flex-1 truncate ${TEXT_CLASS[check.status]}`}>
        {check.message ?? (check.targetLabel ? `${check.targetLabel} ✓` : "✓")}
      </span>
    </li>
  );
}

export default function HandFeedbackRow({ feedback, paused }: Props) {
  if (paused) {
    return (
      <p className="text-[11px] text-gold/70">
        Hand tracking paused — low FPS
      </p>
    );
  }
  if (!feedback) return null;
  return (
    <div className="mt-2 border-t border-white/10 pt-2">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-foreground/50">
        Hands
      </p>
      <ul className="space-y-1">
        {feedback.checks.map((c) => (
          <Row key={c.id} check={c} />
        ))}
      </ul>
    </div>
  );
}
