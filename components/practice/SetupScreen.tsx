"use client";

import { useState, useEffect } from "react";
import type { PoseLandmark } from "@/lib/pose/types";

type SetupConfig = {
  voiceEnabled: boolean;
  audioEnabled: boolean;
  showRef: boolean;
};

type Props = {
  techniqueName: string;
  techniqueNameChinese: string;
  landmarks: PoseLandmark[] | null;
  initialConfig: SetupConfig;
  onStart: (config: SetupConfig) => void;
  onBack: () => void;
};

function bothHandsVisible(landmarks: PoseLandmark[] | null): boolean {
  if (!landmarks) return false;
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  if (!lWrist || !rWrist || !lShoulder || !rShoulder) return false;
  if ((lWrist.visibility ?? 0) < 0.6 || (rWrist.visibility ?? 0) < 0.6) return false;
  // Confirmed visible at some reasonable confidence
  return true;
}

export default function SetupScreen({
  techniqueName,
  techniqueNameChinese,
  landmarks,
  initialConfig,
  onStart,
  onBack,
}: Props) {
  const [config, setConfig] = useState<SetupConfig>(initialConfig);
  const [handsConfirmed, setHandsConfirmed] = useState(false);

  useEffect(() => {
    if (!handsConfirmed && bothHandsVisible(landmarks)) {
      setHandsConfirmed(true);
    }
  }, [landmarks, handsConfirmed]);

  function toggle(key: keyof SetupConfig) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050B1A] text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button
          onClick={onBack}
          className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold active:scale-95"
          style={{ fontSize: "1.75rem" }}
        >
          ←
        </button>
        <div className="flex-1 text-center">
          <p className="font-black" style={{ fontSize: "3.5rem", lineHeight: 1 }}>
            {techniqueName}
          </p>
          <p className="font-bold text-[#FFD700]" style={{ fontSize: "2.5rem", lineHeight: 1.1 }}>
            {techniqueNameChinese}
          </p>
        </div>
      </div>

      {/* Distance check */}
      <div className="mx-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="font-bold text-white/60 uppercase tracking-widest mb-3" style={{ fontSize: "1.75rem" }}>
          Distance Check
        </p>
        <p className="font-semibold text-white/80" style={{ fontSize: "1.75rem" }}>
          Stand 2–3 metres from your phone.
        </p>
        <p className="font-semibold text-white/80 mt-1" style={{ fontSize: "1.75rem" }}>
          Raise both hands to confirm you&apos;re visible.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-5 w-5 rounded-full flex-shrink-0"
            style={{ background: handsConfirmed ? "#00FF88" : "rgba(255,255,255,0.2)" }}
          />
          <span
            className="font-bold"
            style={{
              fontSize: "2rem",
              color: handsConfirmed ? "#00FF88" : "rgba(255,255,255,0.5)",
            }}
          >
            {handsConfirmed ? "VISIBLE — READY" : "Raise both hands…"}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="mx-6 mt-4 space-y-3">
        {(
          [
            { key: "showRef",      label: "Reference Skeleton" },
            { key: "voiceEnabled", label: "Voice Commands" },
            { key: "audioEnabled", label: "Audio + TTS" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 active:scale-[0.98]"
          >
            <span className="font-bold" style={{ fontSize: "1.75rem" }}>
              {label}
            </span>
            <div
              className="h-9 w-16 rounded-full transition-colors"
              style={{ background: config[key] ? "#00FF88" : "rgba(255,255,255,0.15)" }}
            >
              <div
                className="h-9 w-9 rounded-full bg-white shadow-md transition-transform"
                style={{ transform: config[key] ? "translateX(28px)" : "translateX(0)" }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Voice command hint */}
      {config.voiceEnabled && (
        <div className="mx-6 mt-4 rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-6 py-4">
          <p className="font-semibold text-[#00D4FF]" style={{ fontSize: "1.75rem" }}>
            Voice: "Score me" · "Switch view" · "Repeat" · "Exit"
          </p>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Start button */}
      <div className="px-6 pb-8">
        <button
          onClick={() => onStart(config)}
          className="w-full rounded-3xl font-black uppercase tracking-widest text-black active:scale-[0.97] transition-transform"
          style={{
            background: "#00FF88",
            fontSize: "3.5rem",
            padding: "1.5rem",
            opacity: 1,
          }}
        >
          START
        </button>
      </div>
    </div>
  );
}
