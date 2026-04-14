"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ModuleWithProgress, LessonWithStatus } from "@/lib/types";
import ModuleCard from "@/components/ModuleCard";
import Header from "@/components/Header";
import ChineseDisplayToggle from "@/components/ChineseDisplayToggle";
import ContinueLearningCard from "@/components/ContinueLearningCard";
import { DEMO_LESSONS } from "@/lib/demo-data";
import { applyDemoProgressToModules, getDemoProgress } from "@/lib/demo-progress";
import { getDueCount } from "@/lib/vocab-progress";

type Props = {
  modules: ModuleWithProgress[];
  userEmail: string;
  basePath?: string;
  isDemo?: boolean;
};

export default function Dashboard({
  modules: initialModules,
  userEmail,
  basePath = "/learn",
  isDemo = false,
}: Props) {
  const [modules, setModules] = useState<ModuleWithProgress[]>(initialModules);
  const [lessonsByModule, setLessonsByModule] = useState<
    Record<string, LessonWithStatus[]>
  >(isDemo ? {} : buildLessonsFromServer(initialModules));
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (isDemo) {
      const withProgress = applyDemoProgressToModules(initialModules);
      setModules(withProgress);
      const map: Record<string, LessonWithStatus[]> = {};
      for (const m of withProgress) {
        map[m.id] = m.lessons.length
          ? m.lessons
          : DEMO_LESSONS[m.id] ?? [];
      }
      // Re-apply progress on lesson status via getDemoProgress
      const prog = getDemoProgress();
      for (const id of Object.keys(map)) {
        map[id] = map[id].map((l) => {
          const e = prog[l.id];
          if (e?.passed) {
            return {
              ...l,
              derivedStatus: "completed",
              quiz_score: e.score,
              quiz_attempts: 1,
            };
          }
          return l;
        });
      }
      setLessonsByModule(map);
    }
    setDueCount(getDueCount());
  }, [initialModules, isDemo]);

  const totalLessons = modules.reduce((acc, m) => acc + m.totalCount, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.completedCount,
    0,
  );
  const overallPct =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return (
    <main className="relative min-h-screen">
      <Header userEmail={userEmail} />

      <section className="px-6 pt-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Overall progress */}
          <div className="card-surface p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
                  Your journey
                </p>
                <h1 className="mt-1 text-2xl font-bold">
                  {completedLessons} of {totalLessons} lessons complete
                </h1>
              </div>
              <span className="font-chinese text-3xl font-bold text-cyan">
                {overallPct}%
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan to-gold transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {/* Continue learning */}
          <ContinueLearningCard
            modules={modules}
            lessonsByModule={lessonsByModule}
            basePath={basePath}
          />

          {/* Vocab due badge */}
          <Link
            href="/vocab/review"
            className="card-surface flex items-center justify-between p-5 transition hover:border-cyan/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
                  Daily review
                </p>
                <p className="text-sm font-bold">
                  {dueCount > 0
                    ? `${dueCount} vocab ${dueCount === 1 ? "card" : "cards"} due`
                    : "No vocab due — browse words"}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan">
              {dueCount > 0 ? "Review" : "Browse"}
            </span>
          </Link>

          {/* Chinese display toggle */}
          <ChineseDisplayToggle />

          {/* Modules grid */}
          <div>
            <h2 className="mb-4 text-lg font-bold">Curriculum</h2>
            {modules.length === 0 ? (
              <div className="card-surface p-8 text-center text-sm text-foreground/50">
                No modules yet. Check back soon.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map((m) => (
                  <ModuleCard key={m.id} module={m} basePath={basePath} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}

function buildLessonsFromServer(
  modules: ModuleWithProgress[],
): Record<string, LessonWithStatus[]> {
  const map: Record<string, LessonWithStatus[]> = {};
  for (const m of modules) {
    map[m.id] = m.lessons;
  }
  return map;
}
