import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import LessonCard from "@/components/LessonCard";
import { DEMO_MODULES, DEMO_LESSONS } from "@/lib/demo-data";

export default function DemoModulePage({
  params,
}: {
  params: { moduleId: string };
}) {
  const mod = DEMO_MODULES.find((m) => m.id === params.moduleId);
  if (!mod) notFound();

  const lessons = DEMO_LESSONS[params.moduleId] ?? [];
  const completed = lessons.filter((l) => l.derivedStatus === "completed").length;
  const pct = lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100);

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1 text-xs text-foreground/50 transition hover:text-cyan"
          >
            <ChevronLeft size={14} />
            Dashboard
          </Link>

          {/* Module header */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
              {mod.category ?? "Module"}
            </p>
            <h1 className="mt-1 text-3xl font-bold">{mod.title_en}</h1>
            <p className="mt-1 text-base">
              <span className="text-pinyin">{mod.title_pinyin}</span>
              <span className="ml-3 text-zh text-2xl font-bold text-gold">
                {mod.title_zh}
              </span>
            </p>
            {mod.description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
                {mod.description}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="card-surface p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan/70">
                Module progress
              </span>
              <span className="font-chinese text-xl font-bold text-cyan">
                {pct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan to-gold transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-foreground/50">
              {completed} of {lessons.length} lessons complete
            </p>
          </div>

          {/* Lessons */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Lessons</h2>
            {lessons.map((l, i) => (
              <LessonCard
                key={l.id}
                moduleId={mod.id}
                lesson={l}
                index={i}
                basePath="/demo/learn"
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}
