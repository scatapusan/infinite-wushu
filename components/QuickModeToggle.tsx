"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { isQuickMode, setQuickMode } from "@/lib/preferences";
import ToggleSwitch from "@/components/ToggleSwitch";

export default function QuickModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isQuickMode());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setQuickMode(next);
  }

  return (
    <div className="card-surface flex items-start gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-cyan">
        <Zap size={18} />
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold">Quick Mode</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Skip the second camera angle. Single-view scores are marked as
          <span className="text-gold"> preliminary</span>; multi-view scores
          are marked as <span className="text-[#22c55e]">verified</span>.
        </p>
      </div>

      <ToggleSwitch
        enabled={enabled}
        onChange={toggle}
        activeClass="bg-cyan"
        label="Quick Mode"
      />
    </div>
  );
}
