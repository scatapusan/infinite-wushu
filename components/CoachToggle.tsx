"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { isCoachMode, setCoachMode } from "@/lib/coach-mode";
import ToggleSwitch from "@/components/ToggleSwitch";

export default function CoachToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isCoachMode());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setCoachMode(next);
    // Reload so server components pick up the new cookie
    window.location.reload();
  }

  return (
    <div className="card-surface flex items-start gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
        <GraduationCap size={18} />
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold">Coach Mode</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Unlock all lessons and modules for free browsing. Quizzes can be
          taken without meeting prerequisites.
        </p>
        {enabled && (
          <p className="mt-2 text-xs font-semibold text-gold">
            Coach View is active — all content unlocked.
          </p>
        )}
      </div>

      <ToggleSwitch
        enabled={enabled}
        onChange={toggle}
        activeClass="bg-gold"
        label="Coach Mode"
      />
    </div>
  );
}
