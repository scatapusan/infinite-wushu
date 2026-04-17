"use client";

import type { CameraView } from "@/lib/pose/types";

type Props = {
  view: CameraView;
  size?: number;
  className?: string;
};

/**
 * Simple person silhouettes:
 * - "front" → stick figure facing camera
 * - "side"  → stick figure turned 90° (profile)
 */
export default function OrientationIcon({
  view,
  size = 40,
  className,
}: Props) {
  if (view === "front") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        className={className}
        aria-label="Face camera"
      >
        <circle cx="20" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 12v14M12 18l8-4 8 4M20 26l-4 10M20 26l4 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-label="Turn sideways"
    >
      <circle cx="24" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 12v14M24 18l-6 4M24 26l-2 10M24 26l2 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
