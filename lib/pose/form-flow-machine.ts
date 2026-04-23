"use client";

import { useReducer, useCallback } from "react";
import type { CameraView } from "./types";
import type { StanceVariant } from "./leg-resolver";
import type { AttributionLevel } from "@/lib/types";

/**
 * Phases of a guided form carousel:
 *
 *   setup:              Pre-practice setup screen (reuses SetupScreen).
 *   intro:              Form intro + first movement preview with 3s countdown.
 *   practicing:         Current movement is active; scored or info-card.
 *   movement-complete:  Brief celebration flash after a scored movement passed.
 *   movement-skipped:   Brief flash after a non-scored or skipped movement.
 *   transition:         3s countdown to the next movement.
 *   form-complete:      All movements done; show breakdown + total score.
 *   paused:             Frozen mid-form (tab blur, voice "pause").
 *   aborted:            User exited mid-form — do NOT save session.
 */
export type FormPhase =
  | "setup"
  | "intro"
  | "practicing"
  | "movement-complete"
  | "movement-skipped"
  | "transition"
  | "form-complete"
  | "paused"
  | "aborted";

export type MovementResult = {
  movementId: string;
  movementSequence: number;
  /** True when a stance_ref was present and score was captured. */
  scored: boolean;
  score?: number;
  /** True when the user chose to skip, false when auto-advanced via "continue". */
  skipped: boolean;
  variant?: StanceVariant;
  perspective?: CameraView;
};

export type FormFlowState = {
  phase: FormPhase;
  /** Index into the sequenced movements list (0-based). */
  currentMovementIndex: number;
  movementResults: MovementResult[];
  /** Timestamp ms when the session started. Null until `START` fires. */
  sessionStartedAt: number | null;
  /** Average score of scored movements; null until form-complete. */
  totalScore: number | null;
  /** Seconds remaining on transition/intro countdown. */
  countdownSecs: number;
  /** Phase to restore from when resuming from a pause. */
  pausedReturnPhase: FormPhase | null;
};

export type FormFlowAction =
  | { type: "START"; startedAt: number }
  | { type: "INTRO_COUNTDOWN_TICK" }
  | { type: "INTRO_COUNTDOWN_DONE" }
  | {
      type: "MOVEMENT_PASSED";
      movementId: string;
      score: number;
      variant?: StanceVariant;
      perspective?: CameraView;
    }
  | {
      type: "MOVEMENT_SKIPPED";
      movementId: string;
      reason: "non-scored" | "user-skipped" | "timeout";
    }
  | { type: "BEGIN_TRANSITION" }
  | { type: "TRANSITION_TICK" }
  | { type: "TRANSITION_SKIP" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ABORT" }
  | { type: "RESET" };

export const INTRO_COUNTDOWN_SECONDS = 3;
export const TRANSITION_COUNTDOWN_SECONDS = 3;
export const MOVEMENT_COMPLETE_FLASH_MS = 1500;

export type SequencedMovement = {
  id: string;
  sequence: number;
  english: string;
  chinese: string;
  pinyin: string;
  description: string | null;
  keyPoints: string[];
  stanceRef: string | null;
  source?: string | null;
  attribution?: AttributionLevel | null;
};

export function initialFormFlowState(): FormFlowState {
  return {
    phase: "setup",
    currentMovementIndex: 0,
    movementResults: [],
    sessionStartedAt: null,
    totalScore: null,
    countdownSecs: INTRO_COUNTDOWN_SECONDS,
    pausedReturnPhase: null,
  };
}

function computeTotalScore(results: MovementResult[]): number {
  const scored = results.filter((r) => r.scored && typeof r.score === "number");
  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, r) => acc + (r.score ?? 0), 0);
  return Math.round(sum / scored.length);
}

export function makeFormFlowReducer(totalMovements: number) {
  return function reducer(
    state: FormFlowState,
    action: FormFlowAction,
  ): FormFlowState {
    switch (action.type) {
      case "START":
        return {
          ...initialFormFlowState(),
          phase: "intro",
          sessionStartedAt: action.startedAt,
          countdownSecs: INTRO_COUNTDOWN_SECONDS,
        };

      case "INTRO_COUNTDOWN_TICK":
        if (state.phase !== "intro") return state;
        if (state.countdownSecs <= 1) {
          return { ...state, phase: "practicing", countdownSecs: 0 };
        }
        return { ...state, countdownSecs: state.countdownSecs - 1 };

      case "INTRO_COUNTDOWN_DONE":
        if (state.phase !== "intro") return state;
        return { ...state, phase: "practicing", countdownSecs: 0 };

      case "MOVEMENT_PASSED": {
        if (state.phase !== "practicing") return state;
        const results = [
          ...state.movementResults,
          {
            movementId: action.movementId,
            movementSequence: state.currentMovementIndex + 1,
            scored: true,
            score: action.score,
            skipped: false,
            variant: action.variant,
            perspective: action.perspective,
          },
        ];
        return { ...state, phase: "movement-complete", movementResults: results };
      }

      case "MOVEMENT_SKIPPED": {
        if (state.phase !== "practicing") return state;
        const results = [
          ...state.movementResults,
          {
            movementId: action.movementId,
            movementSequence: state.currentMovementIndex + 1,
            scored: false,
            skipped: action.reason !== "non-scored",
          },
        ];
        return { ...state, phase: "movement-skipped", movementResults: results };
      }

      case "BEGIN_TRANSITION": {
        if (state.phase !== "movement-complete" && state.phase !== "movement-skipped") {
          return state;
        }
        const isLast = state.currentMovementIndex >= totalMovements - 1;
        if (isLast) {
          return {
            ...state,
            phase: "form-complete",
            totalScore: computeTotalScore(state.movementResults),
          };
        }
        return {
          ...state,
          phase: "transition",
          currentMovementIndex: state.currentMovementIndex + 1,
          countdownSecs: TRANSITION_COUNTDOWN_SECONDS,
        };
      }

      case "TRANSITION_TICK":
        if (state.phase !== "transition") return state;
        if (state.countdownSecs <= 1) {
          return { ...state, phase: "practicing", countdownSecs: 0 };
        }
        return { ...state, countdownSecs: state.countdownSecs - 1 };

      case "TRANSITION_SKIP":
        if (state.phase !== "transition") return state;
        return { ...state, phase: "practicing", countdownSecs: 0 };

      case "PAUSE":
        if (
          state.phase === "paused" ||
          state.phase === "form-complete" ||
          state.phase === "aborted" ||
          state.phase === "setup"
        ) {
          return state;
        }
        return { ...state, phase: "paused", pausedReturnPhase: state.phase };

      case "RESUME":
        if (state.phase !== "paused") return state;
        return {
          ...state,
          phase: state.pausedReturnPhase ?? "practicing",
          pausedReturnPhase: null,
        };

      case "ABORT":
        return { ...state, phase: "aborted" };

      case "RESET":
        return initialFormFlowState();

      default:
        return state;
    }
  };
}

export function useFormFlow(totalMovements: number) {
  const reducer = makeFormFlowReducer(totalMovements);
  const [state, dispatch] = useReducer(reducer, undefined, initialFormFlowState);

  const start = useCallback(
    () => dispatch({ type: "START", startedAt: Date.now() }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, dispatch, start, reset };
}
