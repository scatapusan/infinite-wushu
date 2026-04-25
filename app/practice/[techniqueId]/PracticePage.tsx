"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Technique } from "@/lib/types";
import type {
  BodyVisibility,
  CameraView as CameraViewKind,
  ViewEvaluation,
  CombinedEvaluation,
} from "@/lib/pose/types";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { useHandDetection } from "@/lib/pose/use-hand-detection";
import { resolveStanceCheck } from "@/lib/pose/technique-lookup";
import { evaluateStanceFrame, combineViews } from "@/lib/pose/pose-evaluator";
import { evaluateHands } from "@/lib/pose/hand-evaluator";
import { checkBodyVisibility } from "@/lib/pose/angle-utils";
import { savePracticeAttempt } from "@/lib/pose/practice-storage";
import {
  isQuickMode,
  isHandTrackingEnabled,
  showReferenceSkeleton,
  setShowReferenceSkeleton,
  showLegClassifierDebug,
} from "@/lib/preferences";
import {
  useFlowReducer,
} from "@/lib/pose/view-state-machine";
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
import CameraView from "@/components/practice/CameraView";
import CountdownOverlay from "@/components/practice/CountdownOverlay";
import ResultsScreen from "@/components/practice/ResultsScreen";
import CircularHoldTimer from "@/components/practice/CircularHoldTimer";
import CorrectionDisplay from "@/components/practice/CorrectionDisplay";
import SetupScreen from "@/components/practice/SetupScreen";
import LegClassifierDebugOverlay from "@/components/practice/LegClassifierDebugOverlay";
import PracticeExitButton from "@/components/practice/PracticeExitButton";

type Props = {
  technique: Technique;
  lessonId: string;
};

function safeBackHref(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch { /* fall through */ }
  return fallback;
}

export default function PracticePage({ technique, lessonId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pose = usePoseDetection();
  const { config, scoringId } = resolveStanceCheck(technique.id);

  // ── Setup phase ─────────────────────────────────────────────────
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [ttsOn, setTtsOn] = useState(true);
  const [setupCameraView, setSetupCameraView] = useState<CameraViewKind>(
    () => config?.primaryView ?? "front",
  );

  // ── Core evaluation state ────────────────────────────────────────
  const [bodyVisibility, setBodyVisibility] = useState<BodyVisibility | null>(null);
  const [liveEval, setLiveEval] = useState<ViewEvaluation | null>(null);
  const liveEvalRef = useRef<ViewEvaluation | null>(null);
  const startTimeRef = useRef(Date.now());
  const bestScoreRef = useRef(0);
  const [adjustCamera, setAdjustCamera] = useState(false);
  const [corrections, setCorrections] = useState<string[]>([]);

  // ── Reference skeleton ───────────────────────────────────────────
  const [showRef, setShowRef] = useState(true);
  const [variant, setVariant] = useState<StanceVariant>("left-forward");
  const variantLockedRef = useRef(false);

  // ── Hand tracking ────────────────────────────────────────────────
  const [handTrackingEnabled] = useState(() =>
    typeof window !== "undefined" ? isHandTrackingEnabled() : false,
  );
  const [handsPaused, setHandsPaused] = useState(false);
  const lowFpsSinceRef = useRef<number | null>(null);

  // ── Temporal buffer (gates → hold timer) ─────────────────────────
  const { status: bufferStatus, push: bufferPush, reset: bufferReset } =
    useTemporalBuffer();

  // ── Gesture timing ───────────────────────────────────────────────
  const exitGestureRef = useRef(0);
  const switchGestureRef = useRef(0);
  const backHrefRef = useRef("");

  // ── Exit gesture progress (0–1) for visual feedback ──────────────
  const [exitGestureProgress, setExitGestureProgress] = useState(0);
  const [exitGestureBoth, setExitGestureBoth] = useState(false);

  const plan = useMemo<CameraViewKind[]>(() => {
    if (!config) return ["front"];
    const first = setupCameraView;
    const second: CameraViewKind = first === "front" ? "side" : "front";
    const quickMode =
      typeof window !== "undefined" ? isQuickMode() : false;
    return quickMode ? [first] : [first, second];
  }, [config, setupCameraView]);

  const { state, dispatch, reset } = useFlowReducer(plan);

  const [debugLegClassifier, setDebugLegClassifier] = useState(false);
  // Read prefs on mount
  useEffect(() => {
    setShowRef(showReferenceSkeleton());
    setDebugLegClassifier(showLegClassifierDebug());
  }, []);
  useEffect(() => { reset(plan); }, [plan, reset]);

  // Sync audio prefs
  useEffect(() => { setSfxEnabled(audioEnabled); }, [audioEnabled]);
  useEffect(() => { setTtsEnabled(ttsOn); }, [ttsOn]);

  // FPS guardrail
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
    enabled: handTrackingEnabled && !handsPaused && practiceStarted,
    onFps: handleHandFps,
  });

  // ── Force-capture (voice / gesture trigger) ──────────────────────
  const forceCapture = useCallback(() => {
    const ev = liveEvalRef.current;
    if (!ev) return;
    if (state.phase === "holding" || state.phase === "awaiting") {
      dispatch({ type: "CAPTURE", view: state.currentView, evaluation: ev });
    }
  }, [dispatch, state.phase, state.currentView]);

  const forceCaptureRef = useRef(forceCapture);
  forceCaptureRef.current = forceCapture;

  // ── Voice commands ───────────────────────────────────────────────
  useVoiceCommands({
    enabled: practiceStarted && voiceEnabled,
    onCommand: (cmd) => {
      if (cmd === "score" || cmd === "switch-view") forceCaptureRef.current();
      if (cmd === "repeat") handleRetryRef.current();
      if (cmd === "exit") router.push(backHrefRef.current);
    },
  });

  // ── Body-visibility & live evaluation + gesture detection ─────────
  useEffect(() => {
    if (!pose.landmarks) return;
    const visibility = checkBodyVisibility(pose.landmarks);
    setBodyVisibility(visibility);

    if (!visibility.ready) {
      dispatch({ type: "BODY_LOST" });
      setLiveEval(null);
      liveEvalRef.current = null;
      setAdjustCamera(false);
      setCorrections([]);
      bufferReset();
      variantLockedRef.current = false;
      exitGestureRef.current = 0;
      switchGestureRef.current = 0;
      return;
    }

    dispatch({ type: "BODY_READY" });

    // ── Gesture detection (runs even before practice starts for setup) ──
    const lw = pose.landmarks[15];
    const rw = pose.landmarks[16];
    const ls = pose.landmarks[11];
    const rs = pose.landmarks[12];
    // Per-side visibility: single-arm gesture works even when one side is occluded
    const lwOk = (lw?.visibility ?? 0) > 0.5 && (ls?.visibility ?? 0) > 0.5;
    const rwOk = (rw?.visibility ?? 0) > 0.5 && (rs?.visibility ?? 0) > 0.5;
    const handsOk = lwOk && rwOk; // still required for arms-crossed (needs both)

    if (practiceStarted) {
      const now = Date.now();
      // Either wrist above its shoulder → exit gesture
      // Both arms: 1s threshold (clear intent); one arm: 1.5s (avoids accidental)
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
          router.push(backHrefRef.current);
          return;
        }
      } else {
        if (exitGestureRef.current !== 0) setExitGestureProgress(0);
        exitGestureRef.current = 0;
      }

      // Arms crossed → capture/score (needs both hands visible)
      if (handsOk) {
        const armsCrossed = lw.x > rw.x;
        if (armsCrossed) {
          if (switchGestureRef.current === 0) switchGestureRef.current = now;
          else if (now - switchGestureRef.current >= 1000) {
            switchGestureRef.current = 0;
            forceCaptureRef.current();
          }
        } else {
          switchGestureRef.current = 0;
        }
      }
    }

    if (!config || !practiceStarted) return;
    if (state.phase !== "holding" && state.phase !== "awaiting") return;

    // Variant lock
    if (!variantLockedRef.current) {
      const detected = classifyVariant(pose.landmarks, scoringId);
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
      state.currentView,
      assignment,
      hf?.checks ?? [],
    );
    const ev = frame.view;
    setLiveEval(ev);
    liveEvalRef.current = ev;
    if (ev.score > bestScoreRef.current) bestScoreRef.current = ev.score;

    if (frame.gates.anyNotVisible) {
      setAdjustCamera(true);
      setCorrections([]);
      bufferReset();
    } else {
      setAdjustCamera(false);
      const failingGateIds = frame.gates.results
        .filter((r) => r.status === "fail")
        .map((r) => r.id);
      setCorrections(getCorrections(failingGateIds));
      bufferPush(frame.gates.allPass);
    }

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
    bufferPush,
    bufferReset,
    variant,
    scoringId,
    practiceStarted,
    router,
  ]);

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
      scoringId,
      state.captures.front,
      state.captures.side,
      mode,
    );
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (duration < 10) return;
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
  }, [state.phase, state.captures, plan.length, technique.id, scoringId]);

  const finalResult: CombinedEvaluation | null = useMemo(() => {
    if (state.phase !== "results") return null;
    const mode: "quick" | "multi" = plan.length === 1 ? "quick" : "multi";
    return combineViews(
      scoringId,
      state.captures.front,
      state.captures.side,
      mode,
    );
  }, [state.phase, state.captures, plan.length, scoringId]);

  const activeReference = useMemo(() => {
    if (!showRef || !config) return null;
    if (state.currentView !== config.primaryView) return null;
    return getReferenceSkeleton(scoringId, variant);
  }, [showRef, config, state.currentView, scoringId, variant]);

  const isAsymmetric = scoringId !== "horse-stance";

  function handleRetry() {
    bestScoreRef.current = 0;
    startTimeRef.current = Date.now();
    liveEvalRef.current = null;
    setLiveEval(null);
    setHandsPaused(false);
    lowFpsSinceRef.current = null;
    bufferReset();
    variantLockedRef.current = false;
    setAdjustCamera(false);
    setCorrections([]);
    resetLastSpoken();
    reset(plan);
  }
  const handleRetryRef = useRef(handleRetry);
  handleRetryRef.current = handleRetry;

  const mirrored = pose.facingMode === "user";
  const backHref = safeBackHref(
    searchParams?.get("from") ?? null,
    `/demo/learn/stances/${lessonId}`,
  );
  backHrefRef.current = backHref;

  const currentStepIndex = plan.indexOf(state.currentView);
  const score = liveEval?.score ?? 0;

  // ── Setup screen (shown before practice starts) ───────────────────
  if (!practiceStarted) {
    return (
      <>
        {/* Camera runs in bg for distance check (hidden behind setup overlay) */}
        <div className="fixed inset-0 bg-[#050B1A]">
          <CameraView
            videoRef={pose.videoRef}
            canvasRef={pose.canvasRef}
            landmarks={pose.landmarks}
            mirrored={mirrored}
            checks={null}
            config={config}
            view="front"
            referenceSkeleton={null}
          />
        </div>
        <SetupScreen
          techniqueName={technique.english}
          techniqueNameChinese={technique.chinese}
          landmarks={pose.landmarks}
          isAsymmetric={isAsymmetric}
          initialConfig={{
            voiceEnabled: true,
            audioEnabled: true,
            ttsEnabled: true,
            showRef: showRef,
            dominantHand: "right",
            variant: "left-forward",
            cameraView: config?.primaryView ?? "front",
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
            startTimeRef.current = Date.now();
            setPracticeStarted(true);
          }}
          onBack={() => router.push(backHref)}
        />
      </>
    );
  }

  // ── Practice view ────────────────────────────────────────────────
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

      {/* Camera error state */}
      {pose.error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-[#050B1A] px-6 text-center">
          <p className="font-bold text-[#FF3355]" style={{ fontSize: "2.5rem" }}>
            Camera Error
          </p>
          <p className="font-semibold text-white/70" style={{ fontSize: "1.75rem" }}>
            Enable camera access in your browser settings, then reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-[#00FF88] px-8 font-black text-black active:scale-95"
            style={{ fontSize: "2.5rem", padding: "1rem 2rem" }}
          >
            Reload
          </button>
        </div>
      )}

      {/* Camera + skeleton overlay */}
      <CameraView
        videoRef={pose.videoRef}
        canvasRef={pose.canvasRef}
        landmarks={pose.landmarks}
        mirrored={mirrored}
        checks={liveEval?.checks ?? null}
        config={config}
        view={state.currentView}
        referenceSkeleton={activeReference}
      />

      {/* Dev-only leg classifier overlay */}
      {debugLegClassifier && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm">
          <LegClassifierDebugOverlay
            landmarks={pose.landmarks}
            stanceId={technique.id}
          />
        </div>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      {state.phase !== "results" && state.phase !== "countdown" && (
        <div className="absolute left-0 right-0 top-0 z-10 flex items-start gap-4 px-4 pt-4">
          {/* Stance name */}
          <div className="flex-1 min-w-0">
            <p
              className="font-black text-white leading-none truncate"
              style={{ fontSize: "3.5rem" }}
            >
              {technique.english.toUpperCase()}
            </p>
            <p
              className="font-bold text-[#FFD700] font-chinese leading-none"
              style={{ fontSize: "2.5rem" }}
            >
              {technique.chinese}
            </p>
          </div>

          {/* Perspective + step indicator */}
          <div className="flex-shrink-0 text-right">
            <p
              className="font-black uppercase tracking-wider text-[#00D4FF] leading-none"
              style={{ fontSize: "2.5rem" }}
            >
              {state.currentView === "front" ? "FRONT" : "SIDE"}
            </p>
            {plan.length > 1 && (
              <p
                className="font-bold text-white/50 leading-none"
                style={{ fontSize: "1.75rem" }}
              >
                {currentStepIndex + 1} / {plan.length}
              </p>
            )}
          </div>

          {/* Exit + camera controls (top-right column) */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <PracticeExitButton onExit={() => router.push(backHrefRef.current)} />
            <button
              onClick={pose.toggleCamera}
              className="h-14 w-14 rounded-2xl border border-white/20 bg-black/50 flex items-center justify-center text-white/70 active:scale-95"
              aria-label="Switch camera"
              style={{ fontSize: "1.5rem" }}
            >
              ⇄
            </button>
            <button
              onClick={() => {
                setShowRef((p) => { setShowReferenceSkeleton(!p); return !p; });
              }}
              className="h-14 w-14 rounded-2xl border border-white/20 bg-black/50 flex items-center justify-center active:scale-95"
              aria-label={showRef ? "Hide reference" : "Show reference"}
              style={{ fontSize: "1.5rem", color: showRef ? "#00D4FF" : "rgba(255,255,255,0.4)" }}
            >
              👻
            </button>
            {isAsymmetric && showRef && (
              <button
                onClick={() => {
                  setVariant((p) => p === "left-forward" ? "right-forward" : "left-forward");
                  variantLockedRef.current = true;
                }}
                className="h-14 w-14 rounded-2xl border border-white/20 bg-black/50 flex items-center justify-center text-white/60 active:scale-95"
                aria-label="Flip reference stance"
                style={{ fontSize: "1.5rem" }}
              >
                ↔
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CORRECTION TEXT (center of screen) ───────────────────── */}
      {state.phase !== "results" && state.phase !== "countdown" && (
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
            <CorrectionDisplay
              corrections={corrections}
              ttsEnabled={ttsOn}
            />
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

      {/* ── CIRCULAR HOLD TIMER (bottom center) ──────────────────── */}
      {state.phase !== "results" && state.phase !== "countdown" && (
        <div className="absolute bottom-6 inset-x-0 z-10 flex flex-col items-center gap-3">
          <CircularHoldTimer
            holding={bufferStatus.allPass}
            target={2}
            score={score}
            onOfficial={handleOfficial}
          />
          {/* Mic indicator */}
          {voiceEnabled && (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full animate-pulse"
                style={{ background: "#00D4FF" }}
              />
              <span
                className="font-semibold text-white/50"
                style={{ fontSize: "1.75rem" }}
              >
                Listening
              </span>
            </div>
          )}
          {/* Exit gesture progress / idle hint */}
          {exitGestureProgress >= 0.01 ? (
            <div className="flex flex-col items-center gap-1.5 w-full max-w-xs px-6">
              <div
                className="w-full overflow-hidden rounded-full bg-white/10"
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
          ) : (
            <p
              className="font-semibold text-white/30 text-center px-4"
              style={{ fontSize: "1.75rem" }}
            >
              ✋ Raise arm 1.5s = exit · ✖ Cross arms 1s = score
            </p>
          )}
        </div>
      )}

      {/* ── COUNTDOWN OVERLAY ────────────────────────────────────── */}
      {state.phase === "countdown" && (
        <CountdownOverlay
          secondsLeft={state.countdownSecs}
          nextView={state.currentView}
          onTick={() => dispatch({ type: "COUNTDOWN_TICK" })}
          onDone={() => dispatch({ type: "COUNTDOWN_DONE" })}
        />
      )}

      {/* ── RESULTS ──────────────────────────────────────────────── */}
      {state.phase === "results" && finalResult && (
        <ResultsScreen
          result={finalResult}
          techniqueEnglish={technique.english}
          techniqueChinese={technique.chinese}
          onRetry={handleRetry}
          backHref={backHref}
        />
      )}
    </div>
  );
}
