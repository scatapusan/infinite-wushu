import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ModuleWithProgress, LessonWithStatus } from "@/lib/types";

type Props = {
  modules: ModuleWithProgress[];
  lessonsByModule: Record<string, LessonWithStatus[]>;
  basePath: string;
};

export default function ContinueLearningCard({
  modules,
  lessonsByModule,
  basePath,
}: Props) {
  // Walk modules in sort order, find first lesson that isn't completed.
  const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
  let nextModule: ModuleWithProgress | null = null;
  let nextLesson: LessonWithStatus | null = null;

  for (const m of sorted) {
    const lessons = lessonsByModule[m.id] ?? [];
    const lesson = lessons.find((l) => l.derivedStatus !== "completed");
    if (lesson) {
      nextModule = m;
      nextLesson = lesson;
      break;
    }
  }

  if (!nextModule || !nextLesson) {
    return (
      <div className="card-surface p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
          All caught up
        </p>
        <h2 className="mt-1 text-xl font-bold">You&apos;ve completed every lesson</h2>
        <p className="mt-1 text-sm text-foreground/50">
          Check back soon for new modules.
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`${basePath}/${nextModule.id}/${nextLesson.id}`}
      className="card-surface block p-6 transition hover:border-cyan/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
            Continue learning
          </p>
          <h2 className="mt-1 truncate text-xl font-bold">
            {nextLesson.title_en}
          </h2>
          <p className="mt-1 text-sm">
            <span className="text-pinyin">{nextLesson.title_pinyin}</span>
            <span className="ml-2 text-zh text-gold/80">
              {nextLesson.title_zh}
            </span>
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            {nextModule.title_en}
          </p>
        </div>
        <div className="btn-gold shrink-0">
          Resume
          <ArrowRight size={14} className="ml-2" />
        </div>
      </div>
    </Link>
  );
}
