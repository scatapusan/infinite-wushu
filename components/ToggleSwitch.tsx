"use client";

type Props = {
  enabled: boolean;
  onChange: () => void;
  /** Tailwind bg-* class for the active track color */
  activeClass?: string;
  label: string;
};

/**
 * Pill toggle switch with correct geometry:
 *   track 48×28px | knob 22×22px | 3px inset each side
 *   OFF  left=3px    knob x=[3, 25]
 *   ON   left=23px   knob x=[23, 45] (3px from right edge)
 * Uses left-position transition instead of transform to avoid stacking context
 * issues with overflow-hidden. focus-visible uses outline (not clipped).
 */
export default function ToggleSwitch({
  enabled,
  onChange,
  activeClass = "bg-cyan",
  label,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative mt-0.5 h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
        enabled ? activeClass : "bg-foreground/20"
      }`}
    >
      <span
        className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all duration-150"
        style={{ left: enabled ? "23px" : "3px" }}
      />
    </button>
  );
}
