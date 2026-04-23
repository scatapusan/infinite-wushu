"use client";

import type { MovementResult } from "./form-flow-machine";

const KEY = "wuxue:form-sessions";

export type FormSession = {
  id: string;
  lessonId: string;
  startedAt: number;
  completedAt: number;
  totalScore: number;
  movementResults: MovementResult[];
};

export function getFormSessions(): FormSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FormSession[]) : [];
  } catch {
    return [];
  }
}

export function saveFormSession(session: FormSession): void {
  if (typeof window === "undefined") return;
  const sessions = getFormSessions();
  sessions.push(session);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // storage full — ignore
  }
}

export function getFormSessionsFor(lessonId: string): FormSession[] {
  return getFormSessions().filter((s) => s.lessonId === lessonId);
}

export function getBestFormScore(lessonId: string): number | null {
  const sessions = getFormSessionsFor(lessonId);
  if (sessions.length === 0) return null;
  return Math.max(...sessions.map((s) => s.totalScore));
}

export function getFormSessionSummary(lessonId: string): {
  best: number | null;
  count: number;
  lastFive: number[];
  avgDurationSeconds: number | null;
  weakMovements: { movementSequence: number; avgScore: number }[];
} {
  const sessions = getFormSessionsFor(lessonId);
  if (sessions.length === 0) {
    return { best: null, count: 0, lastFive: [], avgDurationSeconds: null, weakMovements: [] };
  }

  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt);
  const lastFive = sorted.slice(0, 5).map((s) => s.totalScore);

  const durations = sessions
    .map((s) => Math.max(0, Math.round((s.completedAt - s.startedAt) / 1000)))
    .filter((d) => d > 0);
  const avgDurationSeconds =
    durations.length === 0
      ? null
      : Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  // Aggregate scores per movementSequence across sessions.
  const agg = new Map<number, { total: number; count: number }>();
  for (const s of sessions) {
    for (const m of s.movementResults) {
      if (!m.scored || typeof m.score !== "number") continue;
      const entry = agg.get(m.movementSequence) ?? { total: 0, count: 0 };
      entry.total += m.score;
      entry.count += 1;
      agg.set(m.movementSequence, entry);
    }
  }
  const weakMovements = Array.from(agg.entries())
    .map(([seq, { total, count }]) => ({
      movementSequence: seq,
      avgScore: Math.round(total / count),
    }))
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3);

  return {
    best: Math.max(...sessions.map((s) => s.totalScore)),
    count: sessions.length,
    lastFive,
    avgDurationSeconds,
    weakMovements,
  };
}
