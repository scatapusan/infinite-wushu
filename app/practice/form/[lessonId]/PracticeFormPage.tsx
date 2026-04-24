"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  BodyVisibility,
  CameraView as CameraViewKind,
  ViewEvaluation,
} from "@/lib/pose/types";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { useHandDetection } from "@/lib/pose/use-hand-detection";
import { STANCE_CHECKS } from "@/lib/pose/stance-checks";
import { evaluateStanceFrame } from "@/lib/pose/pose-evaluator";
import { evaluateHands } from "@/lib/pose/hand-evaluator";
import { checkBodyVisibility } from "@/lib/pose/angle-utils";
import {
  isHandTrackingEnabled,
  showReferenceSkeleton,
  setShowReferenceSkeleton,
  showLegClassifierDebug,
} from "@/lib/preferences";
import {
  classifyVariant,
  legAssignmentFor,
  type StanceVariant,
} from "@/lib/pose/leg-resolver";
import { getReferenceSkeleton } from "@/lib/pose/reference-skeletons";
import { useTemporalBuffer } from "@/lib/pose/temporal-buffer";
import { getCorrections } from "@/lib/correction-messages";
import { useVoiceCommands } from "@/lib/voice-commands";
import {
  setTtsEnabled,
  setSfxEnabled,
  resetLastSpoken,
} from "@/lib/audio-feedback";
import {
  useFormFlow,
  MOVEMENT_COMPLETE_FLASH_MS,
  type SequencedMovement,
} from "@/lib/pose/form-flow-machine";
import {
  saveFormSession,
  type FormSession,
} from "@/lib/pose/form-session-storage";
import type { FormLessonMeta } from "@/lib/pose/form-lookup";
import CameraView from "@/components/practice/CameraView";
import CircularHoldTimer from "@/components/practice/CircularHoldTimer";
import CorrectionDisplay from "@/components/practice/CorrectionDisplay";
import SetupScreen from "@/components/practice/SetupScreen";
import FormIntroOverlay from "@/components/practice/FormIntroOverlay";
import FormTransitionOverlay from "@/components/practice/FormTransitionOverlay";
import FormCompleteScreen from "@/components/practice/FormCompleteScreen";
import FormMovementInfoCard from "@/components/practice/FormMovementInfoCard";
import FormPausedOverlay from "@/components/practice/FormPausedOverlay";
import FormExitConfirm from "@/components/practice/FormExitConfirm";
import LegClassifierDebugOverlay from "@/components/practice/LegClassifierDebugOverlay";
import PracticeExitButton from "@/components/practice/PracticeExitButton";

type Props = {
  meta: FormLessonMeta;
  movements: SequencedMovement[];
};

const MOVEMENT_TIMEOUT_MS = 60_000; // 60s → offer skip
const IDLE_TIMEOUT_MS = 120_000; // 120s no activity → pause

function safeBackHref(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch {
    /* fall through */
  }
  return fallback;
}

export default function PracticeFormPage({ meta, movements }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pose = usePoseDetection();

  const totalMovements = movements.length;
  const flow = useFormFlow(totalMovements);
  const { state, dispatch } = flow;

  const currentMovement = movements[state.currentMovementIndex];
  const nextMovement = movements[state.currentMovementIndex + 1] ?? null;
  const config = currentMovement?.stanceRef
    ? (STANCE_CHECKS[currentMovement.stanceRef] ?? null)
    : null;

  // ── Setup phase (before flow starts) ──────────────────────────────
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [ttsOn, setTtsOn] = useState(true);
  const [showRef, setShowRef] = useState(true);
  const [setupCameraView, setSetupCameraView] = useState<CameraViewKind>("front");
  const [variant, setVariant] = useState<StanceVariant>("left-forward");

  // ── Core evaluation state ─────────────────────────────────────────
  const [bodyVisibility, setBodyVisibility] = useState<BodyVisibility | null>(
    null,
  );
  const [liveEval, setLiveEval] = useState<ViewEvaluation | null>(null);
  const liveEvalRef = useRef<ViewEvaluation | null>(null);
  const [adjustCamera, setAdjustCamera] = useState(false);
  const [corrections, setCorrections] = useState<string[]>([]);
  const variantLockedRef = useRef(false);
  const movementStartedAtRef = useRef<number>(Date.now());
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lastPoseActivityRef = useRef<number>(Date.now());
  const [debugLegClassifier, setDebugLegClassifier] = useState(false);

  // ── Hand tracking ─────────────────────────────────────────────────
  const [handTrackingEnabled] = useState(() =>
    typeof window !== "undefined" ? isHandTrackingEnabled() : false,
  );
  const [handsPaused, setHandsPaused] = useState(false);
  const lowFpsSinceRef = useRef<number | null>(null);

  // ── Temporal buffer ───────────────────────────────────────────────
  const {
    status: bufferStatus,
    push: bufferPush,
    reset: bufferReset,
  } = useTemporalBuffer();

  // ── Gesture timing ────────────────────────────────────────────────
  const exitGestureRef = useRef(0);
  const scoreGestureRef = useRef(0);
  const backHrefRef = useRef("");

  // ── Exit gesture progress (0–1) for visual feedback ───────────────
  const [exitGestureProgress, setExitGestureProgress] = useState(0);
  const [exitGestureBoth, setExitGestureBoth] = useState(false);

  // Read prefs on mount
  useEffect(() => {
    setShowRef(showReferenceSkeleton());
    setDebugLegClassifier(showLegClassifierDebug());
  }, []);
  useEffect(() => {
    setSfxEnabled(audioEnabled);
  }, [audioEnabled]);
  useEffect(() => {
    setTtsEnabled(ttsOn);
  }, [ttsOn]);

  // ── Reset movement state on each movement change ───────────────────
  useEffect(() => {
    if (state.phase !== "practicing") return;
    liveEvalRef.current = null;
    setLiveEval(null);
    setAdjustCamera(false);
    setCorrections([]);
    bufferReset();
    variantLockedRef.current = false;
    movementStartedAtRef.current = Date.now();
    setShowSkipHint(false);
    resetLastSpoken();
  }, [state.phase, state.currentMovementIndex, bufferReset]);

  // ── FPS guardrail ──────────────────────────────────────────────────
  const handleHandFps = useCallback((fps: number) => {
    if (fps < 20) {
      const now = performance.now();
      if (lowFpsSinceRef.current === null) lowFpsSinceRef.current = now;
      else if (now - lowFpsSinceRef.current > 2000) setHandsPaused(true);
    } else {
      lowFpsSinceRef.current = null;
    }
  }, []);

  const hands = useHandDetection({
    videoRef: pose.videoRef,
    enabled:
      handTrackingEnabled && !handsPaused && state.phase === "practicing",
    onFps: handleHandFps,
  });

  // ── Helpers bound via refs (avoid stale closures in gesture callbacks) ──
  const doAbort = useCallback(() => {
    setShowExitConfirm(false);
    dispatch({ type: "ABORT" });
    router.push(backHrefRef.current);
  }, [dispatch, router]);
  const doAbortRef = useRef(doAbort);
  doAbortRef.current = doAbort;

  const requestExit = useCallback(() => {
    if (state.phase === "setup" || state.phase === "form-complete") {
      router.push(backHrefRef.current);
      return;
    }
    setShowExitConfirm(true);
  }, [router, state.phase]);
  const requestExitRef = useRef(requestExit);
  requestExitRef.current = requestExit;

  const skipCurrentMovement = useCallback(() => {
    if (state.phase !== "practicing" || !currentMovement) return;
    dispatch({
      type: "MOVEMENT_SKIPPED",
      movementId: currentMovement.id,
      reason: "user-skipped",
    });
  }, [dispatch, state.phase, currentMovement]);
  const skipRef = useRef(skipCurrentMovement);
  skipRef.current = skipCurrentMovement;

  const advanceNow = useCallback(() => {
    if (state.phase === "intro") {
      dispatch({ type: "INTRO_COUNTDOWN_DONE" });
    } else if (state.phase === "transition") {
      dispatch({ type: "TRANSITION_SKIP" });
    } else if (state.phase === "movement-complete" || state.phase === "movement-skipped") {
      dispatch({ type: "BEGIN_TRANSITION" });
    }
  }, [dispatch, state.phase]);
  const advanceNowRef = useRef(advanceNow);
  advanceNowRef.current = advanceNow;

  const forceScoreCapture = useCallback(() => {
    if (state.phase !== "practicing" || !currentMovement?.stanceRef) return;
    const ev = liveEvalRef.current;
    if (!ev) return;
    dispatch({
      type: "MOVEMENT_PASSED",
      movementId: currentMovement.id,
      score: ev.score,
      variant,
      perspective: setupCameraView,
    });
  }, [dispatch, state.phase, currentMovement, variant, setupCameraView]);
  const forceScoreRef = useRef(forceScoreCapture);
  forceScoreRef.current = forceScoreCapture;

  // ── Voice commands ────────────────────────────────────────────────
  useVoiceCommands({
    enabled:
      voiceEnabled &&
      state.phase !== "setup" &&
      state.phase !== "form-complete" &&
      state.phase !== "aborted",
    onCommand: (cmd) => {
      // Voice vocabulary: "score/done" → score now,
      // "switch/next" → advance past countdown or skip transition.
      // "exit/stop" → confirm-exit,
      // "repeat/retry" → restart from setup on form-complete (handled below).
      if (cmd === "score") forceScoreRef.current();
      if (cmd === "switch-view") advanceNowRef.current();
      if (cmd === "exit") requestExitRef.current();
      if (cmd === "repeat") {
        // "repeat" on form-complete isn't reached here; practicing "repeat" skips.
        skipRef.current();
      }
    },
  });

  // ── Tab blur → pause; refocus → resume ────────────────────────────
  useEffect(() => {
    function onVisChange() {
      if (document.hidden) dispatch({ type: "PAUSE" });
      else dispatch({ type: "RESUME" });
    }
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, [dispatch]);

  // ── Idle timeout (no pose activity for 2min → pause) ──────────────
  useEffect(() => {
    if (state.phase !== "practicing") return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastPoseActivityRef.current;
      if (elapsed > IDLE_TIMEOUT_MS) {
        dispatch({ type: "PAUSE" });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch, state.phase]);

  // ── 60s-in-movement → show skip hint ──────────────────────────────
  useEffect(() => {
    if (state.phase !== "practicing") return;
    const t = setTimeout(() => setShowSkipHint(true), MOVEMENT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [state.phase, state.currentMovementIndex]);

  // ── Main evaluation loop ──────────────────────────────────────────
  useEffect(() => {
    if (!pose.landmarks) return;
    lastPoseActivityRef.current = Date.now();

    const visibility = checkBodyVisibility(pose.landmarks);
    setBodyVisibility(visibility);

    // Gesture detection (run whenever pose is visible and flow is active)
    const lw = pose.landmarks[15];
    const rw = pose.landmarks[16];
    const ls = pose.landmarks[11];
    const rs = pose.landmarks[12];
    // Per-side visibility: single-arm gesture works even when one side is occluded
    const lwOk = (lw?.visibility ?? 0) > 0.5 && (ls?.visibility ?? 0) > 0.5;
    const rwOk = (rw?.visibility ?? 0) > 0.5 && (rs?.visibility ?? 0) > 0.5;
    const handsOk = lwOk && rwOk; // still required for arms-crossed (needs both)

    if (state.phase !== "setup" && state.phase !== "aborted") {
      const now = Date.now();
      // Either wrist above its shoulder → exit/advance gesture
      // Both arms: 1s threshold; one arm: 1.5s (avoids accidental triggers)
      const leftAbove = lwOk && lw.y < ls.y - 0.1;
      const rightAbove = rwOk && rw.y < rs.y - 0.1;
      const bothAbove = leftAbove && rightAbove;
      const eitherAbove = leftAbove || rightAbove;

      if (eitherAbove) {
        if (exitGestureRef.current === 0) exitGestureRef.current = now;
        const elapsed = now - exitGestureRef.current;
        const threshold = bothAbove ? 1000 : 1500;
        setExitGestureProgress(Math.min(elapsed / threshold, 1));
        setExitGestureBoth(bothAbove);
        if (elapsed >= threshold) {
          exitGestureRef.current = 0;
          setExitGestureProgress(0);
          if (state.phase === "intro" || state.phase === "transition") {
            advanceNowRef.current();
          } else {
            requestExitRef.current();
          }
          return;
        }
      } else {
        if (exitGestureRef.current !== 0) setExitGestureProgress(0);
        exitGestureRef.current = 0;
      }

      // Arms crossed → score / advance (needs both hands visible)
      if (handsOk) {
        const armsCrossed = lw.x > rw.x;
        if (armsCrossed) {
          if (scoreGestureRef.current === 0) scoreGestureRef.current = now;
          else if (now - scoreGestureRef.current >= 1000) {
            scoreGestureRef.current = 0;
            if (state.phase === "practicing" && currentMovement?.stanceRef) {
              forceScoreRef.current();
            } else if (
              state.phase === "intro" ||
              state.phase === "transition" ||
              state.phase === "movement-complete" ||
              state.phase === "movement-skipped"
            ) {
              advanceNowRef.current();
            }
          }
        } else {
          scoreGestureRef.current = 0;
        }
      }
    }

    // Stance evaluation only during scored practicing
    if (state.phase !== "practicing" || !config) {
      setLiveEval(null);
      liveEvalRef.current = null;
      setAdjustCamera(false);
      setCorrections([]);
      return;
    }

    if (!visibility.ready) {
      setLiveEval(null);
      liveEvalRef.current = null;
      setAdjustCamera(false);
      setCorrections([]);
      bufferReset();
      variantLockedRef.current = false;
      return;
    }

    // Variant lock for asymmetric stances
    if (!variantLockedRef.current && currentMovement?.stanceRef) {
      const detected = classifyVariant(pose.landmarks, currentMovement.stanceRef);
      if (detected) {
        setVariant(detected);
        variantLockedRef.current = true;
      }
    }

    const assignment = legAssignmentFor(variant);
    const handsActive = handTrackingEnabled && !handsPaused && hands.ready;
    const hf = handsActive
      ? evaluateHands(pose.landmarks, hands.left, hands.right, "waist")
      : null;

    const frame = evaluateStanceFrame(
      pose.landmarks,
      config,
      setupCameraView,
      assignment,
      hf?.checks ?? [],
    );
    const ev = frame.view;
    setLiveEval(ev);
    liveEvalRef.current = ev;

    if (frame.gates.anyNotVisible) {
      setAdjustCamera(true);
      setCorrections([]);
      bufferReset();
    } else {
      setAdjustCamera(false);
      const failingIds = frame.gates.results
        .filter((r) => r.status === "fail")
        .map((r) => r.id);
      setCorrections(getCorrections(failingIds));
      bufferPush(frame.gates.allPass);
    }
  }, [
    pose.landmarks,
    config,
    state.phase,
    handTrackingEnabled,
    handsPaused,
    hands.ready,
    hands.left,
    hands.right,
    bufferPush,
    bufferReset,
    variant,
    currentMovement,
    setupCameraView,
  ]);

  // ── On 2s hold → score and capture ─────────────────────────────────
  useEffect(() => {
    if (state.phase !== "practicing") return;
    if (!currentMovement?.stanceRef) return;
    if (!bufferStatus.allPass) return;
    const ev = liveEvalRef.current;
    if (!ev) return;
    // Small debounce: ensure buffer was just filled (edge transition)
    dispatch({
      type: "MOVEMENT_PASSED",
      movementId: currentMovement.id,
      score: ev.score,
      variant,
      perspective: setupCameraView,
    });
  }, [
    bufferStatus.allPass,
    state.phase,
    currentMovement,
    dispatch,
    variant,
    setupCameraView,
  ]);

  // ── Auto-advance for non-scored movements after 5s ─────────────────
  useEffect(() => {
    if (state.phase !== "practicing") return;
    if (!currentMovement) return;
    if (currentMovement.stanceRef) return; // scored handled above
    const t = setTimeout(() => {
      dispatch({
        type: "MOVEMENT_SKIPPED",
        movementId: currentMovement.id,
        reason: "non-scored",
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [state.phase, currentMovement, dispatch]);

  // ── After movement-complete / skipped flash → begin transition ─────
  useEffect(() => {
    if (state.phase !== "movement-complete" && state.phase !== "movement-skipped") {
      return;
    }
    const t = setTimeout(() => {
      dispatch({ type: "BEGIN_TRANSITION" });
    }, MOVEMENT_COMPLETE_FLASH_MS);
    return () => clearTimeout(t);
  }, [state.phase, dispatch]);

  // ── Save session on form-complete ──────────────────────────────────
  useEffect(() => {
    if (state.phase !== "form-complete") return;
    if (!state.sessionStartedAt) return;
    const session: FormSession = {
      id: `${meta.lessonId}-${state.sessionStartedAt}`,
      lessonId: meta.lessonId,
      startedAt: state.sessionStartedAt,
      completedAt: Date.now(),
      totalScore: state.totalScore ?? 0,
      movementResults: state.movementResults,
    };
    saveFormSession(session);
  }, [state.phase, state.sessionStartedAt, state.totalScore, state.movementResults, meta.lessonId]);

  const activeReference = useMemo(() => {
    if (!showRef || !config || !currentMovement?.stanceRef) return null;
    return getReferenceSkeleton(currentMovement.stanceRef, variant);
  }, [showRef, config, currentMovement, variant]);

  const mirrored = pose.facingMode === "user";
  const backHref = safeBackHref(
    searchParams?.get("from") ?? null,
    `/demo/learn/five-stance-form/${meta.lessonId}`,
  );
  backHrefRef.current = backHref;

  const score = liveEval?.score ?? 0;
  const isAsymmetric = currentMovement?.stanceRef
    ? currentMovement.stanceRef !== "horse-stance"
    : false;

  function handleRestart() {
    flow.reset();
    bufferReset();
    variantLockedRef.current = false;
    setLiveEval(null);
    liveEvalRef.current = null;
    setAdjustCamera(false);
    setCorrections([]);
    resetLastSpoken();
  }

  // ─── SETUP PHASE ───────────────────────────────────────────────────
  if (state.phase === "setup") {
    return (
      <>
        <div className="fixed inset-0 bg-[#050B1A]">
          <CameraView
            videoRef={pose.videoRef}
            canvasRef={pose.canvasRef}
            landmarks={pose.landmarks}
            mirrored={mirrored}
            checks={null}
            config={null}
            view="front"
            referenceSkeleton={null}
          />
        </div>
        <SetupScreen
          techniqueName={meta.english}
          techniqueNameChinese={meta.chinese}
          landmarks={pose.landmarks}
          isAsymmetric={true}
          initialConfig={{
            voiceEnabled: true,
            audioEnabled: true,
            ttsEnabled: true,
            showRef,
            dominantHand: "right",
            variant: "left-forward",
            cameraView: "front",
          }}
          onStart={(cfg) => {
            setVoiceEnabled(cfg.voiceEnabled);
            setAudioEnabled(cfg.audioEnabled);
            setTtsOn(cfg.ttsEnabled);
            setShowRef(cfg.showRef);
            setShowReferenceSkeleton(cfg.showRef);
            setSetupCameraView(cfg.cameraView);
            setVariant(cfg.variant);
            variantLockedRef.current = true;
            flow.start();
          }}
          onBack={() => router.push(backHref)}
        />
      </>
    );
  }

  // ─── FORM-COMPLETE PHASE ───────────────────────────────────────────
  if (state.phase === "form-complete") {
    return (
      <FormCompleteScreen
        meta={meta}
        movements={movements}
        results={state.movementResults}
        totalScore={state.totalScore ?? 0}
        durationSeconds={
          state.sessionStartedAt
            ? Math.round((Date.now() - state.sessionStartedAt) / 1000)
            : 0
        }
        onRestart={handleRestart}
        backHref={backHref}
      />
    );
  }

  // ─── ACTIVE PRACTICE VIEW ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#050B1A]">
      {/* Loading state */}
      {pose.isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#050B1A]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00D4FF] border-t-transparent" />
          <p className="font-bold text-white/60" style={{ fontSize: "1.75rem" }}>
            Loading…
          </p>
        </div>
      )}

      {/* Camera + skeleton */}
      <CameraView
        videoRef={pose.videoRef}
        canvasRef={pose.canvasRef}
        landmarks={pose.landmarks}
        mirrored={mirrored}
        checks={liveEval?.checks ?? null}
        config={config}
        view={setupCameraView}
        referenceSkeleton={activeReference}
      />

      {/* Dev-only leg classifier overlay */}
      {debugLegClassifier && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm">
          <LegClassifierDebugOverlay
            landmarks={pose.landmarks}
            stanceId={currentMovement?.stanceRef ?? null}
          />
        </div>
      )}

      {/* TOP BAR — progress + movement name (only during practicing) */}
      {state.phase === "practicing" && currentMovement && (
        <div className="absolute left-0 right-0 top-0 z-10 px-4 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p
              className="font-black uppercase tracking-widest text-white/70"
              style={{ fontSize: "2.5rem", lineHeight: 1 }}
            >
              MOVEMENT {state.currentMovementIndex + 1} OF {totalMovements}
            </p>
            <PracticeExitButton onExit={() => requestExitRef.current()} />
          </div>
          {/* Mini progress bar */}
          <div className="flex gap-1">
            {movements.map((m, i) => {
              const done = state.movementResults[i];
              const isCurrent = i === state.currentMovementIndex;
              return (
                <div
                  key={m.id}
                  className="h-3 flex-1 rounded-full"
                  style={{
                    background: isCurrent
                      ? "#00D4FF"
                      : done?.scored
                        ? "#00FF88"
                        : done
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(255,255,255,0.08)",
                  }}
                />
              );
            })}
          </div>
          {/* Movement title */}
          <div className="flex items-baseline gap-3 pt-1">
            <p
              className="font-bold font-chinese text-[#FFD700] leading-none"
              style={{ fontSize: "4.5rem" }}
            >
              {currentMovement.chinese}
            </p>
            <div className="flex flex-col min-w-0">
              <p
                className="font-bold text-white/80 leading-none truncate"
                style={{ fontSize: "2rem" }}
              >
                {currentMovement.english.toUpperCase()}
              </p>
              <p
                className="italic text-white/50 leading-none truncate"
                style={{ fontSize: "1.5rem" }}
              >
                {currentMovement.pinyin}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Non-scored info card */}
      {state.phase === "practicing" &&
        currentMovement &&
        !currentMovement.stanceRef && (
          <FormMovementInfoCard
            movement={currentMovement}
            onContinue={() =>
              dispatch({
                type: "MOVEMENT_SKIPPED",
                movementId: currentMovement.id,
                reason: "non-scored",
              })
            }
          />
        )}

      {/* Correction text (scored) */}
      {state.phase === "practicing" && currentMovement?.stanceRef && (
        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 pointer-events-none">
          {adjustCamera ? (
            <div className="flex items-center justify-center px-4">
              <span
                className="text-center font-black uppercase tracking-wider"
                style={{
                  fontSize: "3.5rem",
                  color: "#FFD700",
                  textShadow: "0 2px 24px rgba(255,215,0,0.5)",
                }}
              >
                ADJUST CAMERA
              </span>
            </div>
          ) : corrections.length > 0 && !bufferStatus.allPass ? (
            <CorrectionDisplay corrections={corrections} ttsEnabled={ttsOn} />
          ) : bufferStatus.allPass ? (
            <div className="flex items-center justify-center">
              <span
                className="font-black uppercase tracking-wider text-center"
                style={{
                  fontSize: "3.5rem",
                  color: "#00FF88",
                  textShadow: "0 0 30px rgba(0,255,136,0.6)",
                }}
              >
                HOLD IT!
              </span>
            </div>
          ) : !liveEval ? (
            <div className="flex items-center justify-center">
              <span
                className="font-bold text-white/40 text-center"
                style={{ fontSize: "2.5rem" }}
              >
                STEP INTO FRAME
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Hold timer + bottom info (scored) */}
      {state.phase === "practicing" && currentMovement?.stanceRef && (
        <div className="absolute bottom-6 inset-x-0 z-10 flex flex-col items-center gap-3">
          <CircularHoldTimer
            holding={bufferStatus.allPass}
            target={2}
            score={score}
            onOfficial={() => forceScoreRef.current()}
          />
          {nextMovement && (
            <p
              className="font-semibold text-white/40 text-center"
              style={{ fontSize: "1.75rem" }}
            >
              NEXT:{" "}
              <span className="font-chinese text-white/60">
                {nextMovement.chinese}
              </span>{" "}
              · {nextMovement.english}
            </p>
          )}
          {showSkipHint && (
            <button
              onClick={() => skipRef.current()}
              className="rounded-2xl border border-[#FFD700]/40 bg-[#FFD700]/10 px-5 py-2 font-bold text-[#FFD700] active:scale-95"
              style={{ fontSize: "1.75rem" }}
            >
              Skip this movement?
            </button>
          )}
        </div>
      )}

      {/* Exit gesture progress — shown whenever the raise-arm gesture is active */}
      {exitGestureProgress >= 0.01 && (
        <div className="absolute bottom-36 inset-x-0 z-20 flex flex-col items-center gap-1.5 pointer-events-none px-8">
          <div
            className="w-full max-w-sm overflow-hidden rounded-full bg-white/10"
            style={{ height: "6px" }}
          >
            <div
              className="h-full rounded-full bg-[#00D4FF]"
              style={{ width: `${exitGestureProgress * 100}%` }}
            />
          </div>
          <p className="font-bold text-[#00D4FF] text-center" style={{ fontSize: "1.75rem" }}>
            ✋ Hold…{" "}
            {(exitGestureProgress * (exitGestureBoth ? 1.0 : 1.5)).toFixed(1)}s
            {" "}/ {exitGestureBoth ? "1.0s" : "1.5s"}
          </p>
        </div>
      )}

      {/* INTRO overlay */}
      {state.phase === "intro" && currentMovement && (
        <FormIntroOverlay
          meta={meta}
          firstMovement={currentMovement}
          secondsLeft={state.countdownSecs}
          onTick={() => dispatch({ type: "INTRO_COUNTDOWN_TICK" })}
          onSkip={() => dispatch({ type: "INTRO_COUNTDOWN_DONE" })}
          onExit={() => requestExitRef.current()}
        />
      )}

      {/* MOVEMENT COMPLETE flash */}
      {state.phase === "movement-complete" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-md">
          <p
            className="font-black uppercase tracking-widest"
            style={{
              fontSize: "6rem",
              color: "#00FF88",
              textShadow: "0 0 40px rgba(0,255,136,0.8)",
            }}
          >
            ✓ COMPLETE
          </p>
          {state.movementResults[state.movementResults.length - 1]?.score !==
            undefined && (
            <p
              className="font-black text-white"
              style={{ fontSize: "3.5rem" }}
            >
              {state.movementResults[state.movementResults.length - 1]?.score}
            </p>
          )}
        </div>
      )}

      {/* MOVEMENT SKIPPED flash */}
      {state.phase === "movement-skipped" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-md">
          <p
            className="font-black uppercase tracking-widest text-white/60"
            style={{ fontSize: "3.5rem" }}
          >
            → SKIPPED
          </p>
        </div>
      )}

      {/* TRANSITION overlay */}
      {state.phase === "transition" && currentMovement && (
        <FormTransitionOverlay
          nextMovement={currentMovement}
          secondsLeft={state.countdownSecs}
          totalSeconds={3}
          onTick={() => dispatch({ type: "TRANSITION_TICK" })}
          onSkip={() => dispatch({ type: "TRANSITION_SKIP" })}
        />
      )}

      {/* PAUSED overlay */}
      {state.phase === "paused" && (
        <FormPausedOverlay
          onResume={() => dispatch({ type: "RESUME" })}
          onExit={() => requestExitRef.current()}
        />
      )}

      {/* Exit confirmation */}
      {showExitConfirm && (
        <FormExitConfirm
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => doAbortRef.current()}
        />
      )}
    </div>
  );
}
