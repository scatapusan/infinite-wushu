"use client";

import { useCallback, useEffect, useRef } from "react";

export type VoiceCommand =
  | "score"        // "score me" / "done"
  | "switch-view"  // "next angle" / "switch view"
  | "exit"         // "exit" / "stop"
  | "repeat";      // "repeat"

type CommandHandler = (cmd: VoiceCommand) => void;

const PATTERNS: Array<{ pattern: RegExp; command: VoiceCommand }> = [
  { pattern: /score|done|finish|record/i,                             command: "score" },
  { pattern: /next angle|switch view|next view|angle|switch/i,        command: "switch-view" },
  { pattern: /exit|stop|quit|leave/i,                                 command: "exit" },
  { pattern: /repeat|again|retry|reset/i,                             command: "repeat" },
];

function matchCommand(transcript: string): VoiceCommand | null {
  for (const { pattern, command } of PATTERNS) {
    if (pattern.test(transcript)) return command;
  }
  return null;
}

// SpeechRecognition is not consistently typed across TS targets; use any.
type AnySpeechRecognition = any;

function getSpeechRecognitionCtor(): (new () => AnySpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceCommands({
  enabled,
  onCommand,
}: {
  enabled: boolean;
  onCommand: CommandHandler;
}): { supported: boolean } {
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const recognitionRef = useRef<AnySpeechRecognition | null>(null);
  const supported = getSpeechRecognitionCtor() !== null;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const start = useCallback(() => {
    const SR = getSpeechRecognitionCtor();
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (ev: AnySpeechRecognition) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript: string = ev.results[i][0].transcript;
        const cmd = matchCommand(transcript);
        if (cmd) onCommandRef.current(cmd);
      }
    };
    rec.onerror = (ev: AnySpeechRecognition) => {
      if (ev.error === "no-speech" || ev.error === "aborted") {
        recognitionRef.current = null;
        if (enabledRef.current) setTimeout(start, 500);
      }
    };
    rec.onend = () => {
      if (enabledRef.current && recognitionRef.current) setTimeout(start, 300);
    };
    rec.start();
    recognitionRef.current = rec;
  }, []);

  useEffect(() => {
    if (!enabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }
    start();
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [enabled, start]);

  return { supported };
}
