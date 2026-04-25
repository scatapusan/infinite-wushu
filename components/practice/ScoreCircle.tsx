"use client";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number): string {
  if (score >= 70) return "#00FF88";
  if (score >= 40) return "#FFD700";
  return "#e85d4a";
}

export default function ScoreCircle({ score }: { score: number }) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={96} height={96} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={48}
          cy={48}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={6}
        />
        {/* Score arc */}
        <circle
          cx={48}
          cy={48}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span
        className="absolute text-2xl font-bold"
        style={{ color, transition: "color 0.3s ease" }}
      >
        {score}
      </span>
    </div>
  );
}
