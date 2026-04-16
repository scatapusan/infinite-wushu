import Link from "next/link";
import { Lock, Play, Check, Circle, Star } from "lucide-react";
import type { LessonWithStatus } from "@/lib/types";

type Props = {
  moduleId: string;
  lesson: LessonWithStatus;
  index: number;
  basePath?: string;
  coachMode?: boolean;
};

export default function LessonCard({
  moduleId,
  lesson,
  index,
  basePath = "/learn",
  coachMode = false,
}: Props) {
  // In coach mode, locked lessons are treated as available
  const locked = lesson.derivedStatus === "locked" && !coachMode;
  const completed = lesson.derivedStatus === "completed";
  const inProgress = lesson.derivedStatus === "in_progress";

  const icon = locked ? (
    <Lock size={18} className="text-foreground/40" />
  ) : completed ? (
    <Check size={18} className="text-cyan" />
  ) : inProgress ? (
    <Play size={18} className="text-cyan" />
  ) : (
    <Circle size={18} className="text-cyan" />
  );

  const statusLabel = locked
    ? (lesson.prerequisite_label ?? "Locked — complete previous lesson")
    : completed
      ? lesson.quiz_score != null
        ? `Completed · ${Math.round(lesson.quiz_score * 100)}%`
        : "Completed"
      : inProgress
        ? "In progress"
        : "Ready";

  const inner = (
    <article
      className={`card-surface flex items-center gap-4 p-5 transition ${
        locked ? "opacity-50" : "hover:border-cyan/40"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] font-chinese text-sm font-bold text-gold">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold">{lesson.title_en}</h3>
        <p className="mt-0.5 text-sm">
          <span className="text-pinyin">{lesson.title_pinyin}</span>
          <span className="ml-2 text-zh text-gold/80">{lesson.title_zh}</span>
        </p>
        {lesson.description && (
          <p className="mt-1 line-clamp-2 text-xs text-foreground/50">
            {lesson.description}
          </p>
        )}
        {lesson.chinese_level > 0 && (
          <div className="mt-1.5 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={10}
                className={
                  n <= lesson.chinese_level
                    ? "fill-gold text-gold"
                    : "fill-foreground/10 text-foreground/10"
                }
              />
            ))}
          </div>
        )}
        <p
          className={`mt-2 text-xs font-semibold ${
            locked
              ? "text-foreground/40"
              : completed
                ? "text-cyan"
                : inProgress
                  ? "text-cyan"
                  : "text-cyan/70"
          }`}
        >
          {statusLabel}
        </p>
      </div>

      <div className="shrink-0">{icon}</div>
    </article>
  );

  if (locked) return <div>{inner}</div>;

  return (
    <Link href={`${basePath}/${moduleId}/${lesson.id}`} className="block">
      {inner}
    </Link>
  );
}
