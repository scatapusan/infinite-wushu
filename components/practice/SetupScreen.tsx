"use client";

import { useState, useEffect } from "react";
import type { PoseLandmark } from "@/lib/pose/types";

export type SetupConfig = {
  voiceEnabled: boolean;
  audioEnabled: boolean;
  ttsEnabled: boolean;
  showRef: boolean;
  dominantHand: "left" | "right";
  variant: "left-forward" | "right-forward";
  cameraView: "front" | "side";
};

type Props = {
  techniqueName: string;
  techniqueNameChinese: string;
  landmarks: PoseLandmark[] | null;
  isAsymmetric: boolean;
  initialConfig: SetupConfig;
  onStart: (config: SetupConfig) => void;
  onBack: () => void;
};

function bothHandsVisible(landmarks: PoseLandmark[] | null): boolean {
  if (!landmarks) return false;
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  if (!lWrist || !rWrist) return false;
  return (lWrist.visibility ?? 0) >= 0.6 && (rWrist.visibility ?? 0) >= 0.6;
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{
        width: "4.5rem",
        height: "2.5rem",
        background: on ? "#00D4FF" : "rgba(255,255,255,0.15)",
      }}
    >
      <div
        className="absolute rounded-full bg-white shadow-md transition-transform duration-200"
        style={{
          top: "4px",
          left: "4px",
          width: "calc(2.5rem - 8px)",
          height: "calc(2.5rem - 8px)",
          transform: on ? "translateX(2rem)" : "translateX(0)",
        }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-bold uppercase tracking-widest mb-3"
      style={{ fontSize: "1.5rem", color: "#94A3B8" }}
    >
      {children}
    </p>
  );
}

export default function SetupScreen({
  techniqueName,
  techniqueNameChinese,
  landmarks,
  isAsymmetric,
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

  function toggle(key: "voiceEnabled" | "audioEnabled" | "ttsEnabled" | "showRef") {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050B1A] text-white">

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-6 pb-4 space-y-5">

          {/* Header */}
          <div className="flex items-start gap-4 pt-8 pb-2">
            <button
              onClick={onBack}
              className="mt-2 flex-shrink-0 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold active:scale-95"
              style={{ fontSize: "1.75rem" }}
            >
              ←
            </button>
            <div className="flex-1 min-w-0 text-center">
              <p className="font-black" style={{ fontSize: "3.5rem", lineHeight: 1 }}>
                {techniqueName}
              </p>
              <p className="font-bold font-chinese text-[#FFD700]" style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
                {techniqueNameChinese}
              </p>
            </div>
            {/* balance spacer */}
            <div className="flex-shrink-0" style={{ width: "4.5rem" }} />
          </div>

          {/* Distance check */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <SectionLabel>Distance Check</SectionLabel>
            <p className="font-semibold" style={{ fontSize: "1.75rem", color: "#CBD5E1" }}>
              Stand 2–3 metres from your phone.
            </p>
            <p className="font-semibold mt-1" style={{ fontSize: "1.75rem", color: "#CBD5E1" }}>
              Raise both hands to confirm you&apos;re visible.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="h-5 w-5 rounded-full flex-shrink-0 transition-colors"
                style={{ background: handsConfirmed ? "#00FF88" : "rgba(255,255,255,0.2)" }}
              />
              <span
                className="font-bold"
                style={{
                  fontSize: "2rem",
                  color: handsConfirmed ? "#00FF88" : "rgba(255,255,255,0.4)",
                }}
              >
                {handsConfirmed ? "VISIBLE — READY" : "Raise both hands…"}
              </span>
            </div>
          </div>

          {/* Camera angle */}
          <div>
            <SectionLabel>Camera Angle</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {(["front", "side"] as const).map((view) => {
                const sel = config.cameraView === view;
                return (
                  <button
                    key={view}
                    onClick={() => setConfig((c) => ({ ...c, cameraView: view }))}
                    className="flex flex-col items-center justify-center rounded-2xl py-6 gap-3 active:scale-95 transition-all"
                    style={{
                      border: `2px solid ${sel ? "#00D4FF" : "rgba(255,255,255,0.1)"}`,
                      background: sel ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span style={{ fontSize: "6rem", lineHeight: 1 }}>
                      {view === "front" ? "⬤" : "◑"}
                    </span>
                    <span
                      className="font-black uppercase tracking-wider"
                      style={{ fontSize: "2rem", color: sel ? "#00D4FF" : "rgba(255,255,255,0.8)" }}
                    >
                      {view === "front" ? "FRONT" : "SIDE"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lead leg (asymmetric stances) */}
          {isAsymmetric && (
            <div>
              <SectionLabel>Lead Leg</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {(["left-forward", "right-forward"] as const).map((v) => {
                  const sel = config.variant === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setConfig((c) => ({ ...c, variant: v }))}
                      className="flex flex-col items-center justify-center rounded-2xl py-5 gap-2 active:scale-95 transition-all"
                      style={{
                        border: `2px solid ${sel ? "#00D4FF" : "rgba(255,255,255,0.1)"}`,
                        background: sel ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span style={{ fontSize: "4rem", lineHeight: 1 }}>
                        {v === "left-forward" ? "←" : "→"}
                      </span>
                      <span
                        className="font-black uppercase tracking-widest text-center"
                        style={{ fontSize: "1.75rem", color: sel ? "#00D4FF" : "rgba(255,255,255,0.8)" }}
                      >
                        {v === "left-forward" ? "LEFT" : "RIGHT"}
                      </span>
                      <span
                        className="font-semibold uppercase tracking-wider"
                        style={{ fontSize: "1.75rem", color: "rgba(255,255,255,0.4)" }}
                      >
                        FORWARD
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Options toggles */}
          <div>
            <SectionLabel>Options</SectionLabel>
            <div className="space-y-3">
              {(
                [
                  { key: "showRef",      label: "Reference Skeleton" },
                  { key: "voiceEnabled", label: "Voice Commands"     },
                  { key: "audioEnabled", label: "Audio Feedback"     },
                  { key: "ttsEnabled",   label: "TTS Corrections"    },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 active:scale-[0.98] transition-transform"
                  style={{ minHeight: "5rem" }}
                >
                  <span className="font-bold text-left" style={{ fontSize: "2rem" }}>
                    {label}
                  </span>
                  <ToggleSwitch on={config[key]} />
                </button>
              ))}
            </div>
          </div>

          {/* Dominant hand */}
          <div>
            <SectionLabel>Dominant Hand</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {(["left", "right"] as const).map((hand) => {
                const sel = config.dominantHand === hand;
                return (
                  <button
                    key={hand}
                    onClick={() => setConfig((c) => ({ ...c, dominantHand: hand }))}
                    className="flex flex-col items-center justify-center rounded-2xl py-5 gap-2 active:scale-95 transition-all"
                    style={{
                      border: `2px solid ${sel ? "#00D4FF" : "rgba(255,255,255,0.1)"}`,
                      background: sel ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span style={{ fontSize: "4rem", lineHeight: 1 }}>
                      {hand === "left" ? "👈" : "👉"}
                    </span>
                    <span
                      className="font-black uppercase tracking-wider"
                      style={{ fontSize: "2rem", color: sel ? "#00D4FF" : "rgba(255,255,255,0.8)" }}
                    >
                      {hand.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice hint */}
          {config.voiceEnabled && (
            <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-6 py-4">
              <p className="font-semibold text-[#00D4FF]" style={{ fontSize: "1.75rem" }}>
                Voice: &quot;Score me&quot; · &quot;Switch view&quot; · &quot;Repeat&quot; · &quot;Exit&quot;
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ── Sticky START button (always visible at bottom) ─────────── */}
      <div className="flex-shrink-0 bg-[#050B1A] px-6 pb-8 pt-4" style={{ boxShadow: "0 -1px 0 rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => { if (handsConfirmed) onStart(config); }}
          className="w-full rounded-3xl font-black uppercase tracking-widest transition-all active:scale-[0.97]"
          style={{
            height: "6rem",
            fontSize: "3rem",
            background: handsConfirmed ? "#00D4FF" : "#1E293B",
            color: handsConfirmed ? "#000000" : "rgba(255,255,255,0.25)",
            cursor: handsConfirmed ? "pointer" : "default",
          }}
        >
          {handsConfirmed ? "START PRACTICE" : "RAISE HANDS FIRST"}
        </button>
      </div>
    </div>
  );
}
