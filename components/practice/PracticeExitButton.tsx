"use client";

type Props = {
  onExit: () => void;
  className?: string;
};

/**
 * Shared EXIT button for all practice views (single-stance + form carousel).
 * Styling matches the form carousel's top-bar EXIT button.
 */
export default function PracticeExitButton({ onExit, className }: Props) {
  return (
    <button
      onClick={onExit}
      className={`h-12 rounded-2xl border border-white/20 bg-black/50 px-4 font-bold text-white/70 active:scale-95${className ? ` ${className}` : ""}`}
      style={{ fontSize: "1.75rem" }}
      aria-label="Exit practice"
    >
      EXIT
    </button>
  );
}
