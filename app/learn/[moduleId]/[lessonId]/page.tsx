import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight, BookOpen } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  getLesson,
  getModule,
  getTechniquesForLesson,
  startLesson,
} from "@/lib/db";
import Header from "@/components/Header";
import TechniqueCard from "@/components/TechniqueCard";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]+$/;

export default async function LessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string };
}) {
  if (!SLUG.test(params.moduleId) || !SLUG.test(params.lessonId)) notFound();

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [lesson, mod] = await Promise.all([
    getLesson(params.lessonId),
    getModule(params.moduleId),
  ]);

  if (!lesson || !mod || lesson.module_id !== mod.id) notFound();

  const techniques = await getTechniquesForLesson(lesson.id);

  // Write the in_progress row on first view. Swallow failures — the lesson
  // still renders; recovery happens next page load.
  try {
    await startLesson(user.id, lesson.id);
  } catch {
    /* noop — worst case, progress row is written on quiz submit */
  }

  return (
    <main className="relative min-h-screen">
      <Header userEmail={user.email ?? ""} />

      <section className="px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            href={`/learn/${mod.id}`}
            className="inline-flex items-center gap-1 text-xs text-foreground/50 transition hover:text-cyan"
          >
            <ChevronLeft size={14} />
            {mod.title_en}
          </Link>

          {/* Lesson header */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
              Lesson
            </p>
            <h1 className="mt-1 text-3xl font-bold">{lesson.title_en}</h1>
            <p className="mt-1 text-base">
              <span className="text-pinyin">{lesson.title_pinyin}</span>
              <span className="ml-3 text-zh text-2xl font-bold text-gold">
                {lesson.title_zh}
              </span>
            </p>
            {lesson.description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Techniques */}
          {techniques.length === 0 ? (
            <div className="card-surface flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                <BookOpen size={22} className="text-gold/60" />
              </div>
              <div>
                <p className="font-semibold">Content coming soon</p>
                <p className="mt-1 max-w-sm text-sm text-foreground/50">
                  Video tutorials and section-by-section breakdowns for this
                  form will be added here when ready.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {techniques.map((t) => (
                <TechniqueCard key={t.id} technique={t} />
              ))}
            </div>
          )}

          {/* Quiz CTA */}
          <div className="card-surface flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold">Ready to test yourself?</h3>
              <p className="mt-1 text-xs text-foreground/50">
                Pass with 75% to unlock the next lesson.
              </p>
            </div>
            <Link
              href={`/learn/${mod.id}/${lesson.id}/quiz`}
              className="btn-gold"
            >
              Start quiz
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}
