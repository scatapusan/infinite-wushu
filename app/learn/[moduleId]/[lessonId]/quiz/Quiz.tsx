"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { QuizQuestionPublic } from "@/lib/types";
import QuizQuestionCard from "@/components/QuizQuestionCard";

type Props = {
  questions: QuizQuestionPublic[];
  lessonId: string;
  moduleId: string;
  lessonTitle: string;
  nextHref: string | null; // e.g. /learn/stances/pubu-xubu, or null if no next
};

type Phase = "answering" | "submitting" | "reviewing";

type PerQuestionResult = {
  questionId: string;
  correct: boolean;
  correctIndex: number;
  explanation: string | null;
};

type SubmitResponse = {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  results: PerQuestionResult[];
};

export default function Quiz({
  questions,
  lessonId,
  moduleId,
  lessonTitle,
  nextHref,
}: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null)
  );
  const [phase, setPhase] = useState<Phase>("answering");
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = answers.every((a) => a !== null);
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (index: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = index;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setError(null);
    setPhase("submitting");
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data: SubmitResponse = await res.json();
      setResult(data);
      setPhase("reviewing");
      setCurrentIndex(0);
      // Refresh so the module/dashboard RSCs re-read progress state.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
      setPhase("answering");
    }
  };

  const handleRetry = () => {
    setAnswers(questions.map(() => null));
    setResult(null);
    setError(null);
    setPhase("answering");
    setCurrentIndex(0);
  };

  // ─── Result screen ──────────────────────────────────────────────────────
  if (phase === "reviewing" && result) {
    const pct = Math.round(result.score * 100);
    return (
      <div className="space-y-6">
        <div
          className={`card-surface p-8 text-center ${
            result.passed ? "border-cyan/40" : "border-crimson/40"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
            {lessonTitle}
          </p>
          <h2 className="mt-2 text-4xl font-bold">
            {result.passed ? "Passed" : "Not yet"}
          </h2>
          <p className="mt-2 font-chinese text-5xl font-bold text-cyan">
            {pct}%
          </p>
          <p className="mt-2 text-sm text-foreground/60">
            {result.correctCount} of {result.total} correct
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {result.passed ? (
              <>
                {nextHref ? (
                  <Link href={nextHref} className="btn-gold">
                    Next lesson
                    <ArrowRight size={14} className="ml-2" />
                  </Link>
                ) : null}
                <Link
                  href={`/learn/${moduleId}`}
                  className="btn-ghost"
                >
                  Back to module
                </Link>
              </>
            ) : (
              <>
                <button onClick={handleRetry} className="btn-crimson">
                  <RotateCcw size={14} className="mr-2" />
                  Try again
                </button>
                <Link
                  href={`/learn/${moduleId}/${lessonId}`}
                  className="btn-ghost"
                >
                  Review lesson
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Review all questions */}
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
                correctIndex: result.results[i]?.correctIndex ?? -1,
                explanation: result.results[i]?.explanation ?? null,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Answering screen ───────────────────────────────────────────────────
  const q = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground/50">
          {answeredCount} / {questions.length} answered
        </span>
        <div className="h-1 flex-1 mx-4 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-cyan transition-all"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <QuizQuestionCard
        question={q}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        selectedIndex={answers[currentIndex]}
        onSelect={handleSelect}
      />

      {error && (
        <p className="rounded-card-md border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson">
          {error}
        </p>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
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
            disabled={!allAnswered || phase === "submitting"}
            className="btn-gold disabled:cursor-not-allowed"
          >
            {phase === "submitting" ? "Submitting…" : "Submit quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
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
  );
}
