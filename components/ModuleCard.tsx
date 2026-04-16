import Link from "next/link";
import { Lock } from "lucide-react";
import type { ModuleWithProgress } from "@/lib/types";

type Props = {
  module: ModuleWithProgress;
  basePath?: string;
  coachMode?: boolean;
};

export default function ModuleCard({
  module: mod,
  basePath = "/learn",
  coachMode = false,
}: Props) {
  // In coach mode, all modules are unlocked regardless of progress
  const unlocked = mod.unlocked || coachMode;

  const pct =
    mod.totalCount === 0
      ? 0
      : Math.round((mod.completedCount / mod.totalCount) * 100);

  const inner = (
    <article
      className={`card-surface relative flex h-full flex-col gap-4 p-5 transition ${
        unlocked ? "hover:border-cyan/40" : "opacity-50"
      }`}
    >
      {!unlocked && (
        <div className="absolute right-4 top-4 text-foreground/50">
          <Lock size={16} />
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan/60">
          {mod.category ?? "Module"}
        </p>
        <h3 className="mt-1 text-lg font-bold">{mod.title_en}</h3>
        <p className="mt-0.5 text-sm">
          <span className="text-pinyin">{mod.title_pinyin}</span>
          <span className="ml-2 text-zh text-gold/80">{mod.title_zh}</span>
        </p>
        {mod.description && (
          <p className="mt-2 text-sm text-foreground/60">{mod.description}</p>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-foreground/60">
          <span>
            {mod.completedCount} / {mod.totalCount} lessons
          </span>
          <span className="font-semibold text-cyan">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-cyan to-gold transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </article>
  );

  if (!unlocked) {
    return <div>{inner}</div>;
  }

  return (
    <Link href={`${basePath}/${mod.id}`} className="block h-full">
      {inner}
    </Link>
  );
}
