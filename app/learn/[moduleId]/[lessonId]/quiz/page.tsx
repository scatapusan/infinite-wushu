import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  getLesson,
  getModule,
  getQuizForLesson,
  getNextLessonId,
  getModuleWithLessonStatuses,
} from "@/lib/db";
import { isCoachModeServer } from "@/lib/coach-mode.server";
import Header from "@/components/Header";
import Quiz from "./Quiz";
import type { QuizQuestionPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]+$/;

export default async function QuizPage({
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

  // Enforce unlock — quizzes for locked lessons should not render.
  // Coaches bypass the lock check so they can preview any quiz.
  if (!isCoachModeServer()) {
    const moduleData = await getModuleWithLessonStatuses(user.id, mod.id);
    const lessonStatus = moduleData?.lessons.find((l) => l.id === lesson.id);
    if (!lessonStatus || lessonStatus.derivedStatus === "locked") notFound();
  }

  const [questions, nextLesson] = await Promise.all([
    getQuizForLesson(lesson.id),
    getNextLessonId(lesson.id),
  ]);

  // Strip correct_index before handing to the client.
  const publicQuestions: QuizQuestionPublic[] = questions.map((q) => ({
    id: q.id,
    lesson_id: q.lesson_id,
    question: q.question,
    options: q.options,
    explanation: q.explanation,
    sort_order: q.sort_order,
  }));

  const nextHref = nextLesson
    ? `/learn/${nextLesson.moduleId}/${nextLesson.lessonId}`
    : null;

  return (
    <main className="relative min-h-screen">
      <Header userEmail={user.email ?? ""} />

      <section className="px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href={`/learn/${mod.id}/${lesson.id}`}
            className="inline-flex items-center gap-1 text-xs text-foreground/50 transition hover:text-gold"
          >
            <ChevronLeft size={14} />
            {lesson.title_en}
          </Link>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold/70">
              Quiz
            </p>
            <h1 className="mt-1 text-2xl font-bold">{lesson.title_en}</h1>
            <p className="mt-1 text-sm text-foreground/50">
              Answer all questions. 75% to pass.
            </p>
          </div>

          {publicQuestions.length === 0 ? (
            <div className="card-surface p-6 text-center text-sm text-foreground/50">
              No quiz questions yet for this lesson.
            </div>
          ) : (
            <Quiz
              questions={publicQuestions}
              lessonId={lesson.id}
              moduleId={mod.id}
              lessonTitle={lesson.title_en}
              nextHref={nextHref}
            />
          )}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue
      </footer>
    </main>
  );
}
