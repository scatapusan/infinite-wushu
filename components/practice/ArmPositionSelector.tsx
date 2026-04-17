"use client";

import type { ArmPosition } from "@/lib/pose/types";

type Props = {
  value: ArmPosition;
  onChange: (p: ArmPosition) => void;
  disabled?: boolean;
};

const OPTIONS: { value: ArmPosition; label: string; description: string }[] = [
  {
    value: "waist",
    label: "At waist",
    description: "Fists at hip, elbows tucked",
  },
  {
    value: "punch",
    label: "Extended punch",
    description: "One fist extended at shoulder height",
  },
  {
    value: "guard",
    label: "Guarding",
    description: "Both arms up, elbows bent",
  },
];

export default function ArmPositionSelector({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="pointer-events-auto rounded-card-sm border border-white/10 bg-[#080c1a]/85 px-3 py-2 backdrop-blur-md">
      <p className="mb-1.5 text-[10px] uppercase tracking-widest text-foreground/50">
        Expected arms
      </p>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              title={opt.description}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selected
                  ? "bg-gold text-[#080c1a]"
                  : "bg-white/5 text-foreground/70 hover:bg-white/10"
              } disabled:opacity-40`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
