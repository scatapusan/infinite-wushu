"use client";

import type { PracticeAttempt } from "./types";

const KEY = "wuxue:practice-attempts";

export function getPracticeAttempts(): PracticeAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePracticeAttempt(attempt: PracticeAttempt): void {
  if (typeof window === "undefined") return;
  const attempts = getPracticeAttempts();
  attempts.push(attempt);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(attempts));
  } catch {
    // storage full — ignore
  }
}

export function getBestScore(techniqueId: string): number | null {
  const attempts = getPracticeAttempts().filter(
    (a) => a.techniqueId === techniqueId,
  );
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score));
}
