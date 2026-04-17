"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const UNAVAIL_MSG = "Chinese voice not available on this device";

type Props = {
  text: string;
  className?: string;
};

export default function SpeakButton({ text, className = "" }: Props) {
  // tri-state: null = not yet checked, true = available, false = unavailable
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showTip, setShowTip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setAvailable(false);
      return;
    }

    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return; // not yet populated — wait for event
      setAvailable(voices.some((v) => v.lang.startsWith("zh")));
    };

    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);

  const flashTip = () => {
    setShowTip(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowTip(false), 2800);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (available === false) {
      flashTip();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    utterance.onerror = (e) => {
      const err = (e as SpeechSynthesisErrorEvent).error;
      if (
        err === "voice-unavailable" ||
        err === "language-unavailable" ||
        err === "synthesis-unavailable" ||
        err === "not-allowed"
      ) {
        setAvailable(false);
        flashTip();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const unavailable = available === false;

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Pronounce in Chinese: ${text}`}
        title={unavailable ? UNAVAIL_MSG : "Hear pronunciation"}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition focus:outline-none active:scale-90 ${
          unavailable
            ? "cursor-not-allowed text-foreground/20"
            : "text-foreground/35 hover:text-cyan hover:bg-cyan/5"
        }`}
      >
        <Volume2 size={16} />
      </button>

      {showTip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-card-sm bg-foreground/90 px-2.5 py-1 text-[10px] text-background shadow-lg">
          {UNAVAIL_MSG}
        </span>
      )}
    </span>
  );
}
