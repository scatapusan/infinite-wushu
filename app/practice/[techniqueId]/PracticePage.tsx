"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, SwitchCamera } from "lucide-react";
import type { Technique } from "@/lib/types";
import type {
  BodyVisibility,
  CameraView as CameraViewKind,
  ViewEvaluation,
  CombinedEvaluation,
  ArmPosition,
  HandFeedback,
} from "@/lib/pose/types";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { useHandDetection } from "@/lib/pose/use-hand-detection";
import { STANCE_CHECKS } from "@/lib/pose/stance-checks";
import { evaluateStanceView, combineViews } from "@/lib/pose/pose-evaluator";
import { evaluateHands } from "@/lib/pose/hand-evaluator";
import { checkBodyVisibility } from "@/lib/pose/angle-utils";
import { savePracticeAttempt } from "@/lib/pose/practice-storage";
import { isQuickMode, isHandTrackingEnabled } from "@/lib/preferences";
import {
  useFlowReducer,
  COUNTDOWN_SECONDS,
} from "@/lib/pose/view-state-machine";
import CameraView from "@/components/practice/CameraView";
import FeedbackPanel from "@/components/practice/FeedbackPanel";
import BodyVisibilityOverlay from "@/components/practice/BodyVisibilityOverlay";
import ViewIndicator from "@/components/practice/ViewIndicator";
import CountdownOverlay from "@/components/practice/CountdownOverlay";
import ResultsScreen from "@/components/practice/ResultsScreen";
import Disclaimer from "@/components/practice/Disclaimer";
import ArmPositionSelector from "@/components/practice/ArmPositionSelector";
import HandFeedbackRow from "@/components/practice/HandFeedbackRow";

type Props = {
  technique: Technique;
  /** lesson_id for the back link */
  lessonId: string;
};

export default function PracticePage({ technique, lessonId }: Props) {
  const pose = usePoseDetection();
  const config = STANCE_CHECKS[technique.id] ?? null;
  const [bodyVisibility, setBodyVisibility] = useState<BodyVisibility | null>(
    null,
  );
  const [liveEval, setLiveEval] = useState<ViewEvaluation | null>(null);
  const liveEvalRef = useRef<ViewEvaluation | null>(null);
  const startTimeRef = useRef(Date.now());
  const bestScoreRef = useRef(0);
  const [quickMode, setQuickModeState] = useState(false);
  const [handTrackingEnabled, setHandTrackingEnabledState] = useState(false);
  const [handsPaused, setHandsPaused] = useState(false);
  const [armPosition, setArmPosition] = useState<ArmPosition>("waist");
  const [handFeedback, setHandFeedback] = useState<HandFeedback | null>(null);
  const lowFpsSinceRef = useRef<number | null>(null);

  const plan = useMemo<CameraViewKind[]>(() => {
    if (!config) return ["front"];
    const primary = config.primaryView;
    const secondary: CameraViewKind = primary === "front" ? "side" : "front";
    return quickMode ? [primary] : [primary, secondary];
  }, [config, quickMode]);

  const { state, dispatch, reset } = useFlowReducer(plan);

  // Read prefs on mount
  useEffect(() => {
    setQuickModeState(isQuickMode());
    setHandTrackingEnabledState(isHandTrackingEnabled());
  }, []);
  useEffect(() => {
    reset(plan);
  }, [plan, reset]);

  // FPS guardrail: auto-pause hand tracking if FPS < 20 for more than 2s
  const handleHandFps = useCallback((fps: number) => {
    if (fps < 20) {
      const now = performance.now();
      if (lowFpsSinceRef.current === null) lowFpsSinceRef.current = now;
      else if (now - lowFpsSinceRef.current > 2000) {
        setHandsPaused(true);
      }
    } else {
      lowFpsSinceRef.current = null;
    }
  }, []);

  const hands = useHandDetection({
    videoRef: pose.videoRef,
    enabled: handTrackingEnabled && !handsPaused,
    onFps: handleHandFps,
  });

  // Body-visibility & live evaluation
  useEffect(() => {
    if (!pose.landmarks) return;
    const visibility = checkBodyVisibility(pose.landmarks);
    setBodyVisibility(visibility);

    if (!visibility.ready) {
      dispatch({ type: "BODY_LOST" });
      setLiveEval(null);
      liveEvalRef.current = null;
      setHandFeedback(null);
      return;
    }

    dispatch({ type: "BODY_READY" });

    if (!config) return;

    // Only evaluate in states where we're actively capturing
    if (state.phase !== "holding" && state.phase !== "awaiting") return;

    const handsActive = handTrackingEnabled && !handsPaused && hands.ready;
    const hf = handsActive
      ? evaluateHands(pose.landmarks, hands.left, hands.right, armPosition)
      : null;
    setHandFeedback(hf);

    const ev = evaluateStanceView(
      pose.landmarks,
      config,
      state.currentView,
      hf?.checks ?? [],
    );
    setLiveEval(ev);
    liveEvalRef.current = ev;
    if (ev.score > bestScoreRef.current) bestScoreRef.current = ev.score;

    // Buffer last valid evaluation for "use last capture"
    if (ev.score >= 70) {
      dispatch({ type: "BUFFER", view: state.currentView, evaluation: ev });
    }
  }, [
    pose.landmarks,
    config,
    dispatch,
    state.phase,
    state.currentView,
    handTrackingEnabled,
    handsPaused,
    hands.ready,
    hands.left,
    hands.right,
    armPosition,
  ]);

  // Fires when HoldTimer reaches its target — capture this view
  const handleOfficial = useCallback(() => {
    const ev = liveEvalRef.current;
    if (!ev || state.phase !== "holding") return;
    dispatch({ type: "CAPTURE", view: state.currentView, evaluation: ev });
  }, [dispatch, state.phase, state.currentView]);

  // Save attempt when we reach results
  useEffect(() => {
    if (state.phase !== "results") return;
    const mode: "quick" | "multi" = plan.length === 1 ? "quick" : "multi";
    const combined: CombinedEvaluation = combineViews(
      technique.id,
      state.captures.front,
      state.captures.side,
      mode,
    );
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    savePracticeAttempt({
      techniqueId: technique.id,
      score: combined.combinedScore,
      angles: {},
      duration,
      timestamp: Date.now(),
      frontScore: combined.front?.score,
      sideScore: combined.side?.score,
      verified: combined.verified,
      mode: combined.mode,
    });
  }, [state.phase, state.captures, plan.length, technique.id]);

  const finalResult: CombinedEvaluation | null = useMemo(() => {
    if (state.phase !== "results") return null;
    const mode: "quick" | "multi" = plan.length === 1 ? "quick" : "multi";
    return combineViews(
      technique.id,
      state.captures.front,
      state.captures.side,
      mode,
    );
  }, [state.phase, state.captures, plan.length, technique.id]);

  const mirrored = pose.facingMode === "user";
  const backHref = `/demo/learn/stances/${lessonId}`;
  const currentStepIndex = plan.indexOf(state.currentView);
  const bufferedForCurrent = state.buffered[state.currentView];

  function handleRetry() {
    bestScoreRef.current = 0;
    startTimeRef.current = Date.now();
    liveEvalRef.current = null;
    setLiveEval(null);
    setHandFeedback(null);
    setHandsPaused(false);
    lowFpsSinceRef.current = null;
    reset(plan);
  }

  const handsVisible =
    handTrackingEnabled &&
    state.phase !== "results" &&
    state.phase !== "countdown";
  const showArmSelector =
    handsVisible && state.phase === "awaiting" && currentStepIndex === 0;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#080c1a]">
      <header className="relative z-10 flex items-center gap-3 px-4 py-3">
        <Link
          href={backHref}
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

      <div className="relative flex-1">
        {pose.isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#080c1a]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
            <p className="text-sm text-foreground/60">
              Loading pose detection…
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
          checks={liveEval?.checks ?? null}
          config={config}
          view={state.currentView}
        />

        {/* Top row: view indicator + body visibility */}
        {!pose.isLoading &&
          !pose.error &&
          state.phase !== "results" &&
          state.phase !== "countdown" && (
            <div className="pointer-events-none absolute left-0 right-0 top-3 z-10 flex items-start justify-between gap-3 px-3">
              <ViewIndicator
                stepIndex={currentStepIndex}
                totalSteps={plan.length}
                view={state.currentView}
                mode={plan.length === 1 ? "quick" : "multi"}
              />
              {bodyVisibility && (
                <BodyVisibilityOverlay visibility={bodyVisibility} />
              )}
            </div>
          )}

        {/* Countdown between views */}
        {state.phase === "countdown" && (
          <CountdownOverlay
            secondsLeft={state.countdownSecs}
            nextView={state.currentView}
            onTick={() => dispatch({ type: "COUNTDOWN_TICK" })}
            onDone={() => dispatch({ type: "COUNTDOWN_DONE" })}
          />
        )}

        {/* Results */}
        {state.phase === "results" && finalResult && (
          <ResultsScreen
            result={finalResult}
            techniqueEnglish={technique.english}
            techniqueChinese={technique.chinese}
            onRetry={handleRetry}
            backHref={backHref}
          />
        )}

        {/* "Use last capture" option while awaiting a view we already have buffered */}
        {state.phase === "awaiting" &&
          bufferedForCurrent &&
          !state.captures[state.currentView] && (
            <div className="pointer-events-auto absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-card-sm border border-cyan/30 bg-[#080c1a]/90 px-3 py-2 backdrop-blur-md">
              <button
                onClick={() =>
                  dispatch({ type: "USE_BUFFERED", view: state.currentView })
                }
                className="text-xs text-cyan hover:underline"
              >
                Use last reading (score {bufferedForCurrent.score}) →
              </button>
            </div>
          )}

        {/* Arm position selector (first step, hand tracking on) */}
        {showArmSelector && (
          <div className="pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2">
            <ArmPositionSelector value={armPosition} onChange={setArmPosition} />
          </div>
        )}

        {/* Feedback panel */}
        {state.phase !== "results" && state.phase !== "countdown" && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 p-3 sm:p-4">
            <FeedbackPanel
              evaluation={liveEval}
              holdSeconds={3}
              onOfficial={handleOfficial}
            >
              {handsVisible && (
                <HandFeedbackRow
                  feedback={handFeedback}
                  paused={handsPaused}
                />
              )}
            </FeedbackPanel>
            <Disclaimer
              variant="compact"
              className="px-2"
              includeHands={handTrackingEnabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
