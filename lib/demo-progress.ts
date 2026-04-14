"use client";

import type { ModuleWithProgress, LessonWithStatus } from "@/lib/types";
import { DEMO_LESSONS } from "@/lib/demo-data";

const KEY = "wuxue:demo-progress";

export type DemoProgressEntry = { passed: boolean; score: number };
export type DemoProgressMap = Record<string, DemoProgressEntry>;

export function getDemoProgress(): DemoProgressMap {
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

export function setDemoProgress(lessonId: string, passed: boolean, score: number) {
  if (typeof window === "undefined") return;
  const map = getDemoProgress();
  map[lessonId] = { passed, score };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function applyDemoProgressToModules(
  modules: ModuleWithProgress[],
): ModuleWithProgress[] {
  const map = getDemoProgress();
  return modules.map((m) => {
    const lessons = DEMO_LESSONS[m.id] ?? [];
    const withStatus: LessonWithStatus[] = lessons.map((l) => {
      const entry = map[l.id];
      if (entry?.passed) {
        return {
          ...l,
          derivedStatus: "completed",
          quiz_score: entry.score,
          quiz_attempts: 1,
        };
      }
      return l;
    });
    const completedCount = withStatus.filter(
      (l) => l.derivedStatus === "completed",
    ).length;
    return {
      ...m,
      lessons: withStatus,
      completedCount,
      totalCount: lessons.length,
    };
  });
}

export function applyDemoProgressToLessons(
  moduleId: string,
): LessonWithStatus[] {
  const map = getDemoProgress();
  const lessons = DEMO_LESSONS[moduleId] ?? [];
  return lessons.map((l) => {
    const entry = map[l.id];
    if (entry?.passed) {
      return {
        ...l,
        derivedStatus: "completed",
        quiz_score: entry.score,
        quiz_attempts: 1,
      };
    }
    return l;
  });
}
