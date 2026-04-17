"use client";

import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import {
  getHandTrackingPref,
  isHandTrackingEnabled,
  setHandTracking,
} from "@/lib/preferences";

export default function HandTrackingToggle() {
  const [enabled, setEnabled] = useState(false);
  const [explicit, setExplicit] = useState(false);

  useEffect(() => {
    setEnabled(isHandTrackingEnabled());
    setExplicit(getHandTrackingPref() !== null);
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setHandTracking(next);
    setExplicit(true);
  }

  return (
    <div className="card-surface flex items-start gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Hand size={18} />
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold">Hand tracking</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Detect fist, palm, and hook shapes plus arm position during stance
          practice. Defaults on for desktop, off for mobile due to GPU load.
        </p>
        {!explicit && (
          <p className="mt-2 text-[11px] text-foreground/40">
            Using device default.
          </p>
        )}
      </div>

      <button
        onClick={toggle}
        role="switch"
        aria-checked={enabled}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
          enabled ? "bg-gold" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
