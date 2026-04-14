"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import Header from "@/components/Header";
import QuizQuestionCard from "@/components/QuizQuestionCard";
import {
  DEMO_MODULES,
  DEMO_LESSONS,
  DEMO_QUIZZES,
} from "@/lib/demo-data";
import { setDemoProgress } from "@/lib/demo-progress";
import type { QuizQuestionPublic } from "@/lib/types";

const PASS_THRESHOLD = 0.75;

export default function DemoQuizPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>();
  const moduleId = params.moduleId;
  const lessonId = params.lessonId;

  const mod = DEMO_MODULES.find((m) => m.id === moduleId);
  const lesson = (DEMO_LESSONS[moduleId] ?? []).find((l) => l.id === lessonId);
  const fullQuiz = DEMO_QUIZZES[lessonId] ?? [];

  if (!mod || !lesson || fullQuiz.length === 0) {
    notFound();
  }

  const questions: QuizQuestionPublic[] = fullQuiz.map(
    ({ correct_index, ...rest }) => rest,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const isLast = currentIndex === questions.length - 1;

  const correctCount = answers.reduce<number>(
    (acc, a, i) => (a === fullQuiz[i].correct_index ? acc + 1 : acc),
    0,
  );
  const score = questions.length === 0 ? 0 : correctCount / questions.length;
  const passed = score >= PASS_THRESHOLD;

  const handleSelect = (idx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = idx;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setDemoProgress(lessonId, passed, score);
    setSubmitted(true);
    setCurrentIndex(0);
  };

  const handleRetry = () => {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
    setCurrentIndex(0);
  };

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            href={`/demo/learn/${moduleId}/${lessonId}`}
            className="inline-flex items-center gap-1 text-xs text-foreground/50 transition hover:text-cyan"
          >
            <ChevronLeft size={14} />
            {lesson.title_en}
          </Link>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
              Quiz
            </p>
            <h1 className="mt-1 text-3xl font-bold">{lesson.title_en}</h1>
            <p className="mt-1 text-base">
              <span className="text-pinyin">{lesson.title_pinyin}</span>
              <span className="ml-3 text-zh text-2xl font-bold text-gold">
                {lesson.title_zh}
              </span>
            </p>
          </div>

          {submitted ? (
            <div className="space-y-6">
              <div
                className={`card-surface p-8 text-center ${
                  passed ? "border-cyan/40" : "border-crimson/40"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                  {lesson.title_en}
                </p>
                <h2 className="mt-2 text-4xl font-bold">
                  {passed ? "Passed" : "Not yet"}
                </h2>
                <p className="mt-2 font-chinese text-5xl font-bold text-cyan">
                  {Math.round(score * 100)}%
                </p>
                <p className="mt-2 text-sm text-foreground/60">
                  {correctCount} of {questions.length} correct
                </p>

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {passed ? (
                    <>
                      <Link
                        href={`/demo/learn/${moduleId}`}
                        className="btn-gold"
                      >
                        Back to module
                        <ArrowRight size={14} className="ml-2" />
                      </Link>
                      <Link href="/demo" className="btn-ghost">
                        Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <button onClick={handleRetry} className="btn-crimson">
                        <RotateCcw size={14} className="mr-2" />
                        Try again
                      </button>
                      <Link
                        href={`/demo/learn/${moduleId}/${lessonId}`}
                        className="btn-ghost"
                      >
                        Review lesson
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan/70">
                  Review
                </h3>
                {questions.map((q, i) => (
                  <QuizQuestionCard
                    key={q.id}
                    question={q}
                    questionNumber={i + 1}
                    totalQuestions={questions.length}
                    selectedIndex={answers[i]}
                    onSelect={() => {}}
                    review={{
                      correctIndex: fullQuiz[i].correct_index,
                      explanation: fullQuiz[i].explanation,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/50">
                  {answers.filter((a) => a !== null).length} /{" "}
                  {questions.length} answered
                </span>
                <div className="mx-4 h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-cyan transition-all"
                    style={{
                      width: `${
                        (answers.filter((a) => a !== null).length /
                          questions.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <QuizQuestionCard
                question={questions[currentIndex]}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                selectedIndex={answers[currentIndex]}
                onSelect={handleSelect}
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => Math.max(0, i - 1))
                  }
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 rounded-card-md border border-white/10 px-4 py-2 text-sm text-foreground/70 transition hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className="btn-gold disabled:cursor-not-allowed"
                  >
                    Submit quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((i) =>
                        Math.min(questions.length - 1, i + 1),
                      )
                    }
                    disabled={answers[currentIndex] === null}
                    className="inline-flex items-center gap-1 rounded-card-md border border-cyan/40 bg-cyan/5 px-4 py-2 text-sm font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-foreground/30">
        武学 · WuXue · by Infinite Wushu
      </footer>
    </main>
  );
}
