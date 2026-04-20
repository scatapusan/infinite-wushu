"use client";

/**
 * Audio feedback for the practice view.
 * All sounds are synthesised via Web Audio API — no external files needed.
 * TTS (text-to-speech) uses SpeechSynthesis; fires only when the primary
 * correction changes, not every frame.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended (autoplay policy)
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.25,
  fadeOutAt?: number,
): void {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gainNode = ac.createGain();
  osc.connect(gainNode);
  gainNode.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = frequency;
  gainNode.gain.setValueAtTime(gain, ac.currentTime);
  const fadeStart = fadeOutAt ?? ac.currentTime + duration * 0.7;
  gainNode.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
  void fadeStart; // referenced to satisfy linter
}

function playChord(notes: number[], duration: number, gain = 0.18): void {
  notes.forEach((f) => playTone(f, duration, "sine", gain));
}

/** Subtle ascending chime — hold timer started. */
export function playHoldStarted(): void {
  playTone(880,  0.12, "sine", 0.2);
  setTimeout(() => playTone(1047, 0.12, "sine", 0.2), 80);
}

/** Success chord — stance hold completed. */
export function playHoldComplete(): void {
  playChord([523, 659, 784], 0.6, 0.22);
  setTimeout(() => playChord([523, 659, 784, 1047], 0.8, 0.18), 300);
}

/** Soft negative beep — gate still failing. One short beep, not alarming. */
export function playGateFail(): void {
  playTone(220, 0.15, "triangle", 0.12);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-to-speech
// ─────────────────────────────────────────────────────────────────────────────

let lastSpokenCorrection = "";
let ttsEnabled = true;
let sfxEnabled = true;

export function setTtsEnabled(v: boolean): void { ttsEnabled = v; }
export function setSfxEnabled(v: boolean): void { sfxEnabled = v; }

/**
 * Speak a correction only when it changes from the last one spoken.
 * Runs at 1.5× rate so the user hears it quickly between frames.
 */
export function speakCorrection(message: string): void {
  if (!ttsEnabled) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (message === lastSpokenCorrection) return;
  lastSpokenCorrection = message;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(message.toLowerCase());
  utt.rate = 1.5;
  utt.volume = 0.9;
  window.speechSynthesis.speak(utt);
}

export function resetLastSpoken(): void {
  lastSpokenCorrection = "";
}

/** Convenience wrappers that respect the sfxEnabled flag */
export const sfx = {
  holdStarted() { if (sfxEnabled) playHoldStarted(); },
  holdComplete() { if (sfxEnabled) playHoldComplete(); },
  gateFail()    { if (sfxEnabled) playGateFail(); },
};
