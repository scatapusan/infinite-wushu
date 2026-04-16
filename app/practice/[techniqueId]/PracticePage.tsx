"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, SwitchCamera } from "lucide-react";
import type { Technique } from "@/lib/types";
import type { StanceEvaluation } from "@/lib/pose/types";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { STANCE_ANGLES } from "@/lib/pose/reference-angles";
import { evaluateStance } from "@/lib/pose/pose-evaluator";
import { savePracticeAttempt } from "@/lib/pose/practice-storage";
import CameraView from "@/components/practice/CameraView";
import FeedbackPanel from "@/components/practice/FeedbackPanel";

type Props = {
  technique: Technique;
  /** lesson_id for the back link */
  lessonId: string;
};

export default function PracticePage({ technique, lessonId }: Props) {
  const pose = usePoseDetection();
  const config = STANCE_ANGLES[technique.id] ?? null;
  const [evaluation, setEvaluation] = useState<StanceEvaluation | null>(null);
  const startTimeRef = useRef(Date.now());
  const bestScoreRef = useRef(0);

  // Evaluate stance whenever landmarks update
  useEffect(() => {
    if (!pose.landmarks || !config) return;
    const result = evaluateStance(pose.landmarks, config);
    setEvaluation(result);
    if (result.score > bestScoreRef.current) {
      bestScoreRef.current = result.score;
    }
  }, [pose.landmarks, config]);

  // Save practice attempt on unmount
  const saveAttempt = useCallback(() => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (duration < 3) return; // Don't save very short sessions

    const angles: Record<string, number> = {};
    if (evaluation) {
      for (const a of evaluation.angles) {
        angles[a.label] = a.current;
      }
    }

    savePracticeAttempt({
      techniqueId: technique.id,
      score: bestScoreRef.current,
      angles,
      duration,
      timestamp: Date.now(),
    });
  }, [technique.id, evaluation]);

  useEffect(() => {
    return () => saveAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mirrored = pose.facingMode === "user";

  // Find the module for the back link — stances techniques are in the stances module
  const backHref = `/demo/learn/stances/${lessonId}`;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#080c1a]">
      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 px-4 py-3">
        <Link
          href={backHref}
          onClick={saveAttempt}
          className="flex items-center gap-1.5 rounded-card-sm border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">{technique.english}</h1>
          <p className="text-sm text-gold font-chinese">{technique.chinese}</p>
        </div>

        <button
          onClick={pose.toggleCamera}
          className="flex items-center gap-1.5 rounded-card-sm border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Switch camera"
        >
          <SwitchCamera size={16} />
        </button>
      </header>

      {/* Camera view */}
      <div className="relative flex-1">
        {pose.isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#080c1a]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
            <p className="text-sm text-foreground/60">
              Loading pose detection...
            </p>
          </div>
        )}

        {pose.error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#080c1a] px-6 text-center">
            <p className="text-crimson font-medium">{pose.error}</p>
            <p className="text-sm text-foreground/50">
              Make sure your browser has camera permissions enabled.
            </p>
          </div>
        )}

        <CameraView
          videoRef={pose.videoRef}
          canvasRef={pose.canvasRef}
          landmarks={pose.landmarks}
          mirrored={mirrored}
          angleResults={evaluation?.angles ?? null}
          angleConfig={config}
        />

        {/* Feedback panel — overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4">
          <FeedbackPanel evaluation={evaluation} />
        </div>
      </div>
    </div>
  );
}
