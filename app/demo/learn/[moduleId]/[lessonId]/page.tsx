import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LogIn, ClipboardCheck, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import TechniqueCard from "@/components/TechniqueCard";
import PracticeFullFormButton from "@/components/PracticeFullFormButton";
import {
  DEMO_MODULES,
  DEMO_LESSONS,
  DEMO_TECHNIQUES,
  DEMO_QUIZZES,
} from "@/lib/demo-data";
import { isFormLesson } from "@/lib/pose/form-lookup";

export default function DemoLessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string };
}) {
  const mod = DEMO_MODULES.find((m) => m.id === params.moduleId);
  if (!mod) notFound();

  const lessons = DEMO_LESSONS[params.moduleId] ?? [];
  const lesson = lessons.find((l) => l.id === params.lessonId);
  if (!lesson) notFound();

  const techniques = DEMO_TECHNIQUES[params.lessonId] ?? [];
  const hasQuiz = (DEMO_QUIZZES[params.lessonId] ?? []).length > 0;

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            href={`/demo/learn/${mod.id}`}
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

          {/* Full-form practice entry (for form lessons only) */}
          {isFormLesson(params.lessonId) && (
            <PracticeFullFormButton
              lessonId={params.lessonId}
              backHref={`/demo/learn/${params.moduleId}/${params.lessonId}`}
            />
          )}

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
                <TechniqueCard
                  key={t.id}
                  technique={t}
                  backHref={`/demo/learn/${params.moduleId}/${params.lessonId}`}
                />
              ))}
            </div>
          )}

          {/* Quiz CTA */}
          {hasQuiz ? (
            <div className="card-surface flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold">Ready to test yourself?</h3>
                <p className="mt-1 text-xs text-foreground/50">
                  Take the quiz to unlock your progress on the dashboard.
                </p>
              </div>
              <Link
                href={`/demo/learn/${mod.id}/${lesson.id}/quiz`}
                className="btn-gold"
              >
                <ClipboardCheck size={14} className="mr-2" />
                Take quiz
              </Link>
            </div>
          ) : null}

          <div className="card-surface flex flex-col items-start gap-4 border-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/70">
                Save progress across devices
              </h3>
              <p className="mt-1 text-xs text-foreground/40">
                Create a free account to sync your progress.
              </p>
            </div>
            <Link href="/login?mode=signup" className="btn-ghost">
              <LogIn size={14} className="mr-2" />
              Create account
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
