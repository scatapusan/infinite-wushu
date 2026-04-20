"use client";

import { useEffect, useRef, useState } from "react";
import { speakCorrection } from "@/lib/audio-feedback";

type Props = {
  corrections: string[]; // ordered by priority, already deduped
  rotationInterval?: number; // ms between rotations, default 1500
  ttsEnabled?: boolean;
};

export default function CorrectionDisplay({
  corrections,
  rotationInterval = 1500,
  ttsEnabled = true,
}: Props) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset index when correction list changes
  useEffect(() => {
    setIndex(0);
  }, [corrections.join("|")]);

  // Rotate through corrections
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (corrections.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % corrections.length);
    }, rotationInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [corrections.length, rotationInterval, corrections.join("|")]);

  // TTS — speak when displayed correction changes
  const current = corrections[index] ?? null;
  const prevRef = useRef<string | null>(null);
  useEffect(() => {
    if (!current || current === prevRef.current) return;
    prevRef.current = current;
    if (ttsEnabled) speakCorrection(current);
  }, [current, ttsEnabled]);

  if (!current) return null;

  return (
    <div className="pointer-events-none flex items-center justify-center px-4">
      <span
        className="text-center font-black uppercase tracking-wider drop-shadow-lg"
        style={{
          fontSize: "3.5rem",      // practice-large = 56px
          lineHeight: 1.1,
          color: "#FFD700",
          textShadow: "0 2px 24px rgba(255,215,0,0.5), 0 0 8px rgba(0,0,0,0.8)",
          WebkitTextStroke: "1px rgba(0,0,0,0.3)",
        }}
      >
        {current}
      </span>
    </div>
  );
}
