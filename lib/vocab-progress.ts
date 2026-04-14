"use client";

import type { VocabWord } from "@/lib/vocab-data";
import { VOCAB_WORDS } from "@/lib/vocab-data";

const KEY = "wuxue:vocab-progress";

export type VocabEntry = {
  lastReviewed: string; // ISO
  ease: number; // 1..5
  dueAt: string; // ISO
};

export type VocabProgressMap = Record<string, VocabEntry>;

const DAY_MS = 24 * 60 * 60 * 1000;
const TEN_MIN_MS = 10 * 60 * 1000;

function read(): VocabProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: VocabProgressMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getVocabProgress(): VocabProgressMap {
  return read();
}

export function gradeWord(id: string, passed: boolean): VocabEntry {
  const map = read();
  const existing = map[id];
  const priorEase = existing?.ease ?? 2.5;
  const ease = clamp(priorEase + (passed ? 0.2 : -0.3), 1, 5);
  const now = Date.now();
  const delay = passed ? Math.round(ease * DAY_MS) : TEN_MIN_MS;
  const entry: VocabEntry = {
    lastReviewed: new Date(now).toISOString(),
    ease,
    dueAt: new Date(now + delay).toISOString(),
  };
  map[id] = entry;
  write(map);
  return entry;
}

export function getDueWords(words: VocabWord[] = VOCAB_WORDS): VocabWord[] {
  const map = read();
  const now = Date.now();
  return words.filter((w) => {
    const e = map[w.id];
    if (!e) return true; // never reviewed → due
    return new Date(e.dueAt).getTime() <= now;
  });
}

export function getDueCount(): number {
  if (typeof window === "undefined") return 0;
  return getDueWords(VOCAB_WORDS).length;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
