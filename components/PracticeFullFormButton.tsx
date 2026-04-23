"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import {
  getFormSessionSummary,
  type FormSession,
} from "@/lib/pose/form-session-storage";

type Props = {
  lessonId: string;
  backHref: string;
};

/**
 * Large distance-readable CTA that opens the guided form-practice carousel.
 * Shows best-ever score + session count when any sessions exist (client-only).
 */
export default function PracticeFullFormButton({ lessonId, backHref }: Props) {
  const [summary, setSummary] = useState<
    ReturnType<typeof getFormSessionSummary> | null
  >(null);

  useEffect(() => {
    setSummary(getFormSessionSummary(lessonId));
  }, [lessonId]);

  const href = `/practice/form/${lessonId}?from=${encodeURIComponent(backHref)}`;
  const best = summary?.best;
  const count = summary?.count ?? 0;

  return (
    <div className="rounded-card border border-cyan/30 bg-gradient-to-br from-cyan/10 to-cyan/5 p-4 space-y-3">
      <Link
        href={href}
        className="flex w-full items-center justify-center gap-3 rounded-card-md bg-cyan font-black uppercase tracking-wider text-background active:scale-[0.98]"
        style={{ height: "4.5rem", fontSize: "1.75rem" }}
      >
        <Camera size={28} />
        Practice Full Form
      </Link>
      {count > 0 && best !== null && (
        <p className="text-center text-sm font-semibold text-foreground/60">
          Best: <span className="font-bold text-cyan">{best}</span>
          {" · "}
          {count} {count === 1 ? "session" : "sessions"}
        </p>
      )}
      {count === 0 && (
        <p className="text-center text-xs text-foreground/50">
          Practice all 9 movements in sequence for a total form score.
        </p>
      )}
    </div>
  );
}
