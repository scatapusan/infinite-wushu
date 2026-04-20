"use client";

import { useCallback, useRef, useState } from "react";

export const TEMPORAL_BUFFER_SIZE = 10;

export type BufferStatus = {
  /** True only when the buffer is full and every frame passed. */
  allPass: boolean;
  /** Frames recorded in the current run (0..TEMPORAL_BUFFER_SIZE). */
  filled: number;
};

/**
 * Rolling buffer of the last N frame outcomes.
 *
 *   push(true)  appends a pass; once N consecutive passes are recorded, allPass = true.
 *   push(false) wipes the buffer (any fail resets the run).
 *   reset()     also wipes (use on body-lost / visibility-lost).
 *
 * The buffer is stored in a ref for low-overhead per-frame pushes; the React
 * state only reflects the derived status so consumers re-render once per change.
 */
export function useTemporalBuffer(size: number = TEMPORAL_BUFFER_SIZE) {
  const filledRef = useRef(0);
  const [status, setStatus] = useState<BufferStatus>({ allPass: false, filled: 0 });

  const push = useCallback(
    (pass: boolean) => {
      const prev = filledRef.current;
      const next = pass ? Math.min(size, prev + 1) : 0;
      if (next === prev) return;
      filledRef.current = next;
      setStatus({ allPass: next >= size, filled: next });
    },
    [size],
  );

  const reset = useCallback(() => {
    if (filledRef.current === 0) return;
    filledRef.current = 0;
    setStatus({ allPass: false, filled: 0 });
  }, []);

  return { status, push, reset };
}
