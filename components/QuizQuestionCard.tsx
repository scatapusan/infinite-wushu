"use client";

import { Check, X } from "lucide-react";
import type { QuizQuestionPublic } from "@/lib/types";
import SpeakButton from "@/components/SpeakButton";

type Props = {
  question: QuizQuestionPublic;
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  // Review state — only populated after grading
  review?: {
    correctIndex: number;
    explanation: string | null;
  } | null;
};

export default function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  onSelect,
  review,
}: Props) {
  const zhMatches = question.question.match(/[\u4e00-\u9fff]+/g);
  const zhText = zhMatches ? zhMatches.join("") : null;

  return (
    <div className="card-surface p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
        Question {questionNumber} of {totalQuestions}
      </p>
      <div className="mt-2 flex items-start gap-2">
        <h2 className="flex-1 text-lg font-bold leading-snug">{question.question}</h2>
        {zhText && <SpeakButton text={zhText} className="mt-0.5 shrink-0" />}
      </div>

      <ul className="mt-5 space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = review && review.correctIndex === i;
          const isWrongSelected =
            review && isSelected && review.correctIndex !== i;

          let cls =
            "flex w-full items-center gap-3 rounded-card-md border px-4 py-3 text-left text-sm transition ";
          if (review) {
            if (isCorrect) {
              cls += "border-cyan/60 bg-cyan/10 text-cyan";
            } else if (isWrongSelected) {
              cls += "border-crimson/60 bg-crimson/10 text-crimson";
            } else {
              cls += "border-white/10 text-foreground/50";
            }
          } else if (isSelected) {
            cls += "border-cyan/60 bg-cyan/5 text-foreground";
          } else {
            cls +=
              "border-white/10 text-foreground/80 hover:border-cyan/40 hover:bg-white/[0.04]";
          }

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => !review && onSelect(i)}
                disabled={!!review}
                className={cls}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                  {isCorrect && review ? (
                    <Check size={12} />
                  ) : isWrongSelected ? (
                    <X size={12} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {review && review.explanation && (
        <p className="mt-4 rounded-card-md border border-cyan/20 bg-cyan/5 px-4 py-3 text-xs leading-relaxed text-foreground/70">
          <span className="font-semibold text-cyan">Why: </span>
          {review.explanation}
        </p>
      )}
    </div>
  );
}
