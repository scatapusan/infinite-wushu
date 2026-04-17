"use client";

import {
  CHINESE_DISPLAY_MODES,
  useChineseDisplay,
} from "@/lib/chinese-display";

export default function ChineseDisplayToggle() {
  const [mode, setMode] = useChineseDisplay();

  return (
    <div className="card-surface p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan/70">
        Chinese display
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-card-md border border-white/10 bg-white/[0.02] p-1 sm:grid-cols-4">
        {CHINESE_DISPLAY_MODES.map((m) => {
          const active = m.value === mode;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`min-h-11 rounded-card-sm px-3 py-2 text-xs font-semibold transition sm:min-h-0 ${
                active
                  ? "bg-cyan/15 text-cyan"
                  : "text-foreground/60 hover:text-foreground/90"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
