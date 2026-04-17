"use client";

import { useReducer, useCallback } from "react";
import type { CameraView, ViewEvaluation } from "./types";

/**
 * Phases of a multi-view capture flow:
 *
 *   awaiting:    Waiting for user to get into position for a view (body not ready or just switched)
 *   holding:     Body visible; scoring live. Transitions to `captured` when 3 s hold achieved.
 *   countdown:   Between view 1 and view 2 — user repositions.
 *   results:     Both views captured (or Quick Mode single-view complete). Shows combined score.
 */
export type Phase =
  | "awaiting"
  | "holding"
  | "countdown"
  | "results";

export type FlowState = {
  phase: Phase;
  /** Which view is currently being captured (or was last captured) */
  currentView: CameraView;
  /** Plan for this session: [primary, secondary?]. In Quick Mode only primary is present. */
  plan: CameraView[];
  /** Captured per-view evaluations */
  captures: Partial<Record<CameraView, ViewEvaluation>>;
  /** Seconds remaining on repositioning countdown */
  countdownSecs: number;
  /** Optional last-seen buffered evaluation for "use last capture" */
  buffered: Partial<Record<CameraView, ViewEvaluation>>;
};

export type FlowAction =
  | { type: "RESET"; plan: CameraView[] }
  | { type: "BODY_READY" }
  | { type: "BODY_LOST" }
  | { type: "BUFFER"; view: CameraView; evaluation: ViewEvaluation }
  | { type: "CAPTURE"; view: CameraView; evaluation: ViewEvaluation }
  | { type: "USE_BUFFERED"; view: CameraView }
  | { type: "COUNTDOWN_TICK" }
  | { type: "COUNTDOWN_DONE" };

export const COUNTDOWN_SECONDS = 5;

export function initialState(plan: CameraView[]): FlowState {
  return {
    phase: "awaiting",
    currentView: plan[0],
    plan,
    captures: {},
    countdownSecs: COUNTDOWN_SECONDS,
    buffered: {},
  };
}

function advanceAfterCapture(state: FlowState): FlowState {
  const idx = state.plan.indexOf(state.currentView);
  const nextView = state.plan[idx + 1];
  if (!nextView) {
    return { ...state, phase: "results" };
  }
  return {
    ...state,
    phase: "countdown",
    currentView: nextView,
    countdownSecs: COUNTDOWN_SECONDS,
  };
}

export function reducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "RESET":
      return initialState(action.plan);

    case "BODY_READY":
      // Body became ready: move awaiting → holding (live scoring on).
      if (state.phase === "awaiting")
        return { ...state, phase: "holding" };
      return state;

    case "BODY_LOST":
      // Body lost mid-hold: drop back to awaiting.
      if (state.phase === "holding")
        return { ...state, phase: "awaiting" };
      return state;

    case "BUFFER":
      return {
        ...state,
        buffered: { ...state.buffered, [action.view]: action.evaluation },
      };

    case "CAPTURE": {
      const captures = { ...state.captures, [action.view]: action.evaluation };
      return advanceAfterCapture({ ...state, captures });
    }

    case "USE_BUFFERED": {
      const buffered = state.buffered[action.view];
      if (!buffered) return state;
      const captures = { ...state.captures, [action.view]: buffered };
      return advanceAfterCapture({ ...state, captures });
    }

    case "COUNTDOWN_TICK":
      if (state.phase !== "countdown") return state;
      if (state.countdownSecs <= 1)
        return { ...state, phase: "awaiting", countdownSecs: 0 };
      return { ...state, countdownSecs: state.countdownSecs - 1 };

    case "COUNTDOWN_DONE":
      if (state.phase !== "countdown") return state;
      return { ...state, phase: "awaiting", countdownSecs: 0 };

    default:
      return state;
  }
}

export function useFlowReducer(plan: CameraView[]) {
  const [state, dispatch] = useReducer(reducer, plan, initialState);
  const reset = useCallback(
    (nextPlan: CameraView[]) => dispatch({ type: "RESET", plan: nextPlan }),
    [],
  );
  return { state, dispatch, reset };
}
