"use client";

import {
  getFormSessionSummary,
  getFormSessions,
  getBestFormScore,
  type FormSession,
} from "@/lib/pose/form-session-storage";
import {
  getPracticeAttempts,
  getBestScore,
} from "@/lib/pose/practice-storage";
import type { PracticeAttempt } from "@/lib/pose/types";

/**
 * Unified analytics facade for stance + form practice data.
 *
 * Why: The practice analytics live in two localStorage buckets — per-stance
 * attempts (wuxue:practice-attempts) and per-form sessions (wuxue:form-sessions).
 * Dashboard-level summaries need data from both. Re-exporting here keeps callers
 * from importing deep paths and makes future server-side migration easier.
 */

export { getBestScore, getPracticeAttempts };
export type { PracticeAttempt };

export {
  getFormSessions,
  getBestFormScore,
  getFormSessionSummary,
};
export type { FormSession };

/** Aggregate form progress across all form lessons the user has practiced. */
export function getFormAnalytics(): {
  totalSessions: number;
  lessonsPracticed: string[];
  overallBest: { lessonId: string; score: number } | null;
} {
  const sessions = getFormSessions();
  if (sessions.length === 0) {
    return { totalSessions: 0, lessonsPracticed: [], overallBest: null };
  }
  const lessonsPracticed = Array.from(
    new Set(sessions.map((s) => s.lessonId)),
  );
  const best = sessions.reduce((acc, s) =>
    s.totalScore > acc.totalScore ? s : acc,
  );
  return {
    totalSessions: sessions.length,
    lessonsPracticed,
    overallBest: { lessonId: best.lessonId, score: best.totalScore },
  };
}
