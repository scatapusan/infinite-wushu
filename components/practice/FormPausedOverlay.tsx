"use client";

type Props = {
  onResume: () => void;
  onExit: () => void;
};

export default function FormPausedOverlay({ onResume, onExit }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-[#050B1A]/95 backdrop-blur-md px-6">
      <p
        className="font-black uppercase tracking-widest text-[#FFD700]"
        style={{ fontSize: "5rem", textShadow: "0 0 30px rgba(255,215,0,0.4)" }}
      >
        PAUSED
      </p>
      <p
        className="text-center text-white/70 max-w-xl"
        style={{ fontSize: "1.75rem" }}
      >
        The form is paused. Resume when you&apos;re ready.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={onResume}
          className="w-full rounded-3xl bg-[#22D3EE] font-black uppercase tracking-widest text-black active:scale-[0.97]"
          style={{ height: "6rem", fontSize: "2.5rem" }}
        >
          RESUME
        </button>
        <button
          onClick={onExit}
          className="w-full rounded-3xl border border-white/20 bg-white/5 font-bold text-white/80 active:scale-[0.97]"
          style={{ height: "5rem", fontSize: "1.75rem" }}
        >
          Exit form
        </button>
      </div>
    </div>
  );
}
