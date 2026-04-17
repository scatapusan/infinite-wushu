"use client";

import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import {
  getHandTrackingPref,
  isHandTrackingEnabled,
  setHandTracking,
} from "@/lib/preferences";
import ToggleSwitch from "@/components/ToggleSwitch";

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

      <ToggleSwitch
        enabled={enabled}
        onChange={toggle}
        activeClass="bg-gold"
        label="Hand tracking"
      />
    </div>
  );
}
