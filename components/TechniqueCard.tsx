import Link from "next/link";
import { Check, AlertTriangle, Camera } from "lucide-react";
import type { Technique } from "@/lib/types";
import VideoPlayer from "@/components/VideoPlayer";
import SpeakButton from "@/components/SpeakButton";
import SourceAttribution from "@/components/SourceAttribution";
import { PRACTICABLE_IDS } from "@/lib/pose/technique-lookup";

type Props = {
  technique: Technique;
  /** URL to return to from practice mode (lesson page the card is rendered on) */
  backHref?: string;
};

export default function TechniqueCard({ technique: t, backHref }: Props) {
  const practiceHref = backHref
    ? `/practice/${t.id}?from=${encodeURIComponent(backHref)}`
    : `/practice/${t.id}`;
  return (
    <article className="card-surface space-y-5 p-6">
      {/* Headline */}
      <header>
        <h2 className="text-2xl font-bold">{t.english}</h2>
        <p className="mt-1 flex items-center gap-2 text-base">
          <span className="text-pinyin">{t.pinyin}</span>
          <span className="text-zh text-2xl font-bold text-gold">
            {t.chinese}
          </span>
          <SpeakButton text={t.chinese} />
        </p>
      </header>

      {/* Demo video / placeholder */}
      <VideoPlayer videoUrl={t.video_url} title={t.english} />

      {/* Description */}
      {t.description && (
        <p className="text-sm leading-relaxed text-foreground/80">
          {t.description}
        </p>
      )}

      {/* Key Points */}
      {t.key_points.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-cyan">
            <Check size={14} />
            Key Points
          </h3>
          <ul className="space-y-1.5">
            {t.key_points.map((point, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-foreground/75"
              >
                <span className="text-cyan/60">·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes */}
      {t.common_mistakes.length > 0 && (
        <div className="rounded-card-md border border-crimson/25 bg-crimson/5 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-crimson">
            <AlertTriangle size={14} />
            Common Mistakes
          </h3>
          <ul className="space-y-1.5">
            {t.common_mistakes.map((mistake, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-foreground/70"
              >
                <span className="text-crimson/60">·</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Source attribution */}
      <SourceAttribution attribution={t.attribution} source={t.source} />

      {/* Practice button — only for stances with pose detection configs */}
      {PRACTICABLE_IDS.includes(t.id) && (
        <Link
          href={practiceHref}
          className="btn-gold flex w-full items-center justify-center gap-2"
        >
          <Camera size={14} />
          Practice This Stance
        </Link>
      )}
    </article>
  );
}
